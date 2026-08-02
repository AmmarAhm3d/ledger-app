<script lang="ts">
	import { Search, Bell, Plus } from '@lucide/svelte';

	interface Props {
		title: string;
		subtitle: string;
		onAddTransaction: () => void;
	}

	let { title, subtitle, onAddTransaction }: Props = $props();
</script>

<header
	class="sticky top-0 z-[5] flex items-center gap-4 border-b border-border bg-bg/85 px-8 py-4.5 backdrop-blur-sm"
>
	<div>
		<h1 class="m-0 text-[19px] font-semibold tracking-tight">{title}</h1>
		<div class="mt-0.5 text-[12.5px] text-muted">{subtitle}</div>
	</div>
	<div class="ml-auto flex items-center gap-2.5">
		<div
			class="flex w-[210px] items-center gap-1.5 rounded-[9px] border border-border bg-panel px-2.5 py-1.5"
		>
			<Search size={14} strokeWidth={2} class="text-muted" />
			<input
				placeholder="Search transactions"
				class="w-full border-none bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
			/>
		</div>
		<button
			class="flex h-8.5 w-8.5 items-center justify-center rounded-[9px] border border-border bg-panel text-dim transition-colors duration-100 hover:bg-panel-hover"
		>
			<Bell size={15} strokeWidth={1.9} />
		</button>
		<button
			onclick={onAddTransaction}
			class="flex items-center gap-1.5 rounded-[9px] bg-ink px-3.5 py-2 text-[13px] font-semibold text-bg transition-colors duration-150 hover:bg-dim active:translate-y-px"
		>
			<Plus size={15} strokeWidth={2.2} />
			Add transaction
		</button>
	</div>
</header>
