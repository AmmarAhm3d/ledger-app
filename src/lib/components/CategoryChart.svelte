<script lang="ts">
	import { formatPKR } from '$lib/format';
	import type { CategorySpend } from '$lib/types';

	interface Props {
		categories: CategorySpend[];
		range: 30 | 90;
		onSetRange: (range: 30 | 90) => void;
	}

	let { categories, range, onSetRange }: Props = $props();

	const multiplier = { 30: 1, 90: 2.7 } as const;

	let rows = $derived.by(() => {
		const mult = multiplier[range];
		const totalBase = categories.reduce((sum, c) => sum + c.baseAmount, 0);
		const maxBase = Math.max(...categories.map((c) => c.baseAmount));
		return categories.map((c) => ({
			name: c.name,
			color: c.color,
			amount: formatPKR(c.baseAmount * mult),
			share: Math.round((c.baseAmount / totalBase) * 100) + '%',
			width: Math.round((c.baseAmount / maxBase) * 100) + '%'
		}));
	});

	let totalDisplay = $derived(formatPKR(categories.reduce((sum, c) => sum + c.baseAmount, 0)));
</script>

<div class="rounded-[13px] border border-border bg-panel">
	<div class="flex items-center gap-3 px-4.5 pt-4 pb-3">
		<div>
			<div class="text-sm font-semibold tracking-tight">Spending by category</div>
			<div class="mt-0.5 text-xs text-muted">
				{range === 90 ? 'Last 90 days' : 'Last 30 days'} · {totalDisplay} total
			</div>
		</div>
		<div class="ml-auto flex gap-0.5 rounded-lg bg-panel-hover p-0.5">
			<button
				onclick={() => onSetRange(30)}
				class="rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors duration-100"
				class:bg-border-strong={range === 30}
				class:text-ink={range === 30}
				class:text-subtle={range !== 30}
			>
				30d
			</button>
			<button
				onclick={() => onSetRange(90)}
				class="rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors duration-100"
				class:bg-border-strong={range === 90}
				class:text-ink={range === 90}
				class:text-subtle={range !== 90}
			>
				90d
			</button>
		</div>
	</div>
	<div class="flex flex-col gap-3.5 px-4.5 pt-1 pb-4.5">
		{#each rows as row (row.name)}
			<div class="flex flex-col gap-1.5">
				<div class="flex items-baseline gap-2">
					<span class="h-1.5 w-1.5 rounded-sm" style="background:{row.color}"></span>
					<span class="text-[12.5px] font-medium">{row.name}</span>
					<span class="ml-auto font-mono text-[12.5px] text-ink">{row.amount}</span>
					<span class="w-9.5 text-right font-mono text-[11.5px] text-muted">{row.share}</span>
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
