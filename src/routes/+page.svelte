<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { getStoredPin, setStoredPin, clearStoredPin } from '$lib/pin-storage';
	import { formatPKR } from '$lib/format';
	import { toast } from '$lib/components/ui/sonner';
	import KPICards from '$lib/components/KPICards.svelte';
	import CategoryChart from '$lib/components/CategoryChart.svelte';
	import AccountSpendChart from '$lib/components/AccountSpendChart.svelte';
	import BudgetHealth from '$lib/components/BudgetHealth.svelte';
	import TransactionTable from '$lib/components/TransactionTable.svelte';
	import PinModal from '$lib/components/PinModal.svelte';
	import type { Transaction } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let monthlyIncome = $derived(data.monthlyIncome);
	let monthlyExpenses = $derived(data.monthlyExpenses);
	let incomeChangePct = $derived(data.incomeChangePct);
	let expenseChangePct = $derived(data.expenseChangePct);
	let monthlyBudgetCap = $derived(data.monthlyBudgetCap);
	let categorySpend = $derived(data.categorySpend);
	let accountSpend = $derived(data.accountSpend);
	let weeklySpend = $derived(data.weeklySpend);

	let range = $state<30 | 90>(30);
	let pinModalOpen = $state(false);

	let transactions = $derived<Transaction[]>(
		data.transactions.map((tx) => ({
			id: tx.id,
			name: tx.description ?? 'Transaction',
			account: tx.account_name,
			category: tx.is_transfer ? 'Transfer' : (tx.category_name ?? 'Uncategorized'),
			date: tx.date,
			amount: tx.amount,
			hasReceipt: tx.has_receipt
		}))
	);

	let balanceHidden = $state(true);
	let pin = $state('');
	let pinStage = $state<'create' | 'confirm' | 'unlock'>('unlock');
	let pinPending = $state('');
	let pinError = $state(false);

	let accountsTotal = $derived(data.accounts.reduce((sum, a) => sum + a.balance, 0));

	function handleToggleBalance() {
		if (balanceHidden) {
			pin = '';
			pinPending = '';
			pinError = false;
			pinStage = browser && getStoredPin() ? 'unlock' : 'create';
			pinModalOpen = true;
		} else {
			balanceHidden = true;
		}
	}

	function unlockBalance() {
		balanceHidden = false;
		pinModalOpen = false;
		pin = '';
		pinPending = '';
		pinError = false;
	}

	function handlePinReset() {
		clearStoredPin();
		pin = '';
		pinPending = '';
		pinError = false;
		pinStage = 'create';
	}

	function handlePressKey(key: string) {
		if (key === '⌫') {
			pin = pin.slice(0, -1);
			pinError = false;
			return;
		}
		pinError = false;
		const next = (pin + key).slice(0, 4);
		pin = next;
		if (next.length < 4) return;

		if (pinStage === 'create') {
			pinPending = next;
			pin = '';
			pinStage = 'confirm';
			return;
		}

		if (pinStage === 'confirm') {
			if (next === pinPending) {
				setStoredPin(next);
				setTimeout(unlockBalance, 180);
			} else {
				pinError = true;
				pin = '';
				pinPending = '';
				pinStage = 'create';
			}
			return;
		}

		if (next === getStoredPin()) {
			setTimeout(unlockBalance, 180);
		} else {
			pinError = true;
			setTimeout(() => {
				pin = '';
				pinError = false;
			}, 400);
		}
	}
</script>

<KPICards
	{accountsTotal}
	{balanceHidden}
	{monthlyIncome}
	{monthlyExpenses}
	{incomeChangePct}
	{expenseChangePct}
	onToggleBalance={handleToggleBalance}
/>

{#if data.suggestedTransactions.length > 0}
	<section class="rounded-[13px] border border-accent/30 bg-accent/6 p-4 sm:p-4.5">
		<div class="mb-3">
			<div class="text-[13px] font-semibold tracking-tight text-ink">Suggested transactions</div>
			<div class="mt-0.5 text-xs text-muted">
				Subscriptions due — nothing is added to your ledger until you confirm.
			</div>
		</div>
		<div class="flex flex-col gap-2">
			{#each data.suggestedTransactions as sub (sub.id)}
				<div
					class="flex items-center justify-between gap-3 rounded-[10px] border border-border-strong bg-panel px-3 py-2.5"
				>
					<div class="min-w-0">
						<div class="truncate text-[12.5px] font-semibold text-ink">{sub.name}</div>
						<div class="text-[11px] text-muted">
							Due {sub.next_due_date}{sub.account_name ? ` · ${sub.account_name}` : ''}
						</div>
					</div>
					<div class="flex flex-none items-center gap-2.5">
						<div class="font-mono text-[13px] font-medium text-ink">
							{formatPKR(sub.amount)}
						</div>
						<form
						method="POST"
						action="/subscriptions?/confirmSubscriptionPayment"
						use:enhance={() => {
							return async ({ result, update }) => {
								if (result.type === 'success') toast.success('Subscription payment logged');
								else if (result.type === 'failure') {
									toast.error(
										String((result.data as Record<string, unknown> | undefined)?.message ?? 'Something went wrong')
									);
								}
								await update();
							};
						}}
					>
							<input type="hidden" name="id" value={sub.id} />
							<button
								type="submit"
								class="rounded-[9px] border border-accent/40 bg-accent/16 px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-hover transition-colors duration-100 hover:bg-accent/24"
							>
								Log payment
							</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}

<section class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.32fr)_minmax(0,1fr)]">
	<CategoryChart categories={categorySpend} {range} onSetRange={(r) => (range = r)} />
	<BudgetHealth {weeklySpend} {monthlyExpenses} {monthlyBudgetCap} />
</section>

<AccountSpendChart accounts={accountSpend} />

<TransactionTable {transactions} viewAllHref="/transactions" />

<PinModal
	open={pinModalOpen}
	{pin}
	mode={pinStage}
	error={pinError}
	onPressKey={handlePressKey}
	onClose={() => (pinModalOpen = false)}
	onReset={handlePinReset}
/>
