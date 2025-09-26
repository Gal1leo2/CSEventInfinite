<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import wretch from 'wretch';
	import { SyncLoader } from 'svelte-loading-spinners';
	import Footer from '$lib/components/ui/Footer.svelte';
	import Header from '$lib/components/ui/Header.svelte';

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
	}

	// Get course ID from URL params
	const { id } = $page.params;
	
	// Get enrollment data from URL search params
	let studentId = '';
	let firstName = '';
	let lastName = '';
	let year = '';
	let courseName = '';

	let courses = writable<Course[]>([]);
	let isLoading = writable(true);
	let error = writable<string>('');
	let isValidAccess = writable(false);

	function getErrorMessage(error: unknown): string {
		if (error instanceof Error) return error.message;
		return String(error);
	}

	// Security check function
	function validateAccess(): boolean {
		const urlParams = new URLSearchParams($page.url.searchParams);
		const requiredParams = ['studentId', 'firstName', 'lastName', 'year'];
		
		// Check if all required parameters are present and not empty
		for (const param of requiredParams) {
			const value = urlParams.get(param);
			if (!value || value.trim() === '') {
				return false;
			}
		}
		
		// Additional validation for student ID (should be 8 digits)
		const studentIdParam = urlParams.get('studentId');
		if (studentIdParam && !/^\d{8}$/.test(studentIdParam)) {
			return false;
		}
		
		return true;
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

			response.forEach((course) => (course.course_image = course.course_img));
			courses.set(response);
		} catch (err: unknown) {
			error.set(getErrorMessage(err));
		} finally {
			isLoading.set(false);
		}
	}

	onMount(() => {
		// Security check: validate access before proceeding
		if (!validateAccess()) {
			// Small delay before redirect for better UX
			setTimeout(() => {
				goto(`/course/${id}`);
			}, 1500);
			return;
		}
		
		// Set valid access flag
		isValidAccess.set(true);
		
		// Extract data from URL search params
		const urlParams = new URLSearchParams($page.url.searchParams);
		studentId = urlParams.get('studentId') || '';
		firstName = urlParams.get('firstName') || '';
		lastName = urlParams.get('lastName') || '';
		year = urlParams.get('year') || '';
		courseName = urlParams.get('courseName') || '';

		// Fetch course details
		fetchCoursesDetails(id);
	});

	function getYearDisplayName(yearValue: string): string {
		switch(yearValue) {
			case '1': return 'ปี 1';
			case '2': return 'ปี 2';
			case '3': return 'ปี 3';
			case '4': return 'ปี 4';
			case '5': return 'อื่นๆ';
			default: return 'ไม่ระบุ';
		}
	}
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
	<title>CSEvent - Registration Complete</title>
	<meta name="description" content="Course enrollment completed successfully" />
</svelte:head>

<div class="fontUse flex w-full flex-col bg-gradient-to-b from-white to-gray-50 min-h-screen">
	<!-- Header -->
	<Header />

	<!-- Main Content -->
	<div class="fontUse flex flex-1 w-full flex-col items-center justify-center px-4 pb-16 pt-8">
		{#if !$isValidAccess}
			<!-- Security redirect message -->
			<div class="flex flex-col items-center justify-center h-64 w-full max-w-md mx-auto text-center">
				<div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#E35205]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>
				<h2 class="text-xl font-semibold text-gray-900 mb-2">การเข้าถึงไม่ถูกต้อง</h2>
				<p class="text-gray-600 mb-4">กรุณาลงทะเบียนผ่านหน้าคอร์สก่อน</p>
				<div class="flex items-center gap-2 text-sm text-gray-500">
					<SyncLoader size="20" color="#E35205" unit="px" duration="1s" />
					<span>กำลังเปลี่ยนเส้นทางไปหน้าคอร์ส...</span>
				</div>
			</div>
		{:else if $isLoading}
			<div class="flex h-64 w-full items-center justify-center">
				<SyncLoader size="40" color="#E35205" unit="px" duration="1s" />
			</div>
		{:else if $error}
			<Alert.Root variant="destructive" class="w-full max-w-4xl">
				<Alert.Title>Error</Alert.Title>
				<Alert.Description>{$error}</Alert.Description>
			</Alert.Root>
		{:else}
			<div class="container mx-auto max-w-4xl">
				<!-- Success Header -->
				<div class="mb-8 text-center">
					<div class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h1 class="text-4xl font-bold text-gray-900 mb-2">
						🎉 ลงทะเบียนสำเร็จ!
					</h1>
					<p class="text-xl text-gray-600">
						Registration Completed Successfully
					</p>
				</div>

				<!-- Enrollment Details Card -->
				<Card.Root class="mb-8 overflow-hidden rounded-xl shadow-lg">
					<Card.Header class="bg-gradient-to-r from-[#E35205] to-[#ff6a2b] text-white">
						<Card.Title class="text-2xl font-bold flex items-center gap-2">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							รายละเอียดการลงทะเบียน
						</Card.Title>
					</Card.Header>
					<Card.Content class="p-8">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="space-y-4">
								<div>
									<h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider">รหัสนักศึกษา</h3>
									<p class="text-xl font-semibold text-gray-900">{studentId}</p>
								</div>
								<div>
									<h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</h3>
									<p class="text-xl font-semibold text-gray-900">{firstName} {lastName}</p>
								</div>
								<div>
									<h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider">ชั้นปี</h3>
									<p class="text-xl font-semibold text-gray-900">{getYearDisplayName(year)}</p>
								</div>
							</div>
							
							{#if $courses.length}
								{#each $courses as course}
									<div class="space-y-4">
										<div>
											<h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider">ชื่อคอร์ส</h3>
											<p class="text-xl font-semibold text-[#E35205]">{course.course_name}</p>
										</div>
										<div>
											<h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider">วันที่จัดอบรม</h3>
											<p class="text-lg font-medium text-gray-900">{course.course_date}</p>
										</div>
										<div>
											<h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider">สถานที่</h3>
											<p class="text-lg font-medium text-gray-900">{course.course_location}</p>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Important Information Alert -->
				<Alert.Root class="mb-8 border-l-4 border-blue-500 bg-blue-50">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div class="ml-3">
							<Alert.Title class="text-sm font-medium text-blue-800">ข้อมูลสำคัญ</Alert.Title>
							<Alert.Description class="mt-2 text-sm text-blue-700">
								<ul class="list-disc list-inside space-y-1">
									<li>กรุณามาถึงก่อนเวลาเริ่มงาน 15 นาที</li>
									{#if $courses.length && $courses[0].is_personalcomputer}
										<li class="font-semibold text-red-700">กรุณานำคอมพิวเตอร์ส่วนตัวมาเอง</li>
									{/if}
									<li>หากไม่สามารถเข้าร่วมได้ กรุณาแจ้งล่วงหน้า</li>
								</ul>
							</Alert.Description>
						</div>
					</div>
				</Alert.Root>

				<!-- Course Details (if available) -->
				{#if $courses.length}
					{#each $courses as course}
						<Card.Root class="mb-8 overflow-hidden rounded-xl shadow-sm">
							<Card.Header class="bg-gray-50 border-b">
								<Card.Title class="text-xl font-bold flex items-center gap-2">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#E35205]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
									</svg>
									เกี่ยวกับคอร์สนี้
								</Card.Title>
							</Card.Header>
							<Card.Content class="p-6">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div class="space-y-3">
										<div class="flex items-center gap-2">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#E35205]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
											</svg>
											<div>
												<span class="font-medium">วิทยากร:</span> {course.course_lecture}
											</div>
										</div>
										
										<div class="flex items-center gap-2">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#E35205]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
											</svg>
											<div>
												<span class="font-medium">ผู้จัด:</span> {course.course_team}
											</div>
										</div>
										
										<div class="flex items-center gap-2">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#E35205]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
											<div>
												<span class="font-medium">ประเภท:</span> {course.course_type}
											</div>
										</div>
									</div>
									
									{#if course.course_img}
										<div class="flex justify-center">
											<img
												src={course.course_img}
												alt={course.course_name}
												class="rounded-lg shadow-md max-h-48 object-contain"
											/>
										</div>
									{/if}
								</div>
								
								{#if course.is_submissionproject}
									<div class="mt-6 rounded-lg bg-yellow-50 p-4">
										<div class="flex items-center gap-3">
											<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
												<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
												</svg>
											</div>
											<div>
												<h3 class="text-base font-semibold text-gray-900">Project Submission Required</h3>
												<p class="mt-1 text-sm text-gray-600">คอร์สนี้มีการส่งโปรเจค หลังจากเสร็จสิ้นการอบรมแล้ว</p>
											</div>
										</div>
									</div>
								{/if}
							</Card.Content>
						</Card.Root>
					{/each}
				{/if}

				<!-- Action Buttons -->
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a 
						href="/home" 
						class="inline-flex items-center justify-center rounded-full bg-[#E35205] px-8 py-3 font-medium text-white shadow-md transition-all hover:bg-[#ff6a2b] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E35205] focus:ring-opacity-50"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
						</svg>
						กลับหน้าหลัก
					</a>
					
					<a 
						href="/home#courses" 
						class="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-8 py-3 font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-[#E35205] focus:outline-none focus:ring-2 focus:ring-[#E35205] focus:ring-opacity-50"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
						</svg>
						ดูคอร์สอื่นๆ
					</a>
				</div>
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<Footer />
</div>

<style>
	.fontUse {
		font-family: 'Noto Sans Thai', sans-serif;
	}
</style>