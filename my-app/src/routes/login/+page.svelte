<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import Cookies from 'js-cookie';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Wretch from 'wretch';
	import { toast } from 'svelte-sonner';

	let username: string;
	let password: string;
	const login = async () => {
		await Wretch('https://nodejsbackend-ten.vercel.app/admin/login')
			.post({
				username: username,
				password: password
			})
			.badRequest(async (e) => {
				toast.warning(JSON.parse(e.message).message);
			})
			.notFound(async (e) => {
				toast.error(JSON.parse(e.message).message);
			})
			.res(async (e) => {
				toast.success('Login Successfully!');
				localStorage.setItem('jt',e.token)
				window.location.pathname = 'dev';
			});
	};
</script>

<div class="flex h-screen w-full flex-col items-center justify-center gap-6 bg-[#f8f9fa]">
	<div class="flex flex-col justify-between p-8 bg-white rounded-lg shadow-xl border h-[300px] w-[400px]">
		<h1 class="animate-pulse text-3xl font-semibold text-[#2f2f2f] mb-6">Admin Login</h1>
		<Dialog.Root>
			<Dialog.Trigger class={buttonVariants({ size: 'lg' })}>
				Admin Login
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[425px] p-6 rounded-md bg-white shadow-md">
				<Dialog.Header class="mb-4">
					<Dialog.Title class="text-xl font-medium text-[#2f2f2f]">Login</Dialog.Title>
					<Dialog.Description class="text-sm text-gray-500">Enter your credentials to access the admin panel.</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4 py-2">
					<div class="grid grid-cols-4 items-center gap-3">
						<Label for="Username" class="text-right font-medium text-[#2f2f2f]">Username</Label>
						<Input id="Username" bind:value={username} class="col-span-3 p-2 border rounded-md focus:border-[#2f2f2f]" placeholder="Enter your username" />
					</div>
					<div class="grid grid-cols-4 items-center gap-3">
						<Label for="password" class="text-right font-medium text-[#2f2f2f]">Password</Label>
						<Input id="password" type="password" bind:value={password} class="col-span-3 p-2 border rounded-md focus:border-[#2f2f2f]" placeholder="Enter your password" />
					</div>
				</div>
				<Dialog.Footer class="mt-6 flex justify-end">
					<Button class=" text-white px-6 py-2 rounded-md shadow " type="submit" on:click={login}>
						Login
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</div>
</div>
