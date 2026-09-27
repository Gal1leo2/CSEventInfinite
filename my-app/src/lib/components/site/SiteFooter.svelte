<script lang="ts">
	import { Facebook, Instagram, Youtube } from 'lucide-svelte';
	import BrandMark from './BrandMark.svelte';
	import OrbitArt from './OrbitArt.svelte';

	const socials = [
		{ href: 'https://www.facebook.com/cskmitl/', label: 'Facebook', icon: Facebook },
		{ href: 'https://www.instagram.com/cskmitl/', label: 'Instagram', icon: Instagram },
		{ href: 'https://www.youtube.com/c/CSKMITL', label: 'YouTube', icon: Youtube }
	];
</script>

<footer class="relative overflow-hidden bg-charcoal-950 text-charcoal-300">
	<OrbitArt
		tone="dark"
		class="pointer-events-none absolute -right-32 -top-24 h-[460px] w-[460px] opacity-[0.08]"
	/>
	<div class="container relative grid gap-10 py-14 md:grid-cols-[1.5fr_1fr]">
		<div>
			<BrandMark tone="dark" />
			<p class="mt-5 max-w-md text-sm leading-relaxed">
				Short Course Registration System for Computer Science students at King Mongkut's Institute
				of Technology Ladkrabang
			</p>
			<p class="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-charcoal-400">
				Powered by <span class="text-brand-400">CS Infinite</span>
			</p>
		</div>

		<div>
			<h3 class="font-mono text-xs font-medium uppercase tracking-[0.16em] text-white">
				Connect with CS KMITL
			</h3>
			<ul class="mt-4 flex gap-3">
				{#each socials as social}
					<li>
						<a
							href={social.href}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={social.label}
							class="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-charcoal-200 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-charcoal-950"
						>
							<svelte:component this={social.icon} class="h-5 w-5" />
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<div class="relative border-t border-white/10">
		<div
			class="container flex flex-col gap-2 py-6 text-xs text-charcoal-400 md:flex-row md:items-center md:justify-between"
		>
			<p>
				© 2024 – 2026 · Made with ❤️ by
				<a href="https://github.com/Gal1leo2" class="text-brand-400 hover:underline">Gal1leo</a>,
				<a href="https://github.com/tony219y" class="text-brand-400 hover:underline">Tony219y</a>
			</p>
			<p>Computer Science, King Mongkut's Institute of Technology Ladkrabang</p>
		</div>
	</div>
</footer>
