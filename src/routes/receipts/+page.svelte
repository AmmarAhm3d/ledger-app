<script lang="ts">
	import { Paperclip } from '@lucide/svelte';
	import { formatPKR } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="rounded-[13px] border border-border bg-panel overflow-hidden">
	<div class="flex items-center gap-3 border-b border-border px-4 py-3.5 sm:px-4.5 sm:py-4">
		<div class="text-sm font-semibold tracking-tight">Receipts</div>
		<span class="rounded-md bg-panel-hover px-1.5 py-0.5 font-mono text-[11px] text-subtle">
			{data.receipts.length}
		</span>
	</div>

	{#if data.receipts.length === 0}
		<div class="px-4.5 py-10 text-center text-[12.5px] text-muted">
			No receipts attached yet — attach one from "Add transaction".
		</div>
	{:else}
		<div class="divide-y divide-panel-hover">
			{#each data.receipts as r (r.id)}
				<a
					href={`/api/receipts/${r.id}`}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-3 px-4.5 py-3 transition-colors duration-100 hover:bg-panel-2"
				>
					<div
						class="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-accent/14 text-accent-hover"
					>
						<Paperclip size={14} strokeWidth={2} />
					</div>
					<div class="min-w-0 flex-1">
						<div class="truncate text-[13px] font-medium">{r.description ?? 'Transaction'}</div>
						<div class="truncate text-[11.5px] text-muted">
							{r.account_name} · {r.category_name ?? 'Uncategorized'} · {r.date}
						</div>
					</div>
					<div class="font-mono text-[13px] font-medium text-ink">{formatPKR(Math.abs(r.amount))}</div>
				</a>
			{/each}
		</div>
	{/if}
</section>
