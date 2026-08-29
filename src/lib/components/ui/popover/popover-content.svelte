<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 6,
		children,
		...restProps
	}: PopoverPrimitive.ContentProps & { children: Snippet } = $props();
</script>

<PopoverPrimitive.Portal>
	<PopoverPrimitive.Content
		bind:ref
		{sideOffset}
		class={cn(
			'z-50 rounded-[13px] border border-border-strong bg-panel-2 p-1 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
			className
		)}
		{...restProps}
	>
		{@render children()}
	</PopoverPrimitive.Content>
</PopoverPrimitive.Portal>
