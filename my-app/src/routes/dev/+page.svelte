<script lang="ts">
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
			const response = await Wretch('https://nodejsbackend-ten.vercel.app/course/create')
				.post(formData)
				.res(() => {
					toast.success('Create course complete.');
					toast('Dont forget to add course description !!!!.', {
						duration: 4000
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
			await Wretch('https://nodejsbackend-ten.vercel.app/course/update-course-desciption')
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

		await Wretch(`https://nodejsbackend-ten.vercel.app/course/delete/${courseId}`)
			.delete()
			.notFound(() => {
				toast.error('Error deleting course. Please try again.');
			})
			.res(() => {
				toast.success('Course deleted successfully.');
				datacourse = datacourse.filter((course) => course.course_id !== courseId);
			});
	};

	// Show students in each course
	let isLoading = writable(true);
	let students = writable<getuser[]>([]);
	let filteredStudents = writable<getuser[]>([]);
	let error = writable<string>('');
	let allStudents: getuser[] = [];

	async function fetchStudents() {
		try {
			isLoading.set(true);
			const response = await fetch('https://nodejsbackend-ten.vercel.app/user/getuser');
			if (!response.ok) {
				throw new Error('Failed to fetch students');
			}
			allStudents = await response.json(); // Store all students for filtering
			students.set(allStudents); // Set the students store
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

	//Login handle----------------------------------------------------------------------------------------------

	const isLoggedIn = writable(false);

	const token = Cookies.get('authUser');
	onMount(async () => {
		if (token) {
			await Wretch('https://nodejsbackend-ten.vercel.app/admin/auth')
				.post({ token })
				.unauthorized(() => {
					window.location.pathname = '/';
				})
				.res(() => {
					isLoggedIn.set(true);
				});
		} else {
			window.location.pathname = 'home';
		}
		const resUser = await fetch('https://nodejsbackend-ten.vercel.app/user/getuser');
		const resCourse = await fetch('https://nodejsbackend-ten.vercel.app/user/getcourse');
		const DataU: getuser[] = await resUser.json();
		const DataC: Course[] = await resCourse.json();
		datauser = DataU;
		datacourse = DataC;
		fetchStudents();
	});
</script>


{#if $isLoggedIn}
	<div class="flex h-screen w-full ">
		<div class="m-5 flex w-full flex-col border border-[red]">
			<h1 class="text-center text-2xl font-bold">API</h1>
			<div class="grid grid-cols-3 justify-center gap-2">
				<div class="m-3 rounded-sm bg-[#2f2f2f] p-3 text-white hover:shadow-xl">
					<h1 class="font-mono font-bold">Enroll</h1>
					<span class="flex w-full rounded-md bg-black p-2 font-mono text-[#e8c34c]"
						>/user/enroll</span
					>
				</div>
				<div class="m-3 rounded-sm bg-[#2f2f2f] p-3 text-white shadow-xl">
					<h1 class="font-mono font-bold">Getcourse</h1>
					<span class="flex w-full rounded-md bg-black p-2 font-mono text-[#e8c34c]"
						>/user/getcourse</span
					>
				</div>
				<div class="m-3 rounded-sm bg-[#2f2f2f] p-3 text-white shadow-xl">
					<h1 class="font-mono font-bold">Getcourse/id</h1>
					<span class="flex w-full rounded-md bg-black p-2 font-mono text-[#e8c34c]"
						>/user/getcourse/:id</span
					>
				</div>
				<div class="m-3 rounded-sm bg-[#2f2f2f] p-3 text-white shadow-xl">
					<h1 class="font-mono font-bold">GetUsername</h1>
					<span class="flex w-full rounded-md bg-black p-2 font-mono text-[#e8c34c]"
						>/user/getuser</span
					>
				</div>
				<div class="m-3 rounded-sm bg-[#2f2f2f] p-3 text-white shadow-xl">
					<h1 class="font-mono font-bold">CreateCourse</h1>
					<span class="flex w-full rounded-md bg-black p-2 font-mono text-[#e8c34c]"
						>/course/create</span
					>
				</div>
			</div>
			<!-- post Blog -->
			<div class="m-5 flex flex-col h-full items-center justify-center gap-5 border border-[red]">
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
			</div>
		</div>
		<!-- Right Box -->
		<div class="m-5 flex w-full flex-col">
			<div class="flex w-full flex-col border-b bg-[#ffffff] p-5">
				<div class="flex w-full justify-between">
					<h1 class="font-mono font-bold">COURSE_ID</h1>
					<h1 class="font-mono font-bold">NAME</h1>
					<h1 class="font-mono font-bold">LECTURE</h1>
					<h1 class="font-mono font-bold">TYPE</h1>
					<h1 class="font-mono font-bold">DATE</h1>
				</div>
			</div>
			{#each datacourse as data}
				<div class="flex w-full flex-col border-b bg-[#ffffff] p-5">
					<div class="flex w-full justify-between">
						<h1 class="font-mono font-bold">{data.course_id}</h1>
						<h1 class="font-mono font-bold">{data.course_name}</h1>
						<h1 class="font-mono font-bold">{data.course_lecture}</h1>
						<h1 class="font-mono font-bold">{data.course_type}</h1>
						<h1 class="font-mono font-bold">{data.course_date}</h1>
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
