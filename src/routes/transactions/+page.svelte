<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import { Paperclip, Repeat, Search, Trash2 } from '@lucide/svelte';
	import { formatPKR } from '$lib/format';
	import { pending } from '$lib/pending.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import ConfirmDeleteDialog from '$lib/components/ConfirmDeleteDialog.svelte';
	import Checkbox from '$lib/components/ui/checkbox.svelte';
	import * as Select from '$lib/components/ui/select';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let linkedIds = $derived(new Set(data.linkedTransactionIds));

	let selectedIds = $state(new Set<number>());
	let deleting = $state(false);
	let savingIds = $state(new Set<number>());
	let deleteFormEl = $state<HTMLFormElement | null>(null);

	let selectableIds = $derived(data.transactions.filter((tx) => !tx.is_transfer).map((tx) => tx.id));
	let allSelected = $derived(
		selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))
	);

	function toggleAll() {
		selectedIds = allSelected ? new Set() : new Set(selectableIds);
	}

	function toggleOne(id: number) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}

	let searchInput = $state('');
	let searchDebounce: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		searchInput = data.filters.search;
	});

	function updateParams(updates: Record<string, string | null>, resetPage = true) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [key, value] of Object.entries(updates)) {
			if (value === null || value === '') params.delete(key);
			else params.set(key, value);
		}
		if (resetPage) params.delete('page');
		goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	function onSearchInput() {
		clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => {
			updateParams({ search: searchInput.trim() || null });
		}, 350);
	}

	function goToPage(targetPage: number) {
		updateParams({ page: targetPage > 1 ? String(targetPage) : null }, false);
	}

	let rangeStart = $derived(
		data.pagination.totalCount === 0 ? 0 : (data.pagination.page - 1) * data.pagination.limit + 1
	);
	let rangeEnd = $derived(
		Math.min(data.pagination.page * data.pagination.limit, data.pagination.totalCount)
	);
</script>

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
						<form method="POST" action="/subscriptions?/confirmSubscriptionPayment" use:enhance>
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

<section class="rounded-[13px] border border-border bg-panel overflow-hidden">
	<div class="flex items-center gap-3 border-b border-border px-4 py-3.5 sm:px-4.5 sm:py-4">
		<div class="text-sm font-semibold tracking-tight">All transactions</div>
		<span class="rounded-md bg-panel-hover px-1.5 py-0.5 font-mono text-[11px] text-subtle">
			{data.transactions.length}
		</span>
		{#if selectedIds.size > 0}
			<form
				bind:this={deleteFormEl}
				method="POST"
				action="?/deleteTransactions"
				use:enhance={() => {
					deleting = true;
					return async ({ update }) => {
						deleting = false;
						selectedIds = new Set();
						await update();
					};
				}}
				class="ml-auto flex items-center gap-2"
			>
				{#each selectedIds as id (id)}
					<input type="hidden" name="ids" value={id} />
				{/each}
				<ConfirmDeleteDialog
					title="Delete {selectedIds.size} selected transaction{selectedIds.size === 1 ? '' : 's'}?"
					description="This can't be undone. Account balances will be adjusted to reflect the removal."
					confirmLabel="Delete"
					onConfirm={() => deleteFormEl?.requestSubmit()}
					triggerClass="flex items-center gap-1.5 rounded-[9px] border border-red/40 bg-red/10 px-3 py-1.5 text-[12.5px] font-semibold text-red transition-colors duration-100 hover:bg-red/18 disabled:opacity-60"
				>
					{#snippet trigger()}
						<Trash2 size={13} strokeWidth={1.9} />
						Delete {selectedIds.size} selected
					{/snippet}
				</ConfirmDeleteDialog>
			</form>
		{/if}
	</div>

	<div
		class="flex flex-col gap-2.5 border-b border-border px-4.5 py-3 sm:flex-row sm:items-center"
	>
		<div class="relative flex-1 sm:max-w-xs">
			<Search
				size={14}
				strokeWidth={2}
				class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted"
			/>
			<input
				type="search"
				placeholder="Search descriptions..."
				value={searchInput}
				oninput={(e) => {
					searchInput = e.currentTarget.value;
					onSearchInput();
				}}
				class="w-full rounded-[9px] border border-border bg-panel-2 py-1.5 pr-2.5 pl-8 text-[12.5px] text-ink outline-none focus:border-accent"
			/>
		</div>
		<Select.Root
			type="single"
			value={data.filters.category ? String(data.filters.category) : ''}
			onValueChange={(v) => updateParams({ category: v || null })}
		>
			<Select.Trigger class="w-auto min-w-40 py-1.5 text-[12.5px] text-dim">
				<Select.Value placeholder="All categories" />
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="" label="All categories" />
				{#each data.categories as category (category.id)}
					<Select.Item value={String(category.id)} label={category.name} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	{#if form?.message}
		<div class="border-b border-border px-4.5 py-2.5 text-xs text-red">{form.message}</div>
	{/if}

	<div class="overflow-x-auto">
		<div class="min-w-[820px]">
			<div
				class="grid grid-cols-[28px_minmax(0,1.8fr)_1fr_1fr_0.9fr_0.7fr_1fr] items-center gap-3 border-b border-border bg-panel-2 px-4.5 py-2.5 text-[11px] font-semibold tracking-wider text-muted uppercase"
			>
				<Checkbox
					aria-label="Select all"
					checked={allSelected}
					onCheckedChange={toggleAll}
					disabled={selectableIds.length === 0}
				/>
				<div>Description</div>
				<div>Account</div>
				<div>Category</div>
				<div>Date</div>
				<div>Receipt</div>
				<div class="text-right">Amount</div>
			</div>

			{#if pending.isPending('transactions')}
				<div
					class="grid grid-cols-[28px_minmax(0,1.8fr)_1fr_1fr_0.9fr_0.7fr_1fr] items-center gap-3 border-b border-panel-hover px-4.5 py-3"
				>
					<div></div>
					<Skeleton width="70%" height="0.85rem" />
					<Skeleton width="60%" height="0.75rem" />
					<Skeleton width="50%" height="0.75rem" />
					<Skeleton width="4rem" height="0.75rem" />
					<div></div>
					<Skeleton width="3.5rem" height="0.85rem" class="ml-auto" />
				</div>
			{/if}
			{#each data.transactions as tx (tx.id)}
				{#if tx.is_transfer}
					<div
						class="grid grid-cols-[28px_minmax(0,1.8fr)_1fr_1fr_0.9fr_0.7fr_1fr] items-center gap-3 border-b border-panel-hover px-4.5 py-3 opacity-70"
					>
						<div></div>
						<div class="truncate text-[13px] font-medium">{tx.description ?? 'Transfer'}</div>
						<div class="truncate text-[12px] text-muted">{tx.account_name}</div>
						<div>
							<span
								class="inline-block rounded-md border border-border-strong bg-panel-2 px-2 py-0.5 text-[11.5px] font-medium text-dim"
							>
								Transfer
							</span>
						</div>
						<div class="font-mono text-xs text-muted">{tx.date}</div>
						<div></div>
						<div
							class="text-right font-mono text-[13px] font-medium"
							class:text-green={tx.amount > 0}
							class:text-ink={tx.amount <= 0}
						>
							{(tx.amount > 0 ? '+' : '−') + formatPKR(Math.abs(tx.amount))}
						</div>
					</div>
				{:else}
					{@const rowFormEl = { current: null as HTMLFormElement | null }}
					<form
						bind:this={rowFormEl.current}
						method="POST"
						action="?/updateTransaction"
						use:enhance={() => {
							savingIds = new Set(savingIds).add(tx.id);
							return async ({ update }) => {
								await update({ reset: false });
								const next = new Set(savingIds);
								next.delete(tx.id);
								savingIds = next;
							};
						}}
						class="grid grid-cols-[28px_minmax(0,1.8fr)_1fr_1fr_0.9fr_0.7fr_1fr] items-center gap-3 border-b border-panel-hover px-4.5 py-2 transition-colors duration-100 hover:bg-panel-2"
						class:opacity-50={savingIds.has(tx.id)}
						class:pointer-events-none={savingIds.has(tx.id)}
					>
						<input type="hidden" name="id" value={tx.id} />
						<input type="hidden" name="transaction_id" value={tx.id} />
						<Checkbox
							aria-label={`Select ${tx.description ?? 'transaction'}`}
							checked={selectedIds.has(tx.id)}
							onCheckedChange={() => toggleOne(tx.id)}
						/>
						<input
							name="description"
							value={tx.description ?? ''}
							placeholder="Transaction"
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="min-w-0 truncate rounded-lg border border-transparent bg-transparent px-1.5 py-1.5 text-[13px] font-medium text-ink outline-none focus:border-accent focus:bg-panel"
						/>
						<Select.Root
							type="single"
							name="account_id"
							value={String(tx.account_id)}
							onValueChange={async () => {
								await tick();
								rowFormEl.current?.requestSubmit();
							}}
						>
							<Select.Trigger class="h-auto min-w-0 truncate border-none bg-transparent px-1.5 py-1.5 text-[12px] text-muted focus:ring-0">
								<Select.Value />
							</Select.Trigger>
							<Select.Content>
								{#each data.accounts as account (account.id)}
									<Select.Item value={String(account.id)} label={account.name} />
								{/each}
							</Select.Content>
						</Select.Root>
						<Select.Root
							type="single"
							name="category_id"
							value={String(tx.category_id)}
							onValueChange={async () => {
								await tick();
								rowFormEl.current?.requestSubmit();
							}}
						>
							<Select.Trigger class="h-auto min-w-0 border-none bg-transparent px-1.5 py-1.5 text-[12px] text-dim focus:ring-0">
								<Select.Value />
							</Select.Trigger>
							<Select.Content>
								{#each data.categories as category (category.id)}
									<Select.Item value={String(category.id)} label={category.name} />
								{/each}
							</Select.Content>
						</Select.Root>
						<DatePicker
							name="date"
							value={tx.date}
							required
							onValueChange={async () => {
								await tick();
								rowFormEl.current?.requestSubmit();
							}}
							class="border-none bg-transparent px-1.5 py-1.5 font-mono text-xs text-muted focus:ring-0"
						/>
						<div class="flex items-center gap-1.5">
							{#if tx.has_receipt && tx.receipt_url}
								<a
									href={`/api/receipts/${tx.id}`}
									target="_blank"
									rel="noopener noreferrer"
									title="View receipt"
									class="inline-flex items-center gap-1 rounded-md border border-accent/32 bg-accent/14 px-1.5 py-0.5 font-mono text-[10.5px] text-accent-hover hover:bg-accent/22"
								>
									<Paperclip size={11} strokeWidth={2} />
									View
								</a>
							{/if}
							{#if !tx.is_transfer && !linkedIds.has(tx.id)}
								<button
									type="submit"
									formaction="/subscriptions?/createSubscriptionFromTransaction"
									title="Track as recurring subscription"
									class="inline-flex h-6 w-6 flex-none items-center justify-center rounded-md text-muted transition-colors duration-100 hover:bg-panel-strong hover:text-accent-hover"
								>
									<Repeat size={12} strokeWidth={2} />
								</button>
							{/if}
						</div>
						<input
							name="amount"
							type="number"
							step="0.01"
							required
							value={tx.amount}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="w-full rounded-lg border border-transparent bg-transparent px-1.5 py-1.5 text-right font-mono text-[13px] font-medium outline-none focus:border-accent focus:bg-panel"
							class:text-green={tx.amount > 0}
							class:text-ink={tx.amount <= 0}
						/>
					</form>
				{/if}
			{:else}
				<div class="px-4.5 py-8 text-center text-[12.5px] text-muted">No transactions yet.</div>
			{/each}
		</div>
	</div>

	<div
		class="flex flex-col gap-2.5 border-t border-border px-4.5 py-3 sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="text-[12px] text-muted">
			{#if data.pagination.totalCount > 0}
				Showing {rangeStart}&ndash;{rangeEnd} of {data.pagination.totalCount}
			{:else}
				No transactions
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<button
				type="button"
				disabled={!data.pagination.hasPrev}
				onclick={() => goToPage(data.pagination.page - 1)}
				class="rounded-[9px] border border-border bg-panel-2 px-3 py-1.5 text-[12.5px] font-semibold text-dim transition-colors duration-100 hover:bg-panel-hover disabled:cursor-not-allowed disabled:opacity-40"
			>
				Previous
			</button>
			<span class="font-mono text-[12px] text-muted">
				Page {data.pagination.page} of {data.pagination.totalPages}
			</span>
			<button
				type="button"
				disabled={!data.pagination.hasNext}
				onclick={() => goToPage(data.pagination.page + 1)}
				class="rounded-[9px] border border-border bg-panel-2 px-3 py-1.5 text-[12.5px] font-semibold text-dim transition-colors duration-100 hover:bg-panel-hover disabled:cursor-not-allowed disabled:opacity-40"
			>
				Next
			</button>
		</div>
	</div>
</section>
