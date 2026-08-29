<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children,
		...restProps
	}: { class?: string; children: Snippet } & Record<string, unknown> = $props();
</script>

<div class={cn('mt-0.5 flex justify-end gap-2.25', className)} {...restProps}>
	{@render children()}
</div>
