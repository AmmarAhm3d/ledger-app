<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import { toast } from '$lib/components/ui/sonner';
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

	let transferDate = $state(today());

	function handleCancel() {
		formEl?.reset();
		fromAccountId = '';
		toAccountId = '';
		transferDate = today();
		errorMessage = '';
		onClose();
	}
</script>

<Dialog.Root {open} onOpenChange={(next) => !next && handleCancel()}>
	<Dialog.Content>
		<div>
			<Dialog.Title>Transfer between accounts</Dialog.Title>
			<Dialog.Description>
				Moves money between two of your accounts as a linked pair of ledger entries.
			</Dialog.Description>
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
						toast.success('Transfer completed');
						formEl?.reset();
						fromAccountId = '';
						toAccountId = '';
						transferDate = today();
						onClose();
					}
					await update();
				};
			}}
		>
			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-dim">From account</span>
					<Select.Root type="single" name="from_account_id" required bind:value={fromAccountId}>
						<Select.Trigger>
							<Select.Value placeholder="Select account" />
						</Select.Trigger>
						<Select.Content>
							{#each accounts as account (account.id)}
								<Select.Item
									value={String(account.id)}
									label={account.name}
									disabled={String(account.id) === toAccountId}
								/>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-dim">To account</span>
					<Select.Root type="single" name="to_account_id" required bind:value={toAccountId}>
						<Select.Trigger>
							<Select.Value placeholder="Select account" />
						</Select.Trigger>
						<Select.Content>
							{#each accounts as account (account.id)}
								<Select.Item
									value={String(account.id)}
									label={account.name}
									disabled={String(account.id) === fromAccountId}
								/>
							{/each}
						</Select.Content>
					</Select.Root>
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
						class="w-full rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent focus:ring-3 focus:ring-accent/18"
					/>
				</div>
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-dim">Date</span>
					<DatePicker name="date" bind:value={transferDate} required class="w-full" />
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
					class="w-full rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent focus:ring-3 focus:ring-accent/18"
				/>
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
					{submitting ? 'Transferring…' : 'Transfer funds'}
				</button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
