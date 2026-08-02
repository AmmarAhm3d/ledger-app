<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { formatPKR, initials } from '$lib/format';
	import type { Account, AccountType } from '$lib/types';

	interface Props {
		open: boolean;
		accounts: Account[];
		onClose: () => void;
		errorMessage?: string;
	}

	let { open, accounts, onClose, errorMessage }: Props = $props();

	let newName = $state('');
	let newType = $state<AccountType>('Bank');
	let newAmount = $state('');

	let total = $derived(accounts.reduce((sum, a) => sum + a.balance, 0));
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && onClose()} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={onClose}
		role="presentation"
		class="fixed inset-0 z-45 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			onclick={(e) => e.stopPropagation()}
			role="presentation"
			class="flex max-h-[82vh] w-full max-w-110 flex-col gap-3.5 overflow-y-auto rounded-2xl border border-border-strong bg-panel-2 p-5 shadow-2xl"
		>
			<div>
				<div class="text-[15px] font-semibold tracking-tight">Accounts</div>
				<div class="mt-0.5 text-xs text-muted">
					Entered manually — banks and mobile wallets alike. Total balance is the sum below.
				</div>
			</div>

			{#if errorMessage}
				<div class="rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-xs text-red">
					{errorMessage}
				</div>
			{/if}

			<div class="flex flex-col gap-2">
				{#each accounts as account (account.id)}
					<div
						class="flex items-center gap-2.5 rounded-[10px] border border-border-strong bg-panel px-2.5 py-2.25"
					>
						<div
							class="flex h-7.5 w-7.5 flex-none items-center justify-center rounded-lg bg-panel-strong text-[11px] font-semibold text-accent-hover"
						>
							{initials(account.name)}
						</div>
						<div class="min-w-0 flex-1">
							<div class="truncate text-[12.5px] font-semibold">{account.name}</div>
							<div class="text-[11px] text-muted">{account.type}</div>
						</div>
						<form
						method="POST"
						action="?/updateAccountBalance"
						use:enhance={() => {
							return async ({ update }) => {
								await update({ reset: false });
							};
						}}
					>
							<input type="hidden" name="id" value={account.id} />
							<input
								name="balance"
								value={String(account.balance)}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
								class="w-27.5 rounded-lg border border-border-strong bg-panel-2 px-2 py-1.5 text-right font-mono text-[12.5px] text-ink outline-none focus:border-accent"
							/>
						</form>
						<form method="POST" action="?/removeAccount" use:enhance>
							<input type="hidden" name="id" value={account.id} />
							<button
								type="submit"
								title="Remove account"
								class="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-lg text-muted transition-colors duration-100 hover:bg-panel-strong hover:text-red"
							>
								<Trash2 size={13} strokeWidth={1.9} />
							</button>
						</form>
					</div>
				{/each}
			</div>

			<div class="flex items-center justify-between border-t border-border px-0.5 pt-2.5">
				<span class="text-[12.5px] font-medium text-muted">Total</span>
				<span class="font-mono text-[15px] font-semibold">{formatPKR(total)}</span>
			</div>

			<form
				method="POST"
				action="?/addAccount"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						newName = '';
						newAmount = '';
						newType = 'Bank';
					};
				}}
				class="flex flex-col gap-2.5 border-t border-border pt-3.5"
			>
				<div class="text-[12.5px] font-semibold">Add account</div>
				<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.3fr_1fr]">
					<input
						name="name"
						bind:value={newName}
						placeholder="e.g. Meezan Bank"
						class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent"
					/>
					<select
						name="type"
						bind:value={newType}
						class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none"
					>
						<option value="Bank">Bank</option>
						<option value="Microfinance / Wallet">Microfinance / Wallet</option>
						<option value="Cash">Cash</option>
					</select>
				</div>
				<input
					name="balance"
					bind:value={newAmount}
					placeholder="Rs 0"
					class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent"
				/>
				<button
					type="submit"
					class="flex items-center justify-center gap-1.5 rounded-[9px] border border-dashed border-border-hover px-3 py-2.25 text-[12.5px] font-semibold text-dim transition-colors duration-100 hover:border-accent hover:bg-panel-hover"
				>
					<Plus size={13} strokeWidth={2.2} />
					Add bank or wallet
				</button>
			</form>

			<div class="mt-0.5 flex justify-end">
				<button
					onclick={onClose}
					class="rounded-[9px] bg-ink px-4 py-2 text-[13px] font-semibold text-bg transition-colors duration-150 hover:bg-dim"
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}
