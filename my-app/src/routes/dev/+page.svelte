
<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import { DateFormatter, type DateValue, getLocalTimeZone } from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import Wretch from 'wretch';
	import Cookies from 'js-cookie';
	import toast, { Toaster } from 'svelte-french-toast';
	import { writable } from 'svelte/store';
	import * as Card from '$lib/components/ui/card';

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
		is_visible: string;
		pastEvent:boolean
	}

	//เหมือนจะไม่ใช้แล้ว
	interface Student {
		id: number;
		name: string;
		course_id: string;
		Fname: String;
		Lname: String;
		laptop: boolean;
	}

	let file: File | null = null;

	const handleFileChange = async (e: Event) => {
		const target = (await e.target) as HTMLInputElement;
		if (target && target.files) {
			file = target.files[0];
		}
	};

	// Create course
	let courseName: string;
	let courseType: string;
	let courseDescription: string;
	let selectedDate: DateValue | undefined = undefined;
	let courseLecture: string;
	let courseLocation: string;
	let courseTeam: string;

	//create
	const createCourse = async () => {
		if (!file) {
			console.error('No file selected.');
			return;
		}
		const formData = new FormData();
		const date = selectedDate ? selectedDate.toString() : '';
		formData.append('file', file);
		formData.append('course_name', courseName || '');
		formData.append('course_type', courseType || '');
		formData.append('course_date', date);
		formData.append('course_lecture', courseLecture || '');
		formData.append('course_location', courseLocation || '');
		formData.append('course_team', courseTeam || '');
		try {
			const response = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/course/create`)
				.post(formData)
				.res(() => {
					toast.success('Create course complete.');
					toast('Dont forget to add course description !. ไม่อย่างงั้น คอร์สจะมองไม่เห็นทุกกรณีนะครับ', {
						duration: 7000
					});
					toast('สถานะปัจจุบัน คือมองไม่เห็น ลงทะเบียนไม่ได้ อย่าลืมไปปรับในหน้า จัดการ การมองเห็นคอร์สในหน้าแรก', {
						duration: 7000
					});
				})
				.catch(() => {
					toast.error("This didn't work. Please try again.");
				});
		} catch (error) {
			console.error(error);
		}
	};

	// Add course description
	const addCourseDescription = async () => {
		try {
			await Wretch(`${import.meta.env.VITE_API_BASE_URL}/course/update-course-desciption`)
				.put({
					course_id: selectedCourseId,
					course_description: courseDescription
				})
				.res(() => {
					toast.success('Add Course description complete.');
				})
				.catch(() => {
					toast.error("This didn't work. Please try again.");
				});
		} catch (error) {
			console.error(error);
		}
	};

	// Delete
	let selectedCourseId: string = '';

	const deleteCourse = async (courseId: string) => {
		console.log(courseId);

		await Wretch(`${import.meta.env.VITE_API_BASE_URL}/course/delete/${courseId}`)
			.delete()
			.notFound(() => {
				toast.error('Error deleting course. Please try again.');
			})
			.res(() => {
				toast.success('Course deleted successfully.');
				datacourse = datacourse.filter((course) => course.course_id !== courseId);
			})
			.catch(() => {
				toast.error("This didn't work. Please try again.");
			});
	};

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
			console.log('csrf', response.csrfToken);
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
				.json<getuser[]>();
			allStudents = response;
			datauser = response;
			students.set(allStudents); // Set the students store
			console.log(allStudents);
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
				.json<Course[]>();
			allCourse = response;
			datacourse = response;
			students.set(allStudents); // Set the students store
			console.log(allStudents);
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
	//Gunner
	
	const updateCourseVisibility = async (courseId: string, newVisibility: string) => {
		try {
			await Wretch(`${import.meta.env.VITE_API_BASE_URL}/course/update-visible/${courseId}`)
				.put({ is_visible: newVisibility })
				.res(() => {
					toast.success('Course visibility updated.');
					datacourse = datacourse.map((course) =>
						course.course_id === courseId ? { ...course, is_visible: newVisibility } : course
					);
				});
		} catch (error) {
			toast.error('Failed to update course visibility.');
			console.error(error);
		}
	};
	const togglePastCourse = async (courseId: string, currentVisibility: boolean) => {
		try {
			const newVisibility = !currentVisibility;

			await Wretch(`${import.meta.env.VITE_API_BASE_URL}/course/update-visible/${courseId}`)
				.put({ pastEvent: newVisibility })
				.res(() => {
					toast.success('Course status updated.');
					const updatedCourses = datacourse.map((course) =>
						course.course_id === courseId ? { ...course, pastEvent: newVisibility } : course
					);
					datacourse = updatedCourses;
				})
				.catch(() => {
					toast.error('Failed to update course status.');
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
		const token = await localStorage.getItem('auth');
		console.log(token);
		if (token) {
			await Wretch(`${import.meta.env.VITE_API_BASE_URL}/admin/auth`)
				.headers({
					'Content-type': 'application/json',
					Authorization: `Bearer ${token}`
				})
				.post({})
				.badRequest(() => {
					window.location.pathname = 'home';
				})
				.unauthorized(async () => {
					window.location.pathname = 'home';
				})
				.res(async () => {
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
			<h1 class="p-5 text-center text-2xl font-bold">Edit Courses</h1>
			<!-- post Blog -->
			<div class="m-5 flex h-full flex-col justify-center gap-5 border border-[green] p-5">
				<!-- CREATE COURSE -->
				<Dialog.Root>
					<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}
						>Create Course</Dialog.Trigger
					>
					<Dialog.Content class="sm:max-w-[425px]">
						<Dialog.Header>
							<Dialog.Title>Create Course</Dialog.Title>
							<Dialog.Description>
								Create course here. Click save when you're done.
							</Dialog.Description>
						</Dialog.Header>
						<div class="grid gap-4 py-4">
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="name" class="text-right">Name</Label>
								<Input id="name" bind:value={courseName} class="col-span-3" />
							</div>
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="type" class="text-right">Type</Label>
								<Input id="type" bind:value={courseType} class="col-span-3" />
							</div>
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="team" class="text-right">Team</Label>
								<Input id="team" bind:value={courseTeam} class="col-span-3" />
							</div>
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="date" class="text-right">Date</Label>
								<Popover.Root>
									<Popover.Trigger asChild let:builder>
										<Button
											variant="outline"
											class={cn(
												'w-[280px] justify-start text-left font-normal',
												!selectedDate && 'text-muted-foreground'
											)}
											builders={[builder]}
										>
											<CalendarIcon class="mr-2 h-4 w-4" />
											{selectedDate
												? df.format(selectedDate.toDate(getLocalTimeZone()))
												: 'Pick a date'}
										</Button>
									</Popover.Trigger>
									<Popover.Content class="w-auto p-0">
										<Calendar bind:value={selectedDate} initialFocus />
									</Popover.Content>
								</Popover.Root>
							</div>
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="lec" class="text-right">Lecture</Label>
								<Input id="lec" bind:value={courseLecture} class="col-span-3" />
							</div>
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="local" class="text-right">Location</Label>
								<Input id="local" bind:value={courseLocation} class="col-span-3" />
							</div>
							<div class="grid grid-cols-4 items-center gap-4">
								<!-- <Input id="local" bind:value={courseLocation}  /> -->
								<Label for="picture" class="text-right">Picture</Label>
								<Input id="picture" class="col-span-3" type="file" on:change={handleFileChange} />
							</div>
						</div>
						<Dialog.Footer>
							<!-- submit BTN -->
							<Button
								type="submit"
								on:click={() => {
									createCourse();
								}}>Save changes</Button
							>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
				

				<!-- ADD COURSE DESCRIPTION -->
				<Dialog.Root>
					<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}
						>Add Course Description</Dialog.Trigger
					>
					<Dialog.Content class="sm:max-w-[1080px]">
						<Dialog.Header>
							<Dialog.Title>Add Course Description</Dialog.Title>
							<Dialog.Description>
								Provide a description for the selected course. Markdown is supported.
							</Dialog.Description>
						</Dialog.Header>
						<div class="grid gap-4 py-4">
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="course" class="text-right">Course</Label>
								<select id="course" bind:value={selectedCourseId} class="col-span-3">
									<option value="" disabled selected>Select a course</option>
									{#each datacourse as course (course.course_id)}
										<option value={course.course_id}>{course.course_name}</option>
									{/each}
								</select>
							</div>
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="description" class="text-right">Description</Label>
								<textarea
									id="description"
									bind:value={courseDescription}
									class="col-span-3"
									placeholder="Enter course description in markdown"
									rows="20"
									cols="30"
								/>
							</div>
						</div>
						<Dialog.Footer>
							<Button type="button" on:click={addCourseDescription}>Add Description</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>

				<!-- DELETE COURSE -->
				<Dialog.Root>
					<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}
						>Delete Course</Dialog.Trigger
					>
					<Dialog.Content class="sm:max-w-[425px]">
						<Dialog.Header>
							<Dialog.Title>Delete Course</Dialog.Title>
							<Dialog.Description>
								Select a course to delete. This action cannot be undone.
							</Dialog.Description>
						</Dialog.Header>
						<div class="grid gap-4 py-4">
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="course" class="text-right">Course</Label>
								<select id="course" bind:value={selectedCourseId} class="col-span-3">
									<option value="" disabled selected>Select a course</option>
									{#each datacourse as course (course.course_id)}
										<option value={course.course_id}>{course.course_name}</option>
									{/each}
								</select>
							</div>
						</div>
						<Dialog.Footer>
							<Button type="button" on:click={() => deleteCourse(selectedCourseId)}>Delete</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
				<!-- show student in each course -->
				<Dialog.Root>
					<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
						Show student in each course
					</Dialog.Trigger>
					<Dialog.Content class="rounded-lg bg-white p-6 shadow-lg sm:max-w-[600px]">
						<Dialog.Header>
							<Dialog.Title class="text-lg font-bold">Show Students</Dialog.Title>
							<Dialog.Description class="text-sm text-gray-500">
								Select a course to view the list of enrolled students.
							</Dialog.Description>
						</Dialog.Header>

						<div class="grid gap-4 py-4">
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="course" class="text-right">Course</Label>
								<select
									id="course"
									bind:value={selectedCourseId}
									class="col-span-3 rounded-md border border-gray-300 p-2 focus:border-blue-300 focus:outline-none focus:ring"
									on:change={() => showStudentEachCourse(selectedCourseId)}
								>
									<option value="" disabled selected>Select a course</option>
									{#each datacourse as course (course.course_id)}
										<option value={course.course_id}>{course.course_name}</option>
									{/each}
								</select>
							</div>

							{#if $isLoading}
								<p class="text-center text-gray-500">Loading students...</p>
							{/if}

							{#if !$isLoading && $filteredStudents.length > 0}
								<table class="min-w-full bg-white">
									<thead>
										<tr class="w-full border-b bg-gray-100">
											<th class="px-4 py-2 text-left">Student Name</th>
											<th class="px-4 py-2 text-left">Student ID</th>
											<th class="px-4 py-2 text-left">Can bring laptop?</th>
										</tr>
									</thead>
									<tbody>
										{#each $filteredStudents as Student}
											<tr class="border-b">
												<td class="px-4 py-2">{Student.Fname} {Student.Lname}</td>
												<td class="px-4 py-2">{Student.student_id}</td>
												<td class="px-4 py-2">{Student.laptop}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							{/if}

							<!-- Error Handling -->
							{#if $error}
								<p class="text-red-500">{error}</p>
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
						จัดการ การมองเห็นคอร์สในหน้าแรก
					</Dialog.Trigger>
					<Dialog.Content
						class="max-h-[80vh] max-w-[40vw] overflow-auto rounded-lg bg-white p-4 shadow-lg"
					>
						<div class="grid gap-4">
							{#each datacourse as course (course.course_id)}
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
													class={course.is_visible === '1'
														? 'text-xs font-semibold text-green-500'
														: course.is_visible === '2'
															? 'text-xs font-semibold text-yellow-500'
															: 'text-xs font-semibold text-red-500'}
												>
													{course.is_visible === '1'
														? 'มองเห็น และลงทะเบียนได้'
														: course.is_visible === '2'
															? 'มองเห็น แต่ลงทะเบียนไม่ได้'
															: 'มองไม่เห็น ลงทะเบียนไม่ได้ (หากคอร์สนี้จัดไปแล้ว ให้เลือกอันนี้)'}
												</span>
											</div>

											<!-- Dropdown to change visibility status -->
											<select
											class="rounded bg-gray-200 px-2 py-1 text-xs font-bold text-black hover:bg-gray-300"
											bind:value={course.is_visible} 
											on:change={(e) => updateCourseVisibility(course.course_id, e.target.value)} 
										  >
											<option value="1">มองเห็น และลงทะเบียนได้</option>
											<option value="2">มองเห็น แต่ลงทะเบียนไม่ได้</option>
											<option value="3">มองไม่เห็น ลงทะเบียนไม่ได้ (หากคอร์สนี้จัดไปแล้ว ให้เลือกอันนี้)</option>
										  </select>
										  
										  
										</div>
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					</Dialog.Content>
				</Dialog.Root>
				<Dialog.Root>
					<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
						จัดการคอร์ส (อดีต,กำลังจัด)
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
													class={course.pastEvent
													? 'text-xs font-semibold text-red-500'
													:'text-xs font-semibold text-green-500'}
												>
													{course.pastEvent ? 'คอร์สนี้เป็นอดีตไปแล้ว' : 'อยู่ระหว่างการจัดคอร์ส'}
												</span>
											</div>

											<Button
												on:click={() => togglePastCourse(course.course_id, course.pastEvent)}
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
	<div class="flex">
		<div class="m-5 flex w-full flex-col">
			<div class="flex w-full flex-col border-b bg-[#ffffff] p-5">
				<div class="flex w-full justify-between">
					<h1 class="font-mono font-bold">ID</h1>
					<h1 class="font-mono font-bold">STUDENT_ID</h1>
					<h1 class="font-mono font-bold">FIRSTNAME</h1>
					<h1 class="font-mono font-bold">LASTNAME</h1>
				</div>
			</div>
			{#each datauser as data}
				<div class="flex w-full flex-col border-b bg-[#ffffff] p-5">
					<div class="flex w-full justify-between">
						<h1 class="font-mono font-bold">{data.id}</h1>
						<h1 class="font-mono font-bold">{data.student_id}</h1>
						<h1 class="font-mono font-bold">{data.Fname}</h1>
						<h1 class="font-mono font-bold">{data.Lname}</h1>
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
