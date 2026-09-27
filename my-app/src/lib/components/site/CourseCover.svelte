<script lang="ts">
	import OrbitArt from './OrbitArt.svelte';

	export let src: string | undefined | null;
	export let alt = '';
	export let label = '';
	export let eager = false;

	let failed = false;
	$: if (src) failed = false;
</script>

<!-- Posters are square or 4:5, so show the whole thing over a blurred copy of itself. -->
<div class="relative h-full w-full overflow-hidden bg-charcoal-900">
	{#if src && !failed}
		<img
			{src}
			alt=""
			aria-hidden="true"
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
			class="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl"
		/>
		<img
			{src}
			{alt}
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
			class="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
			on:error={() => (failed = true)}
		/>
	{:else}
		<div class="bg-dot-grid absolute inset-0 opacity-40 invert"></div>
		<OrbitArt tone="dark" class="absolute -bottom-12 -right-10 h-52 w-52 opacity-50" />
		<div class="relative flex h-full flex-col justify-end p-5">
			<span class="text-xs font-semibold text-brand-400">{label}</span>
			<span class="mt-1 line-clamp-2 font-display text-lg font-semibold leading-snug text-white"
				>{alt}</span
			>
		</div>
	{/if}
</div>
