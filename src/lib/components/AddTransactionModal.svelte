<script lang="ts">
	import { Paperclip, Import } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from '$lib/components/ui/sonner';
	import { pending } from '$lib/pending.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import { ALLOWED_RECEIPT_TYPES, MAX_RECEIPT_BYTES } from '$lib/schema';
	import type { Account, Category } from '$lib/types';

	interface Props {
		open: boolean;
		accounts: Account[];
		categories: Category[];
		onClose: () => void;
		onBulkImport?: () => void;
	}

	let { open, accounts, categories, onClose, onBulkImport }: Props = $props();

	let formEl = $state<HTMLFormElement | null>(null);
	let fileInputEl = $state<HTMLInputElement | null>(null);
	let receiptFileName = $state('');
	let submitting = $state(false);
	let txType = $state<'expense' | 'income'>('expense');
	let errorMessage = $state('');

	function today() {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	let txDate = $state(today());
	let accountId = $state('');
	let categoryId = $state('');

	function handleFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) {
			receiptFileName = '';
			return;
		}

		if (file.size > MAX_RECEIPT_BYTES) {
			input.value = '';
			receiptFileName = '';
			toast.error('Receipt must be smaller than 10 MB');
			return;
		}

		if (!(file.type in ALLOWED_RECEIPT_TYPES)) {
			input.value = '';
			receiptFileName = '';
			toast.error('Receipt must be a PNG, JPEG, or PDF file');
			return;
		}

		receiptFileName = file.name;
	}

	function resetForm() {
		formEl?.reset();
		receiptFileName = '';
		txType = 'expense';
		txDate = today();
		accountId = '';
		categoryId = '';
		errorMessage = '';
	}

	function handleCancel() {
		resetForm();
		onClose();
	}

	function handleSwitchToBulkImport() {
		resetForm();
		onBulkImport?.();
	}
</script>

<Dialog.Root {open} onOpenChange={(next) => !next && handleCancel()}>
	<Dialog.Content>
		<Dialog.Header>
			<div>
				<Dialog.Title>Add transaction</Dialog.Title>
				<Dialog.Description>Logged to your personal ledger with an audit entry.</Dialog.Description>
			</div>
			{#if onBulkImport}
				<button
					type="button"
					onclick={handleSwitchToBulkImport}
					class="flex flex-none items-center gap-1.25 pt-0.5 text-[11.5px] font-semibold text-accent-hover hover:underline"
				>
					<Import size={12} strokeWidth={2.2} />
					Bulk import instead
				</button>
			{/if}
		</Dialog.Header>
		{#if errorMessage}
			<div class="rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-xs text-red">
				{errorMessage}
			</div>
		{/if}
		<form
			bind:this={formEl}
			method="POST"
			action="/?/addTransaction"
			enctype="multipart/form-data"
			class="flex flex-col gap-3.75"
			use:enhance={() => {
				submitting = true;
				pending.start('transactions');
				return async ({ result, update }) => {
					submitting = false;
					errorMessage =
						result.type === 'failure'
							? String((result.data as Record<string, unknown> | undefined)?.message ?? 'Something went wrong')
							: '';
					if (result.type === 'success') {
						resetForm();
						onClose();
					}
					await update();
					pending.end('transactions');
				};
			}}
		>
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold text-dim">Type</span>
				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						onclick={() => (txType = 'expense')}
						aria-pressed={txType === 'expense'}
						class="rounded-lg border px-2.75 py-2 text-[13px] font-semibold transition-colors duration-100 {txType ===
						'expense'
							? 'border-ink bg-panel-strong text-ink'
							: 'border-border-strong bg-bg text-dim'}"
					>
						Expense
					</button>
					<button
						type="button"
						onclick={() => (txType = 'income')}
						aria-pressed={txType === 'income'}
						class="rounded-lg border px-2.75 py-2 text-[13px] font-semibold transition-colors duration-100 {txType ===
						'income'
							? 'border-green bg-green/12 text-green'
							: 'border-border-strong bg-bg text-dim'}"
					>
						Income
					</button>
				</div>
				<input type="hidden" name="type" value={txType} />
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="tx-description" class="text-xs font-semibold text-dim">Description</label>
				<input
					id="tx-description"
					name="description"
					placeholder="e.g. Whole Foods"
					class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent focus:ring-3 focus:ring-accent/18"
				/>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<label for="tx-amount" class="text-xs font-semibold text-dim">Amount</label>
					<input
						id="tx-amount"
						name="amount"
						type="number"
						step="0.01"
						min="0.01"
						required
						placeholder="0.00"
						class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent focus:ring-3 focus:ring-accent/18"
					/>
				</div>
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-dim">Date</span>
					<DatePicker name="date" bind:value={txDate} required class="w-full" />
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
			<label
				for="tx-receipt"
				class="flex cursor-pointer items-center gap-2.75 rounded-[10px] border border-dashed border-border-hover bg-panel px-3.75 py-3.75 transition-colors duration-150 hover:border-accent hover:bg-panel-2"
			>
				<Paperclip size={17} strokeWidth={1.9} class="text-subtle" />
				<div class="min-w-0">
					<div class="truncate text-[12.5px] font-semibold">
						{receiptFileName || 'Attach receipt image'}
					</div>
					<div class="mt-0.5 text-[11.5px] text-muted">Stored privately with this transaction</div>
				</div>
			</label>
			<input
				bind:this={fileInputEl}
				id="tx-receipt"
				name="receipt"
				type="file"
				accept="image/png, image/jpeg, application/pdf"
				class="sr-only"
				onchange={handleFileChange}
			/>
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
					{submitting ? 'Saving…' : 'Save transaction'}
				</button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
