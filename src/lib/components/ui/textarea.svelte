<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...restProps
	}: HTMLTextareaAttributes & { ref?: HTMLTextAreaElement | null } = $props();
</script>

<textarea
	bind:this={ref}
	bind:value
	class={cn(
		'flex min-h-16 w-full rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none placeholder:text-faint focus:border-accent focus:ring-3 focus:ring-accent/18 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
></textarea>
