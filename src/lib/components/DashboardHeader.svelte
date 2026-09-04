<script lang="ts">
	import { Search, Bell, Plus, Menu, ArrowLeftRight, Import, Loader2, X } from '@lucide/svelte';
	import { formatPKR } from '$lib/format';
	import * as Popover from '$lib/components/ui/popover';
	import Badge from '$lib/components/ui/badge.svelte';
	import type { SearchResult } from '$lib/search-transactions';
	import type { DueSubscription } from '$lib/server/subscriptions';

	function autofocus(node: HTMLElement) {
		node.focus();
	}

	interface Props {
		title: string;
		subtitle: string;
		suggestedTransactions: DueSubscription[];
		onAddTransaction: () => void;
		onTransfer: () => void;
		onBulkImport: () => void;
		onSelectTransaction: (tx: SearchResult) => void;
		onToggleNav?: () => void;
	}

	let {
		title,
		subtitle,
		suggestedTransactions,
		onAddTransaction,
		onTransfer,
		onBulkImport,
		onSelectTransaction,
		onToggleNav
	}: Props = $props();

	let searchQuery = $state('');
	let searchOpen = $state(false);
	let searchLoading = $state(false);
	let searchResults = $state<SearchResult[]>([]);
	let searchDebounce: ReturnType<typeof setTimeout> | undefined;
	let searchRequestId = 0;

	function runSearch(query: string) {
		clearTimeout(searchDebounce);
		if (!query.trim()) {
			searchResults = [];
			searchLoading = false;
			return;
		}
		searchLoading = true;
		searchDebounce = setTimeout(async () => {
			const requestId = ++searchRequestId;
			try {
				const res = await fetch(`/api/search-transactions?q=${encodeURIComponent(query.trim())}`);
				if (!res.ok || requestId !== searchRequestId) return;
				const data = (await res.json()) as { results: SearchResult[] };
				if (requestId === searchRequestId) searchResults = data.results;
			} finally {
				if (requestId === searchRequestId) searchLoading = false;
			}
		}, 300);
	}

	function onSearchInput(e: Event & { currentTarget: HTMLInputElement }) {
		searchQuery = e.currentTarget.value;
		searchOpen = true;
		runSearch(searchQuery);
	}

	function selectResult(tx: SearchResult) {
		if (tx.is_transfer) return;
		onSelectTransaction(tx);
		searchOpen = false;
		mobileSearchOpen = false;
	}

	let bellOpen = $state(false);
	let mobileSearchOpen = $state(false);

	function closeMobileSearch() {
		mobileSearchOpen = false;
		searchOpen = false;
	}
</script>

<header
	class="sticky top-0 z-[5] flex items-center gap-3 border-b border-border bg-bg/85 px-4 py-3.5 backdrop-blur-sm sm:gap-4 sm:px-8 sm:py-4.5"
>
	<button
		type="button"
		onclick={onToggleNav}
		aria-label="Open menu"
		class="flex h-8.5 w-8.5 flex-none items-center justify-center rounded-[9px] border border-border bg-panel text-dim transition-colors duration-100 hover:bg-panel-hover lg:hidden"
	>
		<Menu size={16} strokeWidth={1.9} />
	</button>
	<div class="min-w-0">
		<h1 class="m-0 truncate text-[16.5px] font-semibold tracking-tight sm:text-[19px]">{title}</h1>
		<div class="mt-0.5 truncate text-[11.5px] text-muted sm:text-[12.5px]">{subtitle}</div>
	</div>
	<div class="ml-auto flex items-center gap-2 sm:gap-2.5">
		<button
			type="button"
			onclick={() => (mobileSearchOpen = true)}
			aria-label="Search transactions"
			class="flex h-8.5 w-8.5 flex-none items-center justify-center rounded-[9px] border border-border bg-panel text-dim transition-colors duration-100 hover:bg-panel-hover md:hidden"
		>
			<Search size={15} strokeWidth={1.9} />
		</button>
		<div class="relative hidden md:block">
			<div
				class="flex w-[160px] items-center gap-1.5 rounded-[9px] border border-border bg-panel px-2.5 py-1.5 lg:w-[210px]"
			>
				<Search size={14} strokeWidth={2} class="flex-none text-muted" />
				<input
					type="search"
					aria-label="Search transactions"
					placeholder="Search transactions"
					value={searchQuery}
					oninput={onSearchInput}
					onfocus={() => (searchOpen = true)}
					onkeydown={(e) => e.key === 'Escape' && (searchOpen = false)}
					class="w-full border-none bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
				/>
			</div>
			{#if searchOpen && searchQuery.trim()}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="fixed inset-0 z-40" onclick={() => (searchOpen = false)}></div>
				<div
					class="absolute top-full right-0 z-50 mt-1.5 w-80 overflow-hidden rounded-[13px] border border-border-strong bg-panel-2 p-1 shadow-2xl"
				>
					{@render searchResultsList()}
				</div>
			{/if}
		</div>
		<Popover.Root bind:open={bellOpen}>
			<Popover.Trigger
				aria-label="Notifications"
				class="relative flex h-8.5 w-8.5 flex-none items-center justify-center rounded-[9px] border border-border bg-panel text-dim transition-colors duration-100 hover:bg-panel-hover"
			>
				<Bell size={15} strokeWidth={1.9} />
				{#if suggestedTransactions.length > 0}
					<Badge class="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3"
						>{suggestedTransactions.length}</Badge
					>
				{/if}
			</Popover.Trigger>
			<Popover.Content class="w-80 max-w-[calc(100vw-2rem)] p-1" align="end">
				<div class="px-2.5 pt-2 pb-1.5 text-[12px] font-semibold text-ink">
					Due subscriptions
				</div>
				{#if suggestedTransactions.length === 0}
					<div class="px-2.5 pb-2.5 text-[12px] text-muted">Nothing due right now.</div>
				{:else}
					<div class="flex flex-col gap-1 px-1 pb-1">
						{#each suggestedTransactions as sub (sub.id)}
							<div
								class="flex items-center justify-between gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-panel-hover"
							>
								<div class="min-w-0">
									<div class="truncate text-[12.5px] font-medium text-ink">{sub.name}</div>
									<div class="truncate text-[11px] text-muted">
										Due {sub.next_due_date} · {formatPKR(sub.amount)}
									</div>
								</div>
								<a
									href="/transactions"
									onclick={() => (bellOpen = false)}
									class="flex-none rounded-md border border-accent/40 bg-accent/16 px-2 py-1 text-[11px] font-semibold text-accent-hover transition-colors duration-100 hover:bg-accent/24"
								>
									Log payment
								</a>
							</div>
						{/each}
					</div>
				{/if}
			</Popover.Content>
		</Popover.Root>
		<button
			type="button"
			onclick={onBulkImport}
			aria-label="Bulk import transactions"
			class="hidden items-center gap-1.5 rounded-[9px] border border-border bg-panel px-2.5 py-2 text-[13px] font-semibold text-dim transition-colors duration-100 hover:bg-panel-hover sm:flex sm:px-3.5"
		>
			<Import size={15} strokeWidth={2.2} />
			<span class="hidden lg:inline">Import</span>
		</button>
		<button
			type="button"
			onclick={onTransfer}
			aria-label="Transfer between accounts"
			class="flex items-center gap-1.5 rounded-[9px] border border-border bg-panel px-2.5 py-2 text-[13px] font-semibold text-dim transition-colors duration-100 hover:bg-panel-hover sm:px-3.5"
		>
			<ArrowLeftRight size={15} strokeWidth={2.2} />
			<span class="hidden sm:inline">Transfer</span>
		</button>
		<button
			type="button"
			onclick={onAddTransaction}
			aria-label="Add transaction"
			class="flex items-center gap-1.5 rounded-[9px] bg-ink px-2.5 py-2 text-[13px] font-semibold text-bg transition-colors duration-150 hover:bg-dim active:translate-y-px sm:px-3.5"
		>
			<Plus size={15} strokeWidth={2.2} />
			<span class="hidden sm:inline">Add transaction</span>
		</button>
	</div>
</header>

{#snippet searchResultsList()}
	{#if searchLoading}
		<div class="flex items-center gap-2 px-2.5 py-3 text-[12px] text-muted">
			<Loader2 size={13} strokeWidth={2} class="animate-spin" />
			Searching…
		</div>
	{:else if searchResults.length === 0}
		<div class="px-2.5 py-3 text-[12px] text-muted">No matching transactions.</div>
	{:else}
		{#each searchResults as tx (tx.id)}
			<button
				type="button"
				onclick={() => selectResult(tx)}
				disabled={tx.is_transfer}
				class="flex w-full items-center justify-between gap-2.5 rounded-lg px-2.25 py-2 text-left transition-colors duration-100 hover:bg-panel-hover disabled:cursor-not-allowed disabled:opacity-50"
			>
				<div class="min-w-0">
					<div class="truncate text-[12.5px] font-medium text-ink">
						{tx.description ?? (tx.is_transfer ? 'Transfer' : 'Transaction')}
					</div>
					<div class="truncate text-[11px] text-muted">{tx.account_name} · {tx.date}</div>
				</div>
				<div
					class="flex-none font-mono text-[12.5px] font-medium"
					class:text-green={tx.amount > 0}
					class:text-ink={tx.amount <= 0}
				>
					{(tx.amount > 0 ? '+' : '−') + formatPKR(Math.abs(tx.amount))}
				</div>
			</button>
		{/each}
	{/if}
{/snippet}

{#if mobileSearchOpen}
	<div class="fixed inset-0 z-50 flex flex-col bg-bg md:hidden">
		<div class="flex items-center gap-2 border-b border-border px-4 py-3.5">
			<div
				class="flex flex-1 items-center gap-1.5 rounded-[9px] border border-border bg-panel px-2.5 py-2"
			>
				<Search size={14} strokeWidth={2} class="flex-none text-muted" />
				<input
					type="search"
					use:autofocus
					aria-label="Search transactions"
					placeholder="Search transactions"
					value={searchQuery}
					oninput={onSearchInput}
					onkeydown={(e) => e.key === 'Escape' && closeMobileSearch()}
					class="w-full border-none bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
				/>
			</div>
			<button
				type="button"
				onclick={closeMobileSearch}
				aria-label="Close search"
				class="flex h-8.5 w-8.5 flex-none items-center justify-center rounded-[9px] text-dim transition-colors duration-100 hover:bg-panel-hover"
			>
				<X size={16} strokeWidth={1.9} />
			</button>
		</div>
		{#if searchQuery.trim()}
			<div class="flex-1 overflow-y-auto p-1">
				{@render searchResultsList()}
			</div>
		{/if}
	</div>
{/if}
