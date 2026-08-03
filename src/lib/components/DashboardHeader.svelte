<script lang="ts">
	import { Search, Bell, Plus, Menu, ArrowLeftRight } from '@lucide/svelte';

	interface Props {
		title: string;
		subtitle: string;
		onAddTransaction: () => void;
		onTransfer: () => void;
		onToggleNav?: () => void;
	}

	let { title, subtitle, onAddTransaction, onTransfer, onToggleNav }: Props = $props();
</script>

<header
	class="sticky top-0 z-[5] flex items-center gap-3 border-b border-border bg-bg/85 px-4 py-3.5 backdrop-blur-sm sm:gap-4 sm:px-8 sm:py-4.5"
>
	<button
		type="button"
		onclick={onToggleNav}
		aria-label="Open menu"
		class="flex h-8.5 w-8.5 flex-none items-center justify-center rounded-[9px] border border-border bg-panel text-dim transition-colors duration-100 hover:bg-panel-hover lg:hidden"
	>
		<Menu size={16} strokeWidth={1.9} />
	</button>
	<div class="min-w-0">
		<h1 class="m-0 truncate text-[16.5px] font-semibold tracking-tight sm:text-[19px]">{title}</h1>
		<div class="mt-0.5 truncate text-[11.5px] text-muted sm:text-[12.5px]">{subtitle}</div>
	</div>
	<div class="ml-auto flex items-center gap-2 sm:gap-2.5">
		<div
			class="hidden w-[160px] items-center gap-1.5 rounded-[9px] border border-border bg-panel px-2.5 py-1.5 md:flex lg:w-[210px]"
		>
			<Search size={14} strokeWidth={2} class="text-muted" />
			<input
				type="search"
				aria-label="Search transactions"
				placeholder="Search transactions"
				class="w-full border-none bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
			/>
		</div>
		<button
			type="button"
			aria-label="Notifications"
			class="hidden h-8.5 w-8.5 items-center justify-center rounded-[9px] border border-border bg-panel text-dim transition-colors duration-100 hover:bg-panel-hover sm:flex"
		>
			<Bell size={15} strokeWidth={1.9} />
		</button>
		<button
			type="button"
			onclick={onTransfer}
			aria-label="Transfer between accounts"
			class="flex items-center gap-1.5 rounded-[9px] border border-border bg-panel px-2.5 py-2 text-[13px] font-semibold text-dim transition-colors duration-100 hover:bg-panel-hover sm:px-3.5"
		>
			<ArrowLeftRight size={15} strokeWidth={2.2} />
			<span class="hidden sm:inline">Transfer</span>
		</button>
		<button
			type="button"
			onclick={onAddTransaction}
			aria-label="Add transaction"
			class="flex items-center gap-1.5 rounded-[9px] bg-ink px-2.5 py-2 text-[13px] font-semibold text-bg transition-colors duration-150 hover:bg-dim active:translate-y-px sm:px-3.5"
		>
			<Plus size={15} strokeWidth={2.2} />
			<span class="hidden sm:inline">Add transaction</span>
		</button>
	</div>
</header>
