<script lang="ts">
	import { ArrowRight, Building2, Mic } from 'lucide-svelte';
	import { dateParts, seats, type Course, type CourseStatus } from '$lib/course';
	import CourseCover from './CourseCover.svelte';
	import StatusPill from './StatusPill.svelte';

	export let course: Course;
	export let status: CourseStatus;
	export let enrolled = 0;

	$: date = dateParts(course.course_date);
	$: capacity = seats(course);
	$: fill = Math.min((enrolled / Math.max(capacity, 1)) * 100, 100);
	$: full = capacity > 0 && enrolled >= capacity;
</script>

<article
	class="group relative flex flex-col overflow-hidden rounded-2xl border border-charcoal-900/10 bg-card shadow-sm transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_45px_-22px_rgb(39_41_46/0.45)]"
>
	<div class="relative aspect-[4/3]">
		<CourseCover src={course.course_img} alt={course.course_name} label={course.course_type} />

		{#if date}
			<div
				class="absolute left-3 top-3 min-w-[3.25rem] rounded-xl bg-white/95 px-2 py-1.5 text-center shadow-md backdrop-blur"
			>
				<div class="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-700">
					{date.month}
				</div>
				<div class="font-display text-xl font-bold leading-none text-charcoal-950">{date.day}</div>
				<div class="mt-0.5 font-mono text-[9px] text-charcoal-500">{date.year}</div>
			</div>
		{/if}
		<div class="absolute right-3 top-3">
			<StatusPill {status} />
		</div>
	</div>

	<div class="flex flex-1 flex-col p-5">
		<p
			class="self-start rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800 ring-1 ring-inset ring-brand-200"
		>
			{course.course_type}
		</p>
		<h3 class="mt-2.5 line-clamp-2 font-display text-lg font-semibold leading-snug text-charcoal-950">
			{#if status === 'open'}
				<a
					href="/course/{course.course_id}"
					class="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
				>
					{course.course_name}
				</a>
			{:else}
				{course.course_name}
			{/if}
		</h3>

		<ul class="mt-3 space-y-1.5 text-sm text-charcoal-600">
			{#if course.course_lecture}
				<li class="flex items-start gap-2">
					<Mic class="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" />
					<span class="line-clamp-1">{course.course_lecture}</span>
				</li>
			{/if}
			{#if course.course_team}
				<li class="flex items-start gap-2">
					<Building2 class="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" />
					<span class="line-clamp-1">{course.course_team}</span>
				</li>
			{/if}
		</ul>

		<div class="mt-auto pt-5">
			<div class="flex items-center justify-between text-xs">
				<span class="font-medium text-charcoal-600">
					<span class="font-mono font-bold text-charcoal-950">{enrolled}</span>/{capacity} enrolled
				</span>
				{#if status === 'open' && full}
					<span class="font-semibold text-red-600">Full</span>
				{/if}
			</div>
			<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-charcoal-100">
				<div
					class="h-full rounded-full {status === 'open' ? 'bg-brand-500' : 'bg-charcoal-300'}"
					style="width: {fill}%"
				></div>
			</div>

			{#if status === 'open'}
				<span
					aria-hidden="true"
					class="mt-4 flex items-center justify-between rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-charcoal-950 transition-colors group-hover:bg-brand-400"
				>
					Register now
					<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
				</span>
			{:else if status === 'closed'}
				<span
					class="mt-4 block rounded-xl bg-charcoal-100 px-4 py-2.5 text-center text-sm font-medium text-charcoal-600"
				>
					Registration closed
				</span>
			{/if}
		</div>
	</div>
</article>
