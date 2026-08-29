<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import { Check } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: CheckboxPrimitive.RootProps = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	bind:checked
	bind:indeterminate
	class={cn(
		'peer flex h-4 w-4 flex-none items-center justify-center rounded-[5px] border border-border-strong bg-bg outline-none transition-colors duration-100 focus-visible:ring-3 focus-visible:ring-accent/18 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-accent data-[state=checked]:bg-accent',
		className
	)}
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		{#if indeterminate}
			<div class="h-0.5 w-2 rounded-full bg-bg"></div>
		{:else if checked}
			<Check size={11} strokeWidth={3} class="text-bg" />
		{/if}
	{/snippet}
</CheckboxPrimitive.Root>
