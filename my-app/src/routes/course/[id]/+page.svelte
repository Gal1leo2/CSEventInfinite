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
	import { marked } from 'marked';

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
			data.forEach((course) => (course.course_image = course.course_img));
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
	let isSubmitting = writable(false); // New state JA

	//SUBMIT THE FORM
	const submitform = async () => {
		const laptop = $isChecked;

		isSubmitting.set(true); // Start showing the loading popup

		try {
			await wretch('https://nodejsbackend-ten.vercel.app/user/enroll')
				.post({
					student_id: std_id,
					course_id: id,
					fname: Fname,
					lname: Lname,
					laptop: laptop
				})
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
		} finally {
			isSubmitting.set(false); // Stop showing the loading popup
		}
	};
	onMount(() => {
		fetchCoursesDetails(id);
	});
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/css?family=Noto Sans Thai" rel="stylesheet" />
</svelte:head>

<div class="fontUse flex w-full flex-col">
	<header class="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-2 md:px-4">
		<nav
			class="flex flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-3 lg:gap-4"
		>
			<a href="/home" class="font-bold text-[#E35205] transition-colors">
				CSEvent - Short Course Registration System
			</a>
		</nav>
	</header>
	<div class="fontUse flex min-h-screen w-full flex-col items-center justify-center bg-gray-50">
		{#if $isLoading}
			<p class="mt-4 text-gray-500">Loading course details...</p>
		{:else if $error}
			<p class="mt-4 text-red-500">Error: {$error}</p>
		{:else if $courses.length}
			{#each $courses as course}
				<Card.Root
					class="mb-6 mt-6 flex max-w-7xl flex-col justify-center rounded-lg bg-white p-6 shadow-md"
				>
					<div class="flex flex-col lg:flex-row">
						<!-- Top Left: Image -->
						<!-- svelte-ignore a11y-img-redundant-alt -->
						<img
							src={course.course_image}
							alt="Course Image"
							class="mb-4 min-w-[200px] rounded-lg object-cover lg:mb-0 lg:mr-6 lg:h-auto lg:w-1/2"
						/>

						<!-- Top Right: Course Name -->
						<div class="flex flex-1 flex-col justify-between">
							<Card.Header>
								<Card.Title class="mb-2 text-base font-semibold">{course.course_date}</Card.Title>
								<Card.Title class="mb-2 text-2xl font-semibold"
									><span style="color:#E35205">{course.course_name}</span></Card.Title
								>
								<Card.Title class="mb-2 text-base font-semibold"
									>{course.course_location}</Card.Title
								>
								<div class="flex flex-col justify-between lg:flex-row">
									<div class="text-gray-700">
										<p>Instructor: {course.course_lecture}</p>
										<p>Type: {course.course_type}</p>
									</div>
								</div>
							</Card.Header>

							<Separator class="my-4 lg:my-6" />

							<!-- Bottom Left: Course Description -->
							<Dialog.Root>
								<Dialog.Trigger class={buttonVariants({})}>
									<span style="font-weight:bold;">Enroll this course.</span>
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
													>Participants can bring their own computers.</span
												>
											</div>
										</div>
									</div>

									<Dialog.Footer>
										<Button type="submit" on:click={submitform}>Enroll</Button>
									</Dialog.Footer>
									{#if $isSubmitting}
									<div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 ease-in-out">
										<div class="relative p-6 bg-white bg-opacity-10 rounded-lg shadow-lg border border-gray-300 backdrop-filter backdrop-blur-lg">
											<!-- Glowing Spinner -->
											<div class="spinner-container flex items-center justify-center mb-4">
												<div class="spinner-border animate-spin inline-block w-12 h-12 border-4 border-t-4 border-t-blue-600 border-blue-200 rounded-full"></div>
											</div>
											<!-- Fading Text -->
											<p class="mt-4 text-lg text-gray-200 font-semibold animate-fadeIn">Processing your enrollment...</p>
										</div>
									</div>
								{/if}
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
						<div class="w-full text-gray-700">
							<p class="text-base font-bold">Description</p>
							<div class="prose w-full">
								{@html marked.parse(course.course_description)}
							</div>
						</div>
					</div>
				</Card.Root>
			{/each}
		{:else}
			<p class="mt-4 text-gray-500">No courses found.</p>
		{/if}
	</div>
	<footer class="bg-gray flex">
		<div class="flex w-full justify-between bg-black/5 p-4 text-xs">
			<span>© 2024 | Made with ❤️ by Tony , Gal1leo</span>
			<span>Computer Science, King Mongkut's Institute of Technology Ladkrabang</span>
		</div>
	</footer>
</div>

<style>
	.fontUse {
		font-family: 'Noto Sans Thai';
	}
	.prose {
		line-height: 1.5;
		color: #0c1524;
		max-width: 100%;
	}
	/* Spinner Styles */
	.spinner-border {
		border-radius: 50%;
		border: 4px solid rgba(255, 255, 255, 0.1);
		border-top: 4px solid rgba(59, 130, 246, 0.8); /* Custom blue shade */
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	/* Text Fade-In Animation */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.animate-fadeIn {
		animation: fadeIn 1s ease-in-out;
	}

	/* Blur & transition */
	.backdrop-blur-sm {
		backdrop-filter: blur(5px);
	}
	.transition-opacity {
		transition: opacity 0.3s;
	}
</style>
