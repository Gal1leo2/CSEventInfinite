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

	interface Course {
		course_id: string;
		course_name: string;
		course_lecture: string;
		course_type: string;
		course_date: string;
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

	async function fetchCourses() {
		try {
			isLoading.set(true);
			const response = await fetch('https://nodejsbackend-ten.vercel.app/user/getcourse');
			if (!response.ok) {
				throw new Error('Failed to fetch courses');
			}
			const data: Course[] = await response.json();
			courses.set(data);
		} catch (err: unknown) {
			error.set(getErrorMessage(err));
		} finally {
			isLoading.set(false);
		}
	}

	async function fetchStudents() {
		try {
			isLoading.set(true);
			const response = await fetch('https://nodejsbackend-ten.vercel.app/user/getuser');
			if (!response.ok) {
				throw new Error('Failed to fetch students');
			}
			const data: Student[] = await response.json();
			students.set(data);
		} catch (err: unknown) {
			error.set(getErrorMessage(err));
		} finally {
			isLoading.set(false);
		}
	}

	let totalCourses = derived(courses, ($courses) => $courses.length);

	let enrollCount = derived([courses, students], ([$courses, $students]) => {
		return $courses.map((course) => {
			let count = $students.filter((student) => student.course_id === course.course_id).length;
			return { ...course, enroll_count: count };
		});
	});

	let username: string;
	let password: string;
	const login= async () =>{
		await Wretch('https://nodejsbackend-ten.vercel.app/admin/login')
		.post({
			username: username,
			password: password
		})
		.badRequest(async (e)=>{
			toast.warning(JSON.parse(e.message).message)
		})
		.notFound(async(e)=>{
			toast.error(JSON.parse(e.message).message)
		})
		.res(async(e)=>{
			toast.success("Login Successfully!")
			Cookies.set('authUser', username );
			window.location.pathname = 'dev'
		})
	}

	onMount(() => {
		fetchCourses();
		fetchStudents();
	});
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/css?family=Noto Sans Thai" rel="stylesheet" />
</svelte:head>
<div class="fontUse flex min-w-max flex-col">
	<header class="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-2 md:px-4">
		<nav
			class="flex w-full flex-col justify-between gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-3 lg:gap-4"
		>
			<a href="##" class="font-bold text-[#E35205] transition-colors">
				CSEvent - Short Course Registration System
			</a>
		</nav>
	</header>

	<main class="flex min-h-screen flex-1 flex-col gap-4 bg-gray-50 p-4 md:gap-8 md:p-8">
		<div class="flex flex-col items-center justify-center py-4 text-black">
			<h1 class="text-2xl font-bold"><span style="color:#E35205">CTRL</span> your future</h1>
			<h1 class="text-2xl font-bold"><span style="color:#E35205">ALT</span> your dream</h1>
			<h1 class="text-2xl font-bold"><span style="color:#E35205">SHIFT UP</span> your skills</h1>
		</div>

		{#if $isLoading}
			<div>Loading...</div>
		{:else}
			{#if $error}
				<div class="text-red-500">{$error}</div>
			{/if}

			<div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
				<Card.Root>
					<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
						<Card.Title class="text-sm font-medium">Events that can be registered</Card.Title>
						<CalendarArrowDown class="text-muted-foreground h-6 w-6" />
					</Card.Header>
					<Card.Content>
						<div class="text-2xl font-bold">{$totalCourses}</div>
					</Card.Content>
				</Card.Root>
			</div>

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
									<Table.Head>Date</Table.Head>
									<Table.Head>Enrolled</Table.Head>
									<Table.Head class="text-right">See details</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each $enrollCount as course}
									<Table.Row>
										<Table.Cell>
											<div class="font-medium">{course.course_name}</div>
											<div class="flex items-center">
												<UsersRound class="text-muted-foreground mr-2 h-4 w-4" />
												<div class="text-muted-foreground hidden text-sm md:inline">
													{course.course_lecture}
													<!-- พี่มดแดง ดูให้ทีครับ -->
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="1em"
														height="1em"
														viewBox="0 0 24 24"
														{...$$props}
														><path
															fill="currentColor"
															d="M0 18v-1.575q0-1.1 1.113-1.763Q2.225 14 4 14q.325 0 .625.012q.3.013.575.063q-.35.5-.525 1.075q-.175.575-.175 1.225V18Zm6 0v-1.625q0-1.625 1.663-2.625q1.662-1 4.337-1q2.7 0 4.35 1q1.65 1 1.65 2.625V18Zm13.5 0v-1.625q0-.65-.163-1.225q-.162-.575-.487-1.075q.275-.05.563-.063Q19.7 14 20 14q1.8 0 2.9.662q1.1.663 1.1 1.763V18ZM12 14.75q-1.425 0-2.55.375q-1.125.375-1.325.875H15.9q-.225-.5-1.338-.875Q13.45 14.75 12 14.75ZM4 13q-.825 0-1.412-.588Q2 11.825 2 11q0-.85.588-1.425Q3.175 9 4 9q.85 0 1.425.575Q6 10.15 6 11q0 .825-.575 1.412Q4.85 13 4 13Zm16 0q-.825 0-1.413-.588Q18 11.825 18 11q0-.85.587-1.425Q19.175 9 20 9q.85 0 1.425.575Q22 10.15 22 11q0 .825-.575 1.412Q20.85 13 20 13Zm-8-1q-1.25 0-2.125-.875T9 9q0-1.275.875-2.138Q10.75 6 12 6q1.275 0 2.137.862Q15 7.725 15 9q0 1.25-.863 2.125Q13.275 12 12 12Zm0-4q-.425 0-.712.287Q11 8.575 11 9t.288.712Q11.575 10 12 10t.713-.288Q13 9.425 13 9t-.287-.713Q12.425 8 12 8Zm0 8Zm0-7Z"
														/></svg
													>
												</div>
											</div>
										</Table.Cell>
										<Table.Cell>{course.course_type}</Table.Cell>
										<Table.Cell>{course.course_date}</Table.Cell>
										<Table.Cell>
											<span>{course.enroll_count}</span>
										</Table.Cell>
										<Table.Cell class="text-right">
											<a href="/course/{course.course_id}" class={buttonVariants({})}>
												<b>See details</b>
											</a>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			</div>
		{/if}
	</main>
	<footer class="bg-gray">
		<div class="bg-black/5 p-4 text-xs flex justify-between">
		  <span>© 2024 | Made with ❤️ by Tony , Gal1leo</span>
		  <span>Computer Science, King Mongkut's Institute of Technology Ladkrabang</span>
		</div>
	  </footer>
	  
	  
</div>

<style>
	.fontUse {
		font-family: 'Noto Sans Thai';
	}
</style>

<Toaster></Toaster>
