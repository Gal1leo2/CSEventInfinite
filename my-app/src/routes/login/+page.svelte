<script lang="ts">
	import { ArrowLeft, Eye, EyeOff, LoaderCircle, LogIn, ShieldCheck, UsersRound } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import Wretch from 'wretch';
	import { API } from '$lib/api';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import BrandMark from '$lib/components/site/BrandMark.svelte';
	import OrbitArt from '$lib/components/site/OrbitArt.svelte';

	let username = '';
	let password = '';
	let role: 'admin' | 'staff' = 'admin';
	let showPassword = false;
	let submitting = false;

	const ROLES = [
		{ value: 'admin', label: 'Admin', hint: 'Courses, students, certificates', icon: ShieldCheck },
		{ value: 'staff', label: 'Staff', hint: 'Course staff console', icon: UsersRound }
	] as const;

	// wretch has already parsed the error body into `json` by the time a catcher runs.
	const messageOf = (e: { json?: { message?: string } }, fallback: string) =>
		e.json?.message || fallback;

	const login = async () => {
		submitting = true;
		try {
			await Wretch(`${API}/admin/login`)
				.post({
					username: username,
					password: password
				})
				.badRequest(async (e) => {
					toast.warning(messageOf(e, 'Please check your username and password'));
				})
				.unauthorized(async (e) => {
					toast.error(messageOf(e, 'Invalid username or password'));
				})
				.notFound(async (e) => {
					toast.error(messageOf(e, 'Account not found'));
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
		} finally {
			submitting = false;
		}
	};
</script>

<svelte:head>
	<title>Sign in · CSEvent</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
	<!-- Brand panel -->
	<aside class="relative hidden overflow-hidden bg-charcoal-950 p-12 text-white lg:flex lg:flex-col">
		<div class="bg-dot-grid pointer-events-none absolute inset-0 opacity-25 invert"></div>
		<BrandMark tone="dark" subtitle="Staff console" />

		<div class="relative my-auto grid place-items-center py-12">
			<div class="relative aspect-square w-full max-w-[380px]">
				<OrbitArt tone="dark" spin class="absolute inset-0 h-full w-full opacity-90" />
				<div
					class="absolute inset-[22%] grid place-items-center rounded-full bg-white shadow-[0_30px_80px_-20px_rgb(252_156_24/0.45)]"
				>
					<img src="/brand/cs-logo.png" alt="ComSci KMITL" class="w-[74%]" />
				</div>
			</div>
		</div>

		<div class="relative">
			<p class="font-display text-3xl font-bold leading-snug">
				Run every short course <br />from one console.
			</p>
			<p class="mt-3 max-w-md text-charcoal-300">
				Publish courses, manage enrollments and issue certificates for Computer Science, KMITL.
			</p>
		</div>
	</aside>

	<!-- Form -->
	<main class="flex items-center justify-center px-5 py-12 sm:px-8">
		<div class="w-full max-w-sm animate-fade-up">
			<div class="lg:hidden">
				<BrandMark subtitle="Staff console" />
			</div>

			<h1 class="mt-10 font-display text-3xl font-bold tracking-tight text-charcoal-950 lg:mt-0">
				Sign in
			</h1>
			<p class="mt-2 text-charcoal-600">Enter your credentials to access the panel.</p>

			<form on:submit|preventDefault={login} class="mt-8 space-y-5">
				<fieldset>
					<legend class="text-sm font-semibold text-charcoal-900">Sign in as</legend>
					<div class="mt-2 grid grid-cols-2 gap-2">
						{#each ROLES as option}
							<label class="relative">
								<input
									type="radio"
									name="role"
									value={option.value}
									bind:group={role}
									class="peer sr-only"
								/>
								<span
									class="flex h-full cursor-pointer flex-col gap-1 rounded-xl border border-charcoal-900/15 p-3 transition hover:bg-charcoal-50 peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:ring-1 peer-checked:ring-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
								>
									<span class="flex items-center gap-2 font-semibold text-charcoal-950">
										<svelte:component this={option.icon} class="h-4 w-4 text-brand-700" />
										{option.label}
									</span>
									<span class="text-xs text-charcoal-500">{option.hint}</span>
								</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<div class="space-y-1.5">
					<Label for="username" class="text-sm font-semibold text-charcoal-900">Username</Label>
					<Input
						id="username"
						bind:value={username}
						autocomplete="username"
						class="h-11"
						placeholder="Enter your username"
					/>
				</div>

				<div class="space-y-1.5">
					<Label for="password" class="text-sm font-semibold text-charcoal-900">Password</Label>
					<div class="relative">
						{#if showPassword}
							<Input
								id="password"
								type="text"
								bind:value={password}
								autocomplete="current-password"
								class="h-11 pr-11"
								placeholder="Enter your password"
							/>
						{:else}
							<Input
								id="password"
								type="password"
								bind:value={password}
								autocomplete="current-password"
								class="h-11 pr-11"
								placeholder="Enter your password"
							/>
						{/if}
						<button
							type="button"
							on:click={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							class="absolute inset-y-0 right-0 grid w-11 place-items-center text-charcoal-500 hover:text-charcoal-900"
						>
							{#if showPassword}<EyeOff class="h-4 w-4" />{:else}<Eye class="h-4 w-4" />{/if}
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={submitting}
					class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 font-semibold text-charcoal-950 transition hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70"
				>
					{#if submitting}
						<LoaderCircle class="h-4 w-4 animate-spin" />
						Signing in…
					{:else}
						<LogIn class="h-4 w-4" />
						Sign in as {role === 'admin' ? 'Admin' : 'Staff'}
					{/if}
				</button>
			</form>

			<a
				href="/home"
				class="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-500 hover:text-charcoal-950"
			>
				<ArrowLeft class="h-4 w-4" />
				Back to courses
			</a>
		</div>
	</main>
</div>
