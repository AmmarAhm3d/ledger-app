<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import type { Account, Category } from '$lib/types';
	import type { SearchResult } from '$lib/search-transactions';

	interface Props {
		transaction: SearchResult | null;
		accounts: Account[];
		categories: Category[];
		onClose: () => void;
	}

	let { transaction, accounts, categories, onClose }: Props = $props();

	let submitting = $state(false);
	let errorMessage = $state('');

	let description = $state('');
	let amount = $state('');
	let date = $state('');
	let accountId = $state('');
	let categoryId = $state('');

	$effect(() => {
		if (!transaction) return;
		description = transaction.description ?? '';
		amount = String(transaction.amount);
		date = transaction.date;
		accountId = String(transaction.account_id);
		categoryId = transaction.category_id ? String(transaction.category_id) : '';
		errorMessage = '';
	});

	function handleCancel() {
		errorMessage = '';
		onClose();
	}
</script>

<Dialog.Root open={!!transaction} onOpenChange={(next) => !next && handleCancel()}>
	<Dialog.Content>
		<div>
			<Dialog.Title>Edit transaction</Dialog.Title>
			<Dialog.Description>Found from header search — changes save to your ledger.</Dialog.Description>
		</div>
		{#if errorMessage}
			<div class="rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-xs text-red">
				{errorMessage}
			</div>
		{/if}
		{#if transaction}
			<form
				method="POST"
				action="/transactions?/updateTransaction"
				class="flex flex-col gap-3.75"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						errorMessage =
							result.type === 'failure'
								? String(
										(result.data as Record<string, unknown> | undefined)?.message ??
											'Something went wrong'
									)
								: '';
						if (result.type === 'success') onClose();
						await update({ reset: false });
					};
				}}
			>
				<input type="hidden" name="id" value={transaction.id} />
				<div class="flex flex-col gap-1.5">
					<label for="edit-tx-description" class="text-xs font-semibold text-dim">Description</label>
					<input
						id="edit-tx-description"
						name="description"
						bind:value={description}
						placeholder="e.g. Whole Foods"
						class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent focus:ring-3 focus:ring-accent/18"
					/>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5">
						<label for="edit-tx-amount" class="text-xs font-semibold text-dim">Amount</label>
						<input
							id="edit-tx-amount"
							name="amount"
							type="number"
							step="0.01"
							required
							bind:value={amount}
							class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent focus:ring-3 focus:ring-accent/18"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-dim">Date</span>
						<DatePicker name="date" bind:value={date} required class="w-full" />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-dim">Account</span>
						<Select.Root type="single" name="account_id" required bind:value={accountId}>
							<Select.Trigger>
								<Select.Value placeholder="Select account" />
							</Select.Trigger>
							<Select.Content>
								{#each accounts as account (account.id)}
									<Select.Item value={String(account.id)} label={account.name} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-dim">Category</span>
						<Select.Root type="single" name="category_id" required bind:value={categoryId}>
							<Select.Trigger>
								<Select.Value placeholder="Select category" />
							</Select.Trigger>
							<Select.Content>
								{#each categories as category (category.id)}
									<Select.Item value={String(category.id)} label={category.name} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<Dialog.Footer>
					<button
						type="button"
						onclick={handleCancel}
						class="rounded-[9px] border border-border-strong bg-transparent px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors duration-100 hover:bg-panel-strong"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={submitting}
						class="rounded-[9px] bg-ink px-4 py-2 text-[13px] font-semibold text-bg transition-colors duration-150 hover:bg-dim disabled:opacity-60"
					>
						{submitting ? 'Saving…' : 'Save changes'}
					</button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
