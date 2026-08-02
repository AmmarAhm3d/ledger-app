<script lang="ts">
	import {
		LayoutDashboard,
		ArrowLeftRight,
		Tag,
		Receipt,
		Settings,
		CreditCard
	} from '@lucide/svelte';
	import type { NavKey } from '$lib/types';

	interface Props {
		nav: NavKey;
		accountCount: number;
		onNav: (key: NavKey) => void;
		onManageAccounts: () => void;
	}

	let { nav, accountCount, onNav, onManageAccounts }: Props = $props();

	const items: { key: NavKey; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
		{ key: 'overview', label: 'Overview', icon: LayoutDashboard },
		{ key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
		{ key: 'categories', label: 'Categories', icon: Tag },
		{ key: 'receipts', label: 'Receipts', icon: Receipt, badge: 12 },
		{ key: 'settings', label: 'Settings', icon: Settings }
	];
</script>

<aside
	class="sticky top-0 flex h-screen w-[244px] flex-none flex-col gap-6.5 border-r border-border bg-panel px-3.5 py-5"
>
	<div class="flex items-center gap-2.5 px-2">
		<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-ink">
			<svg
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="#0B0B0D"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M3 17V7" /><path d="M9 17V11" /><path d="M15 17V5" /><path d="M21 17v-8" />
			</svg>
		</div>
		<div class="text-sm font-semibold tracking-tight">Ledger</div>
		<div class="ml-auto rounded-md border border-border-strong px-1.5 py-0.5 text-[10px] font-medium text-muted">
			v1.4
		</div>
	</div>

	<nav class="flex flex-col gap-0.5">
		{#each items as item (item.key)}
			<button
				onclick={() => onNav(item.key)}
				class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] font-medium transition-colors duration-100 hover:bg-panel-hover"
				class:bg-panel-strong={nav === item.key}
				class:text-ink={nav === item.key}
				class:text-subtle={nav !== item.key}
			>
				<item.icon size={16} strokeWidth={1.9} />
				{item.label}
				{#if item.badge}
					<span
						class="ml-auto rounded-md bg-panel-hover px-1.5 py-0.5 font-mono text-[10.5px] text-subtle"
					>
						{item.badge}
					</span>
				{/if}
			</button>
		{/each}
	</nav>

	<div class="mt-auto flex flex-col gap-3">
		<button
			onclick={onManageAccounts}
			class="flex items-center gap-2.5 rounded-[10px] border border-border bg-panel-2 px-2.5 py-2.5 text-left transition-colors duration-100 hover:bg-panel-hover"
		>
			<div
				class="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-lg bg-panel-strong text-dim"
			>
				<CreditCard size={13} strokeWidth={2} />
			</div>
			<div class="min-w-0 leading-tight">
				<div class="text-xs font-semibold text-ink">Manage accounts</div>
				<div class="text-[11px] text-muted">{accountCount} linked · entered manually</div>
			</div>
		</button>
	</div>
</aside>
