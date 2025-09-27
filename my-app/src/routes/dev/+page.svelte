<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Wretch from 'wretch';
	import { toast } from 'svelte-sonner';
	import {
		Calendar,
		Users,
		BookOpen,
		Settings,
		LogOut,
		Plus,
		Edit,
		Trash2,
		Eye,
		EyeOff,
		Search,
		Filter,
		Download,
		Upload,
		ChevronRight,
		Clock,
		MapPin,
		User,
		Laptop,
		GraduationCap,
		MoreVertical,
		TrendingUp,
		Activity,
		BarChart3,
		Grid3x3,
		List
	} from 'lucide-svelte';

	// Type definitions
	interface Course {
		course_id: string;
		course_name: string;
		course_type: string;
		course_date: string;
		course_description: string;
		course_lecture: string;
		course_location: string;
		course_img: string;
		course_team: string;
		is_visible: string;
		is_submissionproject: boolean;
		pastevent: boolean;
		is_personalcomputer: boolean;
	}

	interface Student {
		id: number;
		student_id: string;
		course_id: string;
		fname: string;
		lname: string;
		laptop: boolean;
		student_year: number;
	}

	interface Stats {
		totalCourses: number;
		activeCourses: number;
		totalStudents: number;
		upcomingEvents: number;
	}

	// State management
	const isLoggedIn = writable<boolean>(false);
	let datacourse: Course[] = [];
	let datastudent: Student[] = [];
	let searchTerm: string = '';
	let filterType: string = 'all';
	let selectedFilter = { value: 'all', label: 'All Courses' };
	let viewMode: 'grid' | 'list' = 'grid';
	let isLoading: boolean = true;

	// Stats
	let stats: Stats = {
		totalCourses: 0,
		activeCourses: 0,
		totalStudents: 0,
		upcomingEvents: 0
	};

	// Create course form
	let newCourse: Omit<Course, 'course_id'> = {
		course_name: '',
		course_type: '',
		course_date: '',
		course_description: '',
		course_lecture: '',
		course_location: '',
		course_img: '',
		course_team: '',
		is_visible: '0',
		is_submissionproject: false,
		pastevent: false,
		is_personalcomputer: false
	};

	// Fetch courses
	const fetchCourses = async (): Promise<void> => {
		try {
			const res = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/getcourse`)
				.get()
				.json<Course[]>();
			datacourse = res;
			updateStats();
		} catch (error) {
			toast.error('Failed to fetch courses');
			console.error(error);
		}
	};

	// Fetch students
	const fetchStudents = async (): Promise<void> => {
		try {
			const token = localStorage.getItem('auth');
			const res = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/admin/students`)
				.headers({
					Authorization: `Bearer ${token}`
				})
				.get()
				.json<Student[]>();
			datastudent = res;
			updateStats();
		} catch (error) {
			toast.error('Failed to fetch students');
			console.error(error);
		}
	};
	// Update statistics
	const updateStats = (): void => {
		stats.totalCourses = datacourse.length;
		stats.activeCourses = datacourse.filter((c) => c.is_visible === '1').length;
		stats.totalStudents = datastudent.length;
		stats.upcomingEvents = datacourse.filter(
			(c) => !c.pastevent && new Date(c.course_date) > new Date()
		).length;
	};

	// Create course
	const createCourse = async (): Promise<void> => {
		try {
			const csrfToken = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/csrf-token`)
				.get()
				.json<{ csrfToken: string }>()
				.then((data) => data.csrfToken);

			await Wretch(`${import.meta.env.VITE_API_BASE_URL}/course/create`)
				.headers({ 'X-CSRF-Token': csrfToken })
				.post(newCourse)
				.json();

			toast.success('Course created successfully!');
			fetchCourses();
			// Reset form
			newCourse = {
				course_name: '',
				course_type: '',
				course_date: '',
				course_description: '',
				course_lecture: '',
				course_location: '',
				course_img: '',
				course_team: '',
				is_visible: '0',
				is_submissionproject: false,
				pastevent: false,
				is_personalcomputer: false
			};
		} catch (error) {
			toast.error('Failed to create course');
			console.error(error);
		}
	};

	// Delete course
	const deleteCourse = async (courseId: string): Promise<void> => {
		if (!confirm('Are you sure you want to delete this course?')) return;

		try {
			const csrfToken = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/csrf-token`)
				.get()
				.json<{ csrfToken: string }>()
				.then((data) => data.csrfToken);

			await Wretch(`${import.meta.env.VITE_API_BASE_URL}/course/delete/${courseId}`)
				.headers({ 'X-CSRF-Token': csrfToken })
				.delete()
				.res();

			toast.success('Course deleted successfully');
			fetchCourses();
		} catch (error) {
			toast.error('Failed to delete course');
			console.error(error);
		}
	};

	// Toggle visibility
	const toggleVisibility = async (courseId: string, currentVisibility: string): Promise<void> => {
		try {
			const csrfToken = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/csrf-token`)
				.get()
				.json<{ csrfToken: string }>()
				.then((data) => data.csrfToken);

			const newVisibility = currentVisibility === '1' ? '0' : '1';

			await Wretch(`${import.meta.env.VITE_API_BASE_URL}/course/update-visible/${courseId}`)
				.headers({ 'X-CSRF-Token': csrfToken })
				.put({ is_visible: newVisibility })
				.res();

			toast.success(`Course ${newVisibility === '1' ? 'shown' : 'hidden'}`);
			datacourse = datacourse.map((course) =>
				course.course_id === courseId ? { ...course, is_visible: newVisibility } : course
			);
			updateStats();
		} catch (error) {
			toast.error('Failed to update visibility');
			console.error(error);
		}
	};

	// Toggle past event
	const togglepastevent = async (courseId: string, currentStatus: boolean): Promise<void> => {
		try {
			const csrfToken = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/user/csrf-token`)
				.get()
				.json<{ csrfToken: string }>()
				.then((data) => data.csrfToken);

			await Wretch(`${import.meta.env.VITE_API_BASE_URL}/course/update-visible/${courseId}`)
				.headers({ 'X-CSRF-Token': csrfToken })
				.put({ pastevent: !currentStatus })
				.res();

			toast.success('Course status updated');
			datacourse = datacourse.map((course) =>
				course.course_id === courseId ? { ...course, pastevent: !currentStatus } : course
			);
			updateStats();
		} catch (error) {
			toast.error('Failed to update status');
			console.error(error);
		}
	};

	// Logout
	const logout = (): void => {
		localStorage.removeItem('auth');
		window.location.pathname = '/login';
	};

	// Export data
	const exportData = (): void => {
		const BOM = '\uFEFF';
		const headers = 'Student ID,First Name,Last Name,Year,Course,Has Laptop\n';
		const csvContent =
			BOM +
			headers +
			datastudent
				.map((s) => {
					const courseName =
						datacourse.find((c) => c.course_id === s.course_id)?.course_name || 'N/A';
					return `${s.student_id},"${s.fname}","${s.lname}",${s.student_year},"${courseName}",${s.laptop ? 'Yes' : 'No'}`;
				})
				.join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'students.csv';
		a.click();
		toast.success('Data exported successfully');
	};
	// Export data for specific course
	const exportCourseData = (courseId: string, courseName: string): void => {
		const courseStudents = studentsByCourse[courseId] || [];

		// Add UTF-8 BOM for proper Thai character encoding
		const BOM = '\uFEFF';
		const headers = 'Student ID,First Name,Last Name,Year,Has Laptop\n';
		const csvContent =
			BOM +
			headers +
			courseStudents
				.map(
					(s) =>
						`${s.student_id},"${s.fname}","${s.lname}",${s.student_year},${s.laptop ? 'Yes' : 'No'}`
				)
				.join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${courseName.replace(/[^a-zA-Z0-9]/g, '_')}_students.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
		toast.success(`Exported ${courseStudents.length} students for ${courseName}`);
	};

	// Filtered courses
	$: filteredCourses = datacourse.filter((course) => {
		const matchesSearch =
			course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			course.course_lecture.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesFilter =
			selectedFilter.value === 'all' ||
			(selectedFilter.value === 'active' && course.is_visible === '1') ||
			(selectedFilter.value === 'hidden' && course.is_visible === '0') ||
			(selectedFilter.value === 'past' && course.pastevent);
		return matchesSearch && matchesFilter;
	});

	// Group students by course
	$: studentsByCourse = datastudent.reduce<Record<string, Student[]>>((acc, student) => {
		if (!acc[student.course_id]) acc[student.course_id] = [];
		acc[student.course_id].push(student);
		return acc;
	}, {});

	onMount(async () => {
		// Check authentication
		const token = localStorage.getItem('auth');
		if (token) {
			try {
				await Wretch(`${import.meta.env.VITE_API_BASE_URL}/admin/auth`)
					.headers({
						'Content-type': 'application/json',
						Authorization: `Bearer ${token}`
					})
					.post({})
					.res();
				isLoggedIn.set(true);
				isLoading = false;
				fetchCourses();
				fetchStudents();
			} catch {
				window.location.pathname = '/login';
			}
		} else {
			window.location.pathname = '/login';
		}
	});
</script>

{#if $isLoggedIn}
	<div
		class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
	>
		<!-- Header -->
		<header class="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg dark:bg-gray-900/80">
			<div class="container mx-auto px-4">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center gap-8">
						<h1 class="text-2xl font-bold">CS Event Management</h1>
					</div>
					<div class="flex items-center gap-4">
						<Button variant="outline" size="sm" on:click={exportData} class="gap-2">
							<Download class="h-4 w-4" />
							Export
						</Button>
						<Button variant="destructive" size="sm" on:click={logout} class="gap-2">
							<LogOut class="h-4 w-4" />
							Logout
						</Button>
					</div>
				</div>
			</div>
		</header>

		<div class="container mx-auto p-6">
			<!-- Stats Cards -->
			<div class="mb-6 grid gap-4 md:grid-cols-4">
				<Card.Root>
					<Card.Content class="p-6">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-muted-foreground text-sm font-medium">Total Courses</p>
								<p class="text-3xl font-bold">{stats.totalCourses}</p>
							</div>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20"
							>
								<BookOpen class="h-6 w-6 text-blue-600" />
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Content class="p-6">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-muted-foreground text-sm font-medium">Active Courses</p>
								<p class="text-3xl font-bold">{stats.activeCourses}</p>
							</div>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20"
							>
								<Activity class="h-6 w-6 text-green-600" />
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Content class="p-6">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-muted-foreground text-sm font-medium">Total Students</p>
								<p class="text-3xl font-bold">{stats.totalStudents}</p>
							</div>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20"
							>
								<Users class="h-6 w-6 text-purple-600" />
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Content class="p-6">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-muted-foreground text-sm font-medium">Upcoming Events</p>
								<p class="text-3xl font-bold">{stats.upcomingEvents}</p>
							</div>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20"
							>
								<Calendar class="h-6 w-6 text-orange-600" />
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Main Content -->
			<Tabs.Root value="courses" class="space-y-4">
				<Tabs.List class="grid w-full max-w-md grid-cols-2">
					<Tabs.Trigger value="courses">Courses</Tabs.Trigger>
					<Tabs.Trigger value="students">Students</Tabs.Trigger>
				</Tabs.List>

				<!-- Courses Tab -->
				<Tabs.Content value="courses" class="space-y-4">
					<!-- Toolbar -->
					<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div class="flex flex-1 items-center gap-4">
							<div class="relative max-w-sm flex-1">
								<Search
									class="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
								/>
								<Input placeholder="Search courses..." bind:value={searchTerm} class="pl-10" />
							</div>
							<Select.Root bind:selected={selectedFilter}>
								<Select.Trigger class="w-[180px]">
									<Select.Value placeholder="Filter by..." />
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="all" label="All Courses">All Courses</Select.Item>
									<Select.Item value="active" label="Active">Active</Select.Item>
									<Select.Item value="hidden" label="Hidden">Hidden</Select.Item>
									<Select.Item value="past" label="Past Events">Past Events</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
						<div class="flex items-center gap-2">
							<Button
								variant={viewMode === 'grid' ? 'default' : 'outline'}
								size="icon"
								on:click={() => (viewMode = 'grid')}
							>
								<Grid3x3 class="h-4 w-4" />
							</Button>
							<Button
								variant={viewMode === 'list' ? 'default' : 'outline'}
								size="icon"
								on:click={() => (viewMode = 'list')}
							>
								<List class="h-4 w-4" />
							</Button>
							<Dialog.Root>
								<Dialog.Trigger>
									<Button class="gap-2">
										<Plus class="h-4 w-4" />
										Create Course
									</Button>
								</Dialog.Trigger>
								<Dialog.Content class="max-w-2xl">
									<Dialog.Header>
										<Dialog.Title>Create New Course</Dialog.Title>
										<Dialog.Description>
											Fill in the details to create a new course.
										</Dialog.Description>
									</Dialog.Header>
									<div class="grid gap-4 py-4">
										<div class="grid grid-cols-2 gap-4">
											<div class="space-y-2">
												<Label for="name">Course Name</Label>
												<Input id="name" bind:value={newCourse.course_name} />
											</div>
											<div class="space-y-2">
												<Label for="type">Course Type</Label>
												<Input id="type" bind:value={newCourse.course_type} />
											</div>
										</div>
										<div class="grid grid-cols-2 gap-4">
											<div class="space-y-2">
												<Label for="date">Date</Label>
												<Input id="date" type="date" bind:value={newCourse.course_date} />
											</div>
											<div class="space-y-2">
												<Label for="location">Location</Label>
												<Input id="location" bind:value={newCourse.course_location} />
											</div>
										</div>
										<div class="space-y-2">
											<Label for="lecture">Lecturer</Label>
											<Input id="lecture" bind:value={newCourse.course_lecture} />
										</div>
										<div class="space-y-2">
											<Label for="description">Description</Label>
											<Textarea
												id="description"
												bind:value={newCourse.course_description}
												rows={3}
											/>
										</div>
										<div class="grid grid-cols-3 gap-4">
											<div class="flex items-center space-x-2">
												<Switch id="submission" bind:checked={newCourse.is_submissionproject} />
												<Label for="submission">Submission Project</Label>
											</div>
											<div class="flex items-center space-x-2">
												<Switch id="past" bind:checked={newCourse.pastevent} />
												<Label for="past">Past Event</Label>
											</div>
											<div class="flex items-center space-x-2">
												<Switch id="pc" bind:checked={newCourse.is_personalcomputer} />
												<Label for="pc">Requires PC</Label>
											</div>
										</div>
									</div>
									<Dialog.Footer>
										<Button on:click={createCourse}>Create Course</Button>
									</Dialog.Footer>
								</Dialog.Content>
							</Dialog.Root>
						</div>
					</div>

					<!-- Courses Grid/List -->
					{#if viewMode === 'grid'}
						<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{#each filteredCourses as course}
								<Card.Root class="overflow-hidden transition-shadow hover:shadow-lg">
									<Card.Header class="pb-4">
										<div class="flex items-start justify-between">
											<div class="space-y-1">
												<Card.Title class="line-clamp-1">{course.course_name}</Card.Title>
												<div class="flex items-center gap-2">
													<Badge variant={course.is_visible === '1' ? 'default' : 'secondary'}>
														{course.is_visible === '1' ? 'Active' : 'Hidden'}
													</Badge>
													{#if course.pastevent}
														<Badge variant="outline">Past</Badge>
													{/if}
												</div>
											</div>
											<DropdownMenu.Root>
												<DropdownMenu.Trigger>
													<Button variant="ghost" size="icon">
														<MoreVertical class="h-4 w-4" />
													</Button>
												</DropdownMenu.Trigger>
												<DropdownMenu.Content align="end">
													<DropdownMenu.Item
														on:click={() => exportCourseData(course.course_id, course.course_name)}
													>
														<Download class="mr-2 h-4 w-4" />
														Export Students
													</DropdownMenu.Item>
													<DropdownMenu.Separator />
													<DropdownMenu.Item
														on:click={() => toggleVisibility(course.course_id, course.is_visible)}
													>
														{course.is_visible === '1' ? 'Hide' : 'Show'} Course
													</DropdownMenu.Item>
													<DropdownMenu.Item
														on:click={() => togglepastevent(course.course_id, course.pastevent)}
													>
														Mark as {course.pastevent ? 'Upcoming' : 'Past'}
													</DropdownMenu.Item>
													<DropdownMenu.Separator />
													<DropdownMenu.Item
														on:click={() => deleteCourse(course.course_id)}
														class="text-red-600"
													>
														Delete Course
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Root>
										</div>
									</Card.Header>
									<Card.Content class="space-y-2">
										<div class="space-y-2 text-sm">
											<div class="text-muted-foreground flex items-center gap-2">
												<User class="h-3 w-3" />
												<span class="line-clamp-1">{course.course_lecture}</span>
											</div>
											<div class="text-muted-foreground flex items-center gap-2">
												<MapPin class="h-3 w-3" />
												<span class="line-clamp-1">{course.course_location}</span>
											</div>
											<div class="text-muted-foreground flex items-center gap-2">
												<Calendar class="h-3 w-3" />
												<span>{new Date(course.course_date).toLocaleDateString()}</span>
											</div>
										</div>
										{#if studentsByCourse[course.course_id]}
											<div class="border-t pt-2">
												<p class="text-sm font-medium">
													{studentsByCourse[course.course_id].length} students enrolled
												</p>
											</div>
										{/if}
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					{:else}
						<!-- List View -->
						<Card.Root>
							<Card.Content class="p-0">
								<div class="relative overflow-x-auto">
									<table class="w-full text-sm">
										<thead class="bg-muted/50 border-b">
											<tr>
												<th class="p-4 text-left font-medium">Course Name</th>
												<th class="p-4 text-left font-medium">Lecturer</th>
												<th class="p-4 text-left font-medium">Date</th>
												<th class="p-4 text-left font-medium">Location</th>
												<th class="p-4 text-left font-medium">Students</th>
												<th class="p-4 text-left font-medium">Status</th>
												<th class="p-4 text-left font-medium">Actions</th>
											</tr>
										</thead>
										<tbody>
											{#each filteredCourses as course}
												<tr class="hover:bg-muted/50 border-b">
													<td class="p-4 font-medium">{course.course_name}</td>
													<td class="p-4">{course.course_lecture}</td>
													<td class="p-4">{new Date(course.course_date).toLocaleDateString()}</td>
													<td class="p-4">{course.course_location}</td>
													<td class="p-4">{studentsByCourse[course.course_id]?.length || 0}</td>
													<td class="p-4">
														<Badge variant={course.is_visible === '1' ? 'default' : 'secondary'}>
															{course.is_visible === '1' ? 'Active' : 'Hidden'}
														</Badge>
													</td>
													<td class="p-4">
														<DropdownMenu.Root>
															<DropdownMenu.Trigger>
																<Button variant="ghost" size="sm">
																	<MoreVertical class="h-4 w-4" />
																</Button>
															</DropdownMenu.Trigger>
															<DropdownMenu.Content align="end">
																<DropdownMenu.Item
																	on:click={() =>
																		exportCourseData(course.course_id, course.course_name)}
																>
																	<Download class="mr-2 h-4 w-4" />
																	Export
																</DropdownMenu.Item>
																<DropdownMenu.Separator />
																<DropdownMenu.Item
																	on:click={() =>
																		toggleVisibility(course.course_id, course.is_visible)}
																>
																	{course.is_visible === '1' ? 'Hide' : 'Show'}
																</DropdownMenu.Item>
																<DropdownMenu.Item
																	on:click={() =>
																		togglepastevent(course.course_id, course.pastevent)}
																>
																	Mark as {course.pastevent ? 'Upcoming' : 'Past'}
																</DropdownMenu.Item>
																<DropdownMenu.Separator />
																<DropdownMenu.Item
																	on:click={() => deleteCourse(course.course_id)}
																	class="text-red-600"
																>
																	Delete
																</DropdownMenu.Item>
															</DropdownMenu.Content>
														</DropdownMenu.Root>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</Card.Content>
						</Card.Root>
					{/if}
				</Tabs.Content>

				<!-- Students Tab -->
				<Tabs.Content value="students" class="space-y-4">
					<Card.Root>
						<Card.Header>
							<Card.Title>Enrolled Students</Card.Title>
							<Card.Description>
								Total of {datastudent.length} students enrolled across all courses
							</Card.Description>
						</Card.Header>
						<Card.Content>
							<div class="relative overflow-x-auto">
								<table class="w-full text-sm">
									<thead class="bg-muted/50 border-b">
										<tr>
											<th class="p-4 text-left font-medium">Student ID</th>
											<th class="p-4 text-left font-medium">Name</th>
											<th class="p-4 text-left font-medium">Course</th>
											<th class="p-4 text-left font-medium">Year</th>
											<th class="p-4 text-left font-medium">Laptop</th>
										</tr>
									</thead>
									<tbody>
										{#each datastudent.slice(0, 20) as student}
											<tr class="hover:bg-muted/50 border-b">
												<td class="p-4 font-mono">{student.student_id}</td>
												<td class="p-4">{student.fname} {student.lname}</td>
												<td class="p-4">
													{datacourse.find((c) => c.course_id === student.course_id)?.course_name ||
														'N/A'}
												</td>
												<td class="p-4">
													<Badge variant="outline">Year {student.student_year}</Badge>
												</td>
												<td class="p-4">
													{#if student.laptop}
														<Laptop class="h-4 w-4 text-green-600" />
													{:else}
														<span class="text-muted-foreground">-</span>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
								{#if datastudent.length > 20}
									<div class="text-muted-foreground p-4 text-center text-sm">
										Showing 20 of {datastudent.length} students
									</div>
								{/if}
							</div>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</div>
{:else}
	<div class="flex h-screen items-center justify-center">
		<div
			class="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
		></div>
	</div>
{/if}
