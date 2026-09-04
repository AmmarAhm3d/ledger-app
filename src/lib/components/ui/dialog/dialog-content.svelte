<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import DialogOverlay from './dialog-overlay.svelte';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		children,
		maxWidth = 'sm:max-w-108',
		...restProps
	}: DialogPrimitive.ContentProps & { children: Snippet; maxWidth?: string } = $props();
</script>

<DialogPrimitive.Portal>
	<DialogOverlay />
	<DialogPrimitive.Content
		bind:ref
		class={cn(
			'fixed inset-x-0 bottom-0 z-40 flex max-h-[85vh] w-full flex-col gap-3.75 overflow-x-hidden overflow-y-auto rounded-t-3xl border-t border-border-strong bg-panel-2 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:w-[calc(100%-2rem)] sm:max-h-[90vh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-t-border-strong sm:pb-5 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95',
			maxWidth,
			className
		)}
		{...restProps}
	>
		<div class="-mt-1.5 mb-1 h-1 w-10 flex-none self-center rounded-full bg-border-strong sm:hidden"></div>
		{@render children()}
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
