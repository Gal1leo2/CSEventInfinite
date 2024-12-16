<script lang="ts">
	import { CalendarArrowDown, LibraryIcon } from 'lucide-svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { onMount } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import { LibraryBig } from 'lucide-svelte';
	import { UsersRound } from 'lucide-svelte';
	import Cookies from 'js-cookie';
	import Wretch from 'wretch';
	import { toast } from 'svelte-sonner';
	import { Toaster } from 'svelte-sonner';
	import { Group } from 'lucide-svelte';

	interface Course {
		course_id: string;
		course_name: string;
		course_lecture: string;
		course_type: string;
		course_date: string;
		course_team: string;
		is_visible: string; 
		pastEvent:boolean;
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

	function getErrorMessage(error: unknown): string {
		if (error instanceof Error) return error.message;
		return String(error);
	}

	const csrf = async () => {
		try {
			const response = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/csrf-token`)
				.get()
				.json<{ csrfToken: string }>(); // Use the interface
			return response.csrfToken; // Access the csrfToken
		} catch (error) {
			console.error('Failed to fetch CSRF token:', error);
			throw new Error('Failed to fetch CSRF token'); // Handle errors as needed
		}
	};

	async function fetchCourses() {
		try {
			const csrfToken = await csrf();
			isLoading.set(true);
			const response =  await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/getcourse`)
			.headers({
				'X-CSRF-Token': csrfToken
			})
			.get()
			.json<Course[]>()
			courses.set(response)
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
	//sort table by date
	function sortByDate(courses: Course[]): Course[] {
		return courses.slice().sort((a, b) => {
			const dateA = new Date(a.course_date);
			const dateB = new Date(b.course_date);
			return dateA.getTime() - dateB.getTime();
		});
	}

	let enrollCount = derived([courses, students], ([$courses, $students]) => {
	// Sort courses by date, without filtering by visibility
	const sortedCourses = sortByDate($courses);

	// Map each course and calculate the enroll count
	return sortedCourses.map((course) => {
		let count = $students.filter((student) => student.course_id === course.course_id).length;
		return { ...course, enroll_count: count };
	});
});


	let canRegisCourses = derived(courses, ($courses) => {
		return $courses.filter((course) => course.is_visible === '1' ).length;
	});
	let totalCourses = derived(courses, ($courses) => {
    return $courses.filter((course) => (course.is_visible === '2' || course.is_visible === '3') && course.pastEvent ===false).length;
});



	let username: string;
	let password: string;
	const login = async () => {
		await Wretch(`${import.meta.env.VITE_API_BASE_URL}/admin/login`)
			.post({
				username: username,
				password: password
			})
			.badRequest(async (e) => {
				toast.warning(JSON.parse(e.message).message);
			})
			.notFound(async (e) => {
				toast.error(JSON.parse(e.message).message);
			})
			.res(async (e) => {
				toast.success('Login Successfully!');
				Cookies.set('authUser', username);
				window.location.pathname = 'dev';
			});
	};

	onMount(async () => {
		// await csrf();
		fetchCourses();
		fetchStudents();
	});
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/css?family=Noto Sans Thai" rel="stylesheet" />
</svelte:head>
<div class="fontUse flex min-h-screen min-w-max flex-col">
	<header class="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-2 md:px-4">
		<nav
			class="flex w-full flex-col justify-between gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-3 lg:gap-4"
		>
			<a href="##" class="font-bold text-[#E35205] transition-colors">
				CSEvent - Short Course Registration System
			</a>
		</nav>
	</header>

	<!-- Main content with flex-1 to fill available space -->
	<main class="flex flex-1 flex-col gap-4 bg-gray-50 p-4 md:gap-8 md:p-8">
		<div class="flex flex-col items-center justify-center py-4 text-black">
			<h1 class="text-2xl font-bold"><span style="color:#E35205">CTRL</span> your future</h1>
			<h1 class="text-2xl font-bold"><span style="color:#E35205">ALT</span> your dream</h1>
			<h1 class="text-2xl font-bold"><span style="color:#E35205">SHIFT UP</span> your skills</h1>
		</div>

		{#if $isLoading}
			<div>Loading...</div>
		{:else if $error}
			<div class="text-red-500">{$error}</div>
		{/if}

		<!-- Courses and events -->
		<div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Events that can be registered</Card.Title>
					<CalendarArrowDown class="text-muted-foreground h-6 w-6" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{$canRegisCourses}</div>
				</Card.Content>
			</Card.Root>
		
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium flex-grow">Future events</Card.Title>
					<CalendarArrowDown class="text-muted-foreground h-6 w-6 ml-2" />
				</Card.Header>
				<Card.Content class="flex items-center justify-between">
					<div class="text-2xl font-bold">{$totalCourses}</div>
				</Card.Content>
			</Card.Root>
		</div>	

		<!-- Course details -->
		<div class="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
			<Card.Root class="col-span-full">
				<Card.Header class="flex flex-row items-center justify-between">
					<div class="grid gap-2">
						<Card.Title>Courses</Card.Title>
						<Card.Description>Courses available for registration</Card.Description>
					</div>
					<LibraryBig class="text-muted-foreground ml-2 h-6 w-6" />
				</Card.Header>
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Name</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Date (Y-M-D)</Table.Head>
								<Table.Head>Enrolled</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each $enrollCount.filter(course => course.is_visible !== '3' && course.is_visible !== '4') as course}
							<Table.Row>
									<Table.Cell>
										<div class="font-bold">{course.course_name}</div>
										<div class="mr-8 flex items-center">
											<svg
												class="mr-2"
												xmlns="http://www.w3.org/2000/svg"
												width="1em"
												height="1em"
												viewBox="0 0 24 24"
												{...$$props}
											>
												<path
													fill="black"
													d="M20 17a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H9.46c.35.61.54 1.3.54 2h10v11h-9v2m4-10v2H9v13H7v-6H5v6H3v-8H1.5V9a2 2 0 0 1 2-2zM8 4a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2a2 2 0 0 1 2 2"
												/>
											</svg>
											<div class="text-muted-foreground block text-sm md:inline">
												{course.course_lecture}
											</div>
										</div>
										<div class="flex items-center">
											<svg
												class="mr-2"
												xmlns="http://www.w3.org/2000/svg"
												width="1em"
												height="1em"
												viewBox="0 0 24 24"
												{...$$props}
											>
												<path
													fill="none"
													stroke="black"
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="1.5"
													d="M18 18.72a9.1 9.1 0 0 0 3.741-.479q.01-.12.01-.241a3 3 0 0 0-4.692-2.478m.94 3.197l.001.031q0 .337-.037.666A11.94 11.94 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6 6 0 0 1 6 18.719m12 0a5.97 5.97 0 0 0-.941-3.197m0 0A6 6 0 0 0 12 12.75a6 6 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72a9 9 0 0 0 3.74.477m.94-3.197a5.97 5.97 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0a3 3 0 0 1 6 0m6 3a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0m-13.5 0a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0"
												/>
											</svg>
											<div class="text-muted-foreground mr-2 block text-sm md:inline">
												{course.course_team}
											</div>
										</div>
									</Table.Cell>

									<Table.Cell>{course.course_type}</Table.Cell>
									<Table.Cell>{course.course_date}</Table.Cell>
									<Table.Cell>
										<span>{course.enroll_count}</span>
									</Table.Cell>
									<Table.Cell class="text-right">
										{#if course.is_visible === '1'}
											<a href="/course/{course.course_id}" class={buttonVariants({})}>
												<b>See details</b>
											</a>
										{:else if course.is_visible === '2'}
											<button class={buttonVariants({ variant: 'ghost' })} disabled>
												<b>Registration Closed</b>
											</button>
										{/if}
									</Table.Cell>
									
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</main>

	<!-- Footer sticks at the bottom -->
	<footer class="w-full bg-gray-100">
		<div class="flex justify-between bg-black/5 p-4 text-xs">
			<span
				>© 2024 | Made with ❤️ by <a href="https://github.com/tony007x">Tony219y</a> ,
				<a href="https://github.com/Gal1leo2">Gal1leo</a></span
			>
			<span>Computer Science, King Mongkut's Institute of Technology Ladkrabang</span>
		</div>
	</footer>
</div>

<Toaster></Toaster>

<Toaster></Toaster>

<style>
	.fontUse {
		font-family: 'Noto Sans Thai';
	}
</style>
