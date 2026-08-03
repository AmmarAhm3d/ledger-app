<script lang="ts">
	import { CreditCard, Lock, LockOpen, TrendingUp, TrendingDown } from '@lucide/svelte';
	import { formatPKR } from '$lib/format';

	interface Props {
		accountsTotal: number;
		balanceHidden: boolean;
		monthlyIncome: number;
		monthlyExpenses: number;
		incomeChangePct: number;
		expenseChangePct: number;
		onToggleBalance: () => void;
	}

	let {
		accountsTotal,
		balanceHidden,
		monthlyIncome,
		monthlyExpenses,
		incomeChangePct,
		expenseChangePct,
		onToggleBalance
	}: Props = $props();

	let expenseShare = $derived(
		monthlyIncome > 0 ? Math.round((monthlyExpenses / monthlyIncome) * 1000) / 10 : 0
	);
</script>

<section class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
	<div
		class="rounded-[13px] border border-border bg-panel p-4.5 transition-colors duration-150 hover:border-border-hover"
	>
		<div class="flex items-center gap-2 text-[12.5px] font-medium text-muted">
			<CreditCard size={14} strokeWidth={1.9} />
			Total balance
		</div>
		<div class="mt-2.5 flex items-center gap-2.5">
			<div
				class="font-mono text-[29px] font-medium tracking-tight"
				class:text-muted={balanceHidden}
				class:text-ink={!balanceHidden}
			>
				{balanceHidden ? '••••••••' : formatPKR(accountsTotal)}
			</div>
			<button
				onclick={onToggleBalance}
				title={balanceHidden ? 'Unlock balance' : 'Hide balance'}
				class="flex h-6.5 w-6.5 items-center justify-center rounded-[7px] border border-border-strong bg-panel-2 text-subtle transition-colors duration-100 hover:bg-panel-strong hover:text-ink"
			>
				{#if balanceHidden}
					<Lock size={13} strokeWidth={1.9} />
				{:else}
					<LockOpen size={13} strokeWidth={1.9} />
				{/if}
			</button>
		</div>
		<div class="mt-2 flex items-center gap-1.5 text-xs text-muted">
			{#if balanceHidden}
				<button
					onclick={onToggleBalance}
					class="border-none bg-transparent p-0 text-xs font-semibold text-accent hover:text-accent-hover"
				>
					Enter PIN to reveal
				</button>
			{/if}
		</div>
	</div>

	<div
		class="rounded-[13px] border border-border bg-panel p-4.5 transition-colors duration-150 hover:border-border-hover"
	>
		<div class="flex items-center gap-2 text-[12.5px] font-medium text-muted">
			<TrendingUp size={14} strokeWidth={1.9} />
			Monthly income
		</div>
		<div
			class="mt-2.5 font-mono text-[29px] font-medium tracking-tight"
			class:text-muted={balanceHidden}
			class:text-ink={!balanceHidden}
		>
			{balanceHidden ? '••••••••' : formatPKR(monthlyIncome)}
		</div>
		<div class="mt-2 flex items-center gap-1.5 text-xs text-muted">
			{#if incomeChangePct >= 0}
				<span
					class="inline-flex items-center gap-1 rounded-md border border-green/28 bg-green/12 px-1.5 py-0.5 text-[11.5px] font-semibold text-green"
				>
					<TrendingUp size={11} strokeWidth={2.4} />
					{incomeChangePct}%
				</span>
			{:else}
				<span
					class="inline-flex items-center gap-1 rounded-md border border-red/28 bg-red/12 px-1.5 py-0.5 text-[11.5px] font-semibold text-red"
				>
					<TrendingDown size={11} strokeWidth={2.4} />
					{Math.abs(incomeChangePct)}%
				</span>
			{/if}
			vs. last month
		</div>
	</div>

	<div
		class="rounded-[13px] border border-border bg-panel p-4.5 transition-colors duration-150 hover:border-border-hover"
	>
		<div class="flex items-center gap-2 text-[12.5px] font-medium text-muted">
			<TrendingDown size={14} strokeWidth={1.9} />
			Monthly expenses
		</div>
		<div
			class="mt-2.5 font-mono text-[29px] font-medium tracking-tight"
			class:text-muted={balanceHidden}
			class:text-ink={!balanceHidden}
		>
			{balanceHidden ? '••••••••' : formatPKR(monthlyExpenses)}
		</div>
		<div class="mt-2 flex items-center gap-1.5 text-xs text-muted">
			{#if expenseChangePct > 0}
				<span
					class="inline-flex items-center gap-1 rounded-md border border-red/28 bg-red/12 px-1.5 py-0.5 text-[11.5px] font-semibold text-red"
				>
					<TrendingUp size={11} strokeWidth={2.4} />
					{expenseChangePct}%
				</span>
			{:else}
				<span
					class="inline-flex items-center gap-1 rounded-md border border-green/28 bg-green/12 px-1.5 py-0.5 text-[11.5px] font-semibold text-green"
				>
					<TrendingDown size={11} strokeWidth={2.4} />
					{Math.abs(expenseChangePct)}%
				</span>
			{/if}
			{expenseShare}% of income
		</div>
	</div>
</section>
