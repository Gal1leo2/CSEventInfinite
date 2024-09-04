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
	}
	interface Course {
		course_id: any;
		course_name: string;
		course_lecture: string;
		course_type: string;
		course_date: string;
	}

	//File
	let file: File | null = null;
	const readIMG = async (event: Event) => {
		const input = event.target as HTMLInputElement;
		file = input.files ? input.files[0] : null;
	};
	//upload
	const upload = async () => {
		if (!file) {
			alert('Please select a file first.');
			return;
		}
		const formData = new FormData();
		formData.append('picture', file);
		try {
			const response = await Wretch('https://nodejsbackend-ten.vercel.app/course/upload')
				.post(formData)
				.json();
			console.log('Upload successful:', response);
		} catch (error) {
			console.error('Upload error:', error);
		}
	};

	// create course
	let courseName: string;
	let courseType: string;
	let courseDescription: string;
	let selectedDate: DateValue | undefined = undefined;
	let courseLecture: string;
	let courseLocation: string;
	const createCourse = async () => {
		console.log(selectedDate?.toString());
		await Wretch('https://nodejsbackend-ten.vercel.app/course/create')
			.post({
				course_name: courseName,
				course_type: courseType,
				course_date: selectedDate?.toString(),
				course_description: courseDescription,
				course_lecture: courseLecture,
				course_location: courseLocation
			})
			.badRequest((e) => {
				console.log(e);
			})
			.res((e) => {
				console.log(e.status);
			});
	};

	onMount(async () => {
		const resUser = await fetch('https://nodejsbackend-ten.vercel.app/user/getuser');
		const resCourse = await fetch('https://nodejsbackend-ten.vercel.app/user/getcourse');
		const DataU: getuser[] = await resUser.json();
		const DataC: Course[] = await resCourse.json();
		datauser = DataU;
		datacourse = DataC;
	});
</script>

<div class="flex h-screen w-full">
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
		<div class="m-5 flex h-full border border-[red]">
			<Dialog.Root>
				<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>Create Course</Dialog.Trigger
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
							<Label for="des" class="text-right">Description</Label>
							<Input id="des" bind:value={courseDescription} class="col-span-3" />
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
							<Input id="picture" class="col-span-3" type="file" />
						</div>
					</div>
					<Dialog.Footer>
						<Button type="submit" on:click={createCourse}>Save changes</Button>
					</Dialog.Footer>
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
<div class="grid w-full max-w-sm items-center gap-1.5">
	<Label for="picture">Picture</Label>
	<Input id="picture" type="file" accept="image/*" on:change={readIMG} />
	<Button on:click={upload}>Click</Button>
</div>
