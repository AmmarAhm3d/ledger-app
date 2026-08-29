<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { ChevronDown } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: SelectPrimitive.TriggerProps & { children: Snippet } = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	class={cn(
		'flex w-full items-center justify-between gap-1.5 rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-left text-[13px] text-ink outline-none transition-colors duration-100 focus:border-accent focus:ring-3 focus:ring-accent/18 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-faint',
		className
	)}
	{...restProps}
>
	{@render children()}
	<ChevronDown size={13} strokeWidth={2} class="flex-none text-muted" />
</SelectPrimitive.Trigger>
