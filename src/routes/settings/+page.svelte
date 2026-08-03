<script lang="ts">
	import { enhance } from '$app/forms';
	import { clearStoredPin } from '$lib/pin-storage';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let pinCleared = $state(false);
	let isRefreshing = $state(false);

	function handleClearPin() {
		clearStoredPin();
		pinCleared = true;
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
	}

	const usedBytes = $derived(data.storageUsage?.totalBytes ?? 0);
	const limitBytes = $derived(data.storageUsage?.limitBytes ?? 1000 * 1024 * 1024);
	const percentUsed = $derived(Math.min(100, Math.round((usedBytes / limitBytes) * 100)));
	const blobCount = $derived(data.storageUsage?.blobCount ?? 0);
	const lastUpdated = $derived(
		data.storageUsage?.createdAt
			? new Date(data.storageUsage.createdAt).toLocaleString()
			: 'Never'
	);
</script>

<section class="flex flex-col gap-4">
	<!-- Account Card -->
	<div class="rounded-[13px] border border-border bg-panel p-5">
		<div class="text-[15px] font-semibold tracking-tight">Account</div>
		<div class="mt-3 flex items-center justify-between border-t border-border pt-3.5 text-[13px]">
			<span class="text-muted">Signed in as</span>
			<span class="font-medium text-ink">{data.user?.email}</span>
		</div>
	</div>

	<!-- Blob Storage Usage Card -->
	<div class="rounded-[13px] border border-border bg-panel p-5">
		<div class="flex items-center justify-between">
			<div class="text-[15px] font-semibold tracking-tight">Receipt Blob Storage</div>
			<span class="text-xs text-muted">Snapshot: {lastUpdated}</span>
		</div>
		<div class="mt-1 text-xs text-muted">
			Monitors Vercel Blob consumption against plan limit (1 GB). Auto-purges oldest receipts if storage hits 999 MB.
		</div>

		<div class="mt-4 flex flex-col gap-2">
			<div class="flex items-center justify-between text-[13px]">
				<span class="font-medium text-ink">
					{formatBytes(usedBytes)} / {formatBytes(limitBytes)} ({percentUsed}%)
				</span>
				<span class="text-muted">{blobCount} stored {blobCount === 1 ? 'receipt' : 'receipts'}</span>
			</div>

			<!-- Usage Bar -->
			<div class="h-2 w-full overflow-hidden rounded-full bg-panel-2">
				<div
					class="h-full rounded-full transition-all duration-300 {percentUsed > 90 ? 'bg-red-500' : percentUsed > 75 ? 'bg-amber-500' : 'bg-accent'}"
					style="width: {Math.max(percentUsed, 2)}%"
				></div>
			</div>
		</div>

		<form
			method="POST"
			action="?/refreshStorage"
			use:enhance={() => {
				isRefreshing = true;
				return async ({ update }) => {
					await update();
					isRefreshing = false;
				};
			}}
			class="mt-4"
		>
			<button
				type="submit"
				disabled={isRefreshing}
				class="rounded-[9px] border border-border-strong bg-panel-2 px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors duration-100 hover:bg-panel-hover disabled:opacity-50"
			>
				{isRefreshing ? 'Refreshing storage...' : 'Refresh storage usage'}
			</button>
		</form>
	</div>

	<!-- Balance PIN Card -->
	<div class="rounded-[13px] border border-border bg-panel p-5">
		<div class="text-[15px] font-semibold tracking-tight">Balance PIN</div>
		<div class="mt-0.5 text-xs text-muted">
			Clears the PIN stored on this device — you'll be asked to set a new one next time you
			reveal your balance.
		</div>
		<button
			onclick={handleClearPin}
			class="mt-3.5 rounded-[9px] border border-border-strong bg-panel-2 px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors duration-100 hover:bg-panel-hover"
		>
			{pinCleared ? 'PIN cleared' : 'Clear stored PIN'}
		</button>
	</div>
</section>
