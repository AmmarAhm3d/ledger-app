<script lang="ts">
	import { Lock, Delete } from '@lucide/svelte';

	type Mode = 'create' | 'confirm' | 'unlock';

	interface Props {
		open: boolean;
		pin: string;
		mode: Mode;
		error?: boolean;
		onPressKey: (key: string) => void;
		onClose: () => void;
		onReset: () => void;
	}

	let { open, pin, mode, error = false, onPressKey, onClose, onReset }: Props = $props();

	const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

	const copy: Record<Mode, { title: string; subtitle: string }> = {
		create: { title: 'Create a PIN', subtitle: "Choose 4 digits only you'll remember." },
		confirm: { title: 'Confirm your PIN', subtitle: 'Enter it once more to confirm.' },
		unlock: { title: 'Enter your PIN', subtitle: 'Balance stays hidden until unlocked.' }
	};

	function dotFilled(index: number) {
		return pin.length > index;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			onClose();
		} else if (e.key === 'Backspace') {
			e.preventDefault();
			onPressKey('⌫');
		} else if (/^[0-9]$/.test(e.key)) {
			e.preventDefault();
			onPressKey(e.key);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={onClose}
		role="presentation"
		class="fixed inset-0 z-45 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-label={copy[mode].title}
			tabindex="-1"
			class="flex w-full max-w-74 flex-col items-center gap-3.5 rounded-2xl border border-border-strong bg-panel-2 p-5.5 shadow-2xl"
		>
			<div
				class="flex h-8.5 w-8.5 items-center justify-center rounded-[10px] bg-panel-strong text-ink"
			>
				<Lock size={16} strokeWidth={1.9} />
			</div>
			<div class="text-center">
				<div class="text-[14.5px] font-semibold tracking-tight">{copy[mode].title}</div>
				<div class="mt-0.5 text-xs" class:text-red={error} class:text-muted={!error}>
					{error ? 'Incorrect PIN, try again.' : copy[mode].subtitle}
				</div>
			</div>
			<div class="mt-0.5 flex gap-2.5">
				{#each { length: 4 } as _, i (i)}
					<span
						class="h-2.75 w-2.75 rounded-full transition-colors duration-150"
						class:bg-red={error}
						class:bg-ink={!error && dotFilled(i)}
						class:bg-faint={!error && !dotFilled(i)}
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
			<div class="mt-0.5 flex items-center gap-3">
				<button
					onclick={onClose}
					class="border-none bg-transparent text-[12.5px] font-semibold text-muted hover:text-ink"
				>
					Cancel
				</button>
				{#if mode === 'unlock'}
					<button
						onclick={onReset}
						class="border-none bg-transparent text-[12.5px] font-semibold text-muted hover:text-ink"
					>
						Forgot PIN?
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
