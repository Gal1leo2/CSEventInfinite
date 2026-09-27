<script lang="ts">
	import {
		ArrowRight,
		BookOpen,
		RotateCw
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import Wretch from 'wretch';
	import { API, csrf, getErrorMessage } from '$lib/api';
	import {
		courseStatus,
		isPastCourse,
		parseCourseDate,
		type Course
	} from '$lib/course';
	import CourseCard from '$lib/components/site/CourseCard.svelte';
	import SiteFooter from '$lib/components/site/SiteFooter.svelte';
	import SiteHeader from '$lib/components/site/SiteHeader.svelte';

	interface StatsResponse {
		totalStudents: number;
		enrollmentCounts: Record<string, number>;
	}

	type Tab = 'all' | 'open' | 'closed' | 'past';

	let courses: Course[] = [];
	let stats: StatsResponse = { totalStudents: 0, enrollmentCounts: {} };
	let isLoading = true;
	let error = '';
	let selectedTab: Tab = 'all';

	async function fetchStats() {
		const csrfToken = await csrf();
		stats = await Wretch(`${API}/user/stats`)
			.headers({ 'X-CSRF-Token': csrfToken })
			.get()
			.json<StatsResponse>();
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
		error = '';
		try {
			await Promise.all([fetchCourses(), fetchStats()]);
		} catch (err) {
			error = getErrorMessage(err);
		} finally {
			isLoading = false;
		}
	}

	const time = (course: Course) => parseCourseDate(course.course_date)?.getTime() ?? 0;
	const visibility = (course: Course) => String(course.is_visible);

	// Drafts (0) are never public. Upcoming courses come first, soonest first; past ones
	// follow, most recent first.
	$: listed = courses
		.filter((course) => visibility(course) !== '0')
		.map((course) => ({
			course,
			status: courseStatus(course),
			past: isPastCourse(course),
			enrolled: stats.enrollmentCounts[course.course_id] || 0
		}))
		.sort((a, b) =>
			a.past !== b.past ? Number(a.past) - Number(b.past) : a.past ? time(b.course) - time(a.course) : time(a.course) - time(b.course)
		);

	let tabs: Record<Tab, typeof listed>;
	$: tabs = {
		all: listed.filter(({ course }) => ['1', '2'].includes(visibility(course))),
		open: listed.filter(({ status }) => status === 'open'),
		closed: listed.filter(({ course, past }) => visibility(course) === '2' && !past),
		past: listed.filter(({ past }) => past)
	};

	$: filtered = tabs[selectedTab];

	$: openCount = tabs.open.length;

	const TABS: { value: Tab; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'open', label: 'Open' },
		{ value: 'closed', label: 'Closed' },
		{ value: 'past', label: 'Past' }
	];

	const EMPTY: Record<Tab, { title: string; body: string }> = {
		all: {
			title: 'No courses on the calendar yet',
			body: 'New short courses are announced here first. Meanwhile, see what we have run before.'
		},
		open: {
			title: 'Nothing is open for registration',
			body: 'Registration opens a few weeks before each course. Check back soon.'
		},
		closed: {
			title: 'No closed courses',
			body: 'Courses that have stopped taking registrations will show up here.'
		},
		past: { title: 'No past courses', body: 'Finished courses and events will be listed here.' }
	};

	function showTab(tab: Tab) {
		selectedTab = tab;
		document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
	}

	type HeroKey = 'ctrl' | 'alt' | 'shift';
	let held: Record<HeroKey, boolean> = { ctrl: false, alt: false, shift: false };
	const press = (key: HeroKey) => (held = { ...held, [key]: true });
	const release = (key: HeroKey) => (held = { ...held, [key]: false });
	const releaseAll = () => (held = { ctrl: false, alt: false, shift: false });

	const PHYSICAL_KEYS: Record<string, HeroKey> = { Control: 'ctrl', Alt: 'alt', Shift: 'shift' };
	function onKey(event: KeyboardEvent, down: boolean) {
		const key = PHYSICAL_KEYS[event.key];
		if (key) (down ? press : release)(key);
	}

	// "up your skills": the word stays, its style cycles through the fields we teach.
	type Part = { text: string; style?: string };
	const SKILL_STYLES: { name: string; wrap: string; parts: Part[]; after?: Part }[] = [
		{ name: 'plain', wrap: '', parts: [{ text: 'skills' }] },
		{
			name: 'python',
			wrap: 'font-mono text-[0.65em]',
			parts: [
				{ text: 'print', style: 'text-[#3776AB]' },
				{ text: '(', style: 'text-charcoal-400' },
				{ text: '"skills"', style: 'text-brand-700' },
				{ text: ')', style: 'text-charcoal-400' }
			]
		},
		{
			name: 'html',
			wrap: 'font-mono text-[0.65em]',
			parts: [
				{ text: '<', style: 'text-charcoal-400' },
				{ text: 'div', style: 'text-rose-600' },
				{ text: '>', style: 'text-charcoal-400' },
				{ text: 'skills' },
				{ text: '</', style: 'text-charcoal-400' },
				{ text: 'div', style: 'text-rose-600' },
				{ text: '>', style: 'text-charcoal-400' }
			]
		},
		{
			name: 'cyber security',
			wrap: 'rounded-[0.2em] bg-charcoal-950 px-[0.35em] font-mono text-[0.65em]',
			parts: [
				{ text: '$ ', style: 'text-charcoal-400' },
				{ text: '5k1ll5', style: 'text-emerald-400' },
				{ text: '_', style: 'caret text-emerald-400' }
			]
		},
		{
			name: 'game development',
			wrap: 'font-mono text-[0.78em] uppercase text-sky-500 [text-shadow:0.08em_0.08em_0_#27292E]',
			parts: [{ text: 'skills' }],
			after: {
				text: '+99 XP',
				style: 'ml-[0.35em] align-super font-mono text-[0.3em] font-bold text-brand-600'
			}
		},
		// Drawn by its own markup: sparkles, shimmering gradient, glow and a streaming reveal.
		{ name: 'ai', wrap: '', parts: [{ text: 'skills' }] }
	];
	let wordIndex = 0;

	onMount(() => {
		const timer = setInterval(() => (wordIndex = (wordIndex + 1) % SKILL_STYLES.length), 2000);
		return () => clearInterval(timer);
	});

	onMount(load);
</script>

<svelte:window
	on:keydown={(e) => onKey(e, true)}
	on:keyup={(e) => onKey(e, false)}
	on:blur={releaseAll}
	on:pointerup={releaseAll}
/>

<svelte:head>
	<title>CSEvent · Short courses by Computer Science KMITL</title>
	<meta
		name="description"
		content="Register for short courses and events led by Computer Science, KMITL members."
	/>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<SiteHeader />

	<main class="flex-1">
		<!-- Hero -->
		<section class="relative overflow-hidden">
			<div
				class="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black_30%,transparent_70%)]"
			></div>
			<div class="container relative pb-20 pt-14 sm:pt-20 lg:pb-28 lg:pt-24">
				<div class="animate-fade-up">
					<h1
						class="font-display text-[2.35rem] font-bold leading-[1.25] tracking-tight text-charcoal-950 sm:text-6xl sm:leading-[1.18] xl:text-7xl"
					>
						<span class="sr-only">Ctrl your future. Alt your dream. Shift up your skills.</span>
						<!-- Hold a key (mouse, touch or the real keyboard) and its line reacts. -->
						<span aria-hidden="true" class="block select-none">
							<span class="block">
								<button
									type="button"
									tabindex="-1"
									class="keycap keycap-brand keycap-press {held.ctrl ? 'is-down' : ''}"
									style="animation-delay: 0.5s"
									on:pointerdown={() => press('ctrl')}
									on:pointerup={() => release('ctrl')}
									on:pointerleave={() => release('ctrl')}
									on:pointercancel={() => release('ctrl')}>Ctrl</button
								>
								<span class="relative whitespace-nowrap">
									<span
										class="absolute -inset-x-[0.08em] inset-y-[0.1em] origin-left rounded-[0.12em] bg-brand-200 transition-transform duration-300 ease-out {held.ctrl
											? 'scale-x-100'
											: 'scale-x-0'}"
									></span>
									<span class="relative">your future</span>
								</span>
							</span>
							<span class="block">
								<button
									type="button"
									tabindex="-1"
									class="keycap keycap-press {held.alt ? 'is-down' : ''}"
									style="animation-delay: 0.75s"
									on:pointerdown={() => press('alt')}
									on:pointerup={() => release('alt')}
									on:pointerleave={() => release('alt')}
									on:pointercancel={() => release('alt')}>Alt</button
								>
								<span class="inline-grid whitespace-nowrap">
									<span
										class="transition duration-300 ease-out [grid-area:1/1] {held.alt
											? '-translate-y-[0.3em] opacity-0'
											: ''}">your dream</span
									>
									<span
										class="text-brand-600 transition duration-300 ease-out [grid-area:1/1] {held.alt
											? ''
											: 'translate-y-[0.3em] opacity-0'}">ความฝันของคุณ</span
									>
								</span>
							</span>
							<span class="block">
								<button
									type="button"
									tabindex="-1"
									class="keycap keycap-press {held.shift ? 'is-down' : ''}"
									style="animation-delay: 1s"
									on:pointerdown={() => press('shift')}
									on:pointerup={() => release('shift')}
									on:pointerleave={() => release('shift')}
									on:pointercancel={() => release('shift')}><span>⇧</span><span>Shift</span></button
								>
								<span class="whitespace-nowrap"
									>{#each [...'up your'] as char, i}<span
											class="inline-block transition duration-200 ease-out {held.shift
												? '-translate-y-[0.2em] text-brand-600'
												: ''}"
											style="transition-delay: {held.shift ? i * 18 : 0}ms"
											>{char === ' ' ? '\u00A0' : char}</span
										>{/each}</span
								>
								<span
									class="inline-grid items-baseline transition duration-200 ease-out {held.shift
										? '-translate-y-[0.2em]'
										: ''}"
									style="transition-delay: {held.shift ? 7 * 18 : 0}ms"
								>
									<!-- Every style sits in the same grid cell, so the line never jumps. -->
									{#each SKILL_STYLES as variant, i}
										<span
											class="whitespace-nowrap transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [grid-area:1/1] {i ===
											wordIndex
												? 'translate-y-0 opacity-100'
												: i === (wordIndex + SKILL_STYLES.length - 1) % SKILL_STYLES.length
													? '-translate-y-[0.5em] opacity-0'
													: 'translate-y-[0.5em] opacity-0'}"
											>{#if variant.name === 'ai'}<span
													class="ai-word {i === wordIndex ? 'is-active' : ''}"
													><span class="ai-glow"></span><svg
														viewBox="0 0 24 24"
														class="ai-sparkle"
														aria-hidden="true"
														><defs
															><linearGradient id="ai-spark" x1="0" y1="0" x2="1" y2="1"
																><stop offset="0" stop-color="#7C3AED" /><stop
																	offset="0.55"
																	stop-color="#D946EF"
																/><stop offset="1" stop-color="#06B6D4" /></linearGradient
															></defs
														><path
															fill="url(#ai-spark)"
															d="M10 3c.6 5.6 3.4 8.4 9 9-5.6.6-8.4 3.4-9 9-.6-5.6-3.4-8.4-9-9 5.6-.6 8.4-3.4 9-9Z"
														/><path
															class="ai-sparkle-small"
															fill="url(#ai-spark)"
															d="M19.5 1c.25 2.4 1.1 3.25 3.5 3.5-2.4.25-3.25 1.1-3.5 3.5-.25-2.4-1.1-3.25-3.5-3.5 2.4-.25 3.25-1.1 3.5-3.5Z"
														/></svg
													><span class="ai-text">skills</span></span
												>{:else}<span class={variant.wrap}
													>{#each variant.parts as part}<span class={part.style ?? ''}
															>{part.text}</span
														>{/each}</span
												>{#if variant.after}<span class={variant.after.style}
														>{variant.after.text}</span
													>{/if}{/if}</span
										>
									{/each}
								</span>
							</span>
						</span>
					</h1>

					<p class="mt-8 max-w-xl text-lg leading-relaxed text-charcoal-600">
						Let’s expand your knowledge through short courses and events led by our Computer
						Science, KMITL members.
					</p>

					<div class="mt-9 flex flex-wrap items-center gap-3">
						<a
							href="#courses"
							class="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 font-semibold text-charcoal-950 shadow-[0_10px_24px_-10px_rgb(226_126_6/0.8)] transition hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							Browse courses
							<ArrowRight class="h-4 w-4" />
						</a>
						{#if !isLoading && openCount > 0}
							<button
								type="button"
								on:click={() => showTab('open')}
								class="inline-flex items-center gap-2 rounded-full border border-charcoal-900/15 bg-white px-5 py-3 font-medium text-charcoal-800 transition hover:border-charcoal-900/30"
							>
								<span class="relative flex h-2 w-2">
									<span
										class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
									></span>
									<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
								</span>
								{openCount} open for registration
							</button>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<!-- Courses -->
		<section id="courses" class="container pb-20 pt-6">
			<div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
				<div>
					<h2 class="font-display text-3xl font-bold tracking-tight text-charcoal-950 sm:text-4xl">
						Find your next session
					</h2>
					<p class="mt-2 text-charcoal-600">Browse and register for our short courses.</p>
				</div>

				<div
					role="tablist"
					aria-label="Filter courses"
					class="inline-flex self-start rounded-full border border-charcoal-900/10 bg-card p-1 shadow-sm md:self-auto"
				>
					{#each TABS as tab}
						<button
							type="button"
							role="tab"
							aria-selected={selectedTab === tab.value}
							on:click={() => (selectedTab = tab.value)}
							class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors {selectedTab ===
							tab.value
								? 'bg-charcoal-950 text-white shadow'
								: 'text-charcoal-600 hover:text-charcoal-950'}"
						>
							{tab.label}
							{#if !isLoading}
								<span
									class="rounded-full px-1.5 font-mono text-[11px] {selectedTab === tab.value
										? 'bg-brand-500 text-charcoal-950'
										: 'bg-charcoal-100 text-charcoal-600'}">{tabs[tab.value].length}</span
								>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<div class="mt-10">
				{#if isLoading}
					<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each Array(3) as _}
							<div class="overflow-hidden rounded-2xl border border-charcoal-900/10 bg-card">
								<div class="aspect-[4/3] animate-pulse bg-charcoal-100"></div>
								<div class="space-y-3 p-5">
									<div class="h-3 w-24 animate-pulse rounded bg-charcoal-100"></div>
									<div class="h-5 w-4/5 animate-pulse rounded bg-charcoal-100"></div>
									<div class="h-4 w-3/5 animate-pulse rounded bg-charcoal-100"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if error}
					<div
						role="alert"
						class="flex flex-col items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-6 sm:flex-row sm:items-center sm:justify-between"
					>
						<div>
							<p class="font-semibold text-red-900">We couldn't load the courses</p>
							<p class="mt-1 text-sm text-red-800">{error}</p>
						</div>
						<button
							type="button"
							on:click={load}
							class="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
						>
							<RotateCw class="h-4 w-4" />
							Try again
						</button>
					</div>
				{:else if filtered.length === 0}
					<div
						class="flex flex-col items-center rounded-2xl border border-dashed border-charcoal-900/15 bg-card px-6 py-16 text-center"
					>
						<span class="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
							<BookOpen class="h-6 w-6" />
						</span>
						<h3 class="mt-5 font-display text-xl font-semibold text-charcoal-950">
							{EMPTY[selectedTab].title}
						</h3>
						<p class="mt-2 max-w-md text-charcoal-600">{EMPTY[selectedTab].body}</p>
						{#if selectedTab !== 'past' && tabs.past.length > 0}
							<button
								type="button"
								on:click={() => (selectedTab = 'past')}
								class="mt-6 inline-flex items-center gap-2 rounded-full border border-charcoal-900/15 px-5 py-2.5 text-sm font-semibold text-charcoal-900 transition hover:border-charcoal-900/30 hover:bg-charcoal-50"
							>
								See {tabs.past.length} past courses
								<ArrowRight class="h-4 w-4" />
							</button>
						{/if}
					</div>
				{:else}
					<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each filtered as item (item.course.course_id)}
							<CourseCard course={item.course} status={item.status} enrolled={item.enrolled} />
						{/each}
					</div>
				{/if}
			</div>
		</section>
	</main>

	<SiteFooter />
</div>
