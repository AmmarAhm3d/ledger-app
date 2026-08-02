<script lang="ts">
	import { Lock, Delete } from '@lucide/svelte';

	interface Props {
		open: boolean;
		pin: string;
		onPressKey: (key: string) => void;
		onClose: () => void;
	}

	let { open, pin, onPressKey, onClose }: Props = $props();

	const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

	function dotFilled(index: number) {
		return pin.length > index;
	}
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && onClose()} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={onClose}
		role="presentation"
		class="fixed inset-0 z-45 flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-label="Enter your PIN"
			tabindex="-1"
			class="flex w-74 flex-col items-center gap-3.5 rounded-2xl border border-border-strong bg-panel-2 p-5.5 shadow-2xl"
		>
			<div
				class="flex h-8.5 w-8.5 items-center justify-center rounded-[10px] bg-panel-strong text-ink"
			>
				<Lock size={16} strokeWidth={1.9} />
			</div>
			<div class="text-center">
				<div class="text-[14.5px] font-semibold tracking-tight">Enter your PIN</div>
				<div class="mt-0.5 text-xs text-muted">Balance stays hidden until unlocked.</div>
			</div>
			<div class="mt-0.5 flex gap-2.5">
				{#each { length: 4 } as _, i (i)}
					<span
						class="h-2.75 w-2.75 rounded-full transition-colors duration-150"
						class:bg-ink={dotFilled(i)}
						class:bg-faint={!dotFilled(i)}
					></span>
				{/each}
			</div>
			<div class="mt-1 grid grid-cols-3 gap-2">
				{#each keys as key (key || 'blank')}
					<button
						onclick={() => key && onPressKey(key)}
						class:invisible={key === ''}
						class="h-11.5 rounded-[10px] border border-border-strong bg-panel-hover font-mono text-base font-medium text-ink transition-[background,transform] duration-100 hover:bg-panel-strong active:translate-y-px"
					>
						{#if key === '⌫'}
							<Delete size={16} strokeWidth={1.9} class="mx-auto" />
						{:else}
							{key}
						{/if}
					</button>
				{/each}
			</div>
			<button
				onclick={onClose}
				class="mt-0.5 border-none bg-transparent text-[12.5px] font-semibold text-muted hover:text-ink"
			>
				Cancel
			</button>
		</div>
	</div>
{/if}
