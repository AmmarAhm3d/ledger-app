<script lang="ts">
	import { Paperclip } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import type { Account, Category } from '$lib/types';

	interface Props {
		open: boolean;
		accounts: Account[];
		categories: Category[];
		onClose: () => void;
	}

	let { open, accounts, categories, onClose }: Props = $props();

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

	const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
	const ALLOWED_RECEIPT_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];

	function handleFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) {
			receiptFileName = '';
			return;
		}

		if (file.size >= MAX_RECEIPT_BYTES) {
			input.value = '';
			receiptFileName = '';
			alert('Receipt must be smaller than 5 MB');
			return;
		}

		if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
			input.value = '';
			receiptFileName = '';
			alert('Receipt must be a PNG, JPEG, or PDF file');
			return;
		}

		receiptFileName = file.name;
	}

	function handleCancel() {
		formEl?.reset();
		receiptFileName = '';
		txType = 'expense';
		errorMessage = '';
		onClose();
	}
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && handleCancel()} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={handleCancel}
		role="presentation"
		class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			onclick={(e) => e.stopPropagation()}
			role="presentation"
			class="flex max-h-[90vh] w-full max-w-108 flex-col gap-3.75 overflow-y-auto rounded-2xl border border-border-strong bg-panel-2 p-5 shadow-2xl"
		>
			<div>
				<div class="text-[15.5px] font-semibold tracking-tight">Add transaction</div>
				<div class="mt-0.5 text-[12.5px] text-muted">
					Logged to your personal ledger with an audit entry.
				</div>
			</div>
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
					return async ({ result, update }) => {
						submitting = false;
						errorMessage =
							result.type === 'failure'
								? String((result.data as Record<string, unknown> | undefined)?.message ?? 'Something went wrong')
								: '';
						if (result.type === 'success') {
							formEl?.reset();
							receiptFileName = '';
							txType = 'expense';
							onClose();
						}
						await update();
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
							required
							placeholder="0.00"
							class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent focus:ring-3 focus:ring-accent/18"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="tx-date" class="text-xs font-semibold text-dim">Date</label>
						<input
							id="tx-date"
							name="date"
							type="date"
							required
							value={today()}
							class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent focus:ring-3 focus:ring-accent/18"
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5">
						<label for="tx-account" class="text-xs font-semibold text-dim">Account</label>
						<select
							id="tx-account"
							name="account_id"
							required
							class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none"
						>
							{#each accounts as account (account.id)}
								<option value={account.id}>{account.name}</option>
							{/each}
						</select>
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="tx-category" class="text-xs font-semibold text-dim">Category</label>
						<select
							id="tx-category"
							name="category_id"
							required
							class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none"
						>
							{#each categories as category (category.id)}
								<option value={category.id}>{category.name}</option>
							{/each}
						</select>
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
				<div class="mt-0.5 flex justify-end gap-2.25">
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
				</div>
			</form>
		</div>
	</div>
{/if}
