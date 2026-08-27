<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { pending } from '$lib/pending.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let newName = $state('');
	let newCap = $state('');
	let savingIds = $state(new Set<number>());
</script>

<section class="rounded-[13px] border border-border bg-panel p-5">
	<div class="mb-4">
		<div class="text-[15px] font-semibold tracking-tight">Categories</div>
		<div class="mt-0.5 text-xs text-muted">
			Used to group transactions and track monthly budget caps.
		</div>
	</div>

	{#if form?.message}
		<div class="mb-3.5 rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-xs text-red">
			{form.message}
		</div>
	{/if}

	<div class="flex flex-col gap-2">
		{#if pending.isPending('categories')}
			<div
				class="flex items-center gap-2.5 rounded-[10px] border border-border-strong bg-panel-2 px-2.5 py-2.25"
			>
				<div class="min-w-0 flex-1">
					<Skeleton width="50%" height="0.85rem" />
					<div class="mt-1.5"><Skeleton width="30%" height="0.65rem" /></div>
				</div>
				<Skeleton width="6.875rem" height="1.5rem" />
			</div>
		{/if}
		{#each data.categories as category (category.id)}
			<div
				class="flex items-center gap-2.5 rounded-[10px] border border-border-strong bg-panel-2 px-2.5 py-2.25"
				class:opacity-50={savingIds.has(category.id)}
				class:pointer-events-none={savingIds.has(category.id)}
			>
				<form
					method="POST"
					action="?/updateCategory"
					use:enhance={() => {
						savingIds = new Set(savingIds).add(category.id);
						return async ({ update }) => {
							await update({ reset: false });
							const next = new Set(savingIds);
							next.delete(category.id);
							savingIds = next;
						};
					}}
					class="flex min-w-0 flex-1 items-center gap-2.5"
				>
					<input type="hidden" name="id" value={category.id} />
					<div class="min-w-0 flex-1">
						<input
							name="name"
							required
							value={category.name}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="w-full truncate rounded-lg border border-transparent bg-transparent px-0 py-0 text-[12.5px] font-semibold text-ink outline-none focus:border-accent focus:bg-panel focus:px-2 focus:py-1.5"
						/>
						<div class="text-[11px] text-muted">Monthly cap</div>
					</div>
					<input
						name="monthly_cap"
						type="number"
						step="0.01"
						min="0"
						value={String(category.monthly_cap)}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
						class="w-27.5 rounded-lg border border-border-strong bg-panel px-2 py-1.5 text-right font-mono text-[12.5px] text-ink outline-none focus:border-accent"
					/>
				</form>
				<form method="POST" action="?/removeCategory" use:enhance>
					<input type="hidden" name="id" value={category.id} />
					<button
						type="submit"
						title="Remove category"
						class="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-lg text-muted transition-colors duration-100 hover:bg-panel-strong hover:text-red"
					>
						<Trash2 size={13} strokeWidth={1.9} />
					</button>
				</form>
			</div>
		{:else}
			<div class="rounded-[10px] border border-dashed border-border-strong px-3 py-6 text-center text-[12.5px] text-muted">
				No categories yet — add one below.
			</div>
		{/each}
	</div>

	<form
		method="POST"
		action="?/addCategory"
		use:enhance={() => {
			pending.start('categories');
			return async ({ update }) => {
				await update();
				newName = '';
				newCap = '';
				pending.end('categories');
			};
		}}
		class="mt-4 flex flex-col gap-2.5 border-t border-border pt-4 sm:max-w-100"
	>
		<div class="text-[12.5px] font-semibold">Add category</div>
		<input
			name="name"
			required
			bind:value={newName}
			placeholder="e.g. Groceries"
			class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent"
		/>
		<input
			name="monthly_cap"
			type="number"
			step="0.01"
			min="0"
			bind:value={newCap}
			placeholder="Monthly cap (Rs 0)"
			class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 font-mono text-[13px] text-ink outline-none focus:border-accent"
		/>
		<button
			type="submit"
			class="flex items-center justify-center gap-1.5 rounded-[9px] border border-dashed border-border-hover px-3 py-2.25 text-[12.5px] font-semibold text-dim transition-colors duration-100 hover:border-accent hover:bg-panel-hover"
		>
			<Plus size={13} strokeWidth={2.2} />
			Add category
		</button>
	</form>
</section>
