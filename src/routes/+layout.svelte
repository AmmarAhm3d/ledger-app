<script lang="ts">
	import './layout.css';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import DashboardHeader from '$lib/components/DashboardHeader.svelte';
	import AccountsModal from '$lib/components/AccountsModal.svelte';
	import AddTransactionModal from '$lib/components/AddTransactionModal.svelte';
	import TransferModal from '$lib/components/TransferModal.svelte';
	import BulkImportModal from '$lib/components/BulkImportModal.svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let mobileNavOpen = $state(false);

	type ModalKey = 'accounts' | 'addTransaction' | 'transfer' | 'bulkImport' | null;
	let activeModal = $state<ModalKey>(null);

	async function handleSignOut() {
		await authClient.signOut();
		await goto('/login');
	}
</script>

{#if data.user}
	<div class="flex min-h-screen text-ink">
		<Sidebar
			accountCount={data.accounts.length}
			categoryCount={data.categories.length}
			onManageAccounts={() => (activeModal = 'accounts')}
			onSignOut={handleSignOut}
			open={mobileNavOpen}
			onClose={() => (mobileNavOpen = false)}
		/>

		<main class="flex min-w-0 flex-1 flex-col">
			<DashboardHeader
				title={(page.data.title as string | undefined) ?? 'Overview'}
				subtitle={(page.data.subtitle as string | undefined) ?? ''}
				onAddTransaction={() => (activeModal = 'addTransaction')}
				onTransfer={() => (activeModal = 'transfer')}
				onBulkImport={() => (activeModal = 'bulkImport')}
				onToggleNav={() => (mobileNavOpen = true)}
			/>

			<div
				class="flex flex-col gap-4 px-4 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:gap-5 sm:px-6 sm:pt-6.5 sm:pb-[calc(2.5rem+env(safe-area-inset-bottom))] lg:px-8"
			>
				{@render children()}
			</div>
		</main>
	</div>

	<AccountsModal
		open={activeModal === 'accounts'}
		accounts={data.accounts}
		onClose={() => (activeModal = null)}
	/>

	<AddTransactionModal
		open={activeModal === 'addTransaction'}
		accounts={data.accounts}
		categories={data.categories}
		onClose={() => (activeModal = null)}
		onBulkImport={() => (activeModal = 'bulkImport')}
	/>

	<TransferModal
		open={activeModal === 'transfer'}
		accounts={data.accounts}
		onClose={() => (activeModal = null)}
	/>

	<BulkImportModal
		open={activeModal === 'bulkImport'}
		accounts={data.accounts}
		categories={data.categories}
		onClose={() => (activeModal = null)}
	/>
{:else}
	{@render children()}
{/if}
