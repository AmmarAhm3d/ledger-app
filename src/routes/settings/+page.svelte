<script lang="ts">
	import { clearStoredPin } from '$lib/pin-storage';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let pinCleared = $state(false);

	function handleClearPin() {
		clearStoredPin();
		pinCleared = true;
	}
</script>

<section class="flex flex-col gap-4">
	<div class="rounded-[13px] border border-border bg-panel p-5">
		<div class="text-[15px] font-semibold tracking-tight">Account</div>
		<div class="mt-3 flex items-center justify-between border-t border-border pt-3.5 text-[13px]">
			<span class="text-muted">Signed in as</span>
			<span class="font-medium text-ink">{data.user?.email}</span>
		</div>
	</div>

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
