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
	import Footer from '$lib/components/ui/Footer.svelte'
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
	let selectedTab = writable('all'); // 'all', 'open', 'closed' , 'past'

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
    } else if ($selectedTab === 'past') {
        return $enrollCount.filter(course => course.pastEvent === true);
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
	<Header />

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
					<p class="text-gray-600">Browse and register for our short courses.</p>
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
					<button 
					class="px-4 py-2 rounded-md transition-colors {$selectedTab === 'past' ? 'bg-[#E35205] text-white' : 'hover:bg-gray-100'}"
					on:click={() => selectedTab.set('past')}
				>
					Past
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
													style="width: {Math.min(course.enroll_count / 45 * 100, 100)}%"
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

<Footer />
</div>

<Toaster />

<style>
	.fontUse {
		font-family: 'Noto Sans Thai', sans-serif;
	}
</style>