<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Account } from '$lib/types';

	interface Props {
		open: boolean;
		accounts: Account[];
		onClose: () => void;
	}

	let { open, accounts, onClose }: Props = $props();

	let formEl = $state<HTMLFormElement | null>(null);
	let submitting = $state(false);
	let fromAccountId = $state('');
	let toAccountId = $state('');
	let errorMessage = $state('');

	function today() {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function handleCancel() {
		formEl?.reset();
		fromAccountId = '';
		toAccountId = '';
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
				<div class="text-[15.5px] font-semibold tracking-tight">Transfer between accounts</div>
				<div class="mt-0.5 text-[12.5px] text-muted">
					Moves money between two of your accounts as a linked pair of ledger entries.
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
				action="/?/transfer"
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
							fromAccountId = '';
							toAccountId = '';
							onClose();
						}
						await update();
					};
				}}
			>
				<div class="grid grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5">
						<label for="transfer-from" class="text-xs font-semibold text-dim">From account</label>
						<select
							id="transfer-from"
							name="from_account_id"
							required
							bind:value={fromAccountId}
							class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none"
						>
							<option value="" disabled selected>Select account</option>
							{#each accounts as account (account.id)}
								<option value={account.id} disabled={String(account.id) === toAccountId}
									>{account.name}</option
								>
							{/each}
						</select>
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="transfer-to" class="text-xs font-semibold text-dim">To account</label>
						<select
							id="transfer-to"
							name="to_account_id"
							required
							bind:value={toAccountId}
							class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none"
						>
							<option value="" disabled selected>Select account</option>
							{#each accounts as account (account.id)}
								<option value={account.id} disabled={String(account.id) === fromAccountId}
									>{account.name}</option
								>
							{/each}
						</select>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5">
						<label for="transfer-amount" class="text-xs font-semibold text-dim">Amount</label>
						<input
							id="transfer-amount"
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
						<label for="transfer-date" class="text-xs font-semibold text-dim">Date</label>
						<input
							id="transfer-date"
							name="date"
							type="date"
							required
							value={today()}
							class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent focus:ring-3 focus:ring-accent/18"
						/>
					</div>
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="transfer-description" class="text-xs font-semibold text-dim"
						>Note (optional)</label
					>
					<input
						id="transfer-description"
						name="description"
						placeholder="e.g. Move to savings"
						class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent focus:ring-3 focus:ring-accent/18"
					/>
				</div>
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
						{submitting ? 'Transferring…' : 'Transfer funds'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
