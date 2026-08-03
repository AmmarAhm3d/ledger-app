<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { authClient } from '$lib/auth-client';
	import { getStoredPin, setStoredPin, clearStoredPin } from '$lib/pin-storage';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import DashboardHeader from '$lib/components/DashboardHeader.svelte';
	import KPICards from '$lib/components/KPICards.svelte';
	import CategoryChart from '$lib/components/CategoryChart.svelte';
	import BudgetHealth from '$lib/components/BudgetHealth.svelte';
	import TransactionTable from '$lib/components/TransactionTable.svelte';
	import PinModal from '$lib/components/PinModal.svelte';
	import AccountsModal from '$lib/components/AccountsModal.svelte';
	import CategoriesModal from '$lib/components/CategoriesModal.svelte';
	import AddTransactionModal from '$lib/components/AddTransactionModal.svelte';
	import type { NavKey, Transaction } from '$lib/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let accounts = $derived(data.accounts);
	let categories = $derived(data.categories);
	let monthlyIncome = $derived(data.monthlyIncome);
	let monthlyExpenses = $derived(data.monthlyExpenses);
	let incomeChangePct = $derived(data.incomeChangePct);
	let expenseChangePct = $derived(data.expenseChangePct);
	let monthlyBudgetCap = $derived(data.monthlyBudgetCap);
	let categorySpend = $derived(data.categorySpend);
	let weeklySpend = $derived(data.weeklySpend);

	let nav = $state<NavKey>('overview');
	let range = $state<30 | 90>(30);
	let mobileNavOpen = $state(false);

	type ModalKey = 'accounts' | 'categories' | 'addTransaction' | 'pin' | null;
	let activeModal = $state<ModalKey>(null);

	let transactions = $derived<Transaction[]>(
		data.transactions.map((tx) => ({
			name: tx.description ?? 'Transaction',
			account: tx.account_name,
			category: tx.category_name,
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

	let accountsTotal = $derived(accounts.reduce((sum, a) => sum + a.balance, 0));

	async function handleSignOut() {
		await authClient.signOut();
		await goto('/login');
	}

	function handleToggleBalance() {
		if (balanceHidden) {
			pin = '';
			pinPending = '';
			pinError = false;
			pinStage = browser && getStoredPin() ? 'unlock' : 'create';
			activeModal = 'pin';
		} else {
			balanceHidden = true;
		}
	}

	function unlockBalance() {
		balanceHidden = false;
		activeModal = null;
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

<div class="flex min-h-screen text-ink">
	<Sidebar
		{nav}
		accountCount={accounts.length}
		categoryCount={categories.length}
		onNav={(key) => (nav = key)}
		onManageAccounts={() => (activeModal = 'accounts')}
		onManageCategories={() => (activeModal = 'categories')}
		onSignOut={handleSignOut}
		open={mobileNavOpen}
		onClose={() => (mobileNavOpen = false)}
	/>

	<main class="flex min-w-0 flex-1 flex-col">
		<DashboardHeader
			title="Overview"
			subtitle="February 2026 · synced 4 minutes ago"
			onAddTransaction={() => (activeModal = 'addTransaction')}
			onToggleNav={() => (mobileNavOpen = true)}
		/>

		<div class="flex flex-col gap-4 px-4 pt-5 pb-8 sm:gap-5 sm:px-6 sm:pt-6.5 sm:pb-10 lg:px-8">
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
				<CategoryChart
					categories={categorySpend}
					{range}
					onSetRange={(r) => (range = r)}
				/>
				<BudgetHealth {weeklySpend} {monthlyExpenses} {monthlyBudgetCap} />
			</section>

			<TransactionTable {transactions} />
		</div>
	</main>
</div>

<AccountsModal
	open={activeModal === 'accounts'}
	{accounts}
	onClose={() => (activeModal = null)}
	errorMessage={form?.message}
/>

<CategoriesModal
	open={activeModal === 'categories'}
	{categories}
	onClose={() => (activeModal = null)}
	errorMessage={form?.message}
/>

<PinModal
	open={activeModal === 'pin'}
	{pin}
	mode={pinStage}
	error={pinError}
	onPressKey={handlePressKey}
	onClose={() => (activeModal = null)}
	onReset={handlePinReset}
/>

<AddTransactionModal
	open={activeModal === 'addTransaction'}
	{accounts}
	{categories}
	onClose={() => (activeModal = null)}
	errorMessage={form?.message}
/>
