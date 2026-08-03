<script lang="ts">
	import { enhance } from '$app/forms';
	import { Copy, Check } from '@lucide/svelte';
	import { formatPKR } from '$lib/format';
	import {
		parseAndValidateBulkImport,
		buildImportPrompt,
		type LineError,
		type ValidatedBulkEntry
	} from '$lib/bulk-import';
	import type { Account, Category } from '$lib/types';

	interface Props {
		open: boolean;
		accounts: Account[];
		categories: Category[];
		onClose: () => void;
	}

	let { open, accounts, categories, onClose }: Props = $props();

	let stage = $state<'edit' | 'preview'>('edit');
	let yamlText = $state('');
	let submitting = $state(false);
	let serverMessage = $state('');
	let serverErrors = $state<LineError[]>([]);
	let promptCopied = $state(false);
	let formEl = $state<HTMLFormElement | null>(null);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);
	let gutterEl = $state<HTMLDivElement | null>(null);

	let accountLookups = $derived(accounts.map((a) => ({ id: a.id, name: a.name })));
	let categoryLookups = $derived(categories.map((c) => ({ id: c.id, name: c.name })));

	let parsed = $derived(parseAndValidateBulkImport(yamlText, accountLookups, categoryLookups));
	let entries = $derived<ValidatedBulkEntry[]>(parsed.entries);
	let clientErrors = $derived<LineError[]>(yamlText.trim() === '' ? [] : parsed.errors);
	let errorLines = $derived(new Set(clientErrors.map((e) => e.line)));
	let lineCount = $derived(Math.max(1, yamlText.split('\n').length));
	let lineNumbers = $derived(Array.from({ length: lineCount }, (_, i) => i + 1));
	let canPreview = $derived(yamlText.trim() !== '' && clientErrors.length === 0 && entries.length > 0);

	function accountName(id: number) {
		return accounts.find((a) => a.id === id)?.name ?? 'Unknown';
	}
	function categoryName(id: number) {
		return categories.find((c) => c.id === id)?.name ?? 'Unknown';
	}

	function syncGutterScroll() {
		if (gutterEl && textareaEl) gutterEl.scrollTop = textareaEl.scrollTop;
	}

	async function handleCopyPrompt() {
		const prompt = buildImportPrompt(accountLookups, categoryLookups);
		await navigator.clipboard.writeText(prompt);
		promptCopied = true;
		setTimeout(() => (promptCopied = false), 2000);
	}

	function reset() {
		stage = 'edit';
		yamlText = '';
		serverMessage = '';
		serverErrors = [];
		promptCopied = false;
	}

	function handleCancel() {
		reset();
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
			class="flex max-h-[90vh] w-full max-w-165 flex-col gap-3.75 overflow-y-auto rounded-2xl border border-border-strong bg-panel-2 p-5 shadow-2xl"
		>
			<div class="flex items-start justify-between gap-3">
				<div>
					<div class="text-[15.5px] font-semibold tracking-tight">Bulk import transactions</div>
					<div class="mt-0.5 text-[12.5px] text-muted">
						Paste an LLM-formatted YAML block. Nothing is written until every line validates.
					</div>
				</div>
				<button
					type="button"
					onclick={handleCopyPrompt}
					class="flex flex-none items-center gap-1.5 rounded-[9px] border border-border-strong bg-panel px-2.75 py-1.75 text-[12px] font-semibold text-dim transition-colors duration-100 hover:bg-panel-hover"
				>
					{#if promptCopied}
						<Check size={13} strokeWidth={2.2} class="text-green" />
						Copied
					{:else}
						<Copy size={13} strokeWidth={2.2} />
						Copy import prompt
					{/if}
				</button>
			</div>

			{#if stage === 'edit'}
				<div class="flex overflow-hidden rounded-lg border border-border-strong bg-bg">
					<div
						bind:this={gutterEl}
						class="select-none overflow-hidden py-2.5 pl-2.5 pr-2 text-right font-mono text-[11px] leading-5 text-faint"
						style="width: 2.75rem"
					>
						{#each lineNumbers as n (n)}
							<div class={errorLines.has(n) ? 'font-semibold text-red' : ''}>{n}</div>
						{/each}
					</div>
					<textarea
						bind:this={textareaEl}
						bind:value={yamlText}
						onscroll={syncGutterScroll}
						oninput={syncGutterScroll}
						spellcheck="false"
						wrap="off"
						placeholder={'transactions:\n  - date: 2026-08-02\n    type: expense\n    amount: 240\n    account: Cash\n    category: Food\n    description: Roti'}
						class="h-64 min-w-0 flex-1 resize-y overflow-auto whitespace-pre bg-transparent py-2.5 pr-2.5 font-mono text-[12px] leading-5 text-ink outline-none placeholder:text-faint"
					></textarea>
				</div>

				{#if clientErrors.length > 0}
					<div class="flex flex-col gap-1.5 rounded-lg border border-red/30 bg-red/8 p-3">
						<div class="text-[11.5px] font-semibold text-red">
							{clientErrors.length} issue{clientErrors.length === 1 ? '' : 's'} found — fix these lines
							and nothing else needs to change
						</div>
						<ul class="flex max-h-32 flex-col gap-0.5 overflow-y-auto">
							{#each clientErrors as e (e.line + e.message)}
								<li class="font-mono text-[11.5px] text-red/90">Line {e.line}: {e.message}</li>
							{/each}
						</ul>
					</div>
				{:else if entries.length > 0}
					<div class="rounded-lg border border-green/30 bg-green/8 px-3 py-2 text-[11.5px] text-green">
						{entries.length} transaction{entries.length === 1 ? '' : 's'} parsed — ready to preview
					</div>
				{/if}

				<div class="flex justify-end gap-2.25">
					<button
						type="button"
						onclick={handleCancel}
						class="rounded-[9px] border border-border-strong bg-transparent px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors duration-100 hover:bg-panel-strong"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={!canPreview}
						onclick={() => (stage = 'preview')}
						class="rounded-[9px] bg-ink px-4 py-2 text-[13px] font-semibold text-bg transition-colors duration-150 hover:bg-dim disabled:opacity-40"
					>
						Preview import
					</button>
				</div>
			{:else}
				{#if serverMessage}
					<div class="flex flex-col gap-1.5 rounded-lg border border-red/40 bg-red/10 p-3 text-xs text-red">
						<div>{serverMessage}</div>
						{#if serverErrors.length > 0}
							<ul class="flex max-h-28 flex-col gap-0.5 overflow-y-auto font-mono text-[11px]">
								{#each serverErrors as e (e.line + e.message)}
									<li>Line {e.line}: {e.message}</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}

				<div class="overflow-x-auto rounded-lg border border-border-strong">
					<table class="w-full min-w-140 text-left text-[12px]">
						<thead>
							<tr class="border-b border-border-strong bg-panel text-[11px] text-muted">
								<th class="px-2.5 py-2 font-semibold">Date</th>
								<th class="px-2.5 py-2 font-semibold">Type</th>
								<th class="px-2.5 py-2 font-semibold">Amount</th>
								<th class="px-2.5 py-2 font-semibold">Account</th>
								<th class="px-2.5 py-2 font-semibold">Category</th>
								<th class="px-2.5 py-2 font-semibold">Description</th>
								<th class="px-2.5 py-2 font-semibold">Note</th>
							</tr>
						</thead>
						<tbody>
							{#each entries as entry, i (i)}
								<tr class="border-b border-border last:border-b-0">
									<td class="px-2.5 py-2 font-mono text-ink">{entry.date}</td>
									<td class="px-2.5 py-2 {entry.type === 'income' ? 'text-green' : 'text-dim'}"
										>{entry.type}</td
									>
									<td class="px-2.5 py-2 font-mono text-ink">{formatPKR(entry.amount)}</td>
									<td class="px-2.5 py-2 text-dim">{accountName(entry.account_id)}</td>
									<td class="px-2.5 py-2 text-dim">{categoryName(entry.category_id)}</td>
									<td class="px-2.5 py-2 text-dim">{entry.description}</td>
									<td class="max-w-50 truncate px-2.5 py-2 text-muted" title={entry.note ?? ''}
										>{entry.note ?? '—'}</td
									>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<form
					bind:this={formEl}
					method="POST"
					action="/?/bulkImportTransactions"
					use:enhance={() => {
						submitting = true;
						serverMessage = '';
						serverErrors = [];
						return async ({ result, update }) => {
							submitting = false;
							if (result.type === 'failure') {
								const data = result.data as
									| { message?: string; errors?: LineError[] }
									| undefined;
								serverMessage = data?.message ?? 'Something went wrong';
								serverErrors = data?.errors ?? [];
							} else if (result.type === 'success') {
								reset();
								onClose();
							}
							await update();
						};
					}}
				>
					<input type="hidden" name="yaml" value={yamlText} />
					<div class="mt-0.5 flex justify-end gap-2.25">
						<button
							type="button"
							onclick={() => (stage = 'edit')}
							class="rounded-[9px] border border-border-strong bg-transparent px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors duration-100 hover:bg-panel-strong"
						>
							Back
						</button>
						<button
							type="submit"
							disabled={submitting}
							class="rounded-[9px] bg-ink px-4 py-2 text-[13px] font-semibold text-bg transition-colors duration-150 hover:bg-dim disabled:opacity-60"
						>
							{submitting
								? 'Importing…'
								: `Import ${entries.length} transaction${entries.length === 1 ? '' : 's'}`}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}
