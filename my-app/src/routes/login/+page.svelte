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
	let role: 'admin' | 'staff'; 

	const login = async () => {
		try {
			const res = await Wretch(`${import.meta.env.VITE_API_BASE_URL}/admin/login`)
				.post({
					username: username,
					password: password
				})
				.badRequest(async (e) => {
					const errorData = await e.json();
					toast.warning(errorData.message);
				})
				.notFound(async (e) => {
					const errorData = await e.json();
					toast.error(errorData.message);
				})
				.res(async (e) => {
					const data = await e.json();
					toast.success('Login Successfully!');
					localStorage.setItem('auth', data.token);
					if (role === 'admin') {
						window.location.pathname = '/dev'; // Admin  (poom and gun)path
					} else if (role === 'staff') {
						window.location.pathname = '/forcoursestaff'; // Staff path
					}
				});
		} catch (error) {
			toast.error('An unexpected error occurred');
			console.error(error);
		}
	};
</script>

<div class="flex h-screen w-full flex-col items-center justify-center gap-6 bg-[#f8f9fa]">
	<div class="flex h-[300px] w-[400px] flex-col justify-between rounded-lg border bg-white p-8 shadow-xl">
		<h1 class="mb-6 animate-pulse text-3xl font-semibold text-[#2f2f2f]">Login</h1>
		
		<!-- Admin Login -->
		<Dialog.Root>
			<Dialog.Trigger class={buttonVariants({ size: 'lg' })} on:click={() => role = 'admin'}>
				Admin Login
			</Dialog.Trigger>
			<Dialog.Content class="rounded-md bg-white p-6 shadow-md sm:max-w-[425px]">
				<Dialog.Header class="mb-4">
					<Dialog.Title class="text-xl font-medium text-[#2f2f2f]">Admin Login</Dialog.Title>
					<Dialog.Description class="text-sm text-gray-500">
						Enter your credentials to access the admin panel.
					</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4 py-2">
					<div class="grid grid-cols-4 items-center gap-3">
						<Label for="Username" class="text-right font-medium text-[#2f2f2f]">Username</Label>
						<Input
							id="Username"
							bind:value={username}
							class="col-span-3 rounded-md border p-2 focus:border-[#2f2f2f]"
							placeholder="Enter your username"
						/>
					</div>
					<div class="grid grid-cols-4 items-center gap-3">
						<Label for="password" class="text-right font-medium text-[#2f2f2f]">Password</Label>
						<Input
							id="password"
							type="password"
							bind:value={password}
							class="col-span-3 rounded-md border p-2 focus:border-[#2f2f2f]"
							placeholder="Enter your password"
						/>
					</div>
				</div>
				<Dialog.Footer class="mt-6 flex justify-end">
					<Button class="rounded-md px-6 py-2 text-white shadow" type="submit" on:click={login}>
						Login
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>

		<!-- Staff Login -->
		<Dialog.Root>
			<Dialog.Trigger class={buttonVariants({ size: 'lg' })} on:click={() => role = 'staff'}>
				Staff Login
			</Dialog.Trigger>
			<Dialog.Content class="rounded-md bg-white p-6 shadow-md sm:max-w-[425px]">
				<Dialog.Header class="mb-4">
					<Dialog.Title class="text-xl font-medium text-[#2f2f2f]">Staff Login</Dialog.Title>
					<Dialog.Description class="text-sm text-gray-500">
						Enter your credentials to access the staff panel.
					</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4 py-2">
					<div class="grid grid-cols-4 items-center gap-3">
						<Label for="Username" class="text-right font-medium text-[#2f2f2f]">Username</Label>
						<Input
							id="Username"
							bind:value={username}
							class="col-span-3 rounded-md border p-2 focus:border-[#2f2f2f]"
							placeholder="Enter your username"
						/>
					</div>
					<div class="grid grid-cols-4 items-center gap-3">
						<Label for="password" class="text-right font-medium text-[#2f2f2f]">Password</Label>
						<Input
							id="password"
							type="password"
							bind:value={password}
							class="col-span-3 rounded-md border p-2 focus:border-[#2f2f2f]"
							placeholder="Enter your password"
						/>
					</div>
				</div>
				<Dialog.Footer class="mt-6 flex justify-end">
					<Button class="rounded-md px-6 py-2 text-white shadow" type="submit" on:click={login}>
						Login
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</div>
</div>
