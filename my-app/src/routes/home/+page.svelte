<script lang="ts">
	import { CalendarArrowDown } from 'lucide-svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { onMount } from 'svelte';
	import { writable, derived } from 'svelte/store';

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
			class="flex flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-3 lg:gap-4"
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
						<CalendarArrowDown class="h-4 w-4 text-muted-foreground" />
					</Card.Header>
					<Card.Content>
						<div class="text-2xl font-bold">{$totalCourses}</div>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
				<Card.Root class="col-span-full">
					<Card.Header class="flex flex-row items-center">
						<div class="grid gap-2">
							<Card.Title>Courses</Card.Title>
							<Card.Description>Courses available for registration</Card.Description>
						</div>
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
											<div class="hidden text-sm text-muted-foreground md:inline">
												{course.course_lecture}
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
</div>

<style>
	.fontUse {
		font-family: 'Noto Sans Thai';
	}
</style>
