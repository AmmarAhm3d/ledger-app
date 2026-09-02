<script lang="ts">
	import { enhance } from '$app/forms';
	import { Copy, Check } from '@lucide/svelte';
	import { toast } from '$lib/components/ui/sonner';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import Textarea from '$lib/components/ui/textarea.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import {
		parseAndValidateBulkImport,
		parseBulkImportYaml,
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

	let examplePlaceholder = $derived.by(() => {
		const todayIso = new Date().toISOString().slice(0, 10);
		const accountNames = accounts.map((a) => a.name);
		const categoryNames = categories.map((c) => c.name);
		const [accountExample, ...accountRest] = accountNames.length ? accountNames : ['Cash'];
		const [categoryExample, ...categoryRest] = categoryNames.length ? categoryNames : ['Category'];

		return [
			'transactions:',
			`  - date: ${todayIso}`,
			'    type: expense              # or income',
			'    amount: 240                # Rs, positive number',
			`    account: ${accountExample}${accountRest.length ? `        # or: ${accountRest.join(', ')}` : ''}`,
			`    category: ${categoryExample}${categoryRest.length ? `      # or: ${categoryRest.join(', ')}` : ''}`,
			'    description: description'
		].join('\n');
	});

	let parsed = $derived(parseAndValidateBulkImport(yamlText, accountLookups, categoryLookups));
	let entries = $derived<ValidatedBulkEntry[]>(parsed.entries);
	let clientErrors = $derived<LineError[]>(yamlText.trim() === '' ? [] : parsed.errors);
	let errorLines = $derived(new Set(clientErrors.map((e) => e.line)));
	let lineCount = $derived(Math.max(1, yamlText.split('\n').length));
	let lineNumbers = $derived(Array.from({ length: lineCount }, (_, i) => i + 1));
	let canPreview = $derived(yamlText.trim() !== '' && clientErrors.length === 0 && entries.length > 0);

	type EditableField = 'date' | 'type' | 'amount' | 'account' | 'category' | 'description' | 'note';

	// Preview-stage entries are edited by rewriting the exact source line they were
	// parsed from — yamlText (submitted as-is on import) stays the single source of
	// truth, so an edited preview and the raw block can never drift apart.
	let rawParsed = $derived(parseBulkImportYaml(yamlText));

	function updateEntryField(index: number, field: EditableField, rawValue: string) {
		const rawEntry = rawParsed.entries[index];
		if (!rawEntry) return;
		const lines = yamlText.split('\n');
		const lineNo = rawEntry.fieldLines[field];
		if (lineNo !== undefined) {
			const line = lines[lineNo - 1];
			const colonIndex = line.indexOf(':');
			if (colonIndex === -1) return;
			lines[lineNo - 1] = `${line.slice(0, colonIndex + 1)} ${rawValue}`;
		} else {
			const knownLines = Object.values(rawEntry.fieldLines).filter(
				(n): n is number => n !== undefined
			);
			const insertAfter = knownLines.length ? Math.max(...knownLines) : rawEntry.startLine;
			lines.splice(insertAfter, 0, `    ${field}: ${rawValue}`);
		}
		yamlText = lines.join('\n');
	}

	function updateEntryAccount(index: number, accountId: number) {
		const name = accounts.find((a) => a.id === accountId)?.name;
		if (name) updateEntryField(index, 'account', name);
	}
	function updateEntryCategory(index: number, categoryId: number) {
		const name = categories.find((c) => c.id === categoryId)?.name;
		if (name) updateEntryField(index, 'category', name);
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

<Dialog.Root {open} onOpenChange={(next) => !next && handleCancel()}>
	<Dialog.Content maxWidth="max-w-165">
		<Dialog.Header>
			<div>
				<Dialog.Title>Bulk import transactions</Dialog.Title>
				<Dialog.Description>
					Paste an LLM-formatted YAML block. Nothing is written until every line validates.
				</Dialog.Description>
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
		</Dialog.Header>

		{#if stage === 'edit'}
			<div class="flex h-64 overflow-hidden rounded-lg border border-border-strong bg-bg">
				<div
					bind:this={gutterEl}
					class="select-none overflow-hidden py-2.5 pl-2.5 pr-2 text-right font-mono text-[11px] leading-5 text-faint"
					style="width: 2.75rem"
				>
					{#each lineNumbers as n (n)}
						<div class={errorLines.has(n) ? 'font-semibold text-red' : ''}>{n}</div>
					{/each}
				</div>
				<Textarea
					bind:ref={textareaEl}
					bind:value={yamlText}
					onscroll={syncGutterScroll}
					oninput={syncGutterScroll}
					spellcheck={false}
					wrap="off"
					placeholder={examplePlaceholder}
					class="h-64 min-h-0 min-w-0 flex-1 resize-none overflow-auto whitespace-pre rounded-none border-none bg-transparent py-2.5 pr-2.5 font-mono text-[12px] leading-5 text-ink outline-none placeholder:text-faint focus:ring-0"
				/>
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

			<Dialog.Footer>
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
			</Dialog.Footer>
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
								<td class="px-1.5 py-1">
									<DatePicker
										name={`entry-${i}-date`}
										value={entry.date}
										onValueChange={(v) => updateEntryField(i, 'date', v)}
										class="min-w-31 border-none bg-transparent px-1 py-1 font-mono text-[12px] focus:ring-0"
									/>
								</td>
								<td class="px-1.5 py-1">
									<Select.Root
										type="single"
										value={entry.type}
										onValueChange={(v) => updateEntryField(i, 'type', v)}
									>
										<Select.Trigger
											class="h-auto min-w-20 border-none bg-transparent px-1 py-1 text-[12px] focus:ring-0 {entry.type ===
											'income'
												? 'text-green'
												: 'text-dim'}"
										>
											<Select.Value />
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="expense" label="expense" />
											<Select.Item value="income" label="income" />
										</Select.Content>
									</Select.Root>
								</td>
								<td class="px-1.5 py-1">
									<input
										type="number"
										step="0.01"
										min="0.01"
										value={entry.amount}
										onchange={(e) => updateEntryField(i, 'amount', e.currentTarget.value)}
										class="w-full min-w-20 rounded-md border border-transparent bg-transparent px-1 py-1 font-mono text-[12px] text-ink outline-none focus:border-accent focus:bg-panel"
									/>
								</td>
								<td class="px-1.5 py-1">
									<Select.Root
										type="single"
										items={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
										value={String(entry.account_id)}
										onValueChange={(v) => updateEntryAccount(i, Number(v))}
									>
										<Select.Trigger class="h-auto min-w-30 border-none bg-transparent px-1 py-1 text-[12px] text-dim focus:ring-0">
											<Select.Value />
										</Select.Trigger>
										<Select.Content>
											{#each accounts as a (a.id)}
												<Select.Item value={String(a.id)} label={a.name} />
											{/each}
										</Select.Content>
									</Select.Root>
								</td>
								<td class="px-1.5 py-1">
									<Select.Root
										type="single"
										items={categories.map((c) => ({ value: String(c.id), label: c.name }))}
										value={String(entry.category_id)}
										onValueChange={(v) => updateEntryCategory(i, Number(v))}
									>
										<Select.Trigger class="h-auto min-w-28 border-none bg-transparent px-1 py-1 text-[12px] text-dim focus:ring-0">
											<Select.Value />
										</Select.Trigger>
										<Select.Content>
											{#each categories as c (c.id)}
												<Select.Item value={String(c.id)} label={c.name} />
											{/each}
										</Select.Content>
									</Select.Root>
								</td>
								<td class="px-1.5 py-1">
									<input
										type="text"
										value={entry.description}
										oninput={(e) => updateEntryField(i, 'description', e.currentTarget.value)}
										class="w-full min-w-28 rounded-md border border-transparent bg-transparent px-1 py-1 text-[12px] text-dim outline-none focus:border-accent focus:bg-panel"
									/>
								</td>
								<td class="px-1.5 py-1">
									<input
										type="text"
										value={entry.note ?? ''}
										placeholder="—"
										oninput={(e) => updateEntryField(i, 'note', e.currentTarget.value)}
										class="w-full min-w-32 rounded-md border border-transparent bg-transparent px-1 py-1 text-[12px] text-muted outline-none placeholder:text-faint focus:border-accent focus:bg-panel"
									/>
								</td>
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
							const data = result.data as { imported?: number; skipped?: number } | undefined;
							toast.success(
								data?.skipped
									? `Imported ${data.imported} — skipped ${data.skipped} already in your ledger`
									: `Imported ${data?.imported ?? 0} transaction${data?.imported === 1 ? '' : 's'}`
							);
							reset();
							onClose();
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="yaml" value={yamlText} />
				<Dialog.Footer>
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
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
