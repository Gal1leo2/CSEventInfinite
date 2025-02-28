<script lang="ts">
	import { CalendarCheck, LibraryBig, UsersRound, User, BookOpen, Calendar } from 'lucide-svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { onMount } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import Cookies from 'js-cookie';
	import Wretch from 'wretch';
	import { toast } from 'svelte-sonner';
	import { Toaster } from 'svelte-sonner';

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

	interface Student {
		id: number;
		name: string;
		course_id: string;
		Fname: String;
		Lname: String;
		laptop: boolean;
	}

	let courses = writable<Course[]>([]);
	let students = writable<Student[]>([]);
	let isLoading = writable(true);
	let error = writable<string>('');
	let selectedTab = writable('all'); // 'all', 'open', 'closed'

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

	async function fetchStudents() {
		try {
			const csrfToken = await csrf();
			isLoading.set(true);
			const response = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/getuser`)
				.headers({
					'X-CSRF-Token': csrfToken
				})
				.get()
				.json<Student[]>();
			students.set(response);
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

	let enrollCount = derived([courses, students], ([$courses, $students]) => {
		const sortedCourses = sortByDate($courses);
		return sortedCourses.map((course) => {
			let count = $students.filter((student) => student.course_id === course.course_id).length;
			return { ...course, enroll_count: count };
		});
	});

	let filteredCourses = derived([enrollCount, selectedTab], ([$enrollCount, $selectedTab]) => {
		if ($selectedTab === 'open') {
			return $enrollCount.filter(course => course.is_visible === '1');
		} else if ($selectedTab === 'closed') {
			return $enrollCount.filter(course => course.is_visible === '2' && course.pastEvent === false);
		} else {
			return $enrollCount.filter(course => course.is_visible !== '3' && course.is_visible !== '4');
		}
	});

	let canRegisCourses = derived(courses, ($courses) => {
		return $courses.filter((course) => course.is_visible === '1').length;
	});
	
	let totalCourses = derived(courses, ($courses) => {
		return $courses.filter((course) => (course.is_visible === '2' || course.is_visible === '3') && course.pastEvent === false).length;
	});

	let totalStudents = derived(students, ($students) => {
		return $students.length;
	});

	onMount(async () => {
		fetchCourses();
		fetchStudents();
	});
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link href="https://fonts.googleapis.com/css?family=Noto+Sans+Thai:400,500,600,700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="fontUse flex min-h-screen flex-col bg-gray-50">
	<header class="sticky top-0 z-10 flex h-16 items-center border-b bg-white px-4 shadow-sm">
		<div class="container mx-auto flex items-center justify-between">
			<a href="##" class="text-xl font-bold text-[#E35205] transition-colors hover:text-[#FF6B2B]">
				<span class="hidden sm:inline">CSEvent</span>
				<span class="hidden sm:inline text-gray-700"> - Short Course Registration</span>
				<span class="sm:hidden">CSEvent</span>
			</a>
			<div class="flex items-center gap-4">
				<a href="##" class="text-gray-700 hover:text-[#E35205] transition-colors">Login</a>
			</div>
		</div>
	</header>

	<main class="flex-1 container mx-auto px-4 py-8">
		<!-- Hero section -->
		<div class="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-8 mb-8 shadow-lg">
			<div class="max-w-3xl">
				<h1 class="text-3xl md:text-4xl font-bold mb-4">
					<span class="text-[#E35205]">CTRL</span> your future<br>
					<span class="text-[#E35205]">ALT</span> your dream<br>
					<span class="text-[#E35205]">SHIFT UP</span> your skills
				</h1>
				<p class="text-gray-300 mb-6">Let's expand our knowledge with our short courses led by our computer science members.</p>
				<a href="#courses" class="inline-flex items-center px-6 py-3 bg-[#E35205] text-white rounded-md font-semibold shadow-md hover:bg-[#FF6B2B] transition-colors">
					Browse Courses
					<svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M5 12h14M12 5l7 7-7 7"/>
					</svg>
				</a>
			</div>
		</div>

		{#if $isLoading}
			<div class="flex justify-center items-center p-12">
				<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E35205]"></div>
			</div>
		{:else if $error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
				<strong class="font-bold">Error:</strong>
				<span class="block sm:inline"> {$error}</span>
			</div>
		{/if}

		<!-- Stats cards -->
		<div class="grid gap-6 md:grid-cols-3 mb-8">
			<Card.Root class="overflow-hidden">
				<div class="bg-gradient-to-r from-[#E35205] to-[#FF6B2B] h-1.5"></div>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Open for Registration</Card.Title>
					<CalendarCheck class="text-[#E35205] h-5 w-5" />
				</Card.Header>
				<Card.Content>
					<div class="text-3xl font-bold">{$canRegisCourses}</div>
					<p class="text-sm text-gray-500">Available courses</p>
				</Card.Content>
			</Card.Root>
			
			<Card.Root class="overflow-hidden">
				<div class="bg-gradient-to-r from-[#E35205] to-[#FF6B2B] h-1.5"></div>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Upcoming Events</Card.Title>
					<Calendar class="text-[#E35205] h-5 w-5" />
				</Card.Header>
				<Card.Content>
					<div class="text-3xl font-bold">{$totalCourses}</div>
					<p class="text-sm text-gray-500">Future events</p>
				</Card.Content>
			</Card.Root>
			
			<Card.Root class="overflow-hidden">
				<div class="bg-gradient-to-r from-[#E35205] to-[#FF6B2B] h-1.5"></div>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Total Students</Card.Title>
					<UsersRound class="text-[#E35205] h-5 w-5" />
				</Card.Header>
				<Card.Content>
					<div class="text-3xl font-bold">{$totalStudents}</div>
					<p class="text-sm text-gray-500">Registered participants</p>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Course section -->
		<div id="courses" class="mb-8">
			<div class="flex flex-col md:flex-row md:items-center justify-between mb-6">
				<div>
					<h2 class="text-2xl font-bold text-gray-800">Available Courses</h2>
					<p class="text-gray-600">Browse and register for our computer science courses</p>
				</div>
				
				<div class="flex gap-2 mt-4 md:mt-0 bg-white p-1 rounded-md shadow-sm border">
					<button 
						class="px-4 py-2 rounded-md transition-colors {$selectedTab === 'all' ? 'bg-[#E35205] text-white' : 'hover:bg-gray-100'}"
						on:click={() => selectedTab.set('all')}
					>
						All
					</button>
					<button 
						class="px-4 py-2 rounded-md transition-colors {$selectedTab === 'open' ? 'bg-[#E35205] text-white' : 'hover:bg-gray-100'}"
						on:click={() => selectedTab.set('open')}
					>
						Open
					</button>
					<button 
						class="px-4 py-2 rounded-md transition-colors {$selectedTab === 'closed' ? 'bg-[#E35205] text-white' : 'hover:bg-gray-100'}"
						on:click={() => selectedTab.set('closed')}
					>
						Closed
					</button>
				</div>
			</div>

			<div class="bg-white rounded-xl shadow-sm overflow-hidden">
				{#if $filteredCourses.length === 0}
					<div class="flex flex-col items-center justify-center p-12 text-center">
						<BookOpen class="text-gray-300 h-16 w-16 mb-4" />
						<h3 class="text-xl font-medium text-gray-800">No courses found</h3>
						<p class="text-gray-500 mt-1">No courses match the current filter criteria</p>
					</div>
				{:else}
					<div class="grid gap-6 p-6 md:grid-cols-1 lg:grid-cols-2">
						{#each $filteredCourses as course}
							<Card.Root class="overflow-hidden hover:shadow-md transition-shadow border-0 shadow-sm">
								<div class="bg-gradient-to-r from-[#E35205] to-[#FF6B2B] h-1"></div>
								<Card.Header class="pb-2">
									<div class="flex justify-between items-start">
										<div>
											<div class="flex items-center gap-2 mb-1">
												<span class="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{course.course_type}</span>
												{#if course.is_visible === '1'}
													<span class="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Open</span>
												{:else if course.is_visible === '2'}
													<span class="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Closed</span>
												{/if}
											</div>
											<Card.Title class="text-lg font-bold">{course.course_name}</Card.Title>
										</div>
										<div class="text-sm text-gray-500 font-medium">
											{formatDate(course.course_date)}
										</div>
									</div>
								</Card.Header>
								<Card.Content class="pt-0">
									<div class="flex items-center gap-1 text-gray-600 mb-3">
										<User class="h-4 w-4" />
										<span class="text-sm">{course.course_lecture}</span>
									</div>
									
									<div class="flex items-center gap-1 text-gray-600 mb-4">
										<UsersRound class="h-4 w-4" />
										<span class="text-sm">{course.course_team}</span>
									</div>
									
									<div class="flex justify-between items-center">
										<div class="flex items-center gap-2">
											<div class="relative w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
												<div 
													class="absolute top-0 left-0 h-full bg-[#E35205] rounded-full" 
													style="width: {Math.min(course.enroll_count / 30 * 100, 100)}%"
												></div>
											</div>
											<span class="text-xs text-gray-500">{course.enroll_count} enrolled</span>
										</div>
										
										{#if course.is_visible === '1'}
											<a 
												href="/course/{course.course_id}" 
												class="inline-flex items-center px-4 py-2 bg-[#E35205] text-white text-sm font-medium rounded-md hover:bg-[#FF6B2B] transition-colors"
											>
												Register Now
											</a>
										{:else if course.is_visible === '2'}
											<button 
												class="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md cursor-not-allowed"
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

	<footer class="w-full bg-white border-t">
		<div class="container mx-auto py-8 px-4">
			<div class="grid gap-8 md:grid-cols-3">
				<div>
					<h3 class="text-lg font-bold text-[#E35205] mb-4">CSEvent</h3>
					<p class="text-gray-600 text-sm">
						Short Course Registration System for Computer Science students at King Mongkut's Institute of Technology Ladkrabang
					</p>
				</div>

				
				<div>
					<h3 class="text-sm font-bold uppercase text-gray-800 mb-4">Connect With CS KMITL</h3>
					<div class="flex space-x-4">
						<a href="##" class="text-gray-600 hover:text-[#E35205] transition-colors">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
							</svg>
						</a>
						<a href="##" class="text-gray-600 hover:text-[#E35205] transition-colors">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"  viewBox="0 0 50 50"
							style="fill:#1A1A1A;">
							<path d="M 16 3 C 8.8324839 3 3 8.8324839 3 16 L 3 34 C 3 41.167516 8.8324839 47 16 47 L 34 47 C 41.167516 47 47 41.167516 47 34 L 47 16 C 47 8.8324839 41.167516 3 34 3 L 16 3 z M 16 5 L 34 5 C 40.086484 5 45 9.9135161 45 16 L 45 34 C 45 40.086484 40.086484 45 34 45 L 16 45 C 9.9135161 45 5 40.086484 5 34 L 5 16 C 5 9.9135161 9.9135161 5 16 5 z M 37 11 A 2 2 0 0 0 35 13 A 2 2 0 0 0 37 15 A 2 2 0 0 0 39 13 A 2 2 0 0 0 37 11 z M 25 14 C 18.936712 14 14 18.936712 14 25 C 14 31.063288 18.936712 36 25 36 C 31.063288 36 36 31.063288 36 25 C 36 18.936712 31.063288 14 25 14 z M 25 16 C 29.982407 16 34 20.017593 34 25 C 34 29.982407 29.982407 34 25 34 C 20.017593 34 16 29.982407 16 25 C 16 20.017593 20.017593 16 25 16 z"></path>
							</svg>
						</a>

					</div>
				</div>
			</div>
			
			<div class="border-t mt-8 pt-6">
				<div class="flex flex-col md:flex-row justify-between items-center">
					<p class="text-sm text-gray-600 mb-4 md:mb-0">
						© 2024 - 2025 | Made with ❤️ by <a href="https://github.com/tony007x" class="text-[#E35205]">Tony219y</a>, <a href="https://github.com/Gal1leo2" class="text-[#E35205]">Gal1leo</a>
					</p>
					<p class="text-sm text-gray-600">
						Computer Science, King Mongkut's Institute of Technology Ladkrabang
					</p>
				</div>
			</div>
		</div>
	</footer>
</div>

<Toaster />

<style>
	.fontUse {
		font-family: 'Noto Sans Thai', sans-serif;
	}
</style>