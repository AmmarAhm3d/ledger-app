<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import DashboardHeader from '$lib/components/DashboardHeader.svelte';
	import KPICards from '$lib/components/KPICards.svelte';
	import CategoryChart from '$lib/components/CategoryChart.svelte';
	import BudgetHealth from '$lib/components/BudgetHealth.svelte';
	import TransactionTable from '$lib/components/TransactionTable.svelte';
	import PinModal from '$lib/components/PinModal.svelte';
	import AccountsModal from '$lib/components/AccountsModal.svelte';
	import AddTransactionModal from '$lib/components/AddTransactionModal.svelte';
	import {
		initialAccounts,
		monthlyIncome,
		monthlyExpenses,
		monthlyBudgetCap,
		categorySpend,
		weeklySpend,
		transactions
	} from '$lib/data';
	import type { Account, AccountType, NavKey } from '$lib/types';

	let nav = $state<NavKey>('overview');
	let range = $state<30 | 90>(30);
	let mobileNavOpen = $state(false);

	let accounts = $state<Account[]>(initialAccounts);
	let accountsOpen = $state(false);

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

	function handleUpdateAccountAmount(id: number, balance: number) {
		accounts = accounts.map((a) => (a.id === id ? { ...a, balance } : a));
	}

	function handleRemoveAccount(id: number) {
		accounts = accounts.filter((a) => a.id !== id);
	}

	function handleAddAccount(name: string, type: AccountType, balance: number) {
		accounts = [...accounts, { id: Date.now(), name, type, balance }];
	}
</script>

<div class="flex min-h-screen text-ink">
	<Sidebar
		{nav}
		accountCount={accounts.length}
		onNav={(key) => (nav = key)}
		onManageAccounts={() => (accountsOpen = true)}
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
	onUpdateAmount={handleUpdateAccountAmount}
	onRemove={handleRemoveAccount}
	onAdd={handleAddAccount}
/>

<PinModal open={pinOpen} {pin} onPressKey={handlePressKey} onClose={() => (pinOpen = false)} />

<AddTransactionModal
	open={addTransactionOpen}
	retentionDays={30}
	onClose={() => (addTransactionOpen = false)}
/>
