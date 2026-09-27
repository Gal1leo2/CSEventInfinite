<script lang="ts">
	import { BadgeCheck, CircleX, Download } from 'lucide-svelte';
	import OrbitArt from '$lib/components/site/OrbitArt.svelte';
	import SiteFooter from '$lib/components/site/SiteFooter.svelte';
	import SiteHeader from '$lib/components/site/SiteHeader.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: certificate = data.certificate;
	$: issued = certificate?.issue_date
		? new Date(certificate.issue_date).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})
		: null;
</script>

<svelte:head>
	<title>{certificate ? 'Certificate verified' : 'Invalid certificate'} · CSEvent</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<SiteHeader />

	<main class="relative flex-1 overflow-hidden">
		<div
			class="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_65%)]"
		></div>

		<section class="container relative max-w-2xl py-14 sm:py-20">
			{#if !certificate}
				<div class="rounded-3xl border border-red-200 bg-card p-8 text-center shadow-sm sm:p-10">
					<span class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/60">
						<CircleX class="h-8 w-8" />
					</span>
					<h1 class="mt-6 font-display text-3xl font-bold text-charcoal-950">Invalid certificate</h1>
					<p class="mt-2 text-charcoal-600">This certificate could not be verified.</p>
					<p
						class="mx-auto mt-6 w-fit max-w-full break-all rounded-lg bg-charcoal-50 px-3 py-2 font-mono text-xs text-charcoal-600"
					>
						{data.id}
					</p>
				</div>
			{:else}
				<article
					class="relative overflow-hidden rounded-3xl bg-card shadow-[0_30px_70px_-35px_rgb(24_25_29/0.55)] ring-1 ring-charcoal-900/10"
				>
					<div class="relative overflow-hidden bg-charcoal-950 px-6 py-7 text-white sm:px-10">
						<OrbitArt
							tone="dark"
							class="pointer-events-none absolute -right-14 -top-16 h-56 w-56 opacity-20"
						/>
						<div class="relative flex items-center gap-4">
							<span
								class="grid h-14 w-14 shrink-0 animate-pop-in place-items-center rounded-full bg-emerald-500 text-white ring-4 ring-emerald-500/25"
							>
								<BadgeCheck class="h-7 w-7" />
							</span>
							<div>
								<h1 class="font-display text-2xl font-bold sm:text-3xl">Certificate verified</h1>
								<p class="mt-0.5 text-sm font-medium capitalize text-emerald-300">
									{certificate.status ?? 'Valid'}
								</p>
							</div>
						</div>
					</div>

					<div class="relative px-6 py-8 sm:px-10">
						<img
							src="/brand/cs-logo.png"
							alt=""
							aria-hidden="true"
							class="pointer-events-none absolute -bottom-10 -right-10 w-56 opacity-[0.06]"
						/>
						<p class="text-sm text-charcoal-500">
							Awarded to
						</p>
						<p class="mt-1 font-display text-3xl font-bold leading-tight text-charcoal-950 sm:text-4xl">
							{certificate.recipient_name}
						</p>

						<dl class="relative mt-8 grid gap-6 border-t border-charcoal-900/10 pt-6 sm:grid-cols-2">
							<div class="sm:col-span-2">
								<dt class="text-sm text-charcoal-500">
									Certificate no.
								</dt>
								<dd class="mt-1 break-all font-mono font-semibold text-charcoal-950">
									{certificate.certificate_number || certificate.id.substring(0, 12)}
								</dd>
							</div>
							{#if issued}
								<div>
									<dt class="text-sm text-charcoal-500">
										Issue date
									</dt>
									<dd class="mt-1 font-semibold text-charcoal-950">{issued}</dd>
								</div>
							{/if}
							{#if certificate.student_id}
								<div>
									<dt class="text-sm text-charcoal-500">
										Student ID
									</dt>
									<dd class="mt-1 font-mono font-semibold text-charcoal-950">
										{certificate.student_id}
									</dd>
								</div>
							{/if}
						</dl>

						{#if certificate.has_pdf}
							<a
								href="/verify/{certificate.id}/download"
								data-sveltekit-reload
								class="relative mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 font-semibold text-charcoal-950 transition hover:bg-brand-400"
							>
								<Download class="h-4 w-4" />
								Download certificate
							</a>
						{/if}
					</div>

					<div
						class="border-t border-charcoal-900/10 bg-charcoal-50 px-6 py-4 text-center text-xs text-charcoal-500 sm:px-10"
					>
						Issued by Computer Science, KMITL via CSEvent · ID {certificate.id}
					</div>
				</article>
			{/if}
		</section>
	</main>

	<SiteFooter />
</div>
