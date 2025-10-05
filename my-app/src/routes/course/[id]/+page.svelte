<script lang="ts">
	import { Turnstile } from 'svelte-turnstile';
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
	import Footer from '$lib/components/ui/Footer.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import { goto } from '$app/navigation';
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
		is_submissionproject: boolean;
		is_personalcomputer: boolean;
		is_visible: number;
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

	const csrf = async () => {
		try {
			const response = await wretch(`${import.meta.env.VITE_API_BASE_URL}/user/csrf-token`)
				.get()
				.json<{ csrfToken: string }>();
			return response.csrfToken;
		} catch (error) {
			console.error('Failed to fetch CSRF token:', error);
			throw new Error('Failed to fetch CSRF token');
		}
	};

	async function fetchCoursesDetails(id: string) {
		try {
			const csrfToken = await csrf();
			isLoading.set(true);

			const response = await wretch(`${import.meta.env.VITE_API_BASE_URL}/user/getcourse/${id}`)
				.headers({
					'X-CSRF-Token': csrfToken
				})
				.get()
				.json<Course[]>();

			if (response.length === 0 || response[0].is_visible !== 1) {
				goto('/home');
				return;
			}

			response.forEach((course) => (course.course_image = course.course_img));
			courses.set(response);
		} catch (err: unknown) {
			error.set(getErrorMessage(err));
			goto('/home');
		} finally {
			isLoading.set(false);
		}
	}

	let std_id: string;
	let Fname: string;
	let Lname: string;
	let isSubmitting = writable(false);
	let stdYear: string;
	let errorMessage = '';

	const submitform = async () => {
		const laptop = $isChecked;

		isSubmitting.set(true);

		try {
			const csrfToken = await csrf();
			await wretch(`${import.meta.env.VITE_API_BASE_URL}/course/enroll`)
				.headers({
					'x-csrf-token': csrfToken
				})
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
						toast.success('ลงทะเบียนสำเร็จ', { position: 'bottom-center' });
						const params = new URLSearchParams({
							studentId: std_id,
							firstName: Fname,
							lastName: Lname,
							year: stdYear,
							courseName: $courses[0]?.course_name || ''
						});
						setTimeout(() => {
							goto(`/course/${id}/complete?${params.toString()}`);
						}, 1000);
					} else {
						alertMessage.set('An unexpected error occurred.');
						showAlertFail.set(true);
						showAlert.set(false);
					}
				});
		} catch (error) {
			alertMessage.set('Network error. Please try again later.');
			showAlertFail.set(true);
			showAlert.set(false);
		} finally {
			isSubmitting.set(false);
		}
	};

	let studentIdError = writable<string | null>(null);
	function validateStudentId() {
		const idRegex = /^\d{8}$/;
		if (!idRegex.test(std_id)) {
			studentIdError.set('รหัสนักศึกษาต้องมีตัวเลข 8 หลักเท่านั้น');
		} else {
			studentIdError.set(null);
		}
	}

	let firstNameError = writable<string | null>(null);
	let lastNameError = writable<string | null>(null);
	let nameError = writable(true);

	function isThaiOnly(input: string): boolean {
		const thaiRegex = /^[\u0E00-\u0E7F\s]+$/;
		return thaiRegex.test(input);
	}

	function validateFirstName() {
		if (!isThaiOnly(Fname)) {
			firstNameError.set('กรุณากรอกชื่อเป็นภาษาไทยเท่านั้น');
			nameError.set(false);
		} else {
			nameError.set(true);
			firstNameError.set(null);
		}
	}

	function validateLastName() {
		if (!isThaiOnly(Lname)) {
			nameError.set(false);
			lastNameError.set('กรุณากรอกนามสกุลเป็นภาษาไทยเท่านั้น');
		} else {
			nameError.set(true);
			lastNameError.set(null);
		}
	}

	onMount(() => {
		fetchCoursesDetails(id);
	});
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<title>CSEvent - Short Course Registration</title>
	<meta name="description" content="Computer Science KMITL Short Course Registration System" />
</svelte:head>

<div class="fontUse flex w-full flex-col bg-gradient-to-b from-white to-gray-50">
	<!-- Modern Header with subtle shadow -->
	<Header />

	<!-- Main Content -->
	<div
		class="fontUse flex min-h-screen w-full flex-col items-center justify-center px-4 pb-16 pt-8"
	>
		{#if $isLoading}
			<div class="flex h-64 w-full items-center justify-center">
				<SyncLoader size="40" color="#E35205" unit="px" duration="1s" />
			</div>
		{:else if $error}
			<Alert.Root variant="destructive" class="w-full max-w-4xl">
				<Alert.Title>Error</Alert.Title>
				<Alert.Description>{$error}</Alert.Description>
			</Alert.Root>
		{:else if $courses.length}
			{#each $courses as course}
				<div class="container mx-auto max-w-6xl">
					<!-- Course Header Section -->
					<div class="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
						<div class="flex-1">
							<h1 class="text-3xl font-bold text-gray-900 md:text-4xl">
								<span class="text-[#E35205]">{course.course_name}</span>
							</h1>
							<div class="mt-3 flex flex-wrap gap-3">
								<span
									class="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800"
								>
									{course.course_date}
								</span>
								<span
									class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
								>
									{course.course_type}
								</span>
								<span
									class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800"
								>
									{course.course_location}
								</span>
							</div>
						</div>

						<div class="flex items-center gap-3">
							{#if course.is_submissionproject === true}
								<a
									href="https://csevent.vercel.app/submission"
									class="rounded-full bg-[#E35205] px-6 py-2 font-medium text-white shadow-md transition-all hover:bg-[#ff6a2b] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E35205] focus:ring-opacity-50"
								>
									Submit Project
								</a>
							{/if}

							<Dialog.Root>
								<Dialog.Trigger
									class="rounded-full bg-[#E35205] px-6 py-2 font-medium text-white shadow-md transition-all hover:bg-[#ff6a2b] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E35205] focus:ring-opacity-50"
								>
									Enroll Now
								</Dialog.Trigger>

								<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-md">
									<Dialog.Header>
										<Dialog.Title class="text-2xl font-bold"
											>Enroll in {course.course_name}</Dialog.Title
										>
										<Dialog.Description class="text-gray-600">
											Complete your enrollment information below to reserve your spot.
										</Dialog.Description>
									</Dialog.Header>

									<div class="py-6">
										<div class="space-y-5">
											<div>
												<Label for="stuid" class="text-sm font-medium text-gray-700"
													>รหัสนักศึกษา</Label
												>
												<Input
													id="stuid"
													bind:value={std_id}
													class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#E35205] focus:ring-[#E35205]"
													placeholder="กรอกรหัสนักศึกษา 8 หลัก"
													on:blur={validateStudentId}
												/>
												{#if $studentIdError}
													<p class="mt-1 text-sm text-red-500">{$studentIdError}</p>
												{/if}
											</div>

											<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
												<div>
													<Label for="fname" class="text-sm font-medium text-gray-700"
														>ชื่อ (ภาษาไทย)</Label
													>
													<Input
														id="fname"
														bind:value={Fname}
														class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#E35205] focus:ring-[#E35205]"
														placeholder="ชื่อภาษาไทย"
														on:blur={validateFirstName}
													/>
													{#if $firstNameError}
														<p class="mt-1 text-sm text-red-500">{$firstNameError}</p>
													{/if}
												</div>

												<div>
													<Label for="lname" class="text-sm font-medium text-gray-700"
														>นามสกุล (ภาษาไทย)</Label
													>
													<Input
														id="lname"
														bind:value={Lname}
														class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#E35205] focus:ring-[#E35205]"
														placeholder="นามสกุลภาษาไทย"
														on:blur={validateLastName}
													/>
													{#if $lastNameError}
														<p class="mt-1 text-sm text-red-500">{$lastNameError}</p>
													{/if}
												</div>
											</div>

											<div>
												<Label class="text-sm font-medium text-gray-700">ชั้นปี</Label>
												<RadioGroup.Root bind:value={stdYear} class="mt-2">
													<div class="flex w-full flex-wrap gap-4">
														{#each [1, 2, 3, 4, 5] as year}
															<div class="flex items-center">
																<RadioGroup.Item
																	value={year.toString()}
																	id={`r${year}`}
																	class="peer sr-only"
																/>
																<Label
																	for={`r${year}`}
																	class="flex cursor-pointer items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 peer-data-[state=checked]:border-[#E35205] peer-data-[state=checked]:bg-orange-50 peer-data-[state=checked]:text-[#E35205]"
																>
																	{year < 5 ? `ปี ${year}` : 'อื่นๆ'}
																</Label>
															</div>
														{/each}
													</div>
													<RadioGroup.Input name="spacing" />
												</RadioGroup.Root>
											</div>

											<div class="rounded-lg bg-gray-50 p-4">
												<div class="flex items-center">
													<Switch
														id="laptop"
														bind:checked={$isChecked}
														class="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E35205] data-[state=checked]:bg-[#E35205]"
													/>
													<Label
														for="laptop"
														class="ml-3 cursor-pointer text-sm font-medium text-gray-700"
													>
														ผู้เข้าร่วมสามารถนำคอมพิวเตอร์มาเองได้
													</Label>
												</div>
												{#if course.is_personalcomputer && !$isChecked}
													<p class="mt-2 text-sm font-medium text-red-500">
														ในคอร์สนี้ต้องนำคอมพิวเตอร์ส่วนตัวมาเอง
														กรุณายืนยันการนำคอมพิวเตอร์ส่วนตัวมาเอง
													</p>
												{/if}
											</div>
										</div>
									</div>

									<Turnstile
										siteKey="0x4AAAAAAAkTZ_RJ8UwUievi"
										theme="light"
										size="normal"
										id="cf-turnstile-response"
									/>

									<Dialog.Footer class="flex flex-col gap-4 sm:flex-row-reverse">
										{#if $isSubmitting}
											<Button disabled class="w-full sm:w-auto">
												<span class="flex items-center gap-2">
													<span
														class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
													></span>
													กำลังลงทะเบียน...
												</span>
											</Button>
										{:else if $nameError}
											<Button
												type="submit"
												on:click={submitform}
												class="w-full bg-[#E35205] hover:bg-[#ff6a2b] sm:w-auto"
											>
												ลงทะเบียน
											</Button>
										{:else}
											<Button disabled class="w-full sm:w-auto">ลงทะเบียน</Button>
										{/if}

										<Dialog.Close class="mt-3 w-full sm:mt-0 sm:w-auto">
											<span class={buttonVariants({ variant: 'outline' })}> ยกเลิก </span>
										</Dialog.Close>
									</Dialog.Footer>

									{#if $isSubmitting}
										<div
											class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
										>
											<SyncLoader size="60" color="#E35205" unit="px" duration="1s" />
										</div>
									{/if}

									{#if $showAlert}
										<Alert.Root class="mt-4 border-l-4 border-green-500 bg-green-50">
											<div class="flex">
												<div class="flex-shrink-0">
													<svg
														class="h-5 w-5 text-green-400"
														viewBox="0 0 20 20"
														fill="currentColor"
													>
														<path
															fill-rule="evenodd"
															d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
															clip-rule="evenodd"
														/>
													</svg>
												</div>
												<div class="ml-3">
													<Alert.Title class="text-sm font-medium text-green-800"
														>ลงทะเบียนสำเร็จ!</Alert.Title
													>
													<Alert.Description class="mt-2 text-sm text-green-700">
														Don't forget to come to the event on {course.course_date}.
													</Alert.Description>
												</div>
											</div>
										</Alert.Root>
									{/if}

									{#if $showAlertFail}
										<Alert.Root variant="destructive" class="mt-4">
											<Alert.Title>เกิดข้อผิดพลาด</Alert.Title>
											<Alert.Description>{$alertMessage}</Alert.Description>
										</Alert.Root>
									{/if}
								</Dialog.Content>
							</Dialog.Root>
						</div>
					</div>

					<!-- Course Content Grid -->
					<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
						<!-- Left Column: Course Image and Instructors -->
						<div class="lg:col-span-5">
							<div
								class="overflow-hidden rounded-2xl shadow-md transition-transform hover:scale-[1.01]"
							>
								<img
									src={course.course_image}
									alt={course.course_name}
									class="mx-auto h-auto w-full max-w-full object-contain sm:max-h-96 lg:max-h-[500px]"
								/>
							</div>

							<div class="mt-8 rounded-xl bg-white p-6 shadow-sm">
								<h2 class="text-xl font-bold text-gray-900">Course Details</h2>
								<div class="mt-4 space-y-3 text-gray-700">
									<div class="flex items-center gap-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-[#E35205]"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<div>
											<span class="font-medium">Date:</span>
											{course.course_date}
										</div>
									</div>

									<div class="flex items-center gap-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-[#E35205]"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										<div>
											<span class="font-medium">Location:</span>
											{course.course_location}
										</div>
									</div>

									<div class="flex items-center gap-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-[#E35205]"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
											/>
										</svg>
										<div>
											<span class="font-medium">Instructor:</span>
											{course.course_lecture}
										</div>
									</div>

									<div class="flex items-center gap-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-[#E35205]"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
										<div>
											<span class="font-medium">Type:</span>
											{course.course_type}
										</div>
									</div>

									<div class="flex items-center gap-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-[#E35205]"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
											/>
										</svg>
										<div>
											<span class="font-medium">Provided by:</span>
											{course.course_team}
										</div>
									</div>

									<div class="flex items-center gap-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-[#E35205]"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/>
										</svg>
										<div>
											<span class="font-medium">Computer Required:</span>
											{course.is_personalcomputer
												? 'Yes, please bring your own laptop'
												: 'No, computers will be provided'}
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Right Column: Course Description -->
						<div class="lg:col-span-7">
							<Card.Root class="overflow-hidden rounded-xl shadow-sm">
								<Card.Header class="border-b bg-gray-50 px-6 py-4">
									<Card.Title class="flex items-center gap-2 text-xl font-bold">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-[#E35205]"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										Course Description
									</Card.Title>
								</Card.Header>
								<Card.Content class="px-6 py-6">
									<div class="prose prose-orange max-w-full">
										{@html marked.parse(course.course_description)}
									</div>

									<div class="mt-8 rounded-lg bg-orange-50 p-4">
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-5 w-5 text-[#E35205]"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M13 10V3L4 14h7v7l9-11h-7z"
													/>
												</svg>
											</div>
											<div>
												<h3 class="text-base font-semibold text-gray-900">
													Ready to enhance your skills?
												</h3>
												<p class="mt-1 text-sm text-gray-600">
													Click the "Enroll Now" button to secure your spot in this course.
												</p>
											</div>
										</div>
									</div>
								</Card.Content>
							</Card.Root>

							<!-- FAQ Section -->
							<div class="mt-8 rounded-xl bg-white p-6 shadow-sm">
								<h2 class="text-xl font-bold text-gray-900">Frequently Asked Questions</h2>
								<div class="mt-4 space-y-4">
									<div>
										<h3 class="text-base font-medium text-gray-900">
											What should I prepare before the course?
										</h3>
										<p class="mt-1 text-sm text-gray-600">
											Please check the course details for specific requirements. For courses
											requiring a laptop, ensure you have the necessary software installed
											beforehand.
										</p>
									</div>
									<Separator />
									<div>
										<h3 class="text-base font-medium text-gray-900">
											What is the benefits of taking a short course?
										</h3>
										<p class="mt-1 text-sm text-gray-600">
											1. Explore New Interests: It's a great way to explore new fields of interest
											before committing to more extensive education.
										</p>
										<p class="mt-1 text-sm text-gray-600">
											2. Skill Development: Learn specific and intensive content in a short period,
											such as technology skills, tools, or specialized programming languages.
										</p>
									</div>
									<Separator />
									<div>
										<h3 class="text-base font-medium text-gray-900">Do you have any snacks?</h3>
										<p class="mt-1 text-sm text-gray-600">Nope! 😊</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="container mx-auto max-w-4xl">
				<Alert.Root variant="default" class="mb-8 border border-yellow-200 bg-yellow-50">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<Alert.Title class="text-sm font-medium text-yellow-800">Course Not Found</Alert.Title
							>
							<Alert.Description class="mt-2 text-sm text-yellow-700">
								The course you're looking for doesn't exist or may have been removed.
							</Alert.Description>
						</div>
					</div>
				</Alert.Root>

				<div class="rounded-xl bg-white p-8 shadow-sm">
					<div class="mb-8 text-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mx-auto h-16 w-16 text-gray-300"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<h2 class="mt-4 text-2xl font-bold text-gray-900">We couldn't find this course</h2>
						<p class="mt-2 text-gray-600">
							The course you're looking for may have been removed or doesn't exist.
						</p>
					</div>

					<div class="space-y-4">
						<div class="rounded-lg bg-gray-50 p-4">
							<h3 class="text-lg font-medium text-gray-900">What can you do?</h3>
							<ul class="mt-2 list-inside list-disc space-y-2 text-gray-600">
								<li>Check if the course ID in the URL is correct</li>
								<li>Browse available courses to find alternatives</li>
								<li>Contact the course administrator for assistance</li>
							</ul>
						</div>

						<div class="flex flex-col gap-4 pt-4 sm:flex-row">
							<a
								href="/browse"
								class="inline-flex items-center justify-center rounded-full bg-[#E35205] px-6 py-2 font-medium text-white shadow-md transition-all hover:bg-[#ff6a2b] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E35205] focus:ring-opacity-50"
							>
								Browse Courses
							</a>
							<a
								href="/home"
								class="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-[#E35205] focus:outline-none focus:ring-2 focus:ring-[#E35205] focus:ring-opacity-50"
							>
								Return to Home
							</a>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<Footer />
</div>

<Toaster />

<style>
	.fontUse {
		font-family: 'Noto Sans Thai', sans-serif;
	}
</style>
