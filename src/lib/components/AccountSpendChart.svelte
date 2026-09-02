<script lang="ts">
	import type { AccountSpend } from '$lib/types';

	interface Props {
		accounts: AccountSpend[];
	}

	let { accounts }: Props = $props();

	const PALETTE = ['#F4F4F5', '#818CF8', '#A5B4FC', '#6366F1', '#4338CA', '#3F3F46', '#C4B5FD'];

	let rows = $derived.by(() => {
		const total = accounts.reduce((sum, a) => sum + a.baseAmount, 0);
		const max = Math.max(...accounts.map((a) => a.baseAmount), 0);
		return accounts.map((a, i) => ({
			name: a.name,
			color: PALETTE[i % PALETTE.length],
			share: (total === 0 ? 0 : Math.round((a.baseAmount / total) * 100)) + '%',
			width: (max === 0 ? 0 : Math.round((a.baseAmount / max) * 100)) + '%'
		}));
	});
</script>

<div class="rounded-[13px] border border-border bg-panel">
	<div class="px-4.5 pt-4 pb-3">
		<div class="text-sm font-semibold tracking-tight">Spend by account</div>
		<div class="mt-0.5 text-xs text-muted">This month's share of spend — amounts hidden</div>
	</div>
	<div class="flex flex-col gap-3.5 px-4.5 pt-1 pb-4.5">
		{#if rows.length === 0}
			<p class="py-2 text-xs text-muted">No spending recorded yet.</p>
		{/if}
		{#each rows as row (row.name)}
			<div class="flex flex-col gap-1.5">
				<div class="flex items-baseline gap-2">
					<span class="h-1.5 w-1.5 rounded-sm" style="background:{row.color}"></span>
					<span class="truncate text-[12.5px] font-medium">{row.name}</span>
					<span class="ml-auto w-9.5 text-right font-mono text-[11.5px] text-muted">{row.share}</span>
				</div>
				<div class="h-2 overflow-hidden rounded-md bg-panel-hover">
					<div
						class="h-full rounded-md transition-[width] duration-400 ease-out"
						style="width:{row.width}; background:{row.color}"
					></div>
				</div>
			</div>
		{/each}
	</div>
</div>
