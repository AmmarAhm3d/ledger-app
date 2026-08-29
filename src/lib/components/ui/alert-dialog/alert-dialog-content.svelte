<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import DialogOverlay from '../dialog/dialog-overlay.svelte';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: AlertDialogPrimitive.ContentProps & { children: Snippet } = $props();
</script>

<AlertDialogPrimitive.Portal>
	<DialogOverlay />
	<AlertDialogPrimitive.Content
		bind:ref
		class={cn(
			'fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-95 -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-2xl border border-border-strong bg-panel-2 p-5 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
			className
		)}
		{...restProps}
	>
		{@render children()}
	</AlertDialogPrimitive.Content>
</AlertDialogPrimitive.Portal>
