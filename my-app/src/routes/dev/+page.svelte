<script lang="ts">
	import { onMount } from 'svelte';
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
	onMount(async () => {
		const resUser = await fetch('https://nodejsbackend-ten.vercel.app/user/getuser');
		const resCourse = await fetch('https://nodejsbackend-ten.vercel.app/user/getcourse');
		const DataU: getuser[] = await resUser.json();
		const DataC: Course[] = await resCourse.json();
		datauser = DataU;
		datacourse = DataC;
	});
</script>

<div class="flex h-screen w-full ">
	<div class="m-5 flex w-full flex-col ">
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
		</div>
	</div>

	<!-- Right Box -->
	<div class="flex w-full flex-col m-5">
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
	<div class="flex w-full flex-col m-5">
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
