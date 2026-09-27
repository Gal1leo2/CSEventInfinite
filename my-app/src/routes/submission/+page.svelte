<script lang="ts">
	import {
		ArrowRight,
		BadgeCheck,
		Check,
		ChevronDown,
		CircleAlert,
		CloudUpload,
		FileText,
		LoaderCircle,
		RotateCw,
		TriangleAlert,
		X
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Wretch from 'wretch';
	import { API, csrf, getErrorMessage } from '$lib/api';
	import type { Course } from '$lib/course';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import SiteFooter from '$lib/components/site/SiteFooter.svelte';
	import SiteHeader from '$lib/components/site/SiteHeader.svelte';

	interface Enrollment {
		id: string;
		student_id: string;
		Fname: string;
		Lname: string;
		course_id: string;
		laptop: boolean;
	}

	// Without this the upload would post to `undefined/upload`.
	const STORAGE: string | undefined = import.meta.env.VITE_API_STORAGE;

	const canUpload = Boolean(STORAGE);

	const STEPS = ['Student ID', 'Upload files'];

	let enrollments: Enrollment[] = [];
	let courses: Course[] = [];
	let isLoading = true;
	let loadError = '';

	let studentId = '';
	let verifiedId = '';
	let studentCourses: Course[] = [];
	let selectedCourse = '';

	let files: File[] = [];
	let isDragging = false;
	let isUploading = false;
	let showConfirm = false;

	$: step = verifiedId ? 2 : 1;
	$: totalBytes = files.reduce((sum, file) => sum + file.size, 0);
	$: selectedCourseName =
		studentCourses.find((course) => String(course.course_id) === selectedCourse)?.course_name ?? '';

	async function fetchStudents() {
		const csrfToken = await csrf();
		enrollments = await Wretch(`${API}/user/getuser`)
			.headers({ 'X-CSRF-Token': csrfToken })
			.get()
			.json<Enrollment[]>();
	}

	async function fetchCourses() {
		const csrfToken = await csrf();
		courses = await Wretch(`${API}/user/getcourse`)
			.headers({ 'X-CSRF-Token': csrfToken })
			.get()
			.json<Course[]>();
	}

	async function load() {
		isLoading = true;
		loadError = '';
		try {
			await Promise.all([fetchStudents(), fetchCourses()]);
		} catch (err) {
			loadError = getErrorMessage(err);
		} finally {
			isLoading = false;
		}
	}

	function checkStudentId() {
		const id = studentId.trim();
		const matches = enrollments.filter((user) => String(user.student_id) === id);

		if (!id || matches.length === 0) {
			toast.error('Student ID not found.');
			studentCourses = [];
			verifiedId = '';
			return;
		}

		const courseIds = new Set(matches.map((user) => String(user.course_id)));
		studentCourses = courses.filter((course) => courseIds.has(String(course.course_id)));
		selectedCourse = studentCourses.length === 1 ? String(studentCourses[0].course_id) : '';
		files = [];
		verifiedId = id;
	}

	function changeStudent() {
		verifiedId = '';
		studentCourses = [];
		selectedCourse = '';
		files = [];
	}

	// Every file is prefixed with the student ID so staff can tell submissions apart.
	function setFiles(list: FileList | null | undefined) {
		if (!list || list.length === 0) return;
		files = Array.from(list).map(
			(file) => new File([file], `${verifiedId}_${file.name}`, { type: file.type })
		);
	}

	function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		setFiles(input.files);
		// Clear it so picking the same file again still fires `change`.
		input.value = '';
	}

	function handleDrop(event: DragEvent) {
		isDragging = false;
		if (!canUpload || isUploading) return;
		setFiles(event.dataTransfer?.files);
	}

	// dragleave also fires when the pointer moves onto a child, so ignore those.
	function handleDragLeave(event: DragEvent) {
		const zone = event.currentTarget as Node;
		if (!zone.contains(event.relatedTarget as Node | null)) isDragging = false;
	}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function requestUpload() {
		if (files.length === 0) {
			toast.error('Please select files to upload.');
			return;
		}
		if (!selectedCourse) {
			toast.error('Please select a course.');
			return;
		}
		showConfirm = true;
	}

	async function uploadFiles() {
		if (!STORAGE) return;
		if (files.length === 0) {
			toast.error('Please select files to upload.');
			return;
		}
		if (!selectedCourse) {
			toast.error('Please select a course.');
			return;
		}

		isUploading = true;

		const formData = new FormData();
		files.forEach((file) => formData.append('files', file));

		try {
			const response = await fetch(`${STORAGE}/upload`, {
				method: 'POST',
				body: formData,
				headers: {
					'Course-ID': selectedCourse
				}
			});

			const result = await response.json().catch(() => ({}));

			if (response.ok) {
				toast.success('Files uploaded successfully!');
				files = [];
			} else {
				toast.error('Error: ' + (result.error ?? response.statusText));
			}
		} catch (error) {
			toast.error('Error: ' + getErrorMessage(error));
		} finally {
			isUploading = false;
		}
	}

	function confirmUpload() {
		showConfirm = false;
		uploadFiles();
	}

	onMount(load);
</script>

<svelte:head>
	<title>Submit project · CSEvent</title>
	<meta name="description" content="Upload your short course project files" />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<SiteHeader />

	<main class="relative flex-1 overflow-hidden">
		<div
			class="bg-dot-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]"
		></div>

		<div class="relative mx-auto w-full max-w-xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
			<div class="animate-fade-up">
				<p class="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-700">
					// Project submission
				</p>
				<h1
					class="mt-2 font-display text-3xl font-bold tracking-tight text-charcoal-950 sm:text-4xl"
				>
					Submit your project
				</h1>
				<p class="mt-2 text-charcoal-600">
					Verify your student ID, pick your course, then upload your files.
				</p>
			</div>

			<div
				class="mt-8 overflow-hidden rounded-2xl border border-charcoal-900/10 bg-card shadow-sm"
			>
				<!-- Step indicator -->
				<ol class="flex items-center gap-3 border-b border-charcoal-900/10 px-5 py-4 sm:px-6">
					{#each STEPS as label, i}
						{@const number = i + 1}
						{@const done = step > number}
						{@const active = step === number}
						<li
							class="flex items-center gap-2.5 {i < STEPS.length - 1 ? 'flex-1' : ''}"
							aria-current={active ? 'step' : undefined}
						>
							<span
								class="grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-xs font-bold {done
									? 'bg-charcoal-950 text-white'
									: active
										? 'bg-brand-500 text-charcoal-950'
										: 'bg-charcoal-100 text-charcoal-500'}"
							>
								{#if done}
									<Check class="h-3.5 w-3.5" />
									<span class="sr-only">Completed:</span>
								{:else}
									{number}
								{/if}
							</span>
							<span
								class="whitespace-nowrap text-sm font-semibold {active || done
									? 'text-charcoal-950'
									: 'text-charcoal-500'}">{label}</span
							>
							{#if i < STEPS.length - 1}
								<span
									aria-hidden="true"
									class="ml-1 h-px flex-1 {done ? 'bg-charcoal-950' : 'bg-charcoal-200'}"
								></span>
							{/if}
						</li>
					{/each}
				</ol>

				<div class="p-5 sm:p-6">
					{#if isLoading}
						<div class="space-y-4" aria-busy="true" aria-label="Loading">
							<div class="h-4 w-28 animate-pulse rounded bg-charcoal-100"></div>
							<div class="h-11 w-full animate-pulse rounded-xl bg-charcoal-100"></div>
							<div class="h-11 w-full animate-pulse rounded-xl bg-charcoal-100"></div>
						</div>
					{:else if loadError}
						<div role="alert" class="rounded-xl border border-red-200 bg-red-50 p-4">
							<div class="flex gap-3">
								<CircleAlert class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
								<div class="min-w-0">
									<p class="font-semibold text-red-900">We couldn't load student records</p>
									<p class="mt-1 break-words text-sm text-red-800">{loadError}</p>
								</div>
							</div>
							<button
								type="button"
								on:click={load}
								class="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
							>
								<RotateCw class="h-4 w-4" />
								Try again
							</button>
						</div>
					{:else if step === 1}
						<!-- Step 1: student ID -->
						<form on:submit|preventDefault={checkStudentId} class="space-y-5">
							<div>
								<Label for="student-id" class="text-sm font-semibold text-charcoal-900">
									Student ID
								</Label>
								<Input
									id="student-id"
									bind:value={studentId}
									inputmode="numeric"
									autocomplete="off"
									maxlength={16}
									placeholder="e.g. 67050123"
									class="mt-1.5 h-12 font-mono text-base tracking-wider"
								/>
								<p class="mt-1.5 text-sm text-charcoal-500">
									Use the ID you enrolled in the course with.
								</p>
							</div>

							<button
								type="submit"
								disabled={!studentId.trim()}
								class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 font-semibold text-charcoal-950 transition hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								Check Student ID
								<ArrowRight class="h-4 w-4" />
							</button>
						</form>
					{:else}
						<!-- Step 2: course + files -->
						<div class="space-y-6">
							<div
								class="flex items-center justify-between gap-3 rounded-xl bg-charcoal-50 px-4 py-3 ring-1 ring-inset ring-charcoal-900/10"
							>
								<div class="flex min-w-0 items-center gap-3">
									<BadgeCheck class="h-5 w-5 shrink-0 text-emerald-600" />
									<div class="min-w-0">
										<p class="text-xs text-charcoal-500">Verified student ID</p>
										<p class="truncate font-mono font-semibold text-charcoal-950">{verifiedId}</p>
									</div>
								</div>
								<button
									type="button"
									on:click={changeStudent}
									disabled={isUploading}
									class="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
								>
									Change
								</button>
							</div>

							{#if !canUpload}
								<div
									role="status"
									class="flex gap-3 rounded-xl border border-brand-300 bg-brand-50 p-4 text-brand-900"
								>
									<TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
									<div>
										<p class="font-semibold">Uploads are not configured yet</p>
										<p class="mt-0.5 text-sm text-brand-800">
											The storage server hasn't been set up. Please check back later or contact the
											course staff.
										</p>
									</div>
								</div>
							{/if}

							<div>
								<Label for="course" class="text-sm font-semibold text-charcoal-900">Course</Label>
								{#if studentCourses.length === 0}
									<p
										class="mt-1.5 rounded-xl border border-dashed border-charcoal-900/15 px-4 py-3 text-sm text-charcoal-600"
									>
										No courses found for this student ID.
									</p>
								{:else}
									<div class="relative mt-1.5">
										<select
											id="course"
											bind:value={selectedCourse}
											disabled={isUploading}
											class="flex h-11 w-full cursor-pointer appearance-none rounded-md border border-input bg-background py-2 pl-3 pr-10 text-sm text-charcoal-950 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										>
											<option value="" disabled>Select Course</option>
											{#each studentCourses as course (course.course_id)}
												<option value={String(course.course_id)}>{course.course_name}</option>
											{/each}
										</select>
										<ChevronDown
											class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-500"
										/>
									</div>
								{/if}
							</div>

							<div>
								<p id="files-label" class="text-sm font-semibold text-charcoal-900">Files</p>
								<label
									class="mt-1.5 block {canUpload && !isUploading
										? 'cursor-pointer'
										: 'cursor-not-allowed'}"
									on:dragenter|preventDefault={() => (isDragging = canUpload && !isUploading)}
									on:dragover|preventDefault={() => (isDragging = canUpload && !isUploading)}
									on:dragleave|preventDefault={handleDragLeave}
									on:drop|preventDefault={handleDrop}
								>
									<input
										type="file"
										multiple
										disabled={!canUpload || isUploading}
										aria-labelledby="files-label"
										aria-describedby="files-hint"
										on:change={handleFileChange}
										class="peer sr-only"
									/>
									<span
										class="flex flex-col items-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:opacity-60 {isDragging
											? 'border-brand-500 bg-brand-50'
											: 'border-charcoal-900/15 bg-charcoal-50/60 hover:border-brand-400 hover:bg-brand-50/50'}"
									>
										<span
											class="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200"
										>
											<CloudUpload class="h-6 w-6" />
										</span>
										<span class="mt-3 font-semibold text-charcoal-950">
											{isDragging ? 'Drop files here' : 'Choose files to upload'}
										</span>
										<span class="mt-1 text-sm text-charcoal-500">
											Click to browse, or drag and drop them here
										</span>
									</span>
								</label>
								<p id="files-hint" class="mt-2 text-sm text-charcoal-600">
									*คุณสามารถ Upload หลายไฟล์พร้อมกันได้ โดยการ คลุมทุกไฟล์ที่ต้องการ Upload
								</p>

								{#if files.length > 0}
									<div class="mt-4">
										<div class="flex items-center justify-between text-xs text-charcoal-500">
											<span
												>{files.length}
												{files.length === 1 ? 'file' : 'files'} selected</span
											>
											<span class="font-mono">{formatSize(totalBytes)}</span>
										</div>
										<ul
											class="mt-2 divide-y divide-charcoal-900/[0.07] rounded-xl border border-charcoal-900/10"
										>
											{#each files as file, i (file.name + i)}
												<li class="flex items-center gap-3 px-3 py-2.5">
													<FileText class="h-4 w-4 shrink-0 text-brand-600" />
													<span class="min-w-0 flex-1 truncate text-sm text-charcoal-900" title={file.name}
														>{file.name}</span
													>
													<span class="shrink-0 font-mono text-xs text-charcoal-500"
														>{formatSize(file.size)}</span
													>
													<button
														type="button"
														on:click={() => removeFile(i)}
														disabled={isUploading}
														aria-label="Remove {file.name}"
														class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
													>
														<X class="h-4 w-4" />
													</button>
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>

							<button
								type="button"
								on:click={requestUpload}
								disabled={!canUpload || files.length === 0 || isUploading}
								class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 font-semibold text-charcoal-950 transition hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if isUploading}
									<LoaderCircle class="h-4 w-4 animate-spin" />
									Uploading…
								{:else}
									<CloudUpload class="h-4 w-4" />
									Upload
								{/if}
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</main>

	<SiteFooter />
</div>

<AlertDialog.Root bind:open={showConfirm}>
	<AlertDialog.Content class="w-[calc(100vw-2rem)] rounded-2xl sm:rounded-2xl">
		<AlertDialog.Header>
			<AlertDialog.Title class="font-display text-xl text-charcoal-950">Confirm Upload</AlertDialog.Title>
			<AlertDialog.Description class="text-charcoal-600">
				Are you sure you want to upload these files? This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<dl class="rounded-xl bg-charcoal-50 p-4 text-sm ring-1 ring-inset ring-charcoal-900/10">
			<div class="flex justify-between gap-4">
				<dt class="text-charcoal-500">Student ID</dt>
				<dd class="font-mono font-semibold text-charcoal-950">{verifiedId}</dd>
			</div>
			<div class="mt-2 flex justify-between gap-4">
				<dt class="shrink-0 text-charcoal-500">Course</dt>
				<dd class="min-w-0 text-right font-semibold text-charcoal-950">{selectedCourseName}</dd>
			</div>
			<div class="mt-2 flex justify-between gap-4">
				<dt class="text-charcoal-500">Files</dt>
				<dd class="font-semibold text-charcoal-950">
					{files.length} · <span class="font-mono font-normal">{formatSize(totalBytes)}</span>
				</dd>
			</div>
		</dl>
		<AlertDialog.Footer>
			<AlertDialog.Cancel
				class="h-11 rounded-xl border-charcoal-900/15 font-semibold text-charcoal-900 hover:bg-charcoal-50"
				>Cancel</AlertDialog.Cancel
			>
			<AlertDialog.Action
				on:click={confirmUpload}
				class="h-11 rounded-xl bg-brand-500 font-semibold text-charcoal-950 hover:bg-brand-400"
				>Upload</AlertDialog.Action
			>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
