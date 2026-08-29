<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children,
		...restProps
	}: { class?: string; children: Snippet } & Record<string, unknown> = $props();
</script>

<div class={cn('flex items-start justify-between gap-3', className)} {...restProps}>
	{@render children()}
</div>
