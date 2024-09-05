<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import wretch from 'wretch';
	import { Switch } from '$lib/components/ui/switch';
	import * as Alert from '$lib/components/ui/alert/index.js';

	interface Course {
		course_id: string;
		course_name: string;
		course_lecture: string;
		course_type: string;
		course_date: string;
		course_description: string;
		course_image: string;
		course_location: string;
		course_img: string;
	}

	let courses = writable<Course[]>([]);
	let isLoading = writable(true);
	let error = writable<string>('');
	let showAlert = writable(false);
	let showAlertFail = writable(false);
	let alertMessage = writable<string>('');

	const { id } = $page.params;
	let isChecked = writable(false);

	function getErrorMessage(error: unknown): string {
		if (error instanceof Error) return error.message;
		return String(error);
	}

	async function fetchCoursesDetails(id: string) {
		try {
			isLoading.set(true);
			const response = await fetch(`https://nodejsbackend-ten.vercel.app/user/getcourse/${id}`);
			if (!response.ok) {
				throw new Error('Failed to fetch courses');
			}
			const data: Course[] = await response.json();
			// ชั่วคราว
			data.forEach(
				(course) =>
					(course.course_image = course.course_img));
			courses.set(data);
		} catch (err: unknown) {
			error.set(getErrorMessage(err));
		} finally {
			isLoading.set(false);
		}
	}
	let std_id: string;
	let Fname: string;
	let Lname: string;

	//SUBMIT THE FORM
	const submitform = async () => {
		const laptop = $isChecked;

		try {
			await wretch('https://nodejsbackend-ten.vercel.app/user/enroll')
				.post({
					student_id: std_id,
					course_id: id,
					fname: Fname,
					lname: Lname,
					laptop: laptop
				})
				//ไอกัน ดูให้หน่อย กูอยากให้มัน โชว์ ว่า  Student ID is incorrect! ตามที่มึง return ค่าจาก 400 มา แต่แม่งไม่ยอมหวะ
				.badRequest(async (e) => {
					alertMessage.set(JSON.parse(e.message).message);
					showAlertFail.set(true);
					showAlert.set(false);
				})
				.res(async (response) => {
					if (response.status === 200) {
						showAlert.set(true);
						showAlertFail.set(false);
					} else {
						alertMessage.set('An unexpected error occurred.');
						showAlertFail.set(true);
						showAlert.set(false);
					}
				});
		} catch (error) {
			console.error('Error submitting form:', error);
			alertMessage.set('Network error. Please try again later.');
			showAlertFail.set(true);
			showAlert.set(false);
		}
	};
	onMount(() => {
		fetchCoursesDetails(id);
	});
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/css?family=Noto Sans Thai" rel="stylesheet" />
</svelte:head>

<div class="fontUse flex min-h-screen w-full flex-col">
	<header
		class="sticky top-0 flex h-16 items-center gap-4 border-b bg-orange-400 px-2 text-black md:px-4"
	>
		<nav
			class="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-3 lg:gap-4"
		>
			<a href="##" class="font-bold text-black transition-colors hover:text-gray-800">
				CSEvent - Short Course Registration System
			</a>
		</nav>
	</header>
	<div class="fontUse flex min-h-screen w-full flex-col items-center justify-center bg-gray-100">
		{#if $isLoading}
			<p class="mt-4 text-gray-500">Loading course details...</p>
		{:else if $error}
			<p class="mt-4 text-red-500">Error: {$error}</p>
		{:else if $courses.length}
			{#each $courses as course}
				<Card.Root
					class="mt-6 flex max-w-7xl	 flex-col justify-center rounded-lg bg-white p-6 shadow-md"
				>
					<div class="flex flex-col lg:flex-row">
						<!-- Top Left: Image -->
						<img
							src={course.course_image}
							alt="Course Image"
							class="mb-4 min-w-[200px] rounded-lg object-cover lg:mb-0 lg:mr-6 lg:h-auto lg:w-1/2"
						/>

						<!-- Top Right: Course Name -->
						<div class="flex flex-1 flex-col justify-between">
							<Card.Header>
								<Card.Title class="mb-2 text-base font-semibold">{course.course_date}</Card.Title>
								<Card.Title class="mb-2 text-2xl font-semibold">{course.course_name}</Card.Title>
								<Card.Title class="mb-2 text-base font-semibold"
									>{course.course_location}</Card.Title
								>
								<div class="flex flex-col justify-between lg:flex-row">
									<div class="text-gray-700">
										<p>Lecturer: {course.course_lecture}</p>
										<p>Type: {course.course_type}</p>
									</div>
								</div>
							</Card.Header>

							<Separator class="my-4 lg:my-6" />

							<!-- Bottom Left: Course Description -->
							<Dialog.Root>
								<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
									Enroll this course
								</Dialog.Trigger>
								<Dialog.Content class="sm:max-w-[425px]">
									<Dialog.Header>
										<Dialog.Title>Enroll {course.course_name}</Dialog.Title>
										<Dialog.Description>
											Complete your enrollment here. Fill in your details, and review your choices.
											Click 'Enroll' when you're ready to submit your application.
										</Dialog.Description>
									</Dialog.Header>
									<div class="py-4">
										<div class="space-y-4">
											<div>
												<Label for="stuid" class="block text-sm font-medium text-gray-700"
													>Student ID</Label
												>
												<Input id="stuid" bind:value={std_id} class="mt-1 block w-full" />
											</div>
											<div>
												<Label for="fname" class="block text-sm font-medium text-gray-700"
													>Firstname (In Thai)</Label
												>
												<Input id="fname" bind:value={Fname} class="mt-1 block w-full" />
											</div>
											<div>
												<Label for="lname" class="block text-sm font-medium text-gray-700"
													>Lastname (In Thai)</Label
												>
												<Input id="lname" bind:value={Lname} class="mt-1 block w-full" />
											</div>
											<div class="flex items-center">
												<Switch
													id="laptop"
													bind:checked={$isChecked}
													class="relative inline-flex h-6 w-11 items-center rounded-full"
												></Switch>
												<span class="ml-3 text-sm font-medium text-gray-700"
													>Participants must bring their own computers.</span
												>
											</div>
										</div>
									</div>

									<Dialog.Footer>
										<Button type="submit" on:click={submitform}>Enroll</Button>
									</Dialog.Footer>
									<!-- Success Alert -->
									{#if $showAlert}
										<Alert.Root>
											<Alert.Title>Enroll Successful</Alert.Title>
											<Alert.Description>
												Don't forget to come to the event on {course.course_date}.
											</Alert.Description>
										</Alert.Root>
									{/if}

									<!-- Error Alert -->
									{#if $showAlertFail}
										<Alert.Root variant="destructive">
											<Alert.Title>Error</Alert.Title>
											<Alert.Description>{$alertMessage}</Alert.Description>
										</Alert.Root>
									{/if}
								</Dialog.Content>
							</Dialog.Root>
						</div>
					</div>

					<!-- Bottom Right: Additional Content -->
					<Separator class="my-4 lg:my-6" />
					<div class="flex flex-col justify-between lg:flex-row">
						<div class="text-gray-700">
							<p class="text-base font-bold">Description</p>
							{course.course_description}
						</div>
					</div>
				</Card.Root>
			{/each}
		{:else}
			<p class="mt-4 text-gray-500">No courses found.</p>
		{/if}
	</div>
</div>

<style>
	.fontUse {
		font-family: 'Noto Sans Thai';
	}
</style>
