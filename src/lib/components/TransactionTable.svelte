<script lang="ts">
	import { Paperclip } from '@lucide/svelte';
	import { formatPKR, initials } from '$lib/format';
	import type { Transaction } from '$lib/types';

	interface Props {
		transactions: Transaction[];
	}

	let { transactions }: Props = $props();

	let rows = $derived(
		transactions.map((tx) => ({
			...tx,
			initials: initials(tx.name),
			isCredit: tx.amount > 0,
			amountDisplay: (tx.amount > 0 ? '+' : '−') + formatPKR(Math.abs(tx.amount))
		}))
	);
</script>

<section class="rounded-[13px] border border-border bg-panel overflow-hidden">
	<div class="flex items-center gap-3 border-b border-border px-4.5 py-4">
		<div class="text-sm font-semibold tracking-tight">Recent transactions</div>
		<span class="rounded-md bg-panel-hover px-1.5 py-0.5 font-mono text-[11px] text-subtle">
			{transactions.length}
		</span>
		<button
			class="ml-auto text-[12.5px] font-semibold text-accent hover:text-accent-hover"
		>
			View all
		</button>
	</div>
	<div
		class="grid grid-cols-[minmax(0,2.2fr)_1.1fr_0.9fr_0.7fr_1fr] gap-3 border-b border-border bg-panel-2 px-4.5 py-2.5 text-[11px] font-semibold tracking-wider text-muted uppercase"
	>
		<div>Description</div>
		<div>Category</div>
		<div>Date</div>
		<div>Audit</div>
		<div class="text-right">Amount</div>
	</div>
	{#each rows as tx (tx.name + tx.date)}
		<div
			class="grid grid-cols-[minmax(0,2.2fr)_1.1fr_0.9fr_0.7fr_1fr] items-center gap-3 border-b border-panel-hover px-4.5 py-3 transition-colors duration-100 hover:bg-panel-2"
		>
			<div class="flex min-w-0 items-center gap-2.5">
				<div
					class="flex h-7.5 w-7.5 flex-none items-center justify-center rounded-lg text-[11.5px] font-semibold"
					style="color:{tx.isCredit ? 'var(--color-green)' : 'var(--color-dim)'}; background:{tx.isCredit
						? 'rgba(52,211,153,0.14)'
						: 'var(--color-panel-hover)'}"
				>
					{tx.initials}
				</div>
				<div class="min-w-0">
					<div class="truncate text-[13px] font-medium">{tx.name}</div>
					<div class="truncate text-[11.5px] text-muted">{tx.account}</div>
				</div>
			</div>
			<div>
				<span
					class="inline-block rounded-md border border-border-strong bg-panel-2 px-2 py-0.5 text-[11.5px] font-medium text-dim"
				>
					{tx.category}
				</span>
			</div>
			<div class="font-mono text-xs text-muted">{tx.date}</div>
			<div>
				{#if tx.receiptDays > 0}
					<span
						title="Receipt attached"
						class="inline-flex items-center gap-1 rounded-md border border-accent/32 bg-accent/14 px-1.5 py-0.5 font-mono text-[10.5px] text-accent-hover"
					>
						<Paperclip size={11} strokeWidth={2} />
						{tx.receiptDays}d
					</span>
				{/if}
			</div>
			<div
				class="text-right font-mono text-[13px] font-medium"
				class:text-green={tx.isCredit}
				class:text-ink={!tx.isCredit}
			>
				{tx.amountDisplay}
			</div>
		</div>
	{/each}
</section>
