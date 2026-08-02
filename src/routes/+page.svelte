<script lang="ts">
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
	import {
		monthlyIncome,
		monthlyExpenses,
		monthlyBudgetCap,
		categorySpend,
		weeklySpend
	} from '$lib/data';
	import type { NavKey, Transaction } from '$lib/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let accounts = $derived(data.accounts);
	let categories = $derived(data.categories);

	let nav = $state<NavKey>('overview');
	let range = $state<30 | 90>(30);
	let mobileNavOpen = $state(false);

	let accountsOpen = $state(false);
	let categoriesOpen = $state(false);

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
	let pinOpen = $state(false);
	let pin = $state('');

	let addTransactionOpen = $state(false);

	let accountsTotal = $derived(accounts.reduce((sum, a) => sum + a.balance, 0));

	function handleToggleBalance() {
		if (balanceHidden) {
			pin = '';
			pinOpen = true;
		} else {
			balanceHidden = true;
		}
	}

	function handlePressKey(key: string) {
		if (key === '⌫') {
			pin = pin.slice(0, -1);
			return;
		}
		const next = (pin + key).slice(0, 4);
		pin = next;
		if (next.length === 4) {
			setTimeout(() => {
				balanceHidden = false;
				pinOpen = false;
				pin = '';
			}, 180);
		}
	}

</script>

<div class="flex min-h-screen text-ink">
	<Sidebar
		{nav}
		accountCount={accounts.length}
		categoryCount={categories.length}
		onNav={(key) => (nav = key)}
		onManageAccounts={() => (accountsOpen = true)}
		onManageCategories={() => (categoriesOpen = true)}
		open={mobileNavOpen}
		onClose={() => (mobileNavOpen = false)}
	/>

	<main class="flex min-w-0 flex-1 flex-col">
		<DashboardHeader
			title="Overview"
			subtitle="February 2026 · synced 4 minutes ago"
			onAddTransaction={() => (addTransactionOpen = true)}
			onToggleNav={() => (mobileNavOpen = true)}
		/>

		<div class="flex flex-col gap-4 px-4 pt-5 pb-8 sm:gap-5 sm:px-6 sm:pt-6.5 sm:pb-10 lg:px-8">
			<KPICards
				{accountsTotal}
				{balanceHidden}
				{monthlyIncome}
				{monthlyExpenses}
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
	open={accountsOpen}
	{accounts}
	onClose={() => (accountsOpen = false)}
	errorMessage={form?.message}
/>

<CategoriesModal
	open={categoriesOpen}
	{categories}
	onClose={() => (categoriesOpen = false)}
	errorMessage={form?.message}
/>

<PinModal open={pinOpen} {pin} onPressKey={handlePressKey} onClose={() => (pinOpen = false)} />

<AddTransactionModal
	open={addTransactionOpen}
	{accounts}
	{categories}
	onClose={() => (addTransactionOpen = false)}
	errorMessage={form?.message}
/>
