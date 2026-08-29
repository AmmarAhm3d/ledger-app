<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AlertDialogPrimitive.ActionProps = $props();
</script>

<AlertDialogPrimitive.Action
	bind:ref
	class={cn(
		'rounded-[9px] bg-red px-4 py-2 text-[13px] font-semibold text-bg transition-colors duration-150 hover:bg-red/85 disabled:opacity-60',
		className
	)}
	{...restProps}
/>
