<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { formatPKR } from '$lib/format';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import ConfirmDeleteDialog from '$lib/components/ConfirmDeleteDialog.svelte';
	import * as Select from '$lib/components/ui/select';
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
			{@const rowFormEl = { current: null as HTMLFormElement | null }}
			{@const removeFormEl = { current: null as HTMLFormElement | null }}
			<div class="rounded-[10px] border border-border-strong bg-panel-2 px-3 py-2.75">
				<form
					bind:this={rowFormEl.current}
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
						required
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
					<Select.Root
						type="single"
						name="account_id"
						items={[
							{ value: '', label: 'No account' },
							...data.accounts.map((a) => ({ value: String(a.id), label: a.name }))
						]}
						value={goal.account_id ? String(goal.account_id) : ''}
						onValueChange={async () => {
							await tick();
							rowFormEl.current?.requestSubmit();
						}}
					>
						<Select.Trigger class="h-auto w-auto min-w-28 border-none bg-panel px-2 py-1.5 text-[12px] text-dim focus:ring-0">
							<Select.Value placeholder="No account" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="" label="No account" />
							{#each data.accounts as account (account.id)}
								<Select.Item value={String(account.id)} label={account.name} />
							{/each}
						</Select.Content>
					</Select.Root>
					<DatePicker
						name="target_date"
						value={goal.target_date ?? ''}
						onValueChange={async () => {
							await tick();
							rowFormEl.current?.requestSubmit();
						}}
						class="border-none bg-panel px-2 py-1.5 font-mono text-xs text-muted focus:ring-0"
					/>
					<input
						name="current_amount"
						type="number"
						step="0.01"
						min="0"
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
						min="0.01"
						required
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
					<form bind:this={removeFormEl.current} method="POST" action="?/removeGoal" use:enhance>
						<input type="hidden" name="id" value={goal.id} />
						<ConfirmDeleteDialog
							title="Remove {goal.name}?"
							description="This savings goal and its progress will be removed."
							onConfirm={() => removeFormEl.current?.requestSubmit()}
							triggerTitle="Remove goal"
							triggerClass="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-lg text-muted transition-colors duration-100 hover:bg-panel-strong hover:text-red"
						>
							{#snippet trigger()}
								<Trash2 size={13} strokeWidth={1.9} />
							{/snippet}
						</ConfirmDeleteDialog>
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
			required
			bind:value={newName}
			placeholder="e.g. Emergency fund"
			class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent"
		/>
		<div class="flex gap-2.5">
			<input
				name="current_amount"
				type="number"
				step="0.01"
				min="0"
				bind:value={newCurrentAmount}
				placeholder="Current amount (Rs 0)"
				class="min-w-0 flex-1 rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent"
			/>
			<input
				name="target_amount"
				type="number"
				step="0.01"
				min="0.01"
				required
				bind:value={newTargetAmount}
				placeholder="Target amount"
				class="min-w-0 flex-1 rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent"
			/>
		</div>
		<div class="flex gap-2.5">
			<DatePicker
				name="target_date"
				bind:value={newTargetDate}
				placeholder="Target date"
				class="min-w-0 flex-1 justify-start"
			/>
			<Select.Root type="single" name="account_id" items={data.accounts.map((a) => ({ value: String(a.id), label: a.name }))} bind:value={newAccountId}>
				<Select.Trigger class="min-w-0 flex-1">
					<Select.Value placeholder="No account" />
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="" label="No account" />
					{#each data.accounts as account (account.id)}
						<Select.Item value={String(account.id)} label={account.name} />
					{/each}
				</Select.Content>
			</Select.Root>
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
