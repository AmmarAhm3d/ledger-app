<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import DialogOverlay from './dialog-overlay.svelte';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		children,
		maxWidth = 'max-w-108',
		...restProps
	}: DialogPrimitive.ContentProps & { children: Snippet; maxWidth?: string } = $props();
</script>

<DialogPrimitive.Portal>
	<DialogOverlay />
	<DialogPrimitive.Content
		bind:ref
		class={cn(
			'fixed top-1/2 left-1/2 z-40 flex max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3.75 overflow-y-auto rounded-2xl border border-border-strong bg-panel-2 p-5 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
			maxWidth,
			className
		)}
		{...restProps}
	>
		{@render children()}
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
