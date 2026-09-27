<script lang="ts">
	import {
		BookOpen,
		CalendarCheck,
		CalendarDays,
		CircleAlert,
		DoorClosed,
		DoorOpen,
		Laptop,
		LoaderCircle,
		Lock,
		LogOut,
		Mic,
		RotateCw,
		Search,
		Tag,
		Users,
		UsersRound
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Wretch from 'wretch';
	import { API, adminToken, csrf, getErrorMessage } from '$lib/api';
	import {
		courseStatus,
		flag,
		formatCourseDate,
		isPastDate,
		parseCourseDate,
		type Course
	} from '$lib/course';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Input } from '$lib/components/ui/input/index.js';
	import BrandMark from '$lib/components/site/BrandMark.svelte';
	import StatusPill from '$lib/components/site/StatusPill.svelte';

	interface Student {
		id: string | number;
		student_id: string;
		// /admin/students sends fname/lname; the retired /user/getuser sent Fname/Lname.
		fname?: string;
		lname?: string;
		Fname?: string;
		Lname?: string;
		course_id: string;
		laptop: boolean | string | number;
		student_year?: number | string | null;
	}

	interface StudentRow {
		key: string;
		studentId: string;
		name: string;
		courseId: string;
		courseName: string;
		year: string;
		laptop: boolean;
	}

	type Visibility = '1' | '2';

	let loggedIn = false;
	let token = '';

	let students: Student[] = [];
	let courses: Course[] = [];
	let isLoading = true;
	let loadError = '';

	let tab: string | undefined = 'courses';
	let search = '';
	let pending: Record<string, boolean> = {};

	let rosterOpen = false;
	let rosterCourse: Course | null = null;

	// ---------------------------------------------------------------- data

	// The public /user/getuser route no longer exists, so read enrollments through the
	// signed-in admin endpoint, the same one /dev uses.
	async function fetchStudents(): Promise<Student[]> {
		return Wretch(`${API}/admin/students`)
			.headers({ Authorization: `Bearer ${token}` })
			.get()
			.json<Student[]>();
	}

	async function fetchCourses(): Promise<Course[]> {
		const csrfToken = await csrf();
		return Wretch(`${API}/user/getcourse`)
			.headers({ 'X-CSRF-Token': csrfToken })
			.get()
			.json<Course[]>();
	}

	async function load() {
		isLoading = true;
		loadError = '';
		try {
			const [studentList, courseList] = await Promise.all([fetchStudents(), fetchCourses()]);
			students = studentList;
			courses = courseList;
		} catch (err) {
			loadError = getErrorMessage(err);
		} finally {
			isLoading = false;
		}
	}

	const logout = () => {
		localStorage.removeItem('auth');
		window.location.pathname = '/login';
	};

	// ---------------------------------------------------------------- helpers

	// The first two digits of a student ID are the Thai (BE) entry year, e.g. 67 = 2567.
	// The academic year rolls over in July.
	function yearFromId(studentId: string): string {
		const prefix = String(studentId ?? '').match(/^\d{2}/);
		if (!prefix) return 'Unknown';
		const entry = Number(prefix[0]);
		const now = new Date();
		const currentBE = (now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1) + 543;
		const year = ((currentBE % 100) - entry + 100) % 100 + 1;
		return year >= 1 && year <= 8 ? String(year) : 'Unknown';
	}

	// Prefer the year the student entered at enrollment. The form's "อื่นๆ" choice is stored as 5.
	function studentYear(student: Student): string {
		const stored = Number(student.student_year);
		if (student.student_year != null && student.student_year !== '' && stored > 0) {
			return stored === 5 ? 'Other' : String(stored);
		}
		return yearFromId(student.student_id);
	}

	const canToggle = (course: Course): boolean =>
		['1', '2'].includes(String(course.is_visible)) && !isPastDate(course.course_date);

	function lockReason(course: Course): string {
		const visible = String(course.is_visible);
		if (visible === '0') return 'Draft course';
		if (visible === '3' || visible === '4') return 'Archived';
		if (isPastDate(course.course_date)) return 'Date has passed';
		return 'Unknown state';
	}

	async function toggleRegistration(course: Course) {
		const id = String(course.course_id);
		if (!canToggle(course) || pending[id]) return;

		const next: Visibility = String(course.is_visible) === '1' ? '2' : '1';
		pending = { ...pending, [id]: true };

		try {
			const csrfToken = await csrf();
			await Wretch(`${API}/course/update-visible/${id}`)
				.headers({
					'X-CSRF-Token': csrfToken,
					Authorization: `Bearer ${token}`
				})
				.put({ is_visible: next })
				.res();

			courses = courses.map((c) => (String(c.course_id) === id ? { ...c, is_visible: next } : c));
			toast.success(
				next === '1'
					? `Registration opened for ${course.course_name}`
					: `Registration closed for ${course.course_name}`
			);
		} catch (err) {
			console.error(err);
			toast.error(`Couldn't update registration for ${course.course_name}`);
		} finally {
			pending = { ...pending, [id]: false };
		}
	}

	function openRoster(course: Course) {
		rosterCourse = course;
		rosterOpen = true;
	}

	// ---------------------------------------------------------------- derived

	$: courseById = new Map(courses.map((c) => [String(c.course_id), c]));

	$: rows = students.map(
		(s, i): StudentRow => ({
			key: `${s.id ?? i}-${s.course_id}`,
			studentId: String(s.student_id ?? ''),
			name: [s.fname ?? s.Fname, s.lname ?? s.Lname].filter(Boolean).join(' '),
			courseId: String(s.course_id),
			courseName: courseById.get(String(s.course_id))?.course_name ?? 'Unknown course',
			year: studentYear(s),
			laptop: flag(s.laptop)
		})
	);

	$: enrolledCount = rows.reduce<Record<string, number>>((acc, row) => {
		acc[row.courseId] = (acc[row.courseId] ?? 0) + 1;
		return acc;
	}, {});

	// Newest course first.
	$: sortedCourses = [...courses].sort(
		(a, b) =>
			(parseCourseDate(b.course_date)?.getTime() ?? 0) -
			(parseCourseDate(a.course_date)?.getTime() ?? 0)
	);

	$: openCount = courses.filter((c) => courseStatus(c) === 'open').length;

	$: needle = search.trim().toLowerCase();
	$: filteredRows = needle
		? rows.filter(
				(row) => row.name.toLowerCase().includes(needle) || row.studentId.includes(needle)
			)
		: rows;

	$: rosterRows = rosterCourse
		? rows
				.filter((row) => row.courseId === String(rosterCourse?.course_id))
				.sort((a, b) => a.studentId.localeCompare(b.studentId))
		: [];

	$: stats = [
		{ label: 'Courses', value: courses.length, icon: BookOpen },
		{ label: 'Open courses', value: openCount, icon: CalendarCheck },
		{ label: 'Students', value: students.length, icon: UsersRound }
	];

	// ---------------------------------------------------------------- auth

	onMount(async () => {
		const stored = adminToken();
		if (!stored) {
			window.location.pathname = '/login';
			return;
		}

		try {
			await Wretch(`${API}/admin/auth`)
				.headers({
					'Content-type': 'application/json',
					Authorization: `Bearer ${stored}`
				})
				.post({})
				.res();
		} catch {
			window.location.pathname = '/login';
			return;
		}

		token = stored;
		loggedIn = true;
		load();
	});
</script>

<svelte:head>
	<title>Staff console · CSEvent</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if loggedIn}
	<div class="min-h-screen bg-background">
		<header
			class="sticky top-0 z-40 border-b border-charcoal-900/[0.06] bg-white/90 backdrop-blur-xl"
		>
			<div class="h-[3px] bg-brand-500"></div>
			<div class="container flex h-16 items-center justify-between gap-4">
				<BrandMark href="/forcoursestaff" subtitle="Staff console" />
				<button
					type="button"
					on:click={logout}
					class="inline-flex items-center gap-2 rounded-xl border border-charcoal-900/15 px-3.5 py-2 text-sm font-semibold text-charcoal-900 transition hover:border-charcoal-900/30 hover:bg-charcoal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<LogOut class="h-4 w-4" />
					Log out
				</button>
			</div>
		</header>

		<main class="container space-y-8 pb-20 pt-8 sm:pt-10">
			<div class="animate-fade-up">
				<p class="text-sm font-semibold text-brand-700">
					// Staff console
				</p>
				<h1
					class="mt-2 font-display text-3xl font-bold tracking-tight text-charcoal-950 sm:text-4xl"
				>
					Courses &amp; enrollments
				</h1>
				<p class="mt-2 text-charcoal-600">
					Open or close registration and see who has signed up for each course.
				</p>
			</div>

			<!-- Stats -->
			<dl class="grid grid-cols-3 gap-3 sm:gap-4">
				{#each stats as stat}
					<div
						class="flex items-center gap-4 rounded-2xl border border-charcoal-900/10 bg-card p-4 shadow-sm sm:p-5"
					>
						<span
							class="hidden h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 sm:grid"
						>
							<svelte:component this={stat.icon} class="h-5 w-5" />
						</span>
						<div class="min-w-0">
							<dt class="text-xs font-medium text-charcoal-600 sm:text-sm">{stat.label}</dt>
							<dd
								class="mt-0.5 font-display text-2xl font-bold tabular-nums text-charcoal-950 sm:text-3xl"
							>
								{#if isLoading}
									<span class="inline-block h-7 w-10 animate-pulse rounded-md bg-charcoal-100"></span>
								{:else}
									{stat.value.toLocaleString()}
								{/if}
							</dd>
						</div>
					</div>
				{/each}
			</dl>

			{#if loadError}
				<div
					role="alert"
					class="flex flex-col items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-6 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="flex min-w-0 gap-3">
						<CircleAlert class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
						<div class="min-w-0">
							<p class="font-semibold text-red-900">We couldn't load courses and students</p>
							<p class="mt-1 break-words text-sm text-red-800">{loadError}</p>
						</div>
					</div>
					<button
						type="button"
						on:click={load}
						class="inline-flex shrink-0 items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
					>
						<RotateCw class="h-4 w-4" />
						Try again
					</button>
				</div>
			{:else}
				<Tabs.Root bind:value={tab} class="space-y-5">
					<Tabs.List
						class="h-auto rounded-full border border-charcoal-900/10 bg-card p-1 shadow-sm"
					>
						{#each [{ value: 'courses', label: 'Courses', count: courses.length }, { value: 'students', label: 'Students', count: students.length }] as item}
							<Tabs.Trigger
								value={item.value}
								class="gap-2 rounded-full px-4 py-2 text-charcoal-600 hover:text-charcoal-950 data-[state=active]:bg-charcoal-950 data-[state=active]:text-white data-[state=active]:shadow"
							>
								{item.label}
								{#if !isLoading}
									<span
										class="rounded-full px-1.5 font-mono text-[11px] {tab === item.value
											? 'bg-brand-500 text-charcoal-950'
											: 'bg-charcoal-100 text-charcoal-600'}">{item.count}</span
									>
								{/if}
							</Tabs.Trigger>
						{/each}
					</Tabs.List>

					<!-- Courses -->
					<Tabs.Content value="courses" class="mt-0">
						<div
							class="overflow-hidden rounded-2xl border border-charcoal-900/10 bg-card shadow-sm"
						>
							{#if isLoading}
								<ul class="divide-y divide-charcoal-900/[0.07]" aria-busy="true">
									{#each Array(4) as _}
										<li class="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
											<div class="space-y-2.5">
												<div class="h-5 w-16 animate-pulse rounded-full bg-charcoal-100"></div>
												<div class="h-5 w-2/3 animate-pulse rounded bg-charcoal-100"></div>
												<div class="h-4 w-1/2 animate-pulse rounded bg-charcoal-100"></div>
											</div>
											<div class="flex gap-2">
												<div class="h-10 w-32 animate-pulse rounded-xl bg-charcoal-100"></div>
												<div class="h-10 w-40 animate-pulse rounded-xl bg-charcoal-100"></div>
											</div>
										</li>
									{/each}
								</ul>
							{:else if sortedCourses.length === 0}
								<div class="flex flex-col items-center px-6 py-16 text-center">
									<span
										class="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700"
									>
										<BookOpen class="h-6 w-6" />
									</span>
									<p class="mt-5 font-display text-xl font-semibold text-charcoal-950">
										No courses yet
									</p>
									<p class="mt-2 max-w-md text-charcoal-600">
										Courses created by an admin will show up here.
									</p>
								</div>
							{:else}
								<ul class="divide-y divide-charcoal-900/[0.07]">
									{#each sortedCourses as course (course.course_id)}
										{@const id = String(course.course_id)}
										{@const toggleable = canToggle(course)}
										{@const isOpen = String(course.is_visible) === '1'}
										{@const count = enrolledCount[id] ?? 0}
										<li
											class="grid gap-4 p-4 transition-colors hover:bg-charcoal-50/60 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
										>
											<div class="min-w-0">
												<StatusPill status={courseStatus(course)} />
												<p class="mt-2 break-words font-semibold leading-snug text-charcoal-950">
													{course.course_name}
												</p>
												<div
													class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-charcoal-600"
												>
													<span class="inline-flex items-center gap-1.5">
														<CalendarDays class="h-3.5 w-3.5 shrink-0 text-brand-600" />
														{formatCourseDate(course.course_date)}
													</span>
													{#if course.course_type}
														<span class="inline-flex items-center gap-1.5">
															<Tag class="h-3.5 w-3.5 shrink-0 text-brand-600" />
															{course.course_type}
														</span>
													{/if}
													{#if course.course_lecture}
														<span class="inline-flex min-w-0 items-center gap-1.5">
															<Mic class="h-3.5 w-3.5 shrink-0 text-brand-600" />
															<span class="truncate">{course.course_lecture}</span>
														</span>
													{/if}
													<span class="inline-flex items-center gap-1.5">
														<Users class="h-3.5 w-3.5 shrink-0 text-brand-600" />
														<span
															><span class="font-mono font-semibold text-charcoal-950">{count}</span>
															enrolled</span
														>
													</span>
												</div>
											</div>

											<div class="flex flex-wrap items-start gap-2 md:justify-end">
												<button
													type="button"
													on:click={() => openRoster(course)}
													class="inline-flex h-10 whitespace-nowrap flex-1 items-center justify-center gap-2 rounded-xl border border-charcoal-900/15 px-4 text-sm font-semibold text-charcoal-900 transition hover:border-charcoal-900/30 hover:bg-charcoal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-none"
												>
													<Users class="h-4 w-4" />
													View students
												</button>

												{#if toggleable}
													<button
														type="button"
														on:click={() => toggleRegistration(course)}
														disabled={pending[id]}
														class="inline-flex h-10 whitespace-nowrap flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 sm:w-48 sm:flex-none {isOpen
															? 'border border-charcoal-900/15 text-charcoal-900 hover:border-charcoal-900/30 hover:bg-charcoal-50'
															: 'bg-brand-500 text-charcoal-950 hover:bg-brand-400'}"
													>
														{#if pending[id]}
															<LoaderCircle class="h-4 w-4 animate-spin" />
															Saving…
														{:else if isOpen}
															<DoorClosed class="h-4 w-4" />
															Close registration
														{:else}
															<DoorOpen class="h-4 w-4" />
															Open registration
														{/if}
													</button>
												{:else}
													<div class="flex flex-1 flex-col items-center sm:w-48 sm:flex-none">
														<button
															type="button"
															disabled
															aria-describedby="lock-{id}"
															class="inline-flex h-10 whitespace-nowrap w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-dashed border-charcoal-900/15 px-4 text-sm font-semibold text-charcoal-400"
														>
															<Lock class="h-4 w-4" />
															Registration locked
														</button>
														<span id="lock-{id}" class="mt-1 text-xs text-charcoal-500"
															>{lockReason(course)}</span
														>
													</div>
												{/if}
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</Tabs.Content>

					<!-- Students -->
					<Tabs.Content value="students" class="mt-0">
						<div
							class="overflow-hidden rounded-2xl border border-charcoal-900/10 bg-card shadow-sm"
						>
							<div
								class="flex flex-col gap-3 border-b border-charcoal-900/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
							>
								<div class="relative w-full sm:max-w-sm">
									<Search
										class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
									/>
									<Input
										type="search"
										bind:value={search}
										placeholder="Search by name or student ID"
										aria-label="Search students by name or student ID"
										class="h-10 pl-9"
									/>
								</div>
								{#if !isLoading}
									<p class="text-sm text-charcoal-500">
										Showing <span class="font-mono font-semibold text-charcoal-950"
											>{filteredRows.length}</span
										>
										of <span class="font-mono">{rows.length}</span>
									</p>
								{/if}
							</div>

							<div class="overflow-x-auto">
								<table class="w-full min-w-[640px] text-left text-sm">
									<thead class="bg-charcoal-50 text-charcoal-600">
										<tr>
											<th scope="col" class="whitespace-nowrap px-5 py-3 font-semibold">Student ID</th>
											<th scope="col" class="whitespace-nowrap px-5 py-3 font-semibold">Name</th>
											<th scope="col" class="whitespace-nowrap px-5 py-3 font-semibold">Course</th>
											<th scope="col" class="whitespace-nowrap px-5 py-3 font-semibold">Year</th>
											<th scope="col" class="whitespace-nowrap px-5 py-3 font-semibold">Laptop</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-charcoal-900/[0.07]">
										{#if isLoading}
											{#each Array(6) as _}
												<tr>
													{#each Array(5) as __}
														<td class="px-5 py-3.5">
															<div class="h-4 w-full max-w-[8rem] animate-pulse rounded bg-charcoal-100"></div>
														</td>
													{/each}
												</tr>
											{/each}
										{:else if filteredRows.length === 0}
											<tr>
												<td colspan="5" class="px-5 py-12 text-center text-charcoal-500">
													{rows.length === 0
														? 'No students have enrolled yet.'
														: 'No students match your search.'}
												</td>
											</tr>
										{:else}
											{#each filteredRows as row (row.key)}
												<tr class="transition-colors hover:bg-charcoal-50/60">
													<td class="whitespace-nowrap px-5 py-3 font-mono text-charcoal-950"
														>{row.studentId}</td
													>
													<td class="whitespace-nowrap px-5 py-3 text-charcoal-900">{row.name || '—'}</td>
													<td class="min-w-[14rem] px-5 py-3 text-charcoal-700">{row.courseName}</td>
													<td class="whitespace-nowrap px-5 py-3 text-charcoal-700">
														{row.year === 'Unknown' || row.year === 'Other'
															? row.year
															: `Year ${row.year}`}
													</td>
													<td class="px-5 py-3">
														{#if row.laptop}
															<span
																class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20"
															>
																<Laptop class="h-3.5 w-3.5" />
																Yes
															</span>
														{:else}
															<span class="text-xs font-medium text-charcoal-500">No</span>
														{/if}
													</td>
												</tr>
											{/each}
										{/if}
									</tbody>
								</table>
							</div>
						</div>
					</Tabs.Content>
				</Tabs.Root>
			{/if}
		</main>
	</div>

	<Dialog.Root bind:open={rosterOpen}>
		<Dialog.Content
			class="flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl"
		>
			{#if rosterCourse}
				<div class="border-b border-brand-200 bg-brand-50 px-6 pb-5 pr-12 pt-6">
					<p class="text-sm font-semibold text-brand-800">
						Enrolled students
					</p>
					<Dialog.Title
						class="mt-1 font-display text-xl font-bold leading-snug tracking-normal text-charcoal-950"
					>
						{rosterCourse.course_name}
					</Dialog.Title>
					<Dialog.Description class="mt-1 text-sm text-charcoal-600">
						{formatCourseDate(rosterCourse.course_date)} · {rosterRows.length}
						{rosterRows.length === 1 ? 'student' : 'students'}
					</Dialog.Description>
				</div>

				<div class="min-h-0 flex-1 overflow-auto">
					{#if rosterRows.length === 0}
						<p class="px-6 py-12 text-center text-charcoal-500">
							No students enrolled in this course yet.
						</p>
					{:else}
						<table class="w-full min-w-[480px] text-left text-sm">
							<thead class="sticky top-0 bg-charcoal-50 text-charcoal-600">
								<tr>
									<th scope="col" class="whitespace-nowrap px-5 py-3 font-semibold">Student ID</th>
									<th scope="col" class="whitespace-nowrap px-5 py-3 font-semibold">Name</th>
									<th scope="col" class="whitespace-nowrap px-5 py-3 font-semibold">Year</th>
									<th scope="col" class="whitespace-nowrap px-5 py-3 font-semibold">Laptop</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-charcoal-900/[0.07]">
								{#each rosterRows as row (row.key)}
									<tr>
										<td class="whitespace-nowrap px-5 py-3 font-mono text-charcoal-950"
											>{row.studentId}</td
										>
										<td class="whitespace-nowrap px-5 py-3 text-charcoal-900">{row.name || '—'}</td>
										<td class="whitespace-nowrap px-5 py-3 text-charcoal-700">
											{row.year === 'Unknown' || row.year === 'Other' ? row.year : `Year ${row.year}`}
										</td>
										<td class="px-5 py-3 text-charcoal-700">{row.laptop ? 'Yes' : 'No'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<div class="grid min-h-screen place-items-center" role="status">
		<div class="flex flex-col items-center gap-3">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"
			></div>
			<p class="text-sm text-charcoal-500">Checking your session…</p>
		</div>
	</div>
{/if}
