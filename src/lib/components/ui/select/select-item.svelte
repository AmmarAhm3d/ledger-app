<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { Check } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		...restProps
	}: SelectPrimitive.ItemProps = $props();
</script>

<SelectPrimitive.Item
	bind:ref
	{value}
	{label}
	class={cn(
		'flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.25 py-1.75 text-[13px] text-ink outline-none transition-colors duration-100 data-[highlighted]:bg-panel-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
		className
	)}
	{...restProps}
>
	{#snippet children({ selected })}
		<span class="truncate">{label ?? value}</span>
		{#if selected}
			<Check size={13} strokeWidth={2.5} class="flex-none text-accent-hover" />
		{/if}
	{/snippet}
</SelectPrimitive.Item>
