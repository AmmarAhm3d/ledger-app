<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { dragToDismiss } from '$lib/actions/drag-to-dismiss';
	import DialogOverlay from '../dialog/dialog-overlay.svelte';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: AlertDialogPrimitive.ContentProps & { children: Snippet } = $props();

	let cancelRef = $state<HTMLElement | null>(null);
</script>

<AlertDialogPrimitive.Portal>
	<DialogOverlay />
	<AlertDialogPrimitive.Content
		bind:ref
		class={cn(
			'fixed inset-x-0 bottom-0 z-50 flex w-full flex-col gap-3 overflow-x-hidden rounded-t-3xl border-t border-border-strong bg-panel-2 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:w-[calc(100%-2rem)] sm:max-w-95 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:pb-5 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95',
			className
		)}
		{...restProps}
	>
		<AlertDialogPrimitive.Cancel bind:ref={cancelRef} tabindex={-1} aria-hidden="true" class="hidden" />
		<div
			class="-mt-1.5 mb-1 h-1 w-10 flex-none touch-none self-center rounded-full bg-border-strong sm:hidden"
			use:dragToDismiss={{ getSheet: () => ref, onDismiss: () => cancelRef?.click() }}
		></div>
		{@render children()}
	</AlertDialogPrimitive.Content>
</AlertDialogPrimitive.Portal>
