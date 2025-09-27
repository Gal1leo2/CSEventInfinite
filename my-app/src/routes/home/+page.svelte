<script lang="ts">
	import { CalendarCheck, LibraryBig, UsersRound, User, BookOpen, Calendar } from 'lucide-svelte';
	// import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	//import * as Table from '$lib/components/ui/table/index.js';
	import { onMount } from 'svelte';
	import { writable, derived } from 'svelte/store';
	// import Cookies from 'js-cookie';
	import Wretch from 'wretch';
	// import { toast } from 'svelte-sonner';
	import { Toaster } from 'svelte-sonner';
	import Footer from '$lib/components/ui/Footer.svelte';
	import Header from '$lib/components/ui/Header.svelte';

	interface Course {
		course_id: string;
		course_name: string;
		course_lecture: string;
		course_type: string;
		course_date: string;
		course_team: string;
		is_visible: string;
		pastEvent: boolean;
	}

	interface StatsResponse {
		totalStudents: number;
		enrollmentCounts: Record<string, number>;
	}

	let courses = writable<Course[]>([]);
	let isLoading = writable(true);
	let stats = writable<StatsResponse>({
		totalStudents: 0,
		enrollmentCounts: {} as Record<string, number>
	});
	let error = writable<string>('');
	let selectedTab = writable('all'); // 'all', 'open', 'closed' , 'past'
	async function fetchStats() {
		try {
			const csrfToken = await csrf();
			const response = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/stats`)
				.headers({
					'X-CSRF-Token': csrfToken
				})
				.get()
				.json<StatsResponse>();
			stats.set(response);
		} catch (err) {
			error.set(getErrorMessage(err));
		} finally {
			isLoading.set(false);
		}
	}

	function getErrorMessage(error: unknown): string {
		if (error instanceof Error) return error.message;
		return String(error);
	}

	const csrf = async () => {
		try {
			const response = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/csrf-token`)
				.get()
				.json<{ csrfToken: string }>();
			return response.csrfToken;
		} catch (error) {
			console.error('Failed to fetch CSRF token:', error);
			throw new Error('Failed to fetch CSRF token');
		}
	};

	async function fetchCourses() {
		try {
			const csrfToken = await csrf();
			isLoading.set(true);
			const response = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/getcourse`)
				.headers({
					'X-CSRF-Token': csrfToken
				})
				.get()
				.json<Course[]>();
			courses.set(response);
		} catch (err: unknown) {
			error.set(getErrorMessage(err));
		} finally {
			isLoading.set(false);
		}
	}

	function sortByDate(courses: Course[]): Course[] {
		return courses.slice().sort((a, b) => {
			const dateA = new Date(a.course_date);
			const dateB = new Date(b.course_date);
			return dateA.getTime() - dateB.getTime();
		});
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		};
		return date.toLocaleDateString('en-US', options);
	}

	let enrollCount = derived([courses, stats], ([$courses, $stats]) => {
		const sortedCourses = sortByDate($courses);
		return sortedCourses.map((course) => {
			let count = $stats.enrollmentCounts[course.course_id] || 0;
			return { ...course, enroll_count: count };
		});
	});

	let filteredCourses = derived([enrollCount, selectedTab], ([$enrollCount, $selectedTab]) => {
		if ($selectedTab === 'open') {
			return $enrollCount.filter((course) => course.is_visible === '1');
		} else if ($selectedTab === 'closed') {
			return $enrollCount.filter(
				(course) => course.is_visible === '2' && course.pastEvent === false
			);
		} else if ($selectedTab === 'past') {
			return $enrollCount.filter((course) => course.pastEvent === true);
		} else {
			return $enrollCount.filter(
				(course) => course.is_visible !== '3' && course.is_visible !== '4'
			);
		}
	});

	let canRegisCourses = derived(courses, ($courses) => {
		return $courses.filter((course) => course.is_visible === '1').length;
	});

	let totalCourses = derived(courses, ($courses) => {
		return $courses.filter(
			(course) =>
				(course.is_visible === '2' || course.is_visible === '3') && course.pastEvent === false
		).length;
	});

	let totalStudents = derived(stats, ($stats) => {
		return $stats.totalStudents;
	});

	onMount(async () => {
		fetchCourses();
		fetchStats();
	});
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<link
		href="https://fonts.googleapis.com/css?family=Noto+Sans+Thai:400,500,600,700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="fontUse flex min-h-screen flex-col bg-gray-50">
	<Header />

	<main class="container mx-auto flex-1 px-4 py-8">
		<!-- Hero section -->
		<div
			class="mb-8 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white shadow-lg"
		>
			<div class="max-w-3xl">
				<h1 class="mb-4 text-3xl font-bold md:text-4xl">
					<span class="text-[#E35205]">CTRL</span> your future<br />
					<span class="text-[#E35205]">ALT</span> your dream<br />
					<span class="text-[#E35205]">SHIFT UP</span> your skills
				</h1>
				<p class="mb-6 text-gray-300">
					Let's expand our knowledge with our short courses led by our computer science members.
				</p>
				<a
					href="#courses"
					class="inline-flex items-center rounded-md bg-[#E35205] px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-[#FF6B2B]"
				>
					Browse Courses
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="ml-2 h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M5 12h14M12 5l7 7-7 7" />
					</svg>
				</a>
			</div>
		</div>

		{#if $isLoading}
			<div class="flex items-center justify-center p-12">
				<div
					class="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#E35205]"
				></div>
			</div>
		{:else if $error}
			<div
				class="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
				role="alert"
			>
				<strong class="font-bold">Error:</strong>
				<span class="block sm:inline"> {$error}</span>
			</div>
		{/if}

		<!-- Stats cards -->
		<div class="mb-8 grid gap-6 md:grid-cols-3">
			<Card.Root class="overflow-hidden">
				<div class="h-1.5 bg-gradient-to-r from-[#E35205] to-[#FF6B2B]"></div>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Open for Registration</Card.Title>
					<CalendarCheck class="h-5 w-5 text-[#E35205]" />
				</Card.Header>
				<Card.Content>
					<div class="text-3xl font-bold">{$canRegisCourses}</div>
					<p class="text-sm text-gray-500">Available courses</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="overflow-hidden">
				<div class="h-1.5 bg-gradient-to-r from-[#E35205] to-[#FF6B2B]"></div>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Upcoming Events</Card.Title>
					<Calendar class="h-5 w-5 text-[#E35205]" />
				</Card.Header>
				<Card.Content>
					<div class="text-3xl font-bold">{$totalCourses}</div>
					<p class="text-sm text-gray-500">Future events</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="overflow-hidden">
				<div class="h-1.5 bg-gradient-to-r from-[#E35205] to-[#FF6B2B]"></div>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Total Students</Card.Title>
					<UsersRound class="h-5 w-5 text-[#E35205]" />
				</Card.Header>
				<Card.Content>
					<div class="text-3xl font-bold">{$totalStudents}</div>
					<p class="text-sm text-gray-500">Registered participants</p>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Course section -->
		<div id="courses" class="mb-8">
			<div class="mb-6 flex flex-col justify-between md:flex-row md:items-center">
				<div>
					<h2 class="text-2xl font-bold text-gray-800">Available Courses</h2>
					<p class="text-gray-600">Browse and register for our short courses.</p>
				</div>

				<div class="mt-4 flex gap-2 rounded-md border bg-white p-1 shadow-sm md:mt-0">
					<button
						class="rounded-md px-4 py-2 transition-colors {$selectedTab === 'all'
							? 'bg-[#E35205] text-white'
							: 'hover:bg-gray-100'}"
						on:click={() => selectedTab.set('all')}
					>
						All
					</button>
					<button
						class="rounded-md px-4 py-2 transition-colors {$selectedTab === 'open'
							? 'bg-[#E35205] text-white'
							: 'hover:bg-gray-100'}"
						on:click={() => selectedTab.set('open')}
					>
						Open
					</button>
					<button
						class="rounded-md px-4 py-2 transition-colors {$selectedTab === 'closed'
							? 'bg-[#E35205] text-white'
							: 'hover:bg-gray-100'}"
						on:click={() => selectedTab.set('closed')}
					>
						Closed
					</button>
					<button
						class="rounded-md px-4 py-2 transition-colors {$selectedTab === 'past'
							? 'bg-[#E35205] text-white'
							: 'hover:bg-gray-100'}"
						on:click={() => selectedTab.set('past')}
					>
						Past
					</button>
				</div>
			</div>

			<div class="overflow-hidden rounded-xl bg-white shadow-sm">
				{#if $filteredCourses.length === 0}
					<div class="flex flex-col items-center justify-center p-12 text-center">
						<BookOpen class="mb-4 h-16 w-16 text-gray-300" />
						<h3 class="text-xl font-medium text-gray-800">No courses found</h3>
						<p class="mt-1 text-gray-500">No courses match the current filter criteria</p>
					</div>
				{:else}
					<div class="grid gap-6 p-6 md:grid-cols-1 lg:grid-cols-2">
						{#each $filteredCourses as course}
							<Card.Root
								class="overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md"
							>
								<div class="h-1 bg-gradient-to-r from-[#E35205] to-[#FF6B2B]"></div>
								<Card.Header class="pb-2">
									<div class="flex items-start justify-between">
										<div>
											<div class="mb-1 flex items-center gap-2">
												<span
													class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
													>{course.course_type}</span
												>
												{#if course.is_visible === '1'}
													<span
														class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
														>Open</span
													>
												{:else if course.is_visible === '2'}
													<span
														class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
														>Closed</span
													>
												{/if}
											</div>
											<Card.Title class="text-lg font-bold">{course.course_name}</Card.Title>
										</div>
										<div class="text-sm font-medium text-gray-500">
											{formatDate(course.course_date)}
										</div>
									</div>
								</Card.Header>
								<Card.Content class="pt-0">
									<div class="mb-3 flex items-center gap-1 text-gray-600">
										<User class="h-4 w-4" />
										<span class="text-sm">{course.course_lecture}</span>
									</div>

									<div class="mb-4 flex items-center gap-1 text-gray-600">
										<UsersRound class="h-4 w-4" />
										<span class="text-sm">{course.course_team}</span>
									</div>

									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<div class="relative h-2 w-20 overflow-hidden rounded-full bg-gray-200">
												<div
													class="absolute left-0 top-0 h-full rounded-full bg-[#E35205]"
													style="width: {Math.min((course.enroll_count / 45) * 100, 100)}%"
												></div>
											</div>
											<span class="text-xs text-gray-500">{course.enroll_count} enrolled</span>
										</div>

										{#if course.is_visible === '1'}
											<a
												href="/course/{course.course_id}"
												class="inline-flex items-center rounded-md bg-[#E35205] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#FF6B2B]"
											>
												Register Now
											</a>
										{:else if course.is_visible === '2'}
											<button
												class="inline-flex cursor-not-allowed items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
												disabled
											>
												Registration Closed
											</button>
										{/if}
									</div>
								</Card.Content>
							</Card.Root>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</main>

	<Footer />
</div>

<Toaster />

<style>
	.fontUse {
		font-family: 'Noto Sans Thai', sans-serif;
	}
</style>
