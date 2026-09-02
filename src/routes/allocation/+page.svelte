<script lang="ts">
	import { browser } from '$app/environment';
	import { Lock, LockOpen } from '@lucide/svelte';
	import { getStoredPin, setStoredPin, clearStoredPin } from '$lib/pin-storage';
	import { formatPKR } from '$lib/format';
	import PinModal from '$lib/components/PinModal.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const PALETTE = ['#F4F4F5', '#818CF8', '#A5B4FC', '#6366F1', '#4338CA', '#3F3F46', '#C4B5FD'];

	let rows = $derived.by(() => {
		const total = data.byType.reduce((sum, t) => sum + t.total, 0);
		const max = Math.max(...data.byType.map((t) => t.total), 0);
		return data.byType.map((t, i) => ({
			type: t.type,
			total: t.total,
			color: PALETTE[i % PALETTE.length],
			share: (total === 0 ? 0 : Math.round((t.total / total) * 100)) + '%',
			width: (max === 0 ? 0 : Math.round((t.total / max) * 100)) + '%'
		}));
	});

	let amountsHidden = $state(true);
	let pin = $state('');
	let pinModalOpen = $state(false);
	let pinStage = $state<'create' | 'confirm' | 'unlock'>('unlock');
	let pinPending = $state('');
	let pinError = $state(false);

	function handleToggleAmounts() {
		if (amountsHidden) {
			pin = '';
			pinPending = '';
			pinError = false;
			pinStage = browser && getStoredPin() ? 'unlock' : 'create';
			pinModalOpen = true;
		} else {
			amountsHidden = true;
		}
	}

	function unlockAmounts() {
		amountsHidden = false;
		pinModalOpen = false;
		pin = '';
		pinPending = '';
		pinError = false;
	}

	function handlePinReset() {
		clearStoredPin();
		pin = '';
		pinPending = '';
		pinError = false;
		pinStage = 'create';
	}

	function handlePressKey(key: string) {
		if (key === '⌫') {
			pin = pin.slice(0, -1);
			pinError = false;
			return;
		}
		pinError = false;
		const next = (pin + key).slice(0, 4);
		pin = next;
		if (next.length < 4) return;

		if (pinStage === 'create') {
			pinPending = next;
			pin = '';
			pinStage = 'confirm';
			return;
		}

		if (pinStage === 'confirm') {
			if (next === pinPending) {
				setStoredPin(next);
				setTimeout(unlockAmounts, 180);
			} else {
				pinError = true;
				pin = '';
				pinPending = '';
				pinStage = 'create';
			}
			return;
		}

		if (next === getStoredPin()) {
			setTimeout(unlockAmounts, 180);
		} else {
			pinError = true;
			setTimeout(() => {
				pin = '';
				pinError = false;
			}, 400);
		}
	}
</script>

<div class="rounded-[13px] border border-border bg-panel">
	<div class="flex items-center gap-3 border-b border-border px-4.5 py-4">
		<div>
			<div class="text-sm font-semibold tracking-tight">Balance by account type</div>
			<div class="mt-0.5 text-xs text-muted">Across all {data.accounts.length} accounts</div>
		</div>
		<button
			onclick={handleToggleAmounts}
			title={amountsHidden ? 'Unlock amounts' : 'Hide amounts'}
			class="ml-auto flex h-7 w-7 items-center justify-center rounded-[8px] border border-border-strong bg-panel-2 text-subtle transition-colors duration-100 hover:bg-panel-strong hover:text-ink"
		>
			{#if amountsHidden}
				<Lock size={13} strokeWidth={1.9} />
			{:else}
				<LockOpen size={13} strokeWidth={1.9} />
			{/if}
		</button>
	</div>

	<div class="flex flex-col gap-3.5 px-4.5 pt-4 pb-2">
		{#if rows.length === 0}
			<p class="py-2 text-xs text-muted">No accounts yet.</p>
		{/if}
		{#each rows as row (row.type)}
			<div class="flex flex-col gap-1.5">
				<div class="flex items-baseline gap-2">
					<span class="h-1.5 w-1.5 rounded-sm" style="background:{row.color}"></span>
					<span class="text-[12.5px] font-medium">{row.type}</span>
					<span class="ml-auto font-mono text-[12.5px] text-ink">
						{amountsHidden ? '••••••' : formatPKR(row.total)}
					</span>
					<span class="w-9.5 text-right font-mono text-[11.5px] text-muted">{row.share}</span>
				</div>
				<div class="h-2 overflow-hidden rounded-md bg-panel-hover">
					<div
						class="h-full rounded-md transition-[width] duration-400 ease-out"
						style="width:{row.width}; background:{row.color}"
					></div>
				</div>
			</div>
		{/each}
	</div>

	<div class="mx-4.5 my-3.5 h-px bg-border"></div>

	<div class="flex items-center justify-between px-4.5 pb-4.5 text-[12.5px]">
		<span class="text-muted">Total across all accounts</span>
		<span class="font-mono font-semibold text-ink">
			{amountsHidden ? '••••••••' : formatPKR(data.grandTotal)}
		</span>
	</div>
</div>

<PinModal
	open={pinModalOpen}
	{pin}
	mode={pinStage}
	error={pinError}
	onPressKey={handlePressKey}
	onClose={() => (pinModalOpen = false)}
	onReset={handlePinReset}
/>
