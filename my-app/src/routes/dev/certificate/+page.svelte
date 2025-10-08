<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { createClient } from '@supabase/supabase-js';
	import Wretch from 'wretch';
	import Papa from 'papaparse';
	import QRCode from 'qrcode';
	import { jsPDF } from 'jspdf';
	import toast, { Toaster } from 'svelte-french-toast';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		Upload, Download, QrCode, FileText, Image as ImageIcon, 
		Move, Check, AlertCircle, LogOut, ChevronRight 
	} from 'lucide-svelte';

	// Initialize Supabase
	const supabase = createClient(
		'https://cseventdb.poomzi.com' ,
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTk1MTA4MDAsImV4cCI6MTkxNzI3NzIwMH0.8QxMbL-HG6l7cv5Sif4JtrcMie4gapkZ52eIvLWlhKc' 
	);

	// Types
	interface CertificateData {
		name?: string;
		Fname?: string;
		Lname?: string;
		student_id?: string;
		course_id?: string;
		[key: string]: any;
	}

	interface GeneratedCert {
		id: string;
		name: string;
		pdfUrl: string;
		qrUrl: string;
		data: CertificateData;
	}

	// State
	const isLoggedIn = writable(false);
	let step = 1;
	let template: File | null = null;
	let templatePreview: string | null = null;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	// Name box positioning
	let nameBox = { x: 300, y: 400, width: 400, height: 60 };
	let isDragging = false;
	let isResizing = false;
	let dragStart = { x: 0, y: 0 };

	// Font settings
	let fontSettings = {
		size: 36,
		family: 'Arial',
		color: '#000000',
		align: 'center' as 'left' | 'center' | 'right'
	};

	// CSV data
	let csvData: CertificateData[] = [];
	let csvFile: File | null = null;

	// Processing
	let processing = false;
	let generatedCerts: GeneratedCert[] = [];
	let batchId: string | null = null;

	onMount(async () => {
		// Check authentication
		const token = localStorage.getItem('auth');

		if (canvas) {
			ctx = canvas.getContext('2d')!;
			drawCanvas();
		}
	});

	// Logout
	const logout = () => {
		localStorage.removeItem('auth');
		window.location.pathname = '/login';
	};

	// Handle template upload
	function handleTemplateUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file && file.type.startsWith('image/')) {
			template = file;
			const reader = new FileReader();
			reader.onload = (e) => {
				templatePreview = e.target?.result as string;
				setTimeout(drawCanvas, 100);
			};
			reader.readAsDataURL(file);
		}
	}

	// Draw canvas
	function drawCanvas() {
		if (!templatePreview || !canvas) return;

		const img = new Image();
		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;
			ctx.drawImage(img, 0, 0);

			// Draw name box
			ctx.strokeStyle = '#3b82f6';
			ctx.lineWidth = 3;
			ctx.setLineDash([5, 5]);
			ctx.strokeRect(nameBox.x, nameBox.y, nameBox.width, nameBox.height);

			// Draw sample text
			ctx.setLineDash([]);
			ctx.fillStyle = fontSettings.color;
			ctx.font = `${fontSettings.size}px ${fontSettings.family}`;
			ctx.textAlign = fontSettings.align;

			const textX =
				nameBox.x +
				(fontSettings.align === 'center'
					? nameBox.width / 2
					: fontSettings.align === 'right'
						? nameBox.width
						: 0);
			ctx.fillText('SAMPLE NAME', textX, nameBox.y + nameBox.height / 2 + fontSettings.size / 3);

			// Draw resize handle
			ctx.fillStyle = '#3b82f6';
			ctx.fillRect(nameBox.x + nameBox.width - 10, nameBox.y + nameBox.height - 10, 10, 10);
		};
		img.src = templatePreview;
	}

	// Mouse handlers
	function handleMouseDown(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const resizeHandleSize = 15;
		if (
			x >= nameBox.x + nameBox.width - resizeHandleSize &&
			x <= nameBox.x + nameBox.width + resizeHandleSize &&
			y >= nameBox.y + nameBox.height - resizeHandleSize &&
			y <= nameBox.y + nameBox.height + resizeHandleSize
		) {
			isResizing = true;
			dragStart = { x, y };
		} else if (
			x >= nameBox.x &&
			x <= nameBox.x + nameBox.width &&
			y >= nameBox.y &&
			y <= nameBox.y + nameBox.height
		) {
			isDragging = true;
			dragStart = { x: x - nameBox.x, y: y - nameBox.y };
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging && !isResizing) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (isDragging) {
			nameBox.x = Math.max(0, Math.min(x - dragStart.x, canvas.width - nameBox.width));
			nameBox.y = Math.max(0, Math.min(y - dragStart.y, canvas.height - nameBox.height));
		} else if (isResizing) {
			nameBox.width = Math.max(100, x - nameBox.x);
			nameBox.height = Math.max(30, y - nameBox.y);
		}

		drawCanvas();
	}

	function handleMouseUp() {
		isDragging = false;
		isResizing = false;
	}

	// Handle CSV upload
	function handleCSVUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			csvFile = file;
			Papa.parse(file, {
				header: true,
				skipEmptyLines: true,
				dynamicTyping: true,
				complete: (results) => {
					csvData = results.data as CertificateData[];
					toast.success(`Loaded ${csvData.length} records`);
				}
			});
		}
	}

	// Generate certificates
	async function generateCertificates() {
		processing = true;
		generatedCerts = [];

		try {
			// Upload template to Supabase Storage
			if (!template) {
				toast.error('No template selected');
				processing = false;
				return;
			}

			const timestamp = Date.now();
			const templatePath = `templates/${timestamp}-${template.name}`;
			const { error: templateUploadError } = await supabase.storage
				.from('certificate-templates')
				.upload(templatePath, template);

			if (templateUploadError) {
				toast.error('Failed to upload template');
				console.error(templateUploadError);
				processing = false;
				return;
			}

			// Save template configuration
			const { data: templateRecord, error: templateError } = await supabase
				.from('certificate_templates')
				.insert({
					template_name: template.name,
					template_image_url: templatePath,
					name_box_x: nameBox.x,
					name_box_y: nameBox.y,
					name_box_width: nameBox.width,
					name_box_height: nameBox.height,
					font_size: fontSettings.size,
					font_family: fontSettings.family,
					font_color: fontSettings.color,
					text_align: fontSettings.align
				})
				.select()
				.single();

			if (templateError) {
				toast.error('Failed to save template');
				console.error(templateError);
				processing = false;
				return;
			}

			// Create batch record
			const { data: batch, error: batchError } = await supabase
				.from('certificate_batches')
				.insert({
					batch_name: `Batch ${new Date().toISOString()}`,
					template_id: templateRecord.id,
					total_certificates: csvData.length,
					status: 'processing'
				})
				.select()
				.single();

			if (batchError) {
				toast.error('Failed to create batch');
				console.error(batchError);
				processing = false;
				return;
			}

			batchId = batch.id;

			// Generate each certificate
			for (let i = 0; i < csvData.length; i++) {
				const person = csvData[i];
				const name = person.name || `${person.Fname || ''} ${person.Lname || ''}`.trim() || '';

				if (!name) {
					toast.error(`Row ${i + 1}: Missing name field`);
					continue;
				}

				// Generate certificate
				const certCanvas = document.createElement('canvas');
				const certCtx = certCanvas.getContext('2d')!;
				const img = new Image();

				await new Promise<void>((resolve) => {
					img.onload = async () => {
						certCanvas.width = img.width;
						certCanvas.height = img.height;
						certCtx.drawImage(img, 0, 0);

						// Draw name
						certCtx.fillStyle = fontSettings.color;
						certCtx.font = `${fontSettings.size}px ${fontSettings.family}`;
						certCtx.textAlign = fontSettings.align;
						const textX =
							nameBox.x +
							(fontSettings.align === 'center'
								? nameBox.width / 2
								: fontSettings.align === 'right'
									? nameBox.width
									: 0);
						certCtx.fillText(
							name.toUpperCase(),
							textX,
							nameBox.y + nameBox.height / 2 + fontSettings.size / 3
						);

						// Create certificate record first to get UUID
						const { data: certRecord, error: certError } = await supabase
							.from('certificates')
							.insert({
								batch_id: batchId,
								template_id: templateRecord.id,
								recipient_name: name,
								student_id: person.student_id || null,
								course_id: person.course_id || null,
								additional_data: person
							})
							.select()
							.single();

						if (certError) {
							toast.error(`Failed to create certificate for ${name}`);
							resolve();
							return;
						}

						const certId = certRecord.id;
						const qrUrl = `${window.location.origin}/verify/${certId}`;

						// Generate QR code
						const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 150 });
						const qrImg = new Image();

						qrImg.onload = async () => {
							// Draw QR code
							const qrSize = 100;
							const qrX = certCanvas.width - qrSize - 30;
							const qrY = certCanvas.height - qrSize - 30;
							certCtx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

							// Convert to PDF
							const imgData = certCanvas.toDataURL('image/png');
							const pdf = new jsPDF({
								orientation: certCanvas.width > certCanvas.height ? 'landscape' : 'portrait',
								unit: 'px',
								format: [certCanvas.width, certCanvas.height]
							});
							pdf.addImage(imgData, 'PNG', 0, 0, certCanvas.width, certCanvas.height);

							const pdfBlob = pdf.output('blob');

							// Upload PDF to Supabase
							const pdfPath = `certificates/${certId}.pdf`;
							const { error: pdfError } = await supabase.storage
								.from('certificates')
								.upload(pdfPath, pdfBlob);

							if (!pdfError) {
								// Update certificate record with PDF URL
								await supabase
									.from('certificates')
									.update({
										certificate_pdf_url: pdfPath,
										qr_code_url: qrUrl
									})
									.eq('id', certId);

								generatedCerts.push({
									id: certId,
									name,
									pdfUrl: pdfPath,
									qrUrl,
									data: person
								});

								toast.success(`Generated certificate ${i + 1}/${csvData.length}`);
							}

							resolve();
						};
						qrImg.src = qrDataUrl;
					};
					img.src = templatePreview!;
				});
			}

			// Update batch status
			await supabase
				.from('certificate_batches')
				.update({
					status: 'completed',
					successful_count: generatedCerts.length
				})
				.eq('id', batchId);

			toast.success(`Generated ${generatedCerts.length} certificates!`);
			step = 4;
		} catch (error) {
			toast.error('Error generating certificates');
			console.error(error);
		} finally {
			processing = false;
		}
	}

	// Download certificate
	async function downloadCertificate(path: string, name: string) {
		const { data, error } = await supabase.storage.from('certificates').download(path);

		if (!error && data) {
			const url = URL.createObjectURL(data);
			const a = document.createElement('a');
			a.href = url;
			a.download = `certificate-${name}.pdf`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success('Downloaded!');
		} else {
			toast.error('Download failed');
		}
	}

	// Reactive statements
	$: if (nameBox || fontSettings) {
		drawCanvas();
	}
</script>

{#if $isLoggedIn}
	<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
		<!-- Header -->
		<header class="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg">
			<div class="container mx-auto px-4">
				<div class="flex h-16 items-center justify-between">
					<h1 class="text-2xl font-bold">Certificate Generator</h1>
					<Button variant="destructive" size="sm" on:click={logout} class="gap-2">
						<LogOut class="h-4 w-4" />
						Logout
					</Button>
				</div>
			</div>
		</header>

		<div class="container mx-auto p-6 max-w-7xl">
			<!-- Progress Steps -->
			<Card.Root class="mb-6">
				<Card.Content class="p-6">
					<div class="flex items-center justify-between">
						{#each [{ num: 1, label: 'Upload Template' }, { num: 2, label: 'Position Name' }, { num: 3, label: 'Upload CSV' }, { num: 4, label: 'Generate' }] as s, i}
							<div class="flex items-center">
								<div
									class="w-10 h-10 rounded-full flex items-center justify-center font-bold {step >= s.num
										? 'bg-blue-500 text-white'
										: 'bg-gray-200 text-gray-600'}"
								>
									{#if step > s.num}
										<Check class="h-5 w-5" />
									{:else}
										{s.num}
									{/if}
								</div>
								<span
									class="ml-2 font-medium {step >= s.num ? 'text-blue-600' : 'text-gray-500'}"
								>
									{s.label}
								</span>
							</div>
							{#if i < 3}
								<ChevronRight class="text-gray-400" />
							{/if}
						{/each}
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Step 1: Upload Template -->
			{#if step === 1}
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<ImageIcon class="h-5 w-5" />
							Step 1: Upload Certificate Template
						</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<label
							class="block border-4 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition"
						>
							<Upload class="mx-auto mb-4 text-gray-400" size={48} />
							<p class="text-lg text-gray-600 mb-2">
								{template ? template.name : 'Click to upload certificate template'}
							</p>
							<p class="text-sm text-gray-400">PNG or JPG (Max 10MB)</p>
							<input type="file" accept="image/*" on:change={handleTemplateUpload} class="hidden" />
						</label>

						{#if templatePreview}
							<div class="space-y-4">
								<img
									src={templatePreview}
									alt="Template"
									class="max-h-96 mx-auto rounded-lg shadow"
								/>
								<Button on:click={() => (step = 2)} class="w-full">
									Next: Position Name Box
								</Button>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			{/if}

			<!-- Step 2: Position Name Box -->
			{#if step === 2}
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<Move class="h-5 w-5" />
							Step 2: Position Name Box
						</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
							<div class="space-y-4">
								<div>
									<Label>Font Size</Label>
									<Input type="number" bind:value={fontSettings.size} />
								</div>
								<div>
									<Label>Font Family</Label>
									<select bind:value={fontSettings.family} class="w-full border rounded px-3 py-2">
										<option>Arial</option>
										<option>Times New Roman</option>
										<option>Courier New</option>
										<option>Georgia</option>
									</select>
								</div>
								<div>
									<Label>Text Color</Label>
									<Input type="color" bind:value={fontSettings.color} class="h-10" />
								</div>
								<div>
									<Label>Text Align</Label>
									<select bind:value={fontSettings.align} class="w-full border rounded px-3 py-2">
										<option value="left">Left</option>
										<option value="center">Center</option>
										<option value="right">Right</option>
									</select>
								</div>
							</div>

							<div class="lg:col-span-3 space-y-3">
								<div class="flex items-center gap-2 text-sm text-gray-600">
									<AlertCircle class="h-4 w-4" />
									Drag the blue box to position. Drag corner to resize.
								</div>
								<div class="overflow-auto border-2 rounded-lg">
									<canvas
										bind:this={canvas}
										on:mousedown={handleMouseDown}
										on:mousemove={handleMouseMove}
										on:mouseup={handleMouseUp}
										on:mouseleave={handleMouseUp}
										class="cursor-move"
										style="max-width: 100%; height: auto;"
									/>
								</div>
							</div>
						</div>

						<div class="flex gap-4 mt-6">
							<Button variant="outline" on:click={() => (step = 1)} class="flex-1">Back</Button>
							<Button on:click={() => (step = 3)} class="flex-1">Next: Upload CSV</Button>
						</div>
					</Card.Content>
				</Card.Root>
			{/if}

			<!-- Step 3: Upload CSV -->
			{#if step === 3}
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<FileText class="h-5 w-5" />
							Step 3: Upload CSV Data
						</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<label
							class="block border-4 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition"
						>
							<FileText class="mx-auto mb-4 text-gray-400" size={48} />
							<p class="text-lg text-gray-600 mb-2">
								{csvFile ? csvFile.name : 'Click to upload CSV file'}
							</p>
							<p class="text-sm text-gray-400">CSV with name/Fname+Lname columns</p>
							<input type="file" accept=".csv" on:change={handleCSVUpload} class="hidden" />
						</label>

						{#if csvData.length > 0}
							<div>
								<h3 class="font-bold mb-3">Preview ({csvData.length} records)</h3>
								<div class="overflow-x-auto border rounded-lg">
									<table class="min-w-full divide-y divide-gray-200">
										<thead class="bg-gray-50">
											<tr>
												{#each Object.keys(csvData[0]) as key}
													<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
														{key}
													</th>
												{/each}
											</tr>
										</thead>
										<tbody class="bg-white divide-y">
											{#each csvData.slice(0, 5) as row}
												<tr>
													{#each Object.values(row) as val}
														<td class="px-4 py-3 text-sm">{val}</td>
													{/each}
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
								{#if csvData.length > 5}
									<p class="text-sm text-gray-500 mt-2">... and {csvData.length - 5} more</p>
								{/if}
							</div>
						{/if}

						<div class="flex gap-4">
							<Button variant="outline" on:click={() => (step = 2)} class="flex-1">Back</Button>
							<Button
								on:click={generateCertificates}
								disabled={csvData.length === 0 || processing}
								class="flex-1"
							>
								{processing ? 'Generating...' : `Generate ${csvData.length} Certificates`}
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			{/if}

			<!-- Step 4: Generated -->
			{#if step === 4}
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2 text-green-600">
							<Check class="h-5 w-5" />
							Certificates Generated Successfully!
						</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="bg-green-50 border border-green-200 rounded-lg p-4">
							<p class="text-green-800">
								Successfully generated {generatedCerts.length} certificates with QR codes!
							</p>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							{#each generatedCerts as cert}
								<Card.Root>
									<Card.Content class="p-4">
										<p class="font-bold mb-2">{cert.name}</p>
										<p class="text-xs text-gray-500 mb-3">ID: {cert.id.substring(0, 8)}...</p>
										<Button
											on:click={() => downloadCertificate(cert.pdfUrl, cert.name)}
											class="w-full gap-2"
											size="sm"
										>
											<Download class="h-4 w-4" />
											Download PDF
										</Button>
									</Card.Content>
								</Card.Root>
							{/each}
						</div>

						<Button
							variant="outline"
							on:click={() => {
								step = 1;
								generatedCerts = [];
								csvData = [];
								template = null;
								templatePreview = null;
							}}
							class="w-full"
						>
							Create New Batch
						</Button>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</div>
{/if}

<Toaster />