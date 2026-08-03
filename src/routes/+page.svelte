<script lang="ts">
	import { browser } from '$app/environment';
	import { getStoredPin, setStoredPin, clearStoredPin } from '$lib/pin-storage';
	import KPICards from '$lib/components/KPICards.svelte';
	import CategoryChart from '$lib/components/CategoryChart.svelte';
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
	let weeklySpend = $derived(data.weeklySpend);

	let range = $state<30 | 90>(30);
	let pinModalOpen = $state(false);

	let transactions = $derived<Transaction[]>(
		data.transactions.map((tx) => ({
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

<section class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.32fr)_minmax(0,1fr)]">
	<CategoryChart categories={categorySpend} {range} onSetRange={(r) => (range = r)} />
	<BudgetHealth {weeklySpend} {monthlyExpenses} {monthlyBudgetCap} />
</section>

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
