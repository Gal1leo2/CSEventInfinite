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
	import { SyncLoader } from 'svelte-loading-spinners';
	import toast, { Toaster } from 'svelte-french-toast';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';

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
		course_team: string;
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
	let stdYear: string;
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
					laptop: laptop,
					stdyear: stdYear
				})
				.badRequest(async (e) => {
					alertMessage.set(JSON.parse(e.message).message);
					showAlertFail.set(true);
					showAlert.set(false);
				})
				.res(async (response) => {
					if (response.status === 200) {
						showAlert.set(true);
						toast.success('ลงทะเบียนสำเร็จ.', { position: 'bottom-center' });
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
			isSubmitting.set(false); 
		}
	};
	//check student id num and 8 digit 
	let studentIdError = writable<string | null>(null);
	function validateStudentId() {
		const idRegex = /^\d{8}$/; 
		if (!idRegex.test(std_id)) {
			studentIdError.set("รหัสนักศึกษาต้องมีตัวเลข 8 หลักเท่านั้น");
		} else {
			studentIdError.set(null);
		}
	}
	//check first and last name type in thai only
	let firstNameError = writable<string | null>(null);
	let lastNameError = writable<string | null>(null);

	function isThaiOnly(input: string): boolean {
		const thaiRegex = /^[\u0E00-\u0E7F\s]+$/; // \s allows spaces
		return thaiRegex.test(input);
	}

	function validateFirstName() {
		if (!isThaiOnly(Fname)) {
			firstNameError.set('กรุณากรอกชื่อเป็นภาษาไทยเท่านั้น');
		} else {
			firstNameError.set(null);
		}
	}

	function validateLastName() {
		if (!isThaiOnly(Lname)) {
			lastNameError.set('กรุณากรอกนามสกุลเป็นภาษาไทยเท่านั้น');
		} else {
			lastNameError.set(null);
		}
	}
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
					class="mb-6 mt-6 flex w-full max-w-7xl flex-col justify-center rounded-lg bg-white p-6 shadow-md"
				>
					<div class="flex flex-col lg:flex-row">
						<!-- Top Left: Image -->
						<img
							src={course.course_image}
							alt="A preview of {course.course_name}"
							class="mb-4 w-full max-w-full rounded-lg object-cover lg:mb-0 lg:mr-6 lg:h-auto lg:w-1/2"
							style="object-fit: cover;"
						/>

						<!-- Top Right: Course Name -->
						<div class="flex flex-1 flex-col justify-between text-center lg:text-left">
							<Card.Header>
								<Card.Title class="mb-2 text-base font-semibold">{course.course_date}</Card.Title>
								<Card.Title class="mb-2 text-2xl font-semibold"
									><span style="color:#E35205">{course.course_name}</span></Card.Title
								>

								<Card.Title class="mb-2 text-base font-semibold"
									>{course.course_location}</Card.Title
								>
								<div class="text-gray-700">
									<p>Instructor: {course.course_lecture}</p>
									<p>Type: {course.course_type}</p>
									<p>Powered by: {course.course_team}</p>
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
												<Label for="stuid" class="block text-sm font-medium text-gray-700">Student ID</Label>
												<Input
													id="stuid"
													bind:value={std_id}
													class="mt-1 block w-full"
													on:blur={validateStudentId}
												/>
												{#if $studentIdError}
													<p class="text-red-500 text-sm">{$studentIdError}</p>
												{/if}
											</div>
											<div>
												<Label for="fname" class="block text-sm font-medium text-gray-700"
													>Firstname (In Thai)</Label
												>
												<Input
													id="fname"
													bind:value={Fname}
													class="mt-1 block w-full"
													on:blur={validateFirstName}
												/>
												{#if $firstNameError}
													<p class="text-sm text-red-500">{$firstNameError}</p>
												{/if}
											</div>

											<div>
												<Label for="lname" class="block text-sm font-medium text-gray-700"
													>Lastname (In Thai)</Label
												>
												<Input
													id="lname"
													bind:value={Lname}
													class="mt-1 block w-full"
													on:blur={validateLastName}
												/>
												{#if $lastNameError}
													<p class="text-sm text-red-500">{$lastNameError}</p>
												{/if}
											</div>

											<!-- SELECT YEAR -->
											<div>
												<Label for="lname" class="block text-sm font-medium text-gray-700"
													>Year</Label
												>
												<RadioGroup.Root bind:value={stdYear}>
													<div class="mt-3 flex w-full justify-between">
														<div class="flex items-center space-x-2">
															<RadioGroup.Item value="1" id="r1" />
															<Label for="r1">ปี 1</Label>
														</div>
														<div class="flex items-center space-x-2">
															<RadioGroup.Item value="2" id="r2" />
															<Label for="r2">ปี 2</Label>
														</div>
														<div class="flex items-center space-x-2">
															<RadioGroup.Item value="3" id="r3" />
															<Label for="r3">ปี 3</Label>
														</div>
														<div class="flex items-center space-x-2">
															<RadioGroup.Item value="4" id="r4" />
															<Label for="r4">ปี 4</Label>
														</div>
														<div class="flex items-center space-x-2">
															<RadioGroup.Item value="5" id="r4" />
															<Label for="r5">อื่นๆ</Label>
														</div>
													</div>
													<RadioGroup.Input name="spacing" />
												</RadioGroup.Root>
											</div>
											<div class="flex items-center">
												<Switch
													id="laptop"
													bind:checked={$isChecked}
													class="relative inline-flex h-6 w-11 items-center rounded-full"
												></Switch>
												<span class="ml-3 text-sm font-medium text-gray-700"
													>ผู้เข้าร่วมสามารถนำคอมพิวเตอร์มาเองได้</span
												>
											</div>
										</div>
									</div>

									<Dialog.Footer>
										<Button type="submit" on:click={submitform}>Enroll</Button>
									</Dialog.Footer>
									{#if $isSubmitting}
										<div
											class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
										>
											<SyncLoader size="60" color="#FF3E00" unit="px" duration="1s" />
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
						<!-- Text content container with wider width -->
						<div class="text-gray-700 lg:w-full">
							<!-- Full width on larger screens -->
							<p class="text-base font-bold">Description</p>
							<div class="prose max-w-full">
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
	<footer class="w-full bg-gray-100">
		<div class="flex justify-between bg-black/5 p-4 text-xs">
			<span
				>© 2024 | Made with ❤️ by <a href="https://github.com/tony007x">Tony219y</a> ,
				<a href="https://github.com/Gal1leo2">Gal1leo</a></span
			>
			<span>Computer Science, King Mongkut's Institute of Technology Ladkrabang</span>
		</div>
	</footer>
	<Toaster />
</div>

<style>
	.fontUse {
		font-family: 'Noto Sans Thai';
	}
</style>
