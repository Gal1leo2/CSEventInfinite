<script lang="ts">
	import {
		ArrowRight,
		CalendarDays,
		Check,
		Clock,
		FileUp,
		Laptop,
		MapPin,
		Mic,
		Printer,
		TriangleAlert
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import wretch from 'wretch';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { API, csrf, getErrorMessage } from '$lib/api';
	import { flag, formatCourseDate, type Course } from '$lib/course';
	import OrbitArt from '$lib/components/site/OrbitArt.svelte';
	import SiteFooter from '$lib/components/site/SiteFooter.svelte';
	import SiteHeader from '$lib/components/site/SiteHeader.svelte';

	// Get course ID from URL params
	// Always present: this route is /course/[id].
	const id = $page.params.id as string;

	// Get enrollment data from URL search params
	let studentId = '';
	let firstName = '';
	let lastName = '';
	let year = '';
	let courseName = '';

	let course: Course | null = null;
	let isLoading = true;
	let error = '';
	let isValidAccess = false;
	let checked = false;

	// Security check function
	function validateAccess(): boolean {
		const urlParams = new URLSearchParams($page.url.searchParams);
		const requiredParams = ['studentId', 'firstName', 'lastName', 'year'];

		// Check if all required parameters are present and not empty
		for (const param of requiredParams) {
			const value = urlParams.get(param);
			if (!value || value.trim() === '') {
				return false;
			}
		}

		// Additional validation for student ID (should be 8 digits)
		const studentIdParam = urlParams.get('studentId');
		if (studentIdParam && !/^\d{8}$/.test(studentIdParam)) {
			return false;
		}

		return true;
	}

	async function fetchCoursesDetails(id: string) {
		try {
			const csrfToken = await csrf();
			isLoading = true;

			const response = await wretch(`${API}/user/getcourse/${id}`)
				.headers({ 'X-CSRF-Token': csrfToken })
				.get()
				.json<Course[]>();

			course = response[0] ?? null;
		} catch (err: unknown) {
			error = getErrorMessage(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		checked = true;
		// Security check: validate access before proceeding
		if (!validateAccess()) {
			// Small delay before redirect for better UX
			setTimeout(() => {
				goto(`/course/${id}`);
			}, 1500);
			return;
		}

		isValidAccess = true;

		// Extract data from URL search params
		const urlParams = new URLSearchParams($page.url.searchParams);
		studentId = urlParams.get('studentId') || '';
		firstName = urlParams.get('firstName') || '';
		lastName = urlParams.get('lastName') || '';
		year = urlParams.get('year') || '';
		courseName = urlParams.get('courseName') || '';

		fetchCoursesDetails(id);
	});

	function getYearDisplayName(yearValue: string): string {
		switch (yearValue) {
			case '1':
				return 'ปี 1';
			case '2':
				return 'ปี 2';
			case '3':
				return 'ปี 3';
			case '4':
				return 'ปี 4';
			case '5':
				return 'อื่นๆ';
			default:
				return 'ไม่ระบุ';
		}
	}

	$: title = course?.course_name || courseName;
</script>

<svelte:head>
	<title>CSEvent - Registration Complete</title>
	<meta name="description" content="Course enrollment completed successfully" />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<div class="print:hidden"><SiteHeader /></div>

	<main class="relative flex-1 overflow-hidden">
		<div
			class="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_65%)] print:hidden"
		></div>

		{#if !checked || !isValidAccess}
			{#if checked}
				<div class="container relative max-w-md py-24 text-center">
					<span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
						<TriangleAlert class="h-6 w-6" />
					</span>
					<h1 class="mt-5 font-display text-2xl font-bold text-charcoal-950">การเข้าถึงไม่ถูกต้อง</h1>
					<p class="mt-2 text-charcoal-600">กรุณาลงทะเบียนผ่านหน้าคอร์สก่อน</p>
					<p class="mt-6 inline-flex items-center gap-2 text-sm text-charcoal-500">
						<span
							class="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
						></span>
						กำลังเปลี่ยนเส้นทางไปหน้าคอร์ส...
					</p>
				</div>
			{/if}
		{:else}
			<section class="container relative max-w-3xl py-12 sm:py-16">
				<div class="text-center">
					<span
						class="mx-auto grid h-20 w-20 animate-pop-in place-items-center rounded-full bg-emerald-500 text-white shadow-[0_18px_40px_-15px_rgb(16_185_129/0.8)] ring-8 ring-emerald-100"
					>
						<Check class="h-10 w-10" stroke-width={3} />
					</span>
					<h1 class="mt-7 font-display text-4xl font-bold tracking-tight text-charcoal-950">
						ลงทะเบียนสำเร็จ! 🎉
					</h1>
					<p class="mt-2 text-lg text-charcoal-600">Registration completed successfully</p>
				</div>

				<!-- Admission ticket -->
				<div
					class="relative mt-10 animate-fade-up overflow-hidden rounded-3xl bg-card shadow-[0_30px_70px_-35px_rgb(24_25_29/0.55)] ring-1 ring-charcoal-900/10 [animation-delay:200ms]"
				>
					<div class="relative overflow-hidden bg-charcoal-950 px-6 pb-8 pt-6 text-white sm:px-8">
						<OrbitArt
							tone="dark"
							class="pointer-events-none absolute -right-16 -top-20 h-64 w-64 opacity-20"
						/>
						<div class="relative flex items-center gap-3">
							<span class="grid h-10 w-10 place-items-center rounded-xl bg-white p-1">
								<img src="/brand/cs-logo-320.png" alt="" class="h-full w-full object-contain" />
							</span>
							<span class="text-sm font-semibold text-brand-400">
								CSEvent · Admission
							</span>
						</div>
						<p class="relative mt-6 text-xs font-medium text-charcoal-400">
							ชื่อคอร์ส
						</p>
						<h2 class="relative mt-1 font-display text-2xl font-bold leading-snug sm:text-3xl">
							{title}
						</h2>
						{#if course?.course_type}
							<p class="relative mt-2 text-sm text-charcoal-300">{course.course_type}</p>
						{/if}
					</div>

					<!-- Perforation -->
					<div class="relative h-0">
						<span class="absolute -left-4 -top-4 h-8 w-8 rounded-full bg-background"></span>
						<span class="absolute -right-4 -top-4 h-8 w-8 rounded-full bg-background"></span>
					</div>
					<div class="mx-8 border-t-2 border-dashed border-charcoal-200"></div>

					<div class="grid gap-8 px-6 py-7 sm:grid-cols-2 sm:px-8">
						<dl class="space-y-4">
							<div>
								<dt class="text-xs font-medium text-charcoal-500">
									รหัสนักศึกษา
								</dt>
								<dd class="mt-1 font-mono text-2xl font-bold tracking-wider text-charcoal-950">
									{studentId}
								</dd>
							</div>
							<div>
								<dt class="text-xs font-medium text-charcoal-500">
									ชื่อ-นามสกุล
								</dt>
								<dd class="mt-1 text-xl font-semibold text-charcoal-950">{firstName} {lastName}</dd>
							</div>
							<div>
								<dt class="text-xs font-medium text-charcoal-500">
									ชั้นปี
								</dt>
								<dd class="mt-1 text-xl font-semibold text-charcoal-950">
									{getYearDisplayName(year)}
								</dd>
							</div>
						</dl>

						<dl class="space-y-4 sm:border-l sm:border-charcoal-900/10 sm:pl-8">
							{#if isLoading}
								{#each Array(3) as _}
									<div class="space-y-2">
										<div class="h-3 w-20 animate-pulse rounded bg-charcoal-100"></div>
										<div class="h-5 w-40 animate-pulse rounded bg-charcoal-100"></div>
									</div>
								{/each}
							{:else if course}
								<div>
									<dt class="flex items-center gap-1.5 text-xs font-medium text-charcoal-500">
										<CalendarDays class="h-3.5 w-3.5" /> วันที่จัดอบรม
									</dt>
									<dd class="mt-1 text-lg font-semibold text-charcoal-950">
										{formatCourseDate(course.course_date, {
											weekday: 'short',
											day: 'numeric',
											month: 'long',
											year: 'numeric'
										})}
									</dd>
								</div>
								{#if course.course_location}
									<div>
										<dt class="flex items-center gap-1.5 text-xs font-medium text-charcoal-500">
											<MapPin class="h-3.5 w-3.5" /> สถานที่
										</dt>
										<dd class="mt-1 font-medium text-charcoal-900">{course.course_location}</dd>
									</div>
								{/if}
								{#if course.course_lecture}
									<div>
										<dt class="flex items-center gap-1.5 text-xs font-medium text-charcoal-500">
											<Mic class="h-3.5 w-3.5" /> วิทยากร
										</dt>
										<dd class="mt-1 line-clamp-3 font-medium text-charcoal-900">
											{course.course_lecture}
										</dd>
									</div>
								{/if}
							{:else if error}
								<p class="text-sm text-charcoal-500">
									Couldn't load the course details right now. Your registration is still saved.
								</p>
							{/if}
						</dl>
					</div>
				</div>

				<!-- Before you come -->
				<div class="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-6">
					<h3 class="flex items-center gap-2 font-semibold text-charcoal-950">
						<Clock class="h-5 w-5 text-brand-700" />
						ข้อมูลสำคัญ
					</h3>
					<ul class="mt-3 space-y-2 text-charcoal-700">
						<li class="flex gap-2"><span class="text-brand-600">●</span> กรุณามาถึงก่อนเวลาเริ่มงาน 15 นาที</li>
						{#if course && flag(course.is_personalcomputer)}
							<li class="flex gap-2 font-semibold text-red-700">
								<Laptop class="mt-0.5 h-4 w-4 shrink-0" /> กรุณานำคอมพิวเตอร์ส่วนตัวมาเอง
							</li>
						{/if}
						<li class="flex gap-2"><span class="text-brand-600">●</span> หากไม่สามารถเข้าร่วมได้ กรุณาแจ้งล่วงหน้า</li>
					</ul>
				</div>

				{#if course && flag(course.is_submissionproject)}
					<div class="mt-4 flex items-center gap-4 rounded-2xl border border-charcoal-900/10 bg-card p-5">
						<span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-charcoal-950 text-brand-400">
							<FileUp class="h-5 w-5" />
						</span>
						<div>
							<h3 class="font-semibold text-charcoal-950">Project submission required</h3>
							<p class="text-sm text-charcoal-600">คอร์สนี้มีการส่งโปรเจค หลังจากเสร็จสิ้นการอบรมแล้ว</p>
						</div>
					</div>
				{/if}

				<div class="mt-10 flex flex-col justify-center gap-3 sm:flex-row print:hidden">
					<a
						href="/home"
						class="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-7 py-3 font-semibold text-charcoal-950 transition hover:bg-brand-400"
					>
						กลับหน้าหลัก
					</a>
					<a
						href="/home#courses"
						class="inline-flex items-center justify-center gap-2 rounded-full border border-charcoal-900/15 bg-card px-7 py-3 font-semibold text-charcoal-900 transition hover:bg-charcoal-50"
					>
						ดูคอร์สอื่นๆ
						<ArrowRight class="h-4 w-4" />
					</a>
					<button
						type="button"
						on:click={() => window.print()}
						class="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-medium text-charcoal-600 transition hover:text-charcoal-950"
					>
						<Printer class="h-4 w-4" />
						Save a copy
					</button>
				</div>
			</section>
		{/if}
	</main>

	<div class="print:hidden"><SiteFooter /></div>
</div>
