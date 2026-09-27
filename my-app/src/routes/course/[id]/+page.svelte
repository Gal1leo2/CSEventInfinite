<script lang="ts">
	import {
		ArrowLeft,
		ArrowRight,
		Building2,
		CalendarDays,
		CircleAlert,
		FileUp,
		Laptop,
		LoaderCircle,
		MapPin,
		Mic,
		Tag,
		Ticket,
		Zap
	} from 'lucide-svelte';
	import { marked } from 'marked';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Turnstile } from 'svelte-turnstile';
	import wretch from 'wretch';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { API, csrf, getErrorMessage } from '$lib/api';
	import { dateParts, flag, formatCourseDate, seats, type Course } from '$lib/course';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch';
	import CourseCover from '$lib/components/site/CourseCover.svelte';
	import OrbitArt from '$lib/components/site/OrbitArt.svelte';
	import SiteFooter from '$lib/components/site/SiteFooter.svelte';
	import SiteHeader from '$lib/components/site/SiteHeader.svelte';
	import StatusPill from '$lib/components/site/StatusPill.svelte';

	// Always present: this route is /course/[id].
	const id = $page.params.id as string;

	let course: Course | null = null;
	let isLoading = true;
	let error = '';
	let enrolled: number | null = null;

	async function fetchCourseDetails(id: string) {
		try {
			const csrfToken = await csrf();
			isLoading = true;

			const response = await wretch(`${API}/user/getcourse/${id}`)
				.headers({ 'X-CSRF-Token': csrfToken })
				.get()
				.json<Course[]>();

			if (response.length === 0 || Number(response[0].is_visible) !== 1) {
				goto('/home');
				return;
			}

			course = response[0];
		} catch (err: unknown) {
			error = getErrorMessage(err);
			goto('/home');
		} finally {
			isLoading = false;
		}
	}

	// Seat count is a nice-to-have; the page works without it.
	async function fetchEnrollment(id: string) {
		try {
			const csrfToken = await csrf();
			const stats = await wretch(`${API}/user/stats`)
				.headers({ 'X-CSRF-Token': csrfToken })
				.get()
				.json<{ enrollmentCounts: Record<string, number> }>();
			enrolled = stats.enrollmentCounts[id] ?? 0;
		} catch {
			enrolled = null;
		}
	}

	$: date = course ? dateParts(course.course_date) : null;
	$: capacity = course ? seats(course) : 0;
	$: needsLaptop = course ? flag(course.is_personalcomputer) : false;
	$: hasSubmission = course ? flag(course.is_submissionproject) : false;
	$: seatsLeft = enrolled === null ? null : Math.max(capacity - enrolled, 0);

	// Enrollment form
	let enrollOpen = false;
	let std_id = '';
	let Fname = '';
	let Lname = '';
	let stdYear = '';
	let laptop = false;
	let isSubmitting = false;
	let alertMessage = '';
	let touched = { std_id: false, Fname: false, Lname: false, stdYear: false };

	const isThaiOnly = (input: string) => /^[฀-๿\s]+$/.test(input);

	$: errors = {
		std_id: /^\d{8}$/.test(std_id) ? '' : 'รหัสนักศึกษาต้องมีตัวเลข 8 หลักเท่านั้น',
		Fname: isThaiOnly(Fname) ? '' : 'กรุณากรอกชื่อเป็นภาษาไทยเท่านั้น',
		Lname: isThaiOnly(Lname) ? '' : 'กรุณากรอกนามสกุลเป็นภาษาไทยเท่านั้น',
		stdYear: stdYear ? '' : 'กรุณาเลือกชั้นปี'
	};

	const submitform = async () => {
		touched = { std_id: true, Fname: true, Lname: true, stdYear: true };
		if (Object.values(errors).some(Boolean) || !course) return;

		isSubmitting = true;
		alertMessage = '';

		try {
			const csrfToken = await csrf();
			await wretch(`${API}/course/enroll`)
				.headers({ 'x-csrf-token': csrfToken })
				.post({
					student_id: std_id,
					course_id: id,
					fname: Fname,
					lname: Lname,
					laptop: laptop,
					stdyear: stdYear
				})
				.badRequest(async (e) => {
					try {
						alertMessage = JSON.parse(e.message).message;
					} catch {
						alertMessage = 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
					}
				})
				.res(async (response) => {
					if (response.status === 200) {
						toast.success('ลงทะเบียนสำเร็จ');
						const params = new URLSearchParams({
							studentId: std_id,
							firstName: Fname,
							lastName: Lname,
							year: stdYear,
							courseName: course?.course_name || ''
						});
						setTimeout(() => {
							goto(`/course/${id}/complete?${params.toString()}`);
						}, 1000);
					} else {
						alertMessage = 'An unexpected error occurred.';
					}
				});
		} catch {
			alertMessage = 'Network error. Please try again later.';
		} finally {
			isSubmitting = false;
		}
	};

	const YEARS = [
		{ value: '1', label: 'ปี 1' },
		{ value: '2', label: 'ปี 2' },
		{ value: '3', label: 'ปี 3' },
		{ value: '4', label: 'ปี 4' },
		{ value: '5', label: 'อื่นๆ' }
	];

	const FAQ = [
		{
			q: 'What should I prepare before the course?',
			a: ['Please check the course details for specific requirements. For courses requiring a laptop, ensure you have the necessary software installed beforehand.']
		},
		{
			q: 'What is the benefit of taking a short course?',
			a: [
				"Explore new interests: it's a great way to explore new fields of interest before committing to more extensive education.",
				'Skill development: learn specific and intensive content in a short period, such as technology skills, tools, or specialized programming languages.'
			]
		},
		{ q: 'Do you have any snacks?', a: ['Nope! 😊'] }
	];

	onMount(() => {
		fetchCourseDetails(id);
		fetchEnrollment(id);
	});
</script>

<svelte:head>
	<title>{course ? `${course.course_name} · CSEvent` : 'CSEvent - Short Course Registration'}</title>
	<meta name="description" content="Computer Science KMITL Short Course Registration System" />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<SiteHeader />

	<main class="flex-1 pb-28 lg:pb-0">
		{#if isLoading}
			<div class="bg-charcoal-950">
				<div class="container space-y-5 pb-24 pt-10">
					<div class="h-4 w-28 animate-pulse rounded bg-white/10"></div>
					<div class="h-10 w-3/4 animate-pulse rounded-lg bg-white/10"></div>
					<div class="h-5 w-1/2 animate-pulse rounded bg-white/10"></div>
				</div>
			</div>
			<div class="container grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_400px]">
				<div class="h-80 animate-pulse rounded-2xl bg-charcoal-100"></div>
				<div class="h-96 animate-pulse rounded-2xl bg-charcoal-100 lg:-mt-40"></div>
			</div>
		{:else if course}
			<!-- Title band -->
			<section class="relative overflow-hidden bg-charcoal-950 text-white">
				<OrbitArt
					tone="dark"
					class="pointer-events-none absolute -left-40 -top-36 h-[480px] w-[480px] opacity-[0.07]"
				/>
				<div class="bg-dot-grid pointer-events-none absolute inset-0 opacity-30 invert"></div>
				<div class="container relative grid gap-10 pb-12 pt-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-28">
					<div class="animate-fade-up">
						<a
							href="/home#courses"
							class="inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-300 transition-colors hover:text-white"
						>
							<ArrowLeft class="h-4 w-4" />
							All courses
						</a>
						<div class="mt-6 flex flex-wrap items-center gap-2">
							<StatusPill status="open" />
							<span
								class="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-brand-300"
							>
								{course.course_type}
							</span>
						</div>
						<h1
							class="mt-5 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]"
						>
							{course.course_name}
						</h1>
						<div class="mt-6 flex flex-col gap-3 text-charcoal-200 sm:flex-row sm:flex-wrap sm:gap-x-6">
							<span class="inline-flex items-center gap-2">
								<CalendarDays class="h-4 w-4 text-brand-400" />
								{formatCourseDate(course.course_date, {
									weekday: 'long',
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								})}
							</span>
							{#if course.course_location}
								<span class="inline-flex items-start gap-2">
									<MapPin class="mt-1 h-4 w-4 shrink-0 text-brand-400" />
									{course.course_location}
								</span>
							{/if}
						</div>
					</div>
				</div>
			</section>

			<div class="container grid gap-8 pb-20 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
				<!-- Poster + registration (first on phones) -->
				<aside class="order-first -mt-6 space-y-6 lg:order-none lg:col-start-2 lg:row-start-1 lg:-mt-64">
					<div
						class="relative aspect-square overflow-hidden rounded-2xl shadow-[0_30px_60px_-30px_rgb(24_25_29/0.6)] ring-1 ring-black/5"
					>
						<CourseCover
							src={course.course_img}
							alt={course.course_name}
							label={course.course_type}
							eager
						/>
					</div>

					<div class="lg:sticky lg:top-24">
						<div class="overflow-hidden rounded-2xl border border-charcoal-900/10 bg-card shadow-lg">
							<div class="flex items-center justify-between bg-brand-500 px-5 py-3 text-charcoal-950">
								<span class="text-sm font-semibold"
									>Registration open</span
								>
								<Ticket class="h-5 w-5" />
							</div>
							<div class="p-5">
								{#if date}
									<div class="flex items-center gap-4">
										<div class="font-display text-5xl font-bold leading-none text-charcoal-950">
											{date.day}
										</div>
										<div class="leading-tight">
											<div class="font-semibold text-charcoal-950">{date.month} {date.year}</div>
											<div class="text-sm text-charcoal-500">{date.weekday}</div>
										</div>
									</div>
								{/if}

								<dl class="mt-5 divide-y divide-charcoal-900/[0.07] border-y border-charcoal-900/[0.07] text-sm">
									{#each [{ icon: MapPin, label: 'Location', value: course.course_location }, { icon: Mic, label: 'Instructor', value: course.course_lecture }, { icon: Building2, label: 'Provided by', value: course.course_team }, { icon: Tag, label: 'Type', value: course.course_type }, { icon: Laptop, label: 'Computer', value: needsLaptop ? 'Bring your own laptop' : 'Provided on site' }] as row}
										{#if row.value}
											<div class="flex gap-3 py-3">
												<svelte:component
													this={row.icon}
													class="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
												/>
												<div class="min-w-0">
													<dt class="text-xs text-charcoal-500">{row.label}</dt>
													<dd class="font-medium text-charcoal-900">{row.value}</dd>
												</div>
											</div>
										{/if}
									{/each}
								</dl>

								{#if enrolled !== null && capacity > 0}
									<div class="mt-5">
										<div class="flex items-center justify-between text-sm">
											<span class="text-charcoal-600"
												><span class="font-bold tabular-nums text-charcoal-950">{enrolled}</span>/{capacity}
												enrolled</span
											>
											<span
												class="font-semibold {seatsLeft === 0
													? 'text-red-600'
													: 'text-emerald-700'}"
											>
												{seatsLeft === 0 ? 'Full' : `${seatsLeft} seats left`}
											</span>
										</div>
										<div class="mt-2 h-2 overflow-hidden rounded-full bg-charcoal-100">
											<div
												class="h-full rounded-full bg-brand-500"
												style="width: {Math.min((enrolled / capacity) * 100, 100)}%"
											></div>
										</div>
									</div>
								{/if}

								<button
									type="button"
									on:click={() => (enrollOpen = true)}
									class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3.5 font-semibold text-charcoal-950 shadow-[0_10px_24px_-12px_rgb(226_126_6/0.9)] transition hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								>
									Enroll now
									<ArrowRight class="h-4 w-4" />
								</button>
								{#if hasSubmission}
									<a
										href="/submission"
										class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-charcoal-900/15 px-5 py-3 font-semibold text-charcoal-900 transition hover:bg-charcoal-50"
									>
										<FileUp class="h-4 w-4" />
										Submit project
									</a>
								{/if}
							</div>
						</div>
					</div>
				</aside>

				<!-- Description + FAQ -->
				<div class="space-y-8 lg:col-start-1 lg:row-start-1 lg:pt-10">
					<article class="rounded-2xl border border-charcoal-900/10 bg-card p-6 shadow-sm sm:p-8">
						<p class="text-sm font-semibold text-brand-700">// About this course</p>
						{#if course.course_description?.trim()}
							<div
								class="prose mt-4 max-w-none text-charcoal-700 prose-headings:font-display prose-headings:text-charcoal-950 prose-li:marker:text-brand-500 prose-a:text-brand-700 prose-strong:text-charcoal-950 prose-img:rounded-xl"
							>
								{@html marked.parse(course.course_description ?? '')}
							</div>
						{/if}

						<div
							class="flex items-center gap-4 rounded-xl bg-brand-50 {course.course_description?.trim()
								? 'mt-8'
								: 'mt-4'} p-4 ring-1 ring-inset ring-brand-200"
						>
							<span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-500 text-charcoal-950">
								<Zap class="h-5 w-5" />
							</span>
							<div>
								<h3 class="font-semibold text-charcoal-950">Ready to enhance your skills?</h3>
								<p class="text-sm text-charcoal-600">
									Click “Enroll now” to secure your spot in this course.
								</p>
							</div>
						</div>
					</article>

					<section class="rounded-2xl border border-charcoal-900/10 bg-card p-6 shadow-sm sm:p-8">
						<p class="text-sm font-semibold text-brand-700">// FAQ</p>
						<h2 class="mt-1 font-display text-2xl font-bold text-charcoal-950">
							Frequently asked questions
						</h2>
						<Accordion.Root class="mt-4">
							{#each FAQ as item, i}
								<Accordion.Item value="faq-{i}">
									<Accordion.Trigger class="text-left font-semibold text-charcoal-950 hover:no-underline"
										>{item.q}</Accordion.Trigger
									>
									<Accordion.Content>
										<div class="space-y-2 text-charcoal-600">
											{#each item.a as paragraph}
												<p>{paragraph}</p>
											{/each}
										</div>
									</Accordion.Content>
								</Accordion.Item>
							{/each}
						</Accordion.Root>
					</section>
				</div>
			</div>

			<!-- Phone CTA -->
			<div
				class="fixed inset-x-0 bottom-0 z-30 border-t border-charcoal-900/10 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_-15px_rgb(0_0_0/0.25)] backdrop-blur lg:hidden"
			>
				<div class="flex items-center gap-3">
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold text-charcoal-950">{course.course_name}</p>
						<p class="text-xs text-charcoal-500">
							{formatCourseDate(course.course_date)}{seatsLeft !== null && capacity > 0
								? ` · ${seatsLeft} seats left`
								: ''}
						</p>
					</div>
					<button
						type="button"
						on:click={() => (enrollOpen = true)}
						class="shrink-0 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-charcoal-950"
					>
						Enroll now
					</button>
				</div>
			</div>
		{:else}
			<div class="container max-w-2xl py-20 text-center">
				<span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
					<CircleAlert class="h-6 w-6" />
				</span>
				<h1 class="mt-5 font-display text-3xl font-bold text-charcoal-950">
					We couldn't find this course
				</h1>
				<p class="mt-3 text-charcoal-600">
					{error || "The course you're looking for may have been removed or doesn't exist."}
				</p>
				<a
					href="/home#courses"
					class="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 font-semibold text-charcoal-950 hover:bg-brand-400"
				>
					Browse courses
					<ArrowRight class="h-4 w-4" />
				</a>
			</div>
		{/if}
	</main>

	<SiteFooter />
</div>

{#if course}
	<Dialog.Root bind:open={enrollOpen}>
		<Dialog.Content class="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
			<div class="border-b border-brand-200 bg-brand-50 px-6 pb-5 pt-6">
				<p class="text-sm font-semibold text-brand-800">
					Enrollment
				</p>
				<Dialog.Title class="mt-1 pr-6 font-display text-xl font-bold leading-snug text-charcoal-950">
					{course.course_name}
				</Dialog.Title>
				<Dialog.Description class="mt-1 text-sm text-charcoal-600">
					Complete your enrollment information below to reserve your spot.
				</Dialog.Description>
			</div>

			<form on:submit|preventDefault={submitform} novalidate class="px-6 py-6">
				<fieldset disabled={isSubmitting} class="space-y-5">
					<div>
						<Label for="stuid" class="text-sm font-semibold text-charcoal-900">รหัสนักศึกษา</Label>
						<Input
							id="stuid"
							bind:value={std_id}
							inputmode="numeric"
							maxlength={8}
							autocomplete="off"
							class="mt-1.5 h-11 font-mono text-base tracking-[0.2em] {touched.std_id && errors.std_id
								? 'border-red-400'
								: ''}"
							placeholder="กรอกรหัสนักศึกษา 8 หลัก"
							aria-invalid={touched.std_id && !!errors.std_id}
							on:blur={() => (touched.std_id = true)}
						/>
						{#if touched.std_id && errors.std_id}
							<p class="mt-1.5 text-sm text-red-600">{errors.std_id}</p>
						{/if}
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<Label for="fname" class="text-sm font-semibold text-charcoal-900">ชื่อ (ภาษาไทย)</Label>
							<Input
								id="fname"
								bind:value={Fname}
								class="mt-1.5 h-11 {touched.Fname && errors.Fname ? 'border-red-400' : ''}"
								placeholder="ชื่อภาษาไทย"
								aria-invalid={touched.Fname && !!errors.Fname}
								on:blur={() => (touched.Fname = true)}
							/>
							{#if touched.Fname && errors.Fname}
								<p class="mt-1.5 text-sm text-red-600">{errors.Fname}</p>
							{/if}
						</div>
						<div>
							<Label for="lname" class="text-sm font-semibold text-charcoal-900"
								>นามสกุล (ภาษาไทย)</Label
							>
							<Input
								id="lname"
								bind:value={Lname}
								class="mt-1.5 h-11 {touched.Lname && errors.Lname ? 'border-red-400' : ''}"
								placeholder="นามสกุลภาษาไทย"
								aria-invalid={touched.Lname && !!errors.Lname}
								on:blur={() => (touched.Lname = true)}
							/>
							{#if touched.Lname && errors.Lname}
								<p class="mt-1.5 text-sm text-red-600">{errors.Lname}</p>
							{/if}
						</div>
					</div>

					<div role="radiogroup" aria-labelledby="year-label">
						<p id="year-label" class="text-sm font-semibold text-charcoal-900">ชั้นปี</p>
						<div class="mt-2 grid grid-cols-5 gap-2">
							{#each YEARS as year}
								<label class="relative">
									<input
										type="radio"
										name="stdyear"
										value={year.value}
										bind:group={stdYear}
										class="peer sr-only"
									/>
									<span
										class="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-charcoal-900/15 text-sm font-medium text-charcoal-700 transition hover:bg-charcoal-50 peer-checked:border-brand-500 peer-checked:bg-brand-500 peer-checked:font-semibold peer-checked:text-charcoal-950 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"
									>
										{year.label}
									</span>
								</label>
							{/each}
						</div>
						{#if touched.stdYear && errors.stdYear}
							<p class="mt-1.5 text-sm text-red-600">{errors.stdYear}</p>
						{/if}
					</div>

					<div
						class="rounded-xl border p-4 {needsLaptop && !laptop
							? 'border-red-200 bg-red-50'
							: 'border-charcoal-900/10 bg-charcoal-50'}"
					>
						<div class="flex items-center gap-3">
							<Switch id="laptop" bind:checked={laptop} />
							<Label for="laptop" class="cursor-pointer text-sm font-medium text-charcoal-800">
								ผู้เข้าร่วมสามารถนำคอมพิวเตอร์มาเองได้
							</Label>
						</div>
						{#if needsLaptop && !laptop}
							<p class="mt-2 text-sm font-medium text-red-700">
								ในคอร์สนี้ต้องนำคอมพิวเตอร์ส่วนตัวมาเอง กรุณายืนยันการนำคอมพิวเตอร์ส่วนตัวมาเอง
							</p>
						{/if}
					</div>

					<Turnstile
						siteKey="0x4AAAAAAAkTZ_RJ8UwUievi"
						theme="light"
						size="normal"
						id="cf-turnstile-response"
					/>

					{#if alertMessage}
						<div role="alert" class="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
							<CircleAlert class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
							<div>
								<p class="font-semibold text-red-900">เกิดข้อผิดพลาด</p>
								<p class="text-sm text-red-800">{alertMessage}</p>
							</div>
						</div>
					{/if}

					<div class="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
						<Dialog.Close
							type="button"
							class="h-11 rounded-xl border border-charcoal-900/15 px-5 font-medium text-charcoal-800 transition hover:bg-charcoal-50"
						>
							ยกเลิก
						</Dialog.Close>
						<button
							type="submit"
							class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 font-semibold text-charcoal-950 transition hover:bg-brand-400 disabled:opacity-70"
						>
							{#if isSubmitting}
								<LoaderCircle class="h-4 w-4 animate-spin" />
								กำลังลงทะเบียน...
							{:else}
								ลงทะเบียน
							{/if}
						</button>
					</div>
				</fieldset>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{/if}
