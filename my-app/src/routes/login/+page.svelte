<script lang="ts">
	import { CalendarArrowDown, LibraryIcon } from 'lucide-svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { onMount } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import { LibraryBig } from 'lucide-svelte';
	import { UsersRound } from 'lucide-svelte';
	import Cookies from 'js-cookie';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Wretch from 'wretch';
	import { toast } from 'svelte-sonner';
	import { Toaster } from 'svelte-sonner';

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
				Cookies.set('authUser', username);
				window.location.pathname = 'dev';
			});
	};
</script>

<div class="flex h-screen w-full flex-col items-center justify-center gap-3 bg-[#2f2f2f]">
	<div class="flex flex-col justify-between p-6 bg-white rounded-sm shadow-2xl border h-[250px]">
		<h1 class="animate-pulse text-2xl font-bold">LOG IN FOR ADMIN</h1>
		<Dialog.Root>
			<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>Admin login</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>Login</Dialog.Title>
					<Dialog.Description>Login for edit course.</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4 py-4">
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="Username" class="text-right">Username</Label>
						<Input id="Username" bind:value={username} class="col-span-3" />
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="password" class="text-right">Password</Label>
						<Input id="password" bind:value={password} class="col-span-3" />
					</div>
				</div>
				<Dialog.Footer>
					<Button class="bg-[#2f2f2f]" type="submit" on:click={login}>Login</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</div>
</div>
