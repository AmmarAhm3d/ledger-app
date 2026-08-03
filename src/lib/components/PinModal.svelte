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
		class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-md transition-opacity duration-200"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-label={copy[mode].title}
			tabindex="-1"
			class="flex w-full max-w-full sm:max-w-[340px] flex-col items-center gap-4 rounded-t-3xl sm:rounded-3xl border border-border-strong bg-panel-2 p-6 pb-8 sm:pb-6 shadow-2xl transition-all duration-200"
		>
			<!-- Drag handle for mobile bottom sheet appearance -->
			<div class="h-1 w-10 rounded-full bg-border-strong sm:hidden -mt-1 mb-1"></div>

			<!-- Lock Header Badge -->
			<div
				class="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent border border-accent/20 shadow-sm"
			>
				<Lock size={20} strokeWidth={2} />
			</div>

			<!-- Title & Subtitle -->
			<div class="text-center px-2">
				<div class="text-base font-semibold tracking-tight text-ink">{copy[mode].title}</div>
				<div
					class="mt-1 text-xs transition-colors duration-150"
					class:text-red={error}
					class:text-muted={!error}
				>
					{error ? 'Incorrect PIN, try again.' : copy[mode].subtitle}
				</div>
			</div>

			<!-- PIN Dots Indicator -->
			<div
				class="my-1 flex items-center justify-center gap-3.5"
				class:animate-shake={error}
			>
				{#each { length: 4 } as _, i (i)}
					<div
						class="h-3.5 w-3.5 rounded-full transition-all duration-200"
						class:bg-red={error}
						class:bg-accent={!error && dotFilled(i)}
						class:bg-panel-strong={!error && !dotFilled(i)}
						class:scale-110={error || (!error && dotFilled(i))}
						class:shadow-sm={!error && dotFilled(i)}
						class:shadow-accent-40={!error && dotFilled(i)}
						class:border={!error && !dotFilled(i)}
						class:border-border-strong={!error && !dotFilled(i)}
					></div>
				{/each}
			</div>

			<!-- Circular Numpad Grid -->
			<div class="mt-2 grid w-full max-w-[260px] grid-cols-3 gap-3.5 justify-items-center">
				{#each keys as key (key || 'blank')}
					{#if key === ''}
						<div class="h-15 w-15"></div>
					{:else}
						<button
							type="button"
							onclick={() => onPressKey(key)}
							aria-label={key === '⌫' ? 'Backspace' : `Digit ${key}`}
							class="flex h-15 w-15 items-center justify-center rounded-full border border-border/80 bg-panel-hover text-xl font-medium text-ink transition-all duration-150 hover:bg-panel-strong hover:border-border-strong active:scale-90 active:bg-accent/20 select-none cursor-pointer"
						>
							{#if key === '⌫'}
								<Delete size={20} strokeWidth={2} class="text-subtle" />
							{:else}
								<span>{key}</span>
							{/if}
						</button>
					{/if}
				{/each}
			</div>

			<!-- Action Buttons -->
			<div class="mt-2 flex items-center gap-4">
				<button
					type="button"
					onclick={onClose}
					class="border-none bg-transparent text-xs font-semibold text-muted hover:text-ink transition-colors px-2 py-1 cursor-pointer"
				>
					Cancel
				</button>
				{#if mode === 'unlock'}
					<button
						type="button"
						onclick={onReset}
						class="border-none bg-transparent text-xs font-semibold text-muted hover:text-ink transition-colors px-2 py-1 cursor-pointer"
					>
						Forgot PIN?
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
