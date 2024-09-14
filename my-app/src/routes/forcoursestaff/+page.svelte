<script lang="ts">
	import { onMount } from 'svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { DateFormatter, type DateValue, getLocalTimeZone } from '@internationalized/date';
	import Wretch from 'wretch';
	import toast, { Toaster } from 'svelte-french-toast';
	import { writable } from 'svelte/store';
	import * as Card from '$lib/components/ui/card';
    import { jsPDF } from "jspdf";

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let datauser: getuser[] = [];
	let datacourse: Course[] = [];

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


	let file: File | null = null;






	// Delete
	let selectedCourseId: string = '';



	// Show students in each course
	let isLoading = writable(true);
	let students = writable<getuser[]>([]);
	let filteredStudents = writable<getuser[]>([]);
	let error = writable<string>('');
	let allStudents: getuser[] = [];
	let allCourse: Course[] = [];

	const csrf = async () => {
		try {
			const response = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/csrf-token`)
				.get()
				.json<{ csrfToken: string }>(); // Use the interface
				console.log("csrf" ,response.csrfToken)
			return response.csrfToken; // Access the csrfToken
		} catch (error) {
			console.error('Failed to fetch CSRF token:', error);
			throw new Error('Failed to fetch CSRF token'); // Handle errors as needed
		}
	};


	async function fetchStudents() {
		try {
			const csrfToken = await csrf();
			isLoading.set(true);
			const response = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/getuser`)
			.headers({
				'X-CSRF-Token': csrfToken
			})
			.get()
			.json<getuser[]>()
			allStudents = response;
			datauser = response
			students.set(allStudents); // Set the students store
			console.log(allStudents)
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
			.headers({
				'X-CSRF-Token': csrfToken
			})
			.get()
			.json<Course[]>()
			allCourse = response;
			datacourse = response
			students.set(allStudents); // Set the students store
			console.log(allStudents)
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

	function showStudentEachCourse(courseId: string) {
		if (courseId) {
			filteredStudents.set(allStudents.filter((student) => student.course_id === courseId));
		} else {
			filteredStudents.set([]);
		}
	}
    const getYearFromStudentId = (studentId: string) => {
		if (studentId.startsWith('67')) return '1';
		if (studentId.startsWith('66')) return '2';
		if (studentId.startsWith('65')) return '3';
		if (studentId.startsWith('64')) return '4';
		return 'Unknown';
	};
	//Gunner
	const toggleCourseVisibility = async (courseId: string, currentVisibility: boolean) => {
		try {
			const newVisibility = !currentVisibility;

			await Wretch(`${import.meta.env.VITE_API_BASE_URL}/course/update-visible/${courseId}`)
				.put({ is_visible: newVisibility })
				.res(() => {
					toast.success('Course visibility updated.');
					const updatedCourses = datacourse.map((course) =>
						course.course_id === courseId ? { ...course, is_visible: newVisibility } : course
					);
					datacourse = updatedCourses;
				})
				.catch(() => {
					toast.error('Failed to update course visibility.');
				});
		} catch (error) {
			console.error(error);
		}
	};


	//Login handle----------------------------------------------------------------------------------------------
		//ยังแก้บั้คไม่เสร็จจจจจ
	const isLoggedIn = writable(false);

	onMount(async () => {
		//auth------------------------
		const token = await localStorage.getItem('auth')
		console.log(token)
		if (token) {
			await Wretch(`${import.meta.env.VITE_API_BASE_URL}/admin/auth`)
				.headers(
					{
						"Content-type": "application/json",
						'Authorization': `Bearer ${token}`
					}
				)
				.post({})
				.badRequest(()=>{
					window.location.pathname = 'home';

				})
				.unauthorized(async () => {
					window.location.pathname = 'home';
				})
				.res( async () => {
					isLoggedIn.set(true);
				});
		} else {
			window.location.pathname = 'home';
		}
		fetchStudents();
		fetchCourses();
	});
</script>

{#if $isLoggedIn}
	<div class="flex h-screen w-full">
		<div class="m-5 flex w-full flex-col border border-[red]">
			<h1 class="p-5 text-center text-2xl font-bold">For Staff Console</h1>
			<!-- post Blog -->
			<div class="m-5 flex h-full flex-col justify-center gap-5 border border-[green] p-5">
				<!-- show student in each course -->
                <Dialog.Root>
                    <Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
                        Show Students in Each Course
                    </Dialog.Trigger>
                    <Dialog.Content
                        class="rounded-lg bg-white p-6 shadow-lg sm:max-w-[600px] max-h-[80vh] overflow-y-auto sm:overflow-hidden">
                        <Dialog.Header>
                            <Dialog.Title class="text-lg font-bold text-gray-700">Enrolled Students</Dialog.Title>
                            <Dialog.Description class="text-sm text-gray-500">
                                Select a course to view the list of enrolled students.
                            </Dialog.Description>
                        </Dialog.Header>
                
                        <div class="grid gap-4 py-4">
                            <!-- Course Selection -->
                            <div class="grid grid-cols-4 items-center gap-4">
                                <label for="course" class="text-right font-medium text-gray-700">Course</label>
                                <select
                                    id="course"
                                    bind:value={selectedCourseId}
                                    class="col-span-3 rounded-md border border-gray-300 p-2 focus:border-blue-400 focus:ring focus:ring-blue-200 transition duration-150 ease-in-out"
                                    on:change={() => showStudentEachCourse(selectedCourseId)}>
                                    <option value="" disabled selected>Select a course</option>
                                    {#each datacourse as course (course.course_id)}
                                        <option value={course.course_id}>{course.course_name}</option>
                                    {/each}
                                </select>
                            </div>
                
                            <!-- Loading Indicator -->
                            {#if $isLoading}
                                <p class="text-center text-gray-500">Loading students...</p>
                            {/if}
                
                            <!-- Students Table -->
                            {#if !$isLoading && $filteredStudents.length > 0}
                                <div class="overflow-x-auto max-h-96 overflow-y-auto">
                                    <table class="min-w-full bg-white border rounded-md">
                                        <thead>
                                            <tr class="w-full border-b bg-gray-100 text-gray-700">
                                                <th class="px-4 py-2 text-left font-semibold">Student Name</th>
                                                <th class="px-4 py-2 text-left font-semibold">Student ID</th>
                                                <th class="px-4 py-2 text-left font-semibold">Year</th> <!-- New Year Column -->
                                                <th class="px-4 py-2 text-left font-semibold">Can bring laptop?</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each $filteredStudents as Student}
                                                <tr class="border-b hover:bg-gray-50">
                                                    <td class="px-4 py-2">{Student.Fname} {Student.Lname}</td>
                                                    <td class="px-4 py-2">{Student.student_id}</td>
                                                    <td class="px-4 py-2">{getYearFromStudentId(Student.student_id)}</td> <!-- Year value -->
                                                    <td class="px-4 py-2">{Student.laptop ? 'Yes' : 'No'}</td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {/if}
                
                            <!-- Error Handling -->
                            {#if $error}
                                <p class="text-red-500 text-center">{error}</p>
                            {/if}
                
                            <!-- No students found for the selected course -->
                            {#if !$isLoading && $filteredStudents.length === 0 && selectedCourseId}
                                <p class="text-center text-gray-500">No students enrolled in this course.</p>
                            {/if}
                        </div>
                    </Dialog.Content>
                </Dialog.Root>
                
				<!-- Change courses visibility -->
				<Dialog.Root>
					<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
						Change courses Register states
					</Dialog.Trigger>
					<Dialog.Content
						class="max-h-[80vh] max-w-[40vw] overflow-auto rounded-lg bg-white p-4 shadow-lg"
					>
						<div class="grid gap-4">
							{#each datacourse as course}
								<Card.Root class="col-span-full">
									<Card.Header class="flex flex-row items-center justify-between">
										<div class="grid gap-1">
											<Card.Title class="text-sm font-medium">{course.course_name}</Card.Title>
											<Card.Description class="text-xs">{course.course_type}</Card.Description>
										</div>
									</Card.Header>
									<Card.Content>
										<div class="flex items-center justify-between">
											<div class="flex items-center">
												<span
													class={course.is_visible
														? 'text-xs font-semibold text-green-500'
														: 'text-xs font-semibold text-red-500'}
												>
													{course.is_visible ? 'Can Register' : 'Can not Register'}
												</span>
											</div>

											<Button
												on:click={() => toggleCourseVisibility(course.course_id, course.is_visible)}
												class="rounded bg-gray-200 px-2 py-1 text-xs font-bold text-black hover:bg-gray-300"
											>
												Change Status
											</Button>
										</div>
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		</div>
		<!-- Right Box -->
		<div class="m-5 flex w-full flex-col">
			<div class="flex w-full flex-col border-b bg-gray-300 p-5">
				<div class="flex w-full justify-between text-center">
					<h1 class="w-1/5 font-bold">COURSE_ID</h1>
					<h1 class="w-1/5 font-bold">NAME</h1>
					<h1 class="w-1/5 font-bold">LECTURE</h1>
					<h1 class="w-1/5 font-bold">TYPE</h1>
					<h1 class="w-1/5 font-bold">DATE</h1>
				</div>
			</div>
			{#each datacourse as data}
				<div class="flex w-full flex-col border-b bg-[#ffffff] p-3">
					<div class="flex w-full items-center justify-between gap-5 text-center">
						<h1 class=" w-1/5 text-xs">{data.course_id}</h1>
						<h1 class=" w-1/5 text-xs">{data.course_name}</h1>
						<h1 class=" w-1/5 text-xs">{data.course_lecture}</h1>
						<h1 class=" w-1/5 text-xs">{data.course_type}</h1>
						<h1 class=" w-1/5 text-xs">{data.course_date}</h1>
					</div>
				</div>
			{/each}
		</div>
	</div>
	<div class="flex justify-center p-6">
		<div class="w-full max-w-4xl flex flex-col space-y-4">
		  <!-- Header -->
		  <div class="bg-gray-100 p-5 rounded-lg shadow-md">
			<div class="grid grid-cols-4 gap-4 text-center font-mono font-bold text-gray-700">
			  <h1>ID</h1>
			  <h1>STUDENT ID</h1>
			  <h1>FIRST NAME</h1>
			  <h1>LAST NAME</h1>
			</div>
		  </div>
	  
		  <!-- Data Rows -->
		  {#each datauser as data}
			<div class="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out">
			  <div class="grid grid-cols-4 gap-4 text-center font-mono text-gray-600">
				<h1>{data.id}</h1>
				<h1>{data.student_id}</h1>
				<h1>{data.Fname}</h1>
				<h1>{data.Lname}</h1>
			  </div>
			</div>
		  {/each}
		</div>
	  </div>
	  
	<Toaster />

	<style>
		.lined-textarea {
			background: linear-gradient(to bottom, #ddd 1px, transparent 1px);
			background-size: 100% 24px;
			line-height: 24px;
			padding: 8px;
			border: 1px solid #ccc;
			border-radius: 5px;
			resize: vertical;
		}
	</style>
{/if}
