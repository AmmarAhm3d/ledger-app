<script lang="ts">
	import { formatPKR } from '$lib/format';

	interface Props {
		weeklySpend: number[];
		monthlyExpenses: number;
		monthlyBudgetCap: number;
	}

	let { weeklySpend, monthlyExpenses, monthlyBudgetCap }: Props = $props();

	let bars = $derived.by(() => {
		const max = Math.max(...weeklySpend, 0);
		return weeklySpend.map((v, i) => ({
			label: `Week ${i + 1} · ${formatPKR(v)}`,
			height: (max > 0 ? Math.round((v / max) * 100) : 0) + '%',
			color: v > 240 ? 'var(--color-amber)' : 'var(--color-accent)'
		}));
	});

	// Illustrative figures from the prototype (not strictly derivable from the weekly bars above).
	const remaining = 1021;
	const avgDailyBurn = 113.5;
	const projectedClose = 3972;
</script>

<div class="rounded-[13px] border border-border bg-panel px-4.5 pt-4 pb-4.5">
	<div class="text-sm font-semibold tracking-tight">Budget health</div>
	<div class="mt-0.5 text-xs text-muted">
		{formatPKR(monthlyExpenses)} of {formatPKR(monthlyBudgetCap)} monthly cap
	</div>
	<div class="mt-5 flex h-26 items-end gap-1.5">
		{#each bars as bar, i (i)}
			<div
				title={bar.label}
				class="flex-1 rounded-t-[4px] rounded-b-[2px] opacity-100 transition-[height,opacity] duration-400 ease-out hover:opacity-70"
				style="height:{bar.height}; background:{bar.color}"
			></div>
		{/each}
	</div>
	<div class="mt-2 flex justify-between font-mono text-[10.5px] text-muted">
		<span>W1</span><span>W2</span><span>W3</span><span>W4</span>
	</div>
	<div class="my-4 h-px bg-border"></div>
	<div class="flex flex-col gap-2.5">
		<div class="flex items-center justify-between text-[12.5px]">
			<span class="text-muted">Remaining</span>
			<span class="font-mono font-medium">{formatPKR(remaining)}</span>
		</div>
		<div class="flex items-center justify-between text-[12.5px]">
			<span class="text-muted">Avg. daily burn</span>
			<span class="font-mono font-medium">{formatPKR(avgDailyBurn)}</span>
		</div>
		<div class="flex items-center justify-between text-[12.5px]">
			<span class="text-muted">Projected close</span>
			<span class="font-mono font-medium text-amber">{formatPKR(projectedClose)}</span>
		</div>
	</div>
</div>
