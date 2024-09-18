<script lang="ts">
	import { LibraryIcon } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { writable } from 'svelte/store';
	import toast, { Toaster } from 'svelte-french-toast';
	import Wretch from 'wretch';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { onMount } from 'svelte';
    import { Upload } from 'lucide-svelte';


	// Define types
	interface getuser {
		id: string;
		student_id: string;
		Fname: string;
		Lname: string;
		course_id: string;
		laptop: boolean;
	}

	interface Course {
		course_id: any;
		course_name: string;
		course_lecture: string;
		course_type: string;
		course_date: string;
		is_visible: boolean;
	}

	let datauser: getuser[] = [];
	let datacourse: Course[] = [];
	let files: File[] = [];
	let isUploading: boolean = false;
	let showAlert: boolean = false;
	let studentId: string = '';
	let studentCourses: Course[] = [];
	let selectedCourse: string = ''; // Changed to string
	let studentVerified: boolean = false;

	const isLoading = writable(true);
	const students = writable<getuser[]>([]);
	const error = writable<string>('');

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

	async function fetchStudents() {
		try {
			const csrfToken = await csrf();
			isLoading.set(true);
			const response = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/getuser`)
				.headers({ 'X-CSRF-Token': csrfToken })
				.get()
				.json<getuser[]>();
			datauser = response;
			students.set(response);
		} catch (err) {
			error.set(getErrorMessage(err));
		} finally {
			isLoading.set(false);
		}
	}

	async function fetchCourses() {
		try {
			const csrfToken = await csrf();
			isLoading.set(true);
			const response = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/getcourse`)
				.headers({ 'X-CSRF-Token': csrfToken })
				.get()
				.json<Course[]>();
			datacourse = response;
		} catch (err) {
			error.set(getErrorMessage(err));
		} finally {
			isLoading.set(false);
		}
	}

	function getErrorMessage(error: unknown): string {
		if (error instanceof Error) return error.message;
		return String(error);
	}

	async function checkStudentId() {
		const student = datauser.filter((user) => user.student_id === studentId);
		if (student.length > 0) {
			const studentCourseIds = student.map((user) => user.course_id);
			const uniqueCourseIds = [...new Set(studentCourseIds)];
			studentCourses = datacourse.filter((course) => uniqueCourseIds.includes(course.course_id));
			studentVerified = true;
		} else {
			toast.error('Student ID not found.');
			studentCourses = [];
			studentVerified = false;
		}
	}

	const handleFileChange = (event: Event) => {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			files = Array.from(input.files).map((file) => {
				// Prepend student ID to file name
				const newFileName = `${studentId}_${file.name}`;
				return new File([file], newFileName, { type: file.type });
			});
		}
	};

	const uploadFiles = async () => {
		if (files.length === 0) {
			toast.error('Please select files to upload.');
			return;
		}

		if (!selectedCourse) {
			toast.error('Please select a course.');
			return;
		}

		isUploading = true;

		const formData = new FormData();
		files.forEach((file) => formData.append('files', file));

		try {
			const response = await fetch(`${import.meta.env.VITE_API_STORAGE}/upload`, {
				method: 'POST',
				body: formData,
				headers: {
					'Course-ID': selectedCourse 
				}
			});

			const result = await response.json();

			if (response.ok) {
				toast.success('Files uploaded successfully!');
			} else {
				toast.error('Error: ' + result.error);
			}
		} catch (error) {
			toast.error('Error: ' + (error as Error).message);
		} finally {
			isUploading = false;
		}
	};

	const handleAlertAction = () => {
		uploadFiles();
		setShowAlert(false);
	};

	const setShowAlert = (show: boolean) => {
		showAlert = show;
	};

	onMount(() => {
		fetchStudents();
		fetchCourses();
	});
</script>
<svelte:head>
	<link href="https://fonts.googleapis.com/css?family=Noto Sans Thai" rel="stylesheet" />
</svelte:head>

<div class="upload-container">
	{#if $isLoading}
		<Skeleton class="h-[20px] w-[100px] rounded-full" />
		<Skeleton class="mt-4 h-[20px] w-full rounded-md" />
		<Skeleton class="mt-4 h-[20px] w-[50%] rounded-md" />
	{:else}
		{#if !studentVerified}
			<div>
				<h1>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="lucide lucide-id-card"
                        color="#3182ce"
						><path d="M16 10h2" /><path d="M16 14h2" /><path d="M6.17 15a3 3 0 0 1 5.66 0" /><circle
							cx="9"
							cy="11"
							r="2"
						/><rect x="2" y="5" width="20" height="14" rx="2" /></svg
					>
					Enter Student ID
				</h1>
				<Input
					id="student-id"
					type="text"
					placeholder="Enter Student ID"
					bind:value={studentId}
					class="file-input"
				/>
				<Button class="upload-button mt-4" on:click={checkStudentId}>Check Student ID</Button>
			</div>
		{/if}

		{#if studentVerified}
			<div>
				<h1>
					<Upload size={24} color="#3182ce" />
					Select Courses and Upload Files
				</h1>

                <select bind:value={selectedCourse} class="file-input">
                    <option value="" disabled>Select Course</option>
                    {#each studentCourses as course}
                        <option value={course.course_id}>{course.course_name}</option>
                    {/each}
                </select>

				<p class="text-red-600 text-sm  text-left">
					*คุณสามารถ Upload หลายไฟล์พร้อมกันได้ โดยการ คลุมทุกไฟล์ที่ต้องการ Upload
				</p>

				<Input id="files" type="file" multiple on:change={handleFileChange} class="file-input" />

				<Button
					class="upload-button mt-4"
					on:click={() => setShowAlert(true)}
					disabled={files.length === 0 || isUploading}
				>
					{isUploading ? 'Uploading...' : 'Upload'}
				</Button>

				{#if showAlert}
					<AlertDialog.Root open={showAlert} on:openChange={() => setShowAlert(false)}>
						<AlertDialog.Trigger />
						<AlertDialog.Content>
							<AlertDialog.Header>
								<AlertDialog.Title>Confirm Upload</AlertDialog.Title>
								<AlertDialog.Description>
									Are you sure you want to upload these files? This action cannot be undone.
								</AlertDialog.Description>
							</AlertDialog.Header>
							<AlertDialog.Footer>
								<AlertDialog.Cancel on:click={() => setShowAlert(false)}>Cancel</AlertDialog.Cancel>
								<AlertDialog.Action on:click={handleAlertAction}>Upload</AlertDialog.Action>
							</AlertDialog.Footer>
						</AlertDialog.Content>
					</AlertDialog.Root>
				{/if}
			</div>
		{/if}
	{/if}

	<Toaster />
</div>

<style>
	:global(body) {
        font-family: 'Noto Sans Thai';
        display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		background-color: #e2e8f0;
		margin: 0;
	}

	.upload-container {
		background: #ffffff;
		padding: 40px;
		border-radius: 12px;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
		text-align: center;
		max-width: 600px; /* Increased width */
		width: 100%;
		border: 1px solid #ddd;
	}

	h1 {
		color: #2d3748;
		margin-bottom: 20px;
		font-size: 20px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

    .file-input {
        appearance: none; 
        padding: 14px;
        font-size: 16px;
        border: 2px solid #ddd;
        border-radius: 8px;
        width: 100%;
        box-sizing: border-box;
        background-color: #f9fafb;
        background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"%3E%3C/path%3E%3C/svg%3E');
        background-repeat: no-repeat;
        background-position: right 12px center; /* Adjust position of the arrow */
        background-size: 1.25rem;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .file-input:hover {
        border-color: #3182ce;
    }

    .file-input:focus {
        outline: none;
        border-color: #3182ce;
        box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.3);
    }

    .file-input:disabled {
        background-color: #e2e8f0;
        cursor: not-allowed;
        opacity: 0.7;
    }

    .file-input option {
        background-color: #fff;
        color: #2d3748;
        padding: 10px;
    }

    .file-input::-ms-expand {
        display: none;
    }
</style>
