<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { formatPKR, initials } from '$lib/format';
	import { pending } from '$lib/pending.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { ACCOUNT_TYPES } from '$lib/schema';
	import type { Account, AccountType } from '$lib/types';

	interface Props {
		open: boolean;
		accounts: Account[];
		onClose: () => void;
	}

	let { open, accounts, onClose }: Props = $props();

	let newName = $state('');
	let newType = $state<AccountType>('Bank');
	let newAmount = $state('');
	let errorMessage = $state('');
	let savingIds = $state(new Set<number>());

	function handleResult(result: { type: string; data?: Record<string, unknown> }) {
		errorMessage = result.type === 'failure' ? String(result.data?.message ?? 'Something went wrong') : '';
	}

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
				{#if pending.isPending('accounts')}
					<div
						class="flex items-center gap-2.5 rounded-[10px] border border-border-strong bg-panel px-2.5 py-2.25"
					>
						<Skeleton width="1.875rem" height="1.875rem" class="rounded-lg" />
						<div class="min-w-0 flex-1">
							<Skeleton width="55%" height="0.8rem" />
							<div class="mt-1.5"><Skeleton width="35%" height="0.65rem" /></div>
						</div>
						<Skeleton width="6.875rem" height="1.5rem" />
					</div>
				{/if}
				{#each accounts as account (account.id)}
					<div
						class="flex items-center gap-2.5 rounded-[10px] border border-border-strong bg-panel px-2.5 py-2.25"
						class:opacity-50={savingIds.has(account.id)}
						class:pointer-events-none={savingIds.has(account.id)}
					>
						<div
							class="flex h-7.5 w-7.5 flex-none items-center justify-center rounded-lg bg-panel-strong text-[11px] font-semibold text-accent-hover"
						>
							{initials(account.name)}
						</div>
						<form
							method="POST"
							action="/?/updateAccount"
							use:enhance={() => {
								savingIds = new Set(savingIds).add(account.id);
								return async ({ result, update }) => {
									handleResult(result);
									await update({ reset: false });
									const next = new Set(savingIds);
									next.delete(account.id);
									savingIds = next;
								};
							}}
							class="min-w-0 flex-1"
						>
							<input type="hidden" name="id" value={account.id} />
							<input
								name="name"
								required
								value={account.name}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
								class="w-full truncate rounded-lg border border-transparent bg-transparent px-0 py-0 text-[12.5px] font-semibold text-ink outline-none focus:border-accent focus:bg-panel-2 focus:px-2 focus:py-1"
							/>
							<select
								name="type"
								value={account.type}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
								class="mt-0.5 w-full rounded-lg border border-transparent bg-transparent px-0 py-0 text-[11px] text-muted outline-none focus:border-accent focus:bg-panel-2 focus:px-2 focus:py-1"
							>
								{#each ACCOUNT_TYPES as type (type)}
									<option value={type}>{type}</option>
								{/each}
							</select>
						</form>
						<form
						method="POST"
						action="/?/updateAccountBalance"
						use:enhance={() => {
							savingIds = new Set(savingIds).add(account.id);
							return async ({ result, update }) => {
								handleResult(result);
								await update({ reset: false });
								const next = new Set(savingIds);
								next.delete(account.id);
								savingIds = next;
							};
						}}
					>
							<input type="hidden" name="id" value={account.id} />
							<input
								name="balance"
								type="number"
								step="0.01"
								value={String(account.balance)}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
								class="w-27.5 rounded-lg border border-border-strong bg-panel-2 px-2 py-1.5 text-right font-mono text-[12.5px] text-ink outline-none focus:border-accent"
							/>
						</form>
						<form
							method="POST"
							action="/?/removeAccount"
							use:enhance={() => {
								return async ({ result, update }) => {
									handleResult(result);
									await update();
								};
							}}
						>
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
				action="/?/addAccount"
				use:enhance={() => {
					pending.start('accounts');
					return async ({ result, update }) => {
						handleResult(result);
						await update();
						pending.end('accounts');
						if (result.type === 'success') {
							newName = '';
							newAmount = '';
							newType = 'Bank';
						}
					};
				}}
				class="flex flex-col gap-2.5 border-t border-border pt-3.5"
			>
				<div class="text-[12.5px] font-semibold">Add account</div>
				<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.3fr_1fr]">
					<input
						name="name"
						required
						bind:value={newName}
						placeholder="e.g. Meezan Bank"
						class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent"
					/>
					<select
						name="type"
						bind:value={newType}
						class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none"
					>
						{#each ACCOUNT_TYPES as type (type)}
							<option value={type}>{type}</option>
						{/each}
					</select>
				</div>
				<input
					name="balance"
					type="number"
					step="0.01"
					required
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
