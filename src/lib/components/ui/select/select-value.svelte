<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	let { class: className, ...restProps }: SelectPrimitive.ValueProps = $props();
</script>

<SelectPrimitive.Value class={cn('block truncate', className)} {...restProps} />
