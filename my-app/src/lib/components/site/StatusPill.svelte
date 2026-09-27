<script lang="ts">
	import type { CourseStatus } from '$lib/course';

	export let status: CourseStatus;

	const STYLES: Record<CourseStatus, { label: string; pill: string; dot: string }> = {
		open: {
			label: 'Open',
			pill: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
			dot: 'bg-emerald-500 animate-pulse'
		},
		closed: {
			label: 'Closed',
			pill: 'bg-brand-50 text-brand-900 ring-brand-600/25',
			dot: 'bg-brand-500'
		},
		ended: {
			label: 'Ended',
			pill: 'bg-charcoal-50 text-charcoal-700 ring-charcoal-600/15',
			dot: 'bg-charcoal-400'
		},
		draft: {
			label: 'Draft',
			pill: 'bg-charcoal-50 text-charcoal-700 ring-charcoal-600/15',
			dot: 'bg-charcoal-300'
		}
	};

	$: style = STYLES[status];
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ring-1 ring-inset {style.pill}"
>
	<span class="h-1.5 w-1.5 rounded-full {style.dot}"></span>
	{style.label}
</span>
