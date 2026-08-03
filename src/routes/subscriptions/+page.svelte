<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { formatPKR } from '$lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let newName = $state('');
	let newAmount = $state('');
	let newCadence = $state('monthly');
	let newNextDueDate = $state('');
	let newCategoryId = $state('');
	let newAccountId = $state('');

	function daysUntil(dateStr: string) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const due = new Date(dateStr);
		return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	}
</script>

<section class="flex flex-col gap-4">
	<div class="rounded-[13px] border border-border bg-panel p-5">
		<div class="mb-3.5">
			<div class="text-[15px] font-semibold tracking-tight">Upcoming payments</div>
			<div class="mt-0.5 text-xs text-muted">Active subscriptions due soon, soonest first.</div>
		</div>
		<div class="flex flex-col gap-2">
			{#each data.upcoming as sub (sub.id)}
				<div
					class="flex items-center justify-between rounded-[10px] border border-border-strong bg-panel-2 px-3 py-2.5"
				>
					<div class="min-w-0">
						<div class="truncate text-[12.5px] font-semibold text-ink">{sub.name}</div>
						<div class="text-[11px] text-muted">
							Due {sub.next_due_date} · {daysUntil(sub.next_due_date)} day{daysUntil(
								sub.next_due_date
							) === 1
								? ''
								: 's'}
						</div>
					</div>
					<div class="font-mono text-[13px] font-medium text-ink">{formatPKR(sub.amount)}</div>
				</div>
			{:else}
				<div
					class="rounded-[10px] border border-dashed border-border-strong px-3 py-6 text-center text-[12.5px] text-muted"
				>
					Nothing due soon.
				</div>
			{/each}
		</div>
	</div>

	<div class="rounded-[13px] border border-border bg-panel p-5">
		<div class="mb-4">
			<div class="text-[15px] font-semibold tracking-tight">Recurring subscriptions</div>
			<div class="mt-0.5 text-xs text-muted">
				Bills, streaming services, and memberships that repeat on a schedule.
			</div>
		</div>

		{#if form?.message}
			<div class="mb-3.5 rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-xs text-red">
				{form.message}
			</div>
		{/if}

		<div class="flex flex-col gap-2">
			{#each data.subscriptions as sub (sub.id)}
				<div
					class="flex flex-col gap-2 rounded-[10px] border border-border-strong bg-panel-2 px-2.5 py-2.25 sm:flex-row sm:items-center"
				>
					<form
						method="POST"
						action="?/updateSubscription"
						use:enhance={() => {
							return async ({ update }) => {
								await update({ reset: false });
							};
						}}
						class="flex min-w-0 flex-1 flex-wrap items-center gap-2.5"
					>
						<input type="hidden" name="id" value={sub.id} />
						<div class="min-w-0 flex-1">
							<input
								name="name"
								value={sub.name}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
								class="w-full truncate rounded-lg border border-transparent bg-transparent px-0 py-0 text-[12.5px] font-semibold text-ink outline-none focus:border-accent focus:bg-panel focus:px-2 focus:py-1.5"
							/>
							<div class="text-[11px] text-muted">
								{sub.category_name ?? 'No category'}{sub.account_name
									? ` · ${sub.account_name}`
									: ''}
							</div>
						</div>
						<select
							name="cadence"
							value={sub.cadence}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="rounded-lg border border-border-strong bg-panel px-2 py-1.5 text-[12px] text-dim outline-none focus:border-accent"
						>
							<option value="weekly">Weekly</option>
							<option value="monthly">Monthly</option>
							<option value="yearly">Yearly</option>
						</select>
						<select
							name="category_id"
							value={sub.category_id ?? ''}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="rounded-lg border border-border-strong bg-panel px-2 py-1.5 text-[12px] text-dim outline-none focus:border-accent"
						>
							<option value="">No category</option>
							{#each data.categories as category (category.id)}
								<option value={category.id}>{category.name}</option>
							{/each}
						</select>
						<select
							name="account_id"
							value={sub.account_id ?? ''}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="rounded-lg border border-border-strong bg-panel px-2 py-1.5 text-[12px] text-dim outline-none focus:border-accent"
						>
							<option value="">No account</option>
							{#each data.accounts as account (account.id)}
								<option value={account.id}>{account.name}</option>
							{/each}
						</select>
						<input
							name="next_due_date"
							type="date"
							value={sub.next_due_date}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="rounded-lg border border-border-strong bg-panel px-2 py-1.5 font-mono text-xs text-muted outline-none focus:border-accent"
						/>
						<input
							name="amount"
							type="number"
							step="0.01"
							value={sub.amount}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="w-24 rounded-lg border border-border-strong bg-panel px-2 py-1.5 text-right font-mono text-[12.5px] text-ink outline-none focus:border-accent"
						/>
						<label class="flex items-center gap-1.5 text-[11.5px] text-muted">
							<input
								type="checkbox"
								name="is_active"
								checked={sub.is_active}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
							/>
							Active
						</label>
					</form>
					<form method="POST" action="?/removeSubscription" use:enhance>
						<input type="hidden" name="id" value={sub.id} />
						<button
							type="submit"
							title="Remove subscription"
							class="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-lg text-muted transition-colors duration-100 hover:bg-panel-strong hover:text-red"
						>
							<Trash2 size={13} strokeWidth={1.9} />
						</button>
					</form>
				</div>
			{:else}
				<div
					class="rounded-[10px] border border-dashed border-border-strong px-3 py-6 text-center text-[12.5px] text-muted"
				>
					No subscriptions yet — add one below.
				</div>
			{/each}
		</div>

		<form
			method="POST"
			action="?/addSubscription"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					newName = '';
					newAmount = '';
					newCadence = 'monthly';
					newNextDueDate = '';
					newCategoryId = '';
					newAccountId = '';
				};
			}}
			class="mt-4 flex flex-col gap-2.5 border-t border-border pt-4 sm:max-w-125"
		>
			<div class="text-[12.5px] font-semibold">Add subscription</div>
			<input
				name="name"
				bind:value={newName}
				placeholder="e.g. Netflix"
				class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent"
			/>
			<div class="flex gap-2.5">
				<input
					name="amount"
					bind:value={newAmount}
					placeholder="Amount (Rs 0)"
					class="flex-1 rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent"
				/>
				<select
					name="cadence"
					bind:value={newCadence}
					class="flex-1 rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent"
				>
					<option value="weekly">Weekly</option>
					<option value="monthly">Monthly</option>
					<option value="yearly">Yearly</option>
				</select>
			</div>
			<input
				name="next_due_date"
				type="date"
				bind:value={newNextDueDate}
				class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent"
			/>
			<div class="flex gap-2.5">
				<select
					name="category_id"
					bind:value={newCategoryId}
					class="flex-1 rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent"
				>
					<option value="">No category</option>
					{#each data.categories as category (category.id)}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
				<select
					name="account_id"
					bind:value={newAccountId}
					class="flex-1 rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent"
				>
					<option value="">No account</option>
					{#each data.accounts as account (account.id)}
						<option value={account.id}>{account.name}</option>
					{/each}
				</select>
			</div>
			<button
				type="submit"
				class="flex items-center justify-center gap-1.5 rounded-[9px] border border-dashed border-border-hover px-3 py-2.25 text-[12.5px] font-semibold text-dim transition-colors duration-100 hover:border-accent hover:bg-panel-hover"
			>
				<Plus size={13} strokeWidth={2.2} />
				Add subscription
			</button>
		</form>
	</div>
</section>
