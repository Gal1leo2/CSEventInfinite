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
		Activity,
		Archive,
		BookOpen,
		Calendar,
		Check,
		Download,
		Grid3x3,
		Laptop,
		List,
		LogOut,
		MapPin,
		MoreVertical,
		Pencil,
		Plus,
		Search,
		Trash2,
		User,
		Users
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
		location_seats: number;
	}

	// Seats binds as a string through the shared Input component, so it is
	// coerced back to a number right before the request goes out.
	type CourseForm = Omit<Course, 'course_id' | 'location_seats'> & {
		location_seats: number | string;
	};

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
		openCourses: number;
		totalStudents: number;
		upcomingEvents: number;
	}

	const API = import.meta.env.VITE_API_BASE_URL;

	// The five is_visible states the public site understands.
	const VISIBILITY = [
		{
			value: '0',
			label: 'Draft',
			hint: 'Hidden from the public list. Registration blocked.',
			badge: 'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
		},
		{
			value: '1',
			label: 'Open',
			hint: 'Listed publicly with a Register button. Students can enroll.',
			badge: 'border-green-200 bg-green-100 text-green-800 dark:border-green-900 dark:bg-green-900/30 dark:text-green-300'
		},
		{
			value: '2',
			label: 'Closed',
			hint: 'Listed publicly, but marked "Registration Closed".',
			badge: 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-900/30 dark:text-amber-300'
		},
		{
			value: '3',
			label: 'Archived',
			hint: 'Hidden from the main list. Shows under the Past tab.',
			badge: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
		},
		{
			value: '4',
			label: 'Archived (alt)',
			hint: 'Behaves exactly like Archived. Legacy value kept for old rows.',
			badge: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
		}
	];

	const ARCHIVED = '3';
	const ARCHIVED_STATES = ['3', '4'];

	const visibilityMeta = (value: string) =>
		VISIBILITY.find((v) => v.value === String(value)) ?? {
			value: String(value),
			label: `Unknown (${value})`,
			hint: 'Not a value the public site recognises.',
			badge: 'border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-900/30 dark:text-red-300'
		};

	const isArchivedState = (value: string): boolean => ARCHIVED_STATES.includes(String(value));

	// A date counts as past only once its whole day has ended, in local time.
	const isPastDate = (courseDate: string): boolean => {
		const [year, month, day] = (courseDate ?? '').split('T')[0].split('-').map(Number);
		if (!year || !month || !day) return false;
		return new Date(year, month - 1, day, 23, 59, 59, 999).getTime() < Date.now();
	};

	const emptyForm = (): CourseForm => ({
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
		is_personalcomputer: false,
		location_seats: 50
	});

	// State management
	const isLoggedIn = writable<boolean>(false);
	let datacourse: Course[] = [];
	let datastudent: Student[] = [];
	let searchTerm: string = '';
	let selectedFilter = { value: 'all', label: 'All courses' };
	let viewMode: 'grid' | 'list' = 'grid';

	// Course form (shared by create and edit)
	let formOpen = false;
	let formMode: 'create' | 'edit' = 'create';
	let editingId: string | null = null;
	let form: CourseForm = emptyForm();
	let saving = false;
	let touched = false;

	let stats: Stats = {
		totalCourses: 0,
		openCourses: 0,
		totalStudents: 0,
		upcomingEvents: 0
	};

	// CSRF tokens are single-use on the backend, so every mutation fetches a fresh one.
	const csrf = async (): Promise<string> => {
		const res = await Wretch(`${API}/user/csrf-token`).get().json<{ csrfToken: string }>();
		return res.csrfToken;
	};

	// PUT /course/update-visible doubles as the generic partial-update endpoint.
	const patchCourse = async (courseId: string, patch: Record<string, unknown>): Promise<void> => {
		const csrfToken = await csrf();
		await Wretch(`${API}/course/update-visible/${courseId}`)
			.headers({ 'X-CSRF-Token': csrfToken })
			.put(patch)
			.res();
	};

	const fetchCourses = async (): Promise<void> => {
		try {
			datacourse = await Wretch(`${API}/user/getcourse`).get().json<Course[]>();
			updateStats();
			await autoArchivePastCourses();
		} catch (error) {
			toast.error('Failed to fetch courses');
			console.error(error);
		}
	};

	const fetchStudents = async (): Promise<void> => {
		try {
			const token = localStorage.getItem('auth');
			datastudent = await Wretch(`${API}/admin/students`)
				.headers({ Authorization: `Bearer ${token}` })
				.get()
				.json<Student[]>();
			updateStats();
		} catch (error) {
			toast.error('Failed to fetch students');
			console.error(error);
		}
	};

	const updateStats = (): void => {
		stats.totalCourses = datacourse.length;
		stats.openCourses = datacourse.filter((c) => String(c.is_visible) === '1').length;
		stats.totalStudents = datastudent.length;
		stats.upcomingEvents = datacourse.filter(
			(c) => !c.pastevent && !isPastDate(c.course_date)
		).length;
	};

	// Any course whose date has passed is forced to Archived (is_visible = 3).
	const autoArchivePastCourses = async (): Promise<void> => {
		const stale = datacourse.filter(
			(c) => isPastDate(c.course_date) && !isArchivedState(c.is_visible)
		);
		if (stale.length === 0) return;

		const progress = toast.loading(
			`Archiving ${stale.length} past ${stale.length === 1 ? 'course' : 'courses'}…`
		);
		let archived = 0;
		for (const course of stale) {
			try {
				await patchCourse(course.course_id, { is_visible: ARCHIVED });
				datacourse = datacourse.map((c) =>
					c.course_id === course.course_id ? { ...c, is_visible: ARCHIVED } : c
				);
				archived++;
			} catch (error) {
				console.error(`Failed to auto-archive course ${course.course_id}`, error);
			}
		}

		toast.dismiss(progress);
		updateStats();
		if (archived > 0) {
			toast.success(
				`Auto-archived ${archived} past ${archived === 1 ? 'course' : 'courses'} (is_visible → 3)`
			);
		}
		if (archived < stale.length) {
			toast.error(`${stale.length - archived} past ${
				stale.length - archived === 1 ? 'course' : 'courses'
			} could not be archived`);
		}
	};

	const openCreate = (): void => {
		formMode = 'create';
		editingId = null;
		form = emptyForm();
		touched = false;
		formOpen = true;
	};

	const openEdit = (course: Course): void => {
		formMode = 'edit';
		editingId = course.course_id;
		form = {
			course_name: course.course_name ?? '',
			course_type: course.course_type ?? '',
			course_date: (course.course_date ?? '').split('T')[0],
			course_description: course.course_description ?? '',
			course_lecture: course.course_lecture ?? '',
			course_location: course.course_location ?? '',
			course_img: course.course_img ?? '',
			course_team: course.course_team ?? '',
			is_visible: String(course.is_visible ?? '0'),
			is_submissionproject: Boolean(course.is_submissionproject),
			pastevent: Boolean(course.pastevent),
			is_personalcomputer: Boolean(course.is_personalcomputer),
			location_seats: course.location_seats ?? 0
		};
		touched = false;
		formOpen = true;
	};

	const saveCourse = async (): Promise<void> => {
		touched = true;
		if (!isValid) {
			toast.error('Fill in the highlighted fields first');
			return;
		}

		saving = true;
		const payload = {
			...form,
			is_visible: effectiveVisibility,
			location_seats: Number(form.location_seats) || 0
		};

		try {
			if (formMode === 'edit' && editingId) {
				await patchCourse(editingId, payload);
				toast.success('Course updated');
			} else {
				const csrfToken = await csrf();
				const created = await Wretch(`${API}/course/create`)
					.headers({ 'X-CSRF-Token': csrfToken })
					.post(payload)
					.json<Course>();

				// POST /course/create hardcodes is_visible to '0' and ignores
				// location_seats, so those two are written back straight away.
				if (created?.course_id) {
					try {
						await patchCourse(created.course_id, {
							is_visible: payload.is_visible,
							location_seats: payload.location_seats
						});
					} catch (error) {
						console.error(error);
						toast.error('Course created, but visibility and seats did not save. Edit it to retry.');
					}
				}
				toast.success('Course created');
			}

			formOpen = false;
			await fetchCourses();
		} catch (error) {
			toast.error(formMode === 'edit' ? 'Failed to update course' : 'Failed to create course');
			console.error(error);
		} finally {
			saving = false;
		}
	};

	const setVisibility = async (course: Course, value: string): Promise<void> => {
		if (String(course.is_visible) === value) return;
		if (isPastDate(course.course_date) && !isArchivedState(value)) {
			toast.error('This event date has passed. Change the date first to reopen it.');
			return;
		}

		try {
			await patchCourse(course.course_id, { is_visible: value });
			datacourse = datacourse.map((c) =>
				c.course_id === course.course_id ? { ...c, is_visible: value } : c
			);
			updateStats();
			toast.success(`Visibility set to ${value} · ${visibilityMeta(value).label}`);
		} catch (error) {
			toast.error('Failed to update visibility');
			console.error(error);
		}
	};

	const togglePastFlag = async (course: Course): Promise<void> => {
		try {
			await patchCourse(course.course_id, { pastevent: !course.pastevent });
			datacourse = datacourse.map((c) =>
				c.course_id === course.course_id ? { ...c, pastevent: !course.pastevent } : c
			);
			updateStats();
			toast.success('Course status updated');
		} catch (error) {
			toast.error('Failed to update status');
			console.error(error);
		}
	};

	const deleteCourse = async (course: Course): Promise<void> => {
		if (!confirm(`Delete "${course.course_name}"? This also removes its enrolled students.`)) return;

		try {
			const csrfToken = await csrf();
			await Wretch(`${API}/course/delete/${course.course_id}`)
				.headers({ 'X-CSRF-Token': csrfToken })
				.delete()
				.res();

			toast.success('Course deleted successfully');
			await fetchCourses();
		} catch (error) {
			toast.error('Failed to delete course');
			console.error(error);
		}
	};

	const logout = (): void => {
		localStorage.removeItem('auth');
		window.location.pathname = '/login';
	};

	const downloadCsv = (filename: string, headers: string, rows: string[]): void => {
		const BOM = '\uFEFF';
		const blob = new Blob([BOM + headers + rows.join('\n')], {
			type: 'text/csv;charset=utf-8;'
		});
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	const exportData = (): void => {
		downloadCsv(
			'students.csv',
			'Student ID,First Name,Last Name,Year,Course,Has Laptop\n',
			datastudent.map((s) => {
				const courseName =
					datacourse.find((c) => c.course_id === s.course_id)?.course_name || 'N/A';
				return `${s.student_id},"${s.fname}","${s.lname}",${s.student_year},"${courseName}",${s.laptop ? 'Yes' : 'No'}`;
			})
		);
		toast.success('Data exported successfully');
	};

	const exportCourseData = (courseId: string, courseName: string): void => {
		const courseStudents = studentsByCourse[courseId] || [];
		downloadCsv(
			`${courseName.replace(/[^a-zA-Z0-9]/g, '_')}_students.csv`,
			'Student ID,First Name,Last Name,Year,Has Laptop\n',
			courseStudents.map(
				(s) =>
					`${s.student_id},"${s.fname}","${s.lname}",${s.student_year},${s.laptop ? 'Yes' : 'No'}`
			)
		);
		toast.success(`Exported ${courseStudents.length} students for ${courseName}`);
	};

	// A past date locks the form to Archived. Derived rather than written back
	// into `form`, so there is no cyclical reactive dependency.
	$: formDatePast = isPastDate(form.course_date);
	$: effectiveVisibility =
		formDatePast && !isArchivedState(form.is_visible) ? ARCHIVED : form.is_visible;

	$: errors = {
		course_name: form.course_name.trim() ? '' : 'Course name is required',
		course_type: form.course_type.trim() ? '' : 'Course type is required',
		course_date: form.course_date ? '' : 'Date is required',
		course_lecture: form.course_lecture.trim() ? '' : 'Lecturer is required',
		course_location: form.course_location.trim() ? '' : 'Location is required',
		location_seats: Number(form.location_seats) > 0 ? '' : 'Seats must be at least 1'
	};
	$: isValid = Object.values(errors).every((message) => !message);

	$: filteredCourses = datacourse.filter((course) => {
		const needle = searchTerm.toLowerCase();
		const matchesSearch =
			!needle ||
			[course.course_name, course.course_lecture, course.course_team, course.course_type]
				.filter(Boolean)
				.some((field) => String(field).toLowerCase().includes(needle));

		const filter = selectedFilter.value;
		const matchesFilter =
			filter === 'all' ||
			(filter === 'past' && (isPastDate(course.course_date) || course.pastevent)) ||
			(filter === 'archived' && isArchivedState(course.is_visible)) ||
			(['0', '1', '2'].includes(filter) && String(course.is_visible) === filter);

		return matchesSearch && matchesFilter;
	});

	$: studentsByCourse = datastudent.reduce<Record<string, Student[]>>((acc, student) => {
		if (!acc[student.course_id]) acc[student.course_id] = [];
		acc[student.course_id].push(student);
		return acc;
	}, {});

	onMount(async () => {
		const token = localStorage.getItem('auth');
		if (token) {
			try {
				await Wretch(`${API}/admin/auth`)
					.headers({
						'Content-type': 'application/json',
						Authorization: `Bearer ${token}`
					})
					.post({})
					.res();
				isLoggedIn.set(true);
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
					<h1 class="text-2xl font-bold">CS Event Management</h1>
					<div class="flex items-center gap-2">
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
								<p class="text-muted-foreground text-sm font-medium">Open for Registration</p>
								<p class="text-3xl font-bold">{stats.openCourses}</p>
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
								<Input
									placeholder="Search name, lecturer, team…"
									bind:value={searchTerm}
									class="pl-10"
								/>
							</div>
							<Select.Root bind:selected={selectedFilter}>
								<Select.Trigger class="w-[190px]">
									<Select.Value placeholder="Filter by…" />
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="all" label="All courses">All courses</Select.Item>
									<Select.Item value="0" label="0 · Draft">0 · Draft</Select.Item>
									<Select.Item value="1" label="1 · Open">1 · Open</Select.Item>
									<Select.Item value="2" label="2 · Closed">2 · Closed</Select.Item>
									<Select.Item value="archived" label="3/4 · Archived">3/4 · Archived</Select.Item>
									<Select.Item value="past" label="Past events">Past events</Select.Item>
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
							<Button class="gap-2" on:click={openCreate}>
								<Plus class="h-4 w-4" />
								New Course
							</Button>
						</div>
					</div>

					{#if filteredCourses.length === 0}
						<Card.Root>
							<Card.Content class="flex flex-col items-center justify-center gap-2 p-12 text-center">
								<BookOpen class="text-muted-foreground/40 h-12 w-12" />
								<p class="font-medium">No courses match this filter</p>
								<p class="text-muted-foreground text-sm">
									Try a different filter, or create a new course.
								</p>
							</Card.Content>
						</Card.Root>
					{:else if viewMode === 'grid'}
						<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{#each filteredCourses as course (course.course_id)}
								{@const meta = visibilityMeta(course.is_visible)}
								<Card.Root class="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
									{#if course.course_img}
										<img
											src={course.course_img}
											alt=""
											class="bg-muted h-32 w-full object-cover"
											loading="lazy"
										/>
									{/if}
									<Card.Header class="pb-4">
										<div class="flex items-start justify-between gap-2">
											<div class="min-w-0 space-y-1">
												<Card.Title class="line-clamp-2 text-base">{course.course_name}</Card.Title>
												<div class="flex flex-wrap items-center gap-1.5">
													<Badge variant="outline" class={meta.badge}>
														{course.is_visible} · {meta.label}
													</Badge>
													{#if isPastDate(course.course_date)}
														<Badge variant="outline" class="gap-1">
															<Archive class="h-3 w-3" />
															Past
														</Badge>
													{/if}
													{#if course.course_type}
														<Badge variant="secondary">{course.course_type}</Badge>
													{/if}
												</div>
											</div>
											<DropdownMenu.Root>
												<DropdownMenu.Trigger>
													<Button variant="ghost" size="icon">
														<MoreVertical class="h-4 w-4" />
													</Button>
												</DropdownMenu.Trigger>
												<DropdownMenu.Content align="end" class="w-60">
													<DropdownMenu.Item on:click={() => openEdit(course)}>
														<Pencil class="mr-2 h-4 w-4" />
														Edit course
													</DropdownMenu.Item>
													<DropdownMenu.Item
														on:click={() => exportCourseData(course.course_id, course.course_name)}
													>
														<Download class="mr-2 h-4 w-4" />
														Export students
													</DropdownMenu.Item>
													<DropdownMenu.Separator />
													<DropdownMenu.Label>Visibility</DropdownMenu.Label>
													{#each VISIBILITY as option}
														<DropdownMenu.Item
															disabled={isPastDate(course.course_date) &&
																!isArchivedState(option.value)}
															on:click={() => setVisibility(course, option.value)}
														>
															<span class="mr-2 flex h-4 w-4 items-center justify-center">
																{#if String(course.is_visible) === option.value}
																	<Check class="h-4 w-4" />
																{/if}
															</span>
															{option.value} · {option.label}
														</DropdownMenu.Item>
													{/each}
													{#if isPastDate(course.course_date)}
														<p class="text-muted-foreground px-2 py-1.5 text-xs">
															Date has passed — change the date to reopen.
														</p>
													{/if}
													<DropdownMenu.Separator />
													<DropdownMenu.Item on:click={() => togglePastFlag(course)}>
														Mark as {course.pastevent ? 'upcoming' : 'past'}
													</DropdownMenu.Item>
													<DropdownMenu.Separator />
													<DropdownMenu.Item
														on:click={() => deleteCourse(course)}
														class="text-red-600"
													>
														<Trash2 class="mr-2 h-4 w-4" />
														Delete course
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Root>
										</div>
									</Card.Header>
									<Card.Content class="mt-auto space-y-2">
										<div class="space-y-2 text-sm">
											<div class="text-muted-foreground flex items-center gap-2">
												<User class="h-3 w-3 shrink-0" />
												<span class="line-clamp-1">{course.course_lecture}</span>
											</div>
											<div class="text-muted-foreground flex items-center gap-2">
												<MapPin class="h-3 w-3 shrink-0" />
												<span class="line-clamp-1">{course.course_location}</span>
											</div>
											<div class="text-muted-foreground flex items-center gap-2">
												<Calendar class="h-3 w-3 shrink-0" />
												<span>{new Date(course.course_date).toLocaleDateString()}</span>
											</div>
										</div>
										<div class="flex items-center justify-between border-t pt-2 text-sm">
											<span class="font-medium">
												{studentsByCourse[course.course_id]?.length || 0}/{course.location_seats} enrolled
											</span>
											<div class="text-muted-foreground flex items-center gap-2">
												{#if course.is_personalcomputer}
													<Laptop class="h-4 w-4" />
												{/if}
												{#if course.is_submissionproject}
													<Badge variant="outline" class="text-xs">Project</Badge>
												{/if}
											</div>
										</div>
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
												<th class="p-4 text-left font-medium">Visibility</th>
												<th class="p-4 text-left font-medium">Actions</th>
											</tr>
										</thead>
										<tbody>
											{#each filteredCourses as course (course.course_id)}
												{@const meta = visibilityMeta(course.is_visible)}
												<tr class="hover:bg-muted/50 border-b">
													<td class="p-4 font-medium">{course.course_name}</td>
													<td class="p-4">{course.course_lecture}</td>
													<td class="p-4 whitespace-nowrap">
														{new Date(course.course_date).toLocaleDateString()}
													</td>
													<td class="p-4">{course.course_location}</td>
													<td class="p-4 whitespace-nowrap">
														{studentsByCourse[course.course_id]?.length || 0}/{course.location_seats}
													</td>
													<td class="p-4">
														<Badge variant="outline" class={meta.badge}>
															{course.is_visible} · {meta.label}
														</Badge>
													</td>
													<td class="p-4">
														<DropdownMenu.Root>
															<DropdownMenu.Trigger>
																<Button variant="ghost" size="sm">
																	<MoreVertical class="h-4 w-4" />
																</Button>
															</DropdownMenu.Trigger>
															<DropdownMenu.Content align="end" class="w-60">
																<DropdownMenu.Item on:click={() => openEdit(course)}>
																	<Pencil class="mr-2 h-4 w-4" />
																	Edit course
																</DropdownMenu.Item>
																<DropdownMenu.Item
																	on:click={() =>
																		exportCourseData(course.course_id, course.course_name)}
																>
																	<Download class="mr-2 h-4 w-4" />
																	Export students
																</DropdownMenu.Item>
																<DropdownMenu.Separator />
																<DropdownMenu.Label>Visibility</DropdownMenu.Label>
																{#each VISIBILITY as option}
																	<DropdownMenu.Item
																		disabled={isPastDate(course.course_date) &&
																			!isArchivedState(option.value)}
																		on:click={() => setVisibility(course, option.value)}
																	>
																		<span class="mr-2 flex h-4 w-4 items-center justify-center">
																			{#if String(course.is_visible) === option.value}
																				<Check class="h-4 w-4" />
																			{/if}
																		</span>
																		{option.value} · {option.label}
																	</DropdownMenu.Item>
																{/each}
																{#if isPastDate(course.course_date)}
																	<p class="text-muted-foreground px-2 py-1.5 text-xs">
																		Date has passed — change the date to reopen.
																	</p>
																{/if}
																<DropdownMenu.Separator />
																<DropdownMenu.Item on:click={() => togglePastFlag(course)}>
																	Mark as {course.pastevent ? 'upcoming' : 'past'}
																</DropdownMenu.Item>
																<DropdownMenu.Separator />
																<DropdownMenu.Item
																	on:click={() => deleteCourse(course)}
																	class="text-red-600"
																>
																	<Trash2 class="mr-2 h-4 w-4" />
																	Delete course
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

	<!-- Create / Edit course -->
	<Dialog.Root bind:open={formOpen}>
		<Dialog.Content class="max-h-[90vh] max-w-3xl overflow-y-auto">
			<Dialog.Header>
				<Dialog.Title>
					{formMode === 'edit' ? 'Edit course' : 'Create new course'}
				</Dialog.Title>
				<Dialog.Description>
					Every column on the course record is editable here.
				</Dialog.Description>
			</Dialog.Header>

			<div class="grid gap-6 py-2">
				<!-- Basics -->
				<div class="space-y-4">
					<h3 class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
						Basics
					</h3>
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="name">Course name <span class="text-red-500">*</span></Label>
							<Input id="name" bind:value={form.course_name} placeholder="Intro to Something" />
							{#if touched && errors.course_name}
								<p class="text-xs text-red-500">{errors.course_name}</p>
							{/if}
						</div>
						<div class="space-y-2">
							<Label for="type">Course type <span class="text-red-500">*</span></Label>
							<Input
								id="type"
								bind:value={form.course_type}
								list="course-types"
								placeholder="Web Development"
							/>
							<datalist id="course-types">
								{#each [...new Set(datacourse.map((c) => c.course_type).filter(Boolean))] as type}
									<option value={type}></option>
								{/each}
							</datalist>
							{#if touched && errors.course_type}
								<p class="text-xs text-red-500">{errors.course_type}</p>
							{/if}
						</div>
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="date">Date <span class="text-red-500">*</span></Label>
							<Input id="date" type="date" bind:value={form.course_date} />
							{#if touched && errors.course_date}
								<p class="text-xs text-red-500">{errors.course_date}</p>
							{/if}
						</div>
						<div class="space-y-2">
							<Label for="seats">Seats <span class="text-red-500">*</span></Label>
							<Input id="seats" type="number" min="1" bind:value={form.location_seats} />
							{#if touched && errors.location_seats}
								<p class="text-xs text-red-500">{errors.location_seats}</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- People and place -->
				<div class="space-y-4">
					<h3 class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
						People &amp; place
					</h3>
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="lecture">Lecturer <span class="text-red-500">*</span></Label>
							<Input id="lecture" bind:value={form.course_lecture} placeholder="Name [Nickname]" />
							{#if touched && errors.course_lecture}
								<p class="text-xs text-red-500">{errors.course_lecture}</p>
							{/if}
						</div>
						<div class="space-y-2">
							<Label for="team">Team</Label>
							<Input
								id="team"
								bind:value={form.course_team}
								list="course-teams"
								placeholder="CS DEV"
							/>
							<datalist id="course-teams">
								{#each [...new Set(datacourse.map((c) => c.course_team).filter(Boolean))] as team}
									<option value={team}></option>
								{/each}
							</datalist>
						</div>
					</div>
					<div class="space-y-2">
						<Label for="location">Location <span class="text-red-500">*</span></Label>
						<Input id="location" bind:value={form.course_location} placeholder="224 อาคารจุฬาภรณ์" />
						{#if touched && errors.course_location}
							<p class="text-xs text-red-500">{errors.course_location}</p>
						{/if}
					</div>
				</div>

				<!-- Content -->
				<div class="space-y-4">
					<h3 class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
						Content
					</h3>
					<div class="space-y-2">
						<Label for="img">Cover image URL</Label>
						<Input id="img" bind:value={form.course_img} placeholder="https://…" />
						{#if form.course_img}
							<img
								src={form.course_img}
								alt="Cover preview"
								class="bg-muted h-32 w-full rounded-md border object-cover"
							/>
						{/if}
					</div>
					<div class="space-y-2">
						<Label for="description">Description (Markdown)</Label>
						<Textarea id="description" bind:value={form.course_description} rows={6} />
					</div>
				</div>

				<!-- Options -->
				<div class="space-y-4">
					<h3 class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
						Options
					</h3>
					<div class="grid gap-4 sm:grid-cols-3">
						<div class="flex items-center space-x-2">
							<Switch id="submission" bind:checked={form.is_submissionproject} />
							<Label for="submission">Submission project</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Switch id="pc" bind:checked={form.is_personalcomputer} />
							<Label for="pc">Requires own laptop</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Switch id="past" bind:checked={form.pastevent} />
							<Label for="past">Past event</Label>
						</div>
					</div>
				</div>

				<!-- Visibility -->
				<div class="space-y-3">
					<h3 class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
						Visibility (is_visible)
					</h3>
					<div class="grid gap-2 sm:grid-cols-5">
						{#each VISIBILITY as option}
							{@const locked = formDatePast && !isArchivedState(option.value)}
							<button
								type="button"
								disabled={locked}
								on:click={() => (form.is_visible = option.value)}
								class="flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 {effectiveVisibility ===
								option.value
									? 'border-primary ring-primary bg-primary/5 ring-1'
									: 'hover:bg-muted'}"
							>
								<span class="text-muted-foreground font-mono text-xs">{option.value}</span>
								<span class="text-sm font-medium">{option.label}</span>
							</button>
						{/each}
					</div>
					<p class="text-muted-foreground text-sm">{visibilityMeta(effectiveVisibility).hint}</p>
					{#if formDatePast}
						<p
							class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-300"
						>
							This date has already passed, so visibility is locked to Archived. Pick a future date to
							open registration.
						</p>
					{/if}
				</div>
			</div>

			<Dialog.Footer class="gap-2">
				<Button variant="outline" on:click={() => (formOpen = false)} disabled={saving}>
					Cancel
				</Button>
				<Button on:click={saveCourse} disabled={saving}>
					{#if saving}
						Saving…
					{:else}
						{formMode === 'edit' ? 'Save changes' : 'Create course'}
					{/if}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<div class="flex h-screen items-center justify-center">
		<div
			class="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
		></div>
	</div>
{/if}
