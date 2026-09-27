<script lang="ts">
	// The logo's two arcs: a thick amber "C" and a thin charcoal orbit with node dots.
	let className = '';
	export { className as class };
	export let spin = false;
	export let tone: 'light' | 'dark' = 'light';

	$: orbit = tone === 'dark' ? '#B2B5BC' : '#494C54';
</script>

<svg viewBox="0 0 400 400" fill="none" aria-hidden="true" class={className}>
	<path
		d="M275 70.1A150 150 0 1 0 275 329.9"
		stroke="#FC9C18"
		stroke-width="44"
		stroke-linecap="round"
	/>
	<g class={spin ? 'origin-center animate-orbit-slow' : ''}>
		<path
			d="M183.9 15.7A185 185 0 1 0 247.9 378.7"
			stroke={orbit}
			stroke-width="7"
			stroke-linecap="round"
		/>
		<circle cx="39.8" cy="292.5" r="13" fill={orbit} />
	</g>
</svg>
