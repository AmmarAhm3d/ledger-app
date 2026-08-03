<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { formatPKR } from '$lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let newName = $state('');
	let newTargetAmount = $state('');
	let newCurrentAmount = $state('');
	let newTargetDate = $state('');
	let newAccountId = $state('');

	function progressColor(progress: number) {
		if (progress >= 100) return 'var(--color-green)';
		if (progress >= 60) return 'var(--color-accent)';
		return 'var(--color-amber)';
	}
</script>

<section class="rounded-[13px] border border-border bg-panel p-5">
	<div class="mb-4">
		<div class="text-[15px] font-semibold tracking-tight">Savings goals</div>
		<div class="mt-0.5 text-xs text-muted">Track progress toward a target amount over time.</div>
	</div>

	{#if form?.message}
		<div class="mb-3.5 rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-xs text-red">
			{form.message}
		</div>
	{/if}

	<div class="flex flex-col gap-3">
		{#each data.goals as goal (goal.id)}
			<div class="rounded-[10px] border border-border-strong bg-panel-2 px-3 py-2.75">
				<form
					method="POST"
					action="?/updateGoal"
					use:enhance={() => {
						return async ({ update }) => {
							await update({ reset: false });
						};
					}}
					class="flex flex-wrap items-center gap-2.5"
				>
					<input type="hidden" name="id" value={goal.id} />
					<div class="min-w-0 flex-1">
						<input
							name="name"
							value={goal.name}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="w-full truncate rounded-lg border border-transparent bg-transparent px-0 py-0 text-[13px] font-semibold text-ink outline-none focus:border-accent focus:bg-panel focus:px-2 focus:py-1.5"
						/>
						<div class="text-[11px] text-muted">
							{goal.account_name ?? 'No linked account'}{goal.target_date
								? ` · target ${goal.target_date}`
								: ''}
						</div>
					</div>
					<select
						name="account_id"
						value={goal.account_id ?? ''}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
						class="rounded-lg border border-border-strong bg-panel px-2 py-1.5 text-[12px] text-dim outline-none focus:border-accent"
					>
						<option value="">No account</option>
						{#each data.accounts as account (account.id)}
							<option value={account.id}>{account.name}</option>
						{/each}
					</select>
					<input
						name="target_date"
						type="date"
						value={goal.target_date ?? ''}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
						class="rounded-lg border border-border-strong bg-panel px-2 py-1.5 font-mono text-xs text-muted outline-none focus:border-accent"
					/>
					<input
						name="current_amount"
						type="number"
						step="0.01"
						value={goal.current_amount}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
						title="Current amount saved"
						class="w-24 rounded-lg border border-border-strong bg-panel px-2 py-1.5 text-right font-mono text-[12.5px] text-ink outline-none focus:border-accent"
					/>
					<span class="text-muted">/</span>
					<input
						name="target_amount"
						type="number"
						step="0.01"
						value={goal.target_amount}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
						title="Target amount"
						class="w-24 rounded-lg border border-border-strong bg-panel px-2 py-1.5 text-right font-mono text-[12.5px] text-ink outline-none focus:border-accent"
					/>
				</form>

				<div class="mt-2.5 flex items-center gap-2.5">
					<div class="h-2 flex-1 overflow-hidden rounded-full bg-panel-strong">
						<div
							class="h-full rounded-full transition-[width] duration-300 ease-out"
							style="width:{goal.progress}%; background:{progressColor(goal.progress)}"
						></div>
					</div>
					<span class="w-10 flex-none text-right font-mono text-[11.5px] font-medium text-dim">
						{goal.progress}%
					</span>
					<form method="POST" action="?/removeGoal" use:enhance>
						<input type="hidden" name="id" value={goal.id} />
						<button
							type="submit"
							title="Remove goal"
							class="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-lg text-muted transition-colors duration-100 hover:bg-panel-strong hover:text-red"
						>
							<Trash2 size={13} strokeWidth={1.9} />
						</button>
					</form>
				</div>
				<div class="mt-1.5 font-mono text-[11px] text-muted">
					{formatPKR(goal.current_amount)} of {formatPKR(goal.target_amount)}
				</div>
			</div>
		{:else}
			<div
				class="rounded-[10px] border border-dashed border-border-strong px-3 py-6 text-center text-[12.5px] text-muted"
			>
				No savings goals yet — add one below.
			</div>
		{/each}
	</div>

	<form
		method="POST"
		action="?/addGoal"
		use:enhance={() => {
			return async ({ update }) => {
				await update();
				newName = '';
				newTargetAmount = '';
				newCurrentAmount = '';
				newTargetDate = '';
				newAccountId = '';
			};
		}}
		class="mt-4 flex flex-col gap-2.5 border-t border-border pt-4 sm:max-w-125"
	>
		<div class="text-[12.5px] font-semibold">Add savings goal</div>
		<input
			name="name"
			bind:value={newName}
			placeholder="e.g. Emergency fund"
			class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent"
		/>
		<div class="flex gap-2.5">
			<input
				name="current_amount"
				bind:value={newCurrentAmount}
				placeholder="Current amount (Rs 0)"
				class="flex-1 rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent"
			/>
			<input
				name="target_amount"
				bind:value={newTargetAmount}
				placeholder="Target amount"
				class="flex-1 rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent"
			/>
		</div>
		<div class="flex gap-2.5">
			<input
				name="target_date"
				type="date"
				bind:value={newTargetDate}
				class="flex-1 rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent"
			/>
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
			Add savings goal
		</button>
	</form>
</section>
