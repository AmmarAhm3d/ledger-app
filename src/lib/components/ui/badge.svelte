<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<span
	class={cn(
		'inline-flex items-center justify-center rounded-full bg-red px-1.5 py-px font-mono text-[10px] font-semibold leading-none text-bg',
		className
	)}
>
	{@render children?.()}
</span>
