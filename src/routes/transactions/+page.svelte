<script lang="ts">
	import { enhance } from '$app/forms';
	import { Paperclip, Trash2 } from '@lucide/svelte';
	import { formatPKR } from '$lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let selectedIds = $state(new Set<number>());
	let deleting = $state(false);

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
</script>

<section class="rounded-[13px] border border-border bg-panel overflow-hidden">
	<div class="flex items-center gap-3 border-b border-border px-4 py-3.5 sm:px-4.5 sm:py-4">
		<div class="text-sm font-semibold tracking-tight">All transactions</div>
		<span class="rounded-md bg-panel-hover px-1.5 py-0.5 font-mono text-[11px] text-subtle">
			{data.transactions.length}
		</span>
		{#if selectedIds.size > 0}
			<form
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
				<button
					type="submit"
					disabled={deleting}
					class="flex items-center gap-1.5 rounded-[9px] border border-red/40 bg-red/10 px-3 py-1.5 text-[12.5px] font-semibold text-red transition-colors duration-100 hover:bg-red/18 disabled:opacity-60"
				>
					<Trash2 size={13} strokeWidth={1.9} />
					Delete {selectedIds.size} selected
				</button>
			</form>
		{/if}
	</div>

	{#if form?.message}
		<div class="border-b border-border px-4.5 py-2.5 text-xs text-red">{form.message}</div>
	{/if}

	<div class="overflow-x-auto">
		<div class="min-w-[820px]">
			<div
				class="grid grid-cols-[28px_minmax(0,1.8fr)_1fr_1fr_0.9fr_0.7fr_1fr] items-center gap-3 border-b border-border bg-panel-2 px-4.5 py-2.5 text-[11px] font-semibold tracking-wider text-muted uppercase"
			>
				<input
					type="checkbox"
					aria-label="Select all"
					checked={allSelected}
					onchange={toggleAll}
					disabled={selectableIds.length === 0}
				/>
				<div>Description</div>
				<div>Account</div>
				<div>Category</div>
				<div>Date</div>
				<div>Receipt</div>
				<div class="text-right">Amount</div>
			</div>

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
					<form
						method="POST"
						action="?/updateTransaction"
						use:enhance={() => {
							return async ({ update }) => {
								await update({ reset: false });
							};
						}}
						class="grid grid-cols-[28px_minmax(0,1.8fr)_1fr_1fr_0.9fr_0.7fr_1fr] items-center gap-3 border-b border-panel-hover px-4.5 py-2 transition-colors duration-100 hover:bg-panel-2"
					>
						<input type="hidden" name="id" value={tx.id} />
						<input
							type="checkbox"
							aria-label={`Select ${tx.description ?? 'transaction'}`}
							checked={selectedIds.has(tx.id)}
							onchange={() => toggleOne(tx.id)}
						/>
						<input
							name="description"
							value={tx.description ?? ''}
							placeholder="Transaction"
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="min-w-0 truncate rounded-lg border border-transparent bg-transparent px-1.5 py-1.5 text-[13px] font-medium text-ink outline-none focus:border-accent focus:bg-panel"
						/>
						<div class="truncate text-[12px] text-muted">{tx.account_name}</div>
						<select
							name="category_id"
							value={tx.category_id}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="min-w-0 rounded-lg border border-transparent bg-transparent px-1.5 py-1.5 text-[12px] text-dim outline-none focus:border-accent focus:bg-panel"
						>
							{#each data.categories as category (category.id)}
								<option value={category.id}>{category.name}</option>
							{/each}
						</select>
						<input
							name="date"
							type="date"
							value={tx.date}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="rounded-lg border border-transparent bg-transparent px-1.5 py-1.5 font-mono text-xs text-muted outline-none focus:border-accent focus:bg-panel"
						/>
						<div>
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
						</div>
						<input
							name="amount"
							type="number"
							step="0.01"
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
</section>
