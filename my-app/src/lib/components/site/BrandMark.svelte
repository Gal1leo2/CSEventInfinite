<script lang="ts">
	export let href = '/home';
	export let tone: 'light' | 'dark' = 'light';
	export let subtitle = '';
</script>

<a
	{href}
	class="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
>
	<span
		class="grid h-11 w-11 shrink-0 place-items-center rounded-xl {tone === 'dark'
			? 'bg-white p-1'
			: ''}"
	>
		<img
			src="/brand/cs-logo-320.png"
			alt="ComSci KMITL"
			width="44"
			height="41"
			class="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:-rotate-12"
		/>
	</span>
	<span class="leading-none">
		<span
			class="block font-display text-xl font-bold tracking-tight {tone === 'dark'
				? 'text-white'
				: 'text-charcoal-950'}">CS<span class="text-brand-600">Event</span></span
		>
		{#if subtitle}
			<span
				class="mt-1 block font-mono text-[10px] font-medium uppercase tracking-[0.16em] {tone ===
				'dark'
					? 'text-charcoal-300'
					: 'text-charcoal-500'}">{subtitle}</span
			>
		{/if}
	</span>
</a>
