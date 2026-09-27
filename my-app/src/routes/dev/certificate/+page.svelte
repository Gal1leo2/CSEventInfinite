<script lang="ts">
	import { onMount } from 'svelte';
	import Papa from 'papaparse';
	import QRCode from 'qrcode';
	import { jsPDF } from 'jspdf';
	import Wretch from 'wretch';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		ArrowLeft,
		Check,
		Download,
		FileText,
		Image as ImageIcon,
		LogOut,
		Move,
		MousePointerClick,
		Upload
	} from 'lucide-svelte';
	import { API, adminToken, getErrorMessage } from '$lib/api';
	import BrandMark from '$lib/components/site/BrandMark.svelte';

	// Types
	interface CertificateData {
		name?: string;
		Fname?: string;
		Lname?: string;
		student_id?: string | number;
		course_id?: string | number;
		[key: string]: unknown;
	}

	interface GeneratedCert {
		id: string;
		name: string;
		qrUrl: string;
		data: CertificateData;
	}

	// State
	let isLoggedIn = false;
	let step = 1;
	let template: File | null = null;
	let templatePreview: string | null = null;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let templateImg: HTMLImageElement | null = null;

	// Name box positioning, in template pixels
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
	const FONTS = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Prompt', 'IBM Plex Sans Thai'];

	// CSV data
	let csvData: CertificateData[] = [];
	let csvFile: File | null = null;

	// Processing
	let processing = false;
	let progress = { done: 0, total: 0 };
	let generatedCerts: GeneratedCert[] = [];
	let batchId: string | null = null;

	const STEPS = ['Template', 'Name position', 'Recipients', 'Done'];

	onMount(async () => {
		const token = adminToken();
		if (!token) {
			window.location.pathname = '/login';
			return;
		}
		try {
			await Wretch(`${API}/admin/auth`)
				.headers({ 'Content-type': 'application/json', Authorization: `Bearer ${token}` })
				.post({})
				.res();
			isLoggedIn = true;
		} catch {
			window.location.pathname = '/login';
		}
	});

	// The canvas only exists on step 2 and is recreated each time the step is shown.
	$: if (canvas) {
		ctx = canvas.getContext('2d')!;
		drawCanvas();
	}

	// Logout
	const logout = () => {
		localStorage.removeItem('auth');
		window.location.pathname = '/login';
	};

	// Calls this app's certificate API; the Supabase key lives on the server.
	async function certApi<T>(path: string, method: 'POST' | 'PATCH', body: unknown): Promise<T> {
		const res = await fetch(path, {
			method,
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken()}` },
			body: JSON.stringify(body)
		});
		if (!res.ok) {
			const detail = await res.json().catch(() => null);
			throw new Error(detail?.message ?? `Request failed (${res.status})`);
		}
		return res.json();
	}

	// Files go straight to storage through one-off signed URLs, so large PDFs never pass
	// through a size-limited serverless function.
	async function uploadTo(signedUrl: string, file: Blob, contentType: string) {
		const res = await fetch(signedUrl, {
			method: 'PUT',
			headers: { 'Content-Type': contentType },
			body: file
		});
		if (!res.ok) throw new Error(`Upload failed (${res.status})`);
	}

	const loadImage = (src: string) =>
		new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});

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

	const fontString = () => `${fontSettings.size}px "${fontSettings.family}"`;

	const textX = () =>
		nameBox.x +
		(fontSettings.align === 'center'
			? nameBox.width / 2
			: fontSettings.align === 'right'
				? nameBox.width
				: 0);

	// Draw canvas
	async function drawCanvas() {
		if (!templatePreview || !canvas || !ctx) return;

		await document.fonts?.load(fontString()).catch(() => undefined);
		if (templateImg?.src !== templatePreview) templateImg = await loadImage(templatePreview);
		const img = templateImg;
		canvas.width = img.width;
		canvas.height = img.height;
		ctx.drawImage(img, 0, 0);

		// Draw name box
		ctx.strokeStyle = '#FC9C18';
		ctx.lineWidth = 3;
		ctx.setLineDash([8, 6]);
		ctx.strokeRect(nameBox.x, nameBox.y, nameBox.width, nameBox.height);

		// Draw sample text
		ctx.setLineDash([]);
		ctx.fillStyle = fontSettings.color;
		ctx.font = fontString();
		ctx.textAlign = fontSettings.align;
		ctx.fillText('SAMPLE NAME', textX(), nameBox.y + nameBox.height / 2 + fontSettings.size / 3);

		// Draw resize handle
		ctx.fillStyle = '#FC9C18';
		ctx.fillRect(nameBox.x + nameBox.width - 12, nameBox.y + nameBox.height - 12, 12, 12);
	}

	// The canvas is shown scaled down, so pointer positions are mapped back to template pixels.
	function pointerPosition(e: PointerEvent) {
		const rect = canvas.getBoundingClientRect();
		const scale = canvas.width / rect.width;
		return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale, scale };
	}

	function handlePointerDown(e: PointerEvent) {
		const { x, y, scale } = pointerPosition(e);
		const handle = 15 * scale;
		if (
			x >= nameBox.x + nameBox.width - handle &&
			x <= nameBox.x + nameBox.width + handle &&
			y >= nameBox.y + nameBox.height - handle &&
			y <= nameBox.y + nameBox.height + handle
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
		} else {
			return;
		}
		canvas.setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging && !isResizing) return;
		const { x, y } = pointerPosition(e);

		if (isDragging) {
			nameBox.x = Math.max(0, Math.min(x - dragStart.x, canvas.width - nameBox.width));
			nameBox.y = Math.max(0, Math.min(y - dragStart.y, canvas.height - nameBox.height));
		} else if (isResizing) {
			nameBox.width = Math.max(100, x - nameBox.x);
			nameBox.height = Math.max(30, y - nameBox.y);
		}
	}

	function handlePointerUp() {
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

	// Name on the template plus the verification QR code, as a one-page PDF.
	async function renderCertificate(img: HTMLImageElement, name: string, qrUrl: string) {
		const certCanvas = document.createElement('canvas');
		const certCtx = certCanvas.getContext('2d')!;
		certCanvas.width = img.width;
		certCanvas.height = img.height;
		certCtx.drawImage(img, 0, 0);

		certCtx.fillStyle = fontSettings.color;
		certCtx.font = fontString();
		certCtx.textAlign = fontSettings.align;
		certCtx.fillText(
			name.toUpperCase(),
			textX(),
			nameBox.y + nameBox.height / 2 + fontSettings.size / 3
		);

		const qrImg = await loadImage(await QRCode.toDataURL(qrUrl, { width: 150 }));
		const qrSize = 100;
		certCtx.drawImage(
			qrImg,
			certCanvas.width - qrSize - 30,
			certCanvas.height - qrSize - 30,
			qrSize,
			qrSize
		);

		const pdf = new jsPDF({
			orientation: certCanvas.width > certCanvas.height ? 'landscape' : 'portrait',
			unit: 'px',
			format: [certCanvas.width, certCanvas.height]
		});
		pdf.addImage(certCanvas.toDataURL('image/png'), 'PNG', 0, 0, certCanvas.width, certCanvas.height);
		return pdf.output('blob');
	}

	// Generate certificates
	async function generateCertificates() {
		if (!template || !templatePreview) {
			toast.error('No template selected');
			return;
		}

		processing = true;
		generatedCerts = [];
		progress = { done: 0, total: csvData.length };

		try {
			const templateUpload = await certApi<{ path: string; signedUrl: string }>(
				'/api/certificates/template-upload',
				'POST',
				{ file_name: template.name }
			);
			await uploadTo(templateUpload.signedUrl, template, template.type || 'application/octet-stream');

			const batch = await certApi<{ templateId: string; batchId: string }>(
				'/api/certificates/batches',
				'POST',
				{
					template: {
						template_name: template.name,
						template_image_url: templateUpload.path,
						name_box_x: nameBox.x,
						name_box_y: nameBox.y,
						name_box_width: nameBox.width,
						name_box_height: nameBox.height,
						font_size: fontSettings.size,
						font_family: fontSettings.family,
						font_color: fontSettings.color,
						text_align: fontSettings.align
					},
					total_certificates: csvData.length
				}
			);
			batchId = batch.batchId;

			await document.fonts?.load(fontString()).catch(() => undefined);
			const img = await loadImage(templatePreview);
			// Numbers are unique across batches, e.g. CERT-2025-1766384700344-0005.
			const batchStamp = Date.now();

			for (let i = 0; i < csvData.length; i++) {
				const person = csvData[i];
				const name = person.name || `${person.Fname || ''} ${person.Lname || ''}`.trim() || '';

				if (!name) {
					toast.error(`Row ${i + 1}: Missing name field`);
					progress.done = i + 1;
					continue;
				}

				try {
					const cert = await certApi<{ id: string; qrUrl: string; uploadUrl: string }>(
						'/api/certificates',
						'POST',
						{
							certificate_number: `CERT-${new Date().getFullYear()}-${batchStamp}-${String(i + 1).padStart(4, '0')}`,
							batch_id: batch.batchId,
							template_id: batch.templateId,
							recipient_name: String(name),
							student_id: person.student_id || null,
							course_id: person.course_id || null,
							additional_data: person
						}
					);
					const pdf = await renderCertificate(img, String(name), cert.qrUrl);
					await uploadTo(cert.uploadUrl, pdf, 'application/pdf');
					await certApi(`/api/certificates/${cert.id}`, 'PATCH', {});

					generatedCerts = [
						...generatedCerts,
						{ id: cert.id, name: String(name), qrUrl: cert.qrUrl, data: person }
					];
				} catch (error) {
					toast.error(`Failed to create certificate for ${name}`);
					console.error(error);
				}
				progress.done = i + 1;
			}

			// Update batch status
			await certApi(`/api/certificates/batches/${batch.batchId}`, 'PATCH', {
				status: 'completed',
				successful_count: generatedCerts.length
			});

			toast.success(`Generated ${generatedCerts.length} certificates!`);
			step = 4;
		} catch (error) {
			toast.error(getErrorMessage(error) || 'Error generating certificates');
			console.error(error);
		} finally {
			processing = false;
		}
	}

	function resetBatch() {
		step = 1;
		generatedCerts = [];
		csvData = [];
		csvFile = null;
		template = null;
		templatePreview = null;
		batchId = null;
	}

	// Reactive statements
	$: if (nameBox || fontSettings) {
		drawCanvas();
	}
</script>

<svelte:head>
	<title>Certificates · CSEvent admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if isLoggedIn}
	<div class="min-h-screen bg-background">
		<header
			class="sticky top-0 z-50 border-b border-charcoal-900/[0.06] bg-background/80 backdrop-blur-xl"
		>
			<div class="h-[3px] bg-brand-500"></div>
			<div class="container flex h-16 items-center justify-between gap-3">
				<BrandMark href="/dev" subtitle="Certificates" />
				<div class="flex items-center gap-2">
					<Button href="/dev" variant="ghost" size="sm" class="gap-2">
						<ArrowLeft class="h-4 w-4" />
						<span class="hidden sm:inline">Dashboard</span>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						on:click={logout}
						class="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
					>
						<LogOut class="h-4 w-4" />
						<span class="hidden sm:inline">Logout</span>
					</Button>
				</div>
			</div>
		</header>

		<div class="container max-w-6xl py-8">
			<p class="text-sm font-semibold text-brand-700">
				// Certificates
			</p>
			<h1 class="mt-2 font-display text-3xl font-bold tracking-tight text-charcoal-950">
				Generate certificates
			</h1>
			<p class="mt-1 text-charcoal-600">
				Each PDF gets a QR code that links to its public verification page.
			</p>

			<!-- Progress Steps -->
			<ol class="mt-8 grid grid-cols-4 gap-2">
				{#each STEPS as label, i}
					{@const num = i + 1}
					<li class="flex flex-col gap-2">
						<div
							class="h-1.5 rounded-full {step >= num ? 'bg-brand-500' : 'bg-charcoal-100'}"
						></div>
						<div class="flex items-center gap-2 text-sm">
							<span
								class="grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-xs font-bold {step >
								num
									? 'bg-charcoal-950 text-white'
									: step === num
										? 'bg-brand-500 text-charcoal-950'
										: 'bg-charcoal-100 text-charcoal-500'}"
							>
								{#if step > num}<Check class="h-3.5 w-3.5" />{:else}{num}{/if}
							</span>
							<span
								class="hidden font-medium sm:inline {step >= num
									? 'text-charcoal-950'
									: 'text-charcoal-500'}">{label}</span
							>
						</div>
					</li>
				{/each}
			</ol>

			<div class="mt-8 rounded-2xl border border-charcoal-900/10 bg-card p-5 shadow-sm sm:p-8">
				<!-- Step 1: Upload Template -->
				{#if step === 1}
					<h2 class="flex items-center gap-2 font-display text-xl font-semibold text-charcoal-950">
						<ImageIcon class="h-5 w-5 text-brand-600" />
						Upload certificate template
					</h2>
					<label
						class="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-charcoal-900/15 bg-charcoal-50/60 p-10 text-center transition hover:border-brand-500 hover:bg-brand-50/50"
					>
						<span class="grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
							<Upload class="h-6 w-6" />
						</span>
						<span class="mt-4 font-semibold text-charcoal-900">
							{template ? template.name : 'Click to upload certificate template'}
						</span>
						<span class="mt-1 text-sm text-charcoal-500">PNG or JPG (Max 10MB)</span>
						<input type="file" accept="image/*" on:change={handleTemplateUpload} class="sr-only" />
					</label>

					{#if templatePreview}
						<img
							src={templatePreview}
							alt="Template"
							class="mx-auto mt-6 max-h-96 rounded-xl shadow ring-1 ring-charcoal-900/10"
						/>
						<Button on:click={() => (step = 2)} class="mt-6 w-full" size="lg">
							Next: position the name box
						</Button>
					{/if}
				{/if}

				<!-- Step 2: Position Name Box -->
				{#if step === 2}
					<h2 class="flex items-center gap-2 font-display text-xl font-semibold text-charcoal-950">
						<Move class="h-5 w-5 text-brand-600" />
						Position the name box
					</h2>
					<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
						<div class="space-y-4">
							<div class="space-y-1.5">
								<Label for="font-size">Font size</Label>
								<Input id="font-size" type="number" bind:value={fontSettings.size} />
							</div>
							<div class="space-y-1.5">
								<Label for="font-family">Font family</Label>
								<select
									id="font-family"
									bind:value={fontSettings.family}
									class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
								>
									{#each FONTS as font}
										<option>{font}</option>
									{/each}
								</select>
							</div>
							<div class="space-y-1.5">
								<Label for="font-color">Text colour</Label>
								<Input id="font-color" type="color" bind:value={fontSettings.color} class="h-10 p-1" />
							</div>
							<div class="space-y-1.5">
								<Label for="text-align">Text align</Label>
								<select
									id="text-align"
									bind:value={fontSettings.align}
									class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
								>
									<option value="left">Left</option>
									<option value="center">Center</option>
									<option value="right">Right</option>
								</select>
							</div>
						</div>

						<div class="min-w-0 space-y-3">
							<p class="flex items-center gap-2 text-sm text-charcoal-600">
								<MousePointerClick class="h-4 w-4 text-brand-600" />
								Drag the amber box to position it. Drag its corner to resize.
							</p>
							<div class="overflow-hidden rounded-xl border border-charcoal-900/10 bg-charcoal-50">
								<canvas
									bind:this={canvas}
									on:pointerdown={handlePointerDown}
									on:pointermove={handlePointerMove}
									on:pointerup={handlePointerUp}
									on:pointercancel={handlePointerUp}
									class="block w-full cursor-move touch-none"
									style="height: auto;"
								/>
							</div>
						</div>
					</div>

					<div class="mt-6 flex gap-3">
						<Button variant="outline" on:click={() => (step = 1)} class="flex-1">Back</Button>
						<Button on:click={() => (step = 3)} class="flex-1">Next: upload recipients</Button>
					</div>
				{/if}

				<!-- Step 3: Upload CSV -->
				{#if step === 3}
					<h2 class="flex items-center gap-2 font-display text-xl font-semibold text-charcoal-950">
						<FileText class="h-5 w-5 text-brand-600" />
						Upload recipients (CSV)
					</h2>
					<label
						class="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-charcoal-900/15 bg-charcoal-50/60 p-10 text-center transition hover:border-brand-500 hover:bg-brand-50/50"
					>
						<span class="grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
							<FileText class="h-6 w-6" />
						</span>
						<span class="mt-4 font-semibold text-charcoal-900">
							{csvFile ? csvFile.name : 'Click to upload CSV file'}
						</span>
						<span class="mt-1 text-sm text-charcoal-500">
							Columns: <code class="font-mono">name</code> or
							<code class="font-mono">Fname</code> + <code class="font-mono">Lname</code>; optional
							<code class="font-mono">student_id</code>, <code class="font-mono">course_id</code>
						</span>
						<input type="file" accept=".csv" on:change={handleCSVUpload} class="sr-only" />
					</label>

					{#if csvData.length > 0}
						<h3 class="mt-6 font-semibold text-charcoal-950">Preview ({csvData.length} records)</h3>
						<div class="mt-3 overflow-x-auto rounded-xl border border-charcoal-900/10">
							<table class="min-w-full text-sm">
								<thead class="bg-charcoal-50 text-left">
									<tr>
										{#each Object.keys(csvData[0]) as key}
											<th class="px-4 py-3 font-mono text-xs font-medium text-charcoal-600">{key}</th>
										{/each}
									</tr>
								</thead>
								<tbody class="divide-y divide-charcoal-900/5">
									{#each csvData.slice(0, 5) as row}
										<tr>
											{#each Object.values(row) as val}
												<td class="whitespace-nowrap px-4 py-3">{val}</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						{#if csvData.length > 5}
							<p class="mt-2 text-sm text-charcoal-500">… and {csvData.length - 5} more</p>
						{/if}
					{/if}

					{#if processing}
						<div class="mt-6 rounded-xl bg-brand-50 p-4 ring-1 ring-inset ring-brand-200">
							<div class="flex justify-between text-sm font-medium text-charcoal-900">
								<span>Generating certificates…</span>
								<span class="font-mono">{progress.done}/{progress.total}</span>
							</div>
							<div class="mt-2 h-2 overflow-hidden rounded-full bg-white">
								<div
									class="h-full rounded-full bg-brand-500 transition-all"
									style="width: {progress.total ? (progress.done / progress.total) * 100 : 0}%"
								></div>
							</div>
						</div>
					{/if}

					<div class="mt-6 flex gap-3">
						<Button variant="outline" on:click={() => (step = 2)} class="flex-1" disabled={processing}
							>Back</Button
						>
						<Button
							on:click={generateCertificates}
							disabled={csvData.length === 0 || processing}
							class="flex-1"
						>
							{processing ? 'Generating…' : `Generate ${csvData.length} certificates`}
						</Button>
					</div>
				{/if}

				<!-- Step 4: Generated -->
				{#if step === 4}
					<div class="flex items-start gap-4 rounded-xl bg-emerald-50 p-5 ring-1 ring-inset ring-emerald-200">
						<span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
							<Check class="h-5 w-5" />
						</span>
						<div>
							<h2 class="font-display text-xl font-semibold text-emerald-950">
								Certificates generated
							</h2>
							<p class="text-emerald-900">
								Successfully generated {generatedCerts.length} certificates with QR codes.
							</p>
						</div>
					</div>

					<div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{#each generatedCerts as cert}
							<div class="flex items-center justify-between gap-3 rounded-xl border border-charcoal-900/10 p-4">
								<div class="min-w-0">
									<p class="truncate font-semibold text-charcoal-950">{cert.name}</p>
									<a
										href="/verify/{cert.id}"
										target="_blank"
										class="font-mono text-xs text-charcoal-500 hover:text-brand-700"
										>{cert.id.substring(0, 8)}…</a
									>
								</div>
								<a
									href="/verify/{cert.id}/download"
									data-sveltekit-reload
									aria-label="Download PDF for {cert.name}"
									class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500 text-charcoal-950 transition hover:bg-brand-400"
								>
									<Download class="h-4 w-4" />
								</a>
							</div>
						{/each}
					</div>

					<Button variant="outline" on:click={resetBatch} class="mt-6 w-full">
						Create new batch
					</Button>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-screen items-center justify-center">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
	</div>
{/if}
