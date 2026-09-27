<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import BrandMark from './BrandMark.svelte';
</script>

<header
	class="sticky top-0 z-40 border-b border-charcoal-900/[0.06] bg-background/80 backdrop-blur-xl"
>
	<div class="h-[3px] bg-brand-500"></div>
	<div class="container flex h-16 items-center justify-between gap-4">
		<BrandMark />
		<nav class="flex items-center gap-2">
			<slot />
			<a
				href="/home#courses"
				class="inline-flex items-center gap-1.5 rounded-full bg-charcoal-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-charcoal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			>
				<span class="hidden sm:inline">Browse courses</span>
				<span class="sm:hidden">Courses</span>
				<ArrowRight class="h-4 w-4" />
			</a>
		</nav>
	</div>
</header>
