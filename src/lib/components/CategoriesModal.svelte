<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Trash2 } from '@lucide/svelte';
	import type { Category } from '$lib/types';

	interface Props {
		open: boolean;
		categories: Category[];
		onClose: () => void;
		errorMessage?: string;
	}

	let { open, categories, onClose, errorMessage }: Props = $props();

	let newName = $state('');
	let newCap = $state('');
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
				<div class="text-[15px] font-semibold tracking-tight">Categories</div>
				<div class="mt-0.5 text-xs text-muted">
					Used to group transactions and track monthly budget caps.
				</div>
			</div>

			{#if errorMessage}
				<div class="rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-xs text-red">
					{errorMessage}
				</div>
			{/if}

			<div class="flex flex-col gap-2">
				{#each categories as category (category.id)}
					<div
						class="flex items-center gap-2.5 rounded-[10px] border border-border-strong bg-panel px-2.5 py-2.25"
					>
						<form
							method="POST"
							action="?/updateCategory"
							use:enhance={() => {
								return async ({ update }) => {
									await update({ reset: false });
								};
							}}
							class="flex min-w-0 flex-1 items-center gap-2.5"
						>
							<input type="hidden" name="id" value={category.id} />
							<div class="min-w-0 flex-1">
								<input
									name="name"
									value={category.name}
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
									class="w-full truncate rounded-lg border border-transparent bg-transparent px-0 py-0 text-[12.5px] font-semibold text-ink outline-none focus:border-accent focus:bg-panel-2 focus:px-2 focus:py-1.5"
								/>
								<div class="text-[11px] text-muted">Monthly cap</div>
							</div>
							<input
								name="monthly_cap"
								value={String(category.monthly_cap)}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
								class="w-27.5 rounded-lg border border-border-strong bg-panel-2 px-2 py-1.5 text-right font-mono text-[12.5px] text-ink outline-none focus:border-accent"
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
				{/each}
			</div>

			<form
				method="POST"
				action="?/addCategory"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						newName = '';
						newCap = '';
					};
				}}
				class="flex flex-col gap-2.5 border-t border-border pt-3.5"
			>
				<div class="text-[12.5px] font-semibold">Add category</div>
				<input
					name="name"
					bind:value={newName}
					placeholder="e.g. Groceries"
					class="rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-[13px] text-ink outline-none focus:border-accent"
				/>
				<input
					name="monthly_cap"
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
