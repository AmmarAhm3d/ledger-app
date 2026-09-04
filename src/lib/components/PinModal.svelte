<script lang="ts">
	import { Lock, Delete } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';

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
		if (e.key === 'Backspace') {
			e.preventDefault();
			onPressKey('⌫');
		} else if (/^[0-9]$/.test(e.key)) {
			e.preventDefault();
			onPressKey(e.key);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root {open} onOpenChange={(next) => !next && onClose()}>
	<Dialog.Content maxWidth="sm:max-w-[340px]" class="items-center gap-4">
		<div
			class="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent shadow-sm"
		>
			<Lock size={20} strokeWidth={2} />
		</div>

		<div class="px-2 text-center">
			<Dialog.Title class="text-base">{copy[mode].title}</Dialog.Title>
			<div
				class="mt-1 text-xs transition-colors duration-150"
				class:text-red={error}
				class:text-muted={!error}
			>
				{error ? 'Incorrect PIN, try again.' : copy[mode].subtitle}
			</div>
		</div>

		<div class="my-1 flex items-center justify-center gap-3.5" class:animate-shake={error}>
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

		<div class="mt-2 grid w-full max-w-[260px] grid-cols-3 gap-3.5 justify-items-center">
			{#each keys as key (key || 'blank')}
				{#if key === ''}
					<div class="h-15 w-15"></div>
				{:else}
					<button
						type="button"
						onclick={() => onPressKey(key)}
						aria-label={key === '⌫' ? 'Backspace' : `Digit ${key}`}
						class="flex h-15 w-15 cursor-pointer items-center justify-center rounded-full border border-border/80 bg-panel-hover text-xl font-medium text-ink transition-all duration-150 select-none hover:border-border-strong hover:bg-panel-strong active:scale-90 active:bg-accent/20"
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

		<div class="mt-2 flex items-center gap-4">
			<button
				type="button"
				onclick={onClose}
				class="cursor-pointer border-none bg-transparent px-2 py-1 text-xs font-semibold text-muted transition-colors hover:text-ink"
			>
				Cancel
			</button>
			{#if mode === 'unlock'}
				<button
					type="button"
					onclick={onReset}
					class="cursor-pointer border-none bg-transparent px-2 py-1 text-xs font-semibold text-muted transition-colors hover:text-ink"
				>
					Forgot PIN?
				</button>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
