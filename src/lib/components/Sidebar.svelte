<script lang="ts">
	import {
		LayoutDashboard,
		ArrowLeftRight,
		Tag,
		Receipt,
		Repeat,
		PiggyBank,
		Settings,
		CreditCard,
		PieChart,
		LogOut,
		X
	} from '@lucide/svelte';
	import { page } from '$app/state';

	interface Props {
		accountCount: number;
		categoryCount: number;
		onManageAccounts: () => void;
		onSignOut: () => void;
		open?: boolean;
		onClose?: () => void;
	}

	let { accountCount, categoryCount, onManageAccounts, onSignOut, open = false, onClose }: Props =
		$props();

	const items: { href: string; label: string; icon: typeof LayoutDashboard }[] = [
		{ href: '/', label: 'Overview', icon: LayoutDashboard },
		{ href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
		{ href: '/categories', label: 'Categories', icon: Tag },
		{ href: '/receipts', label: 'Receipts', icon: Receipt },
		{ href: '/subscriptions', label: 'Subscriptions', icon: Repeat },
		{ href: '/goals', label: 'Goals', icon: PiggyBank },
		{ href: '/allocation', label: 'Allocation', icon: PieChart },
		{ href: '/settings', label: 'Settings', icon: Settings }
	];

	function isActive(href: string) {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	function handleManageAccounts() {
		onManageAccounts();
		onClose?.();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={onClose}
		role="presentation"
		class="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
	></div>
{/if}

<aside
	class="fixed inset-y-0 left-0 z-50 flex h-screen w-[244px] flex-none flex-col gap-6.5 border-r border-border bg-panel px-3.5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] transition-transform duration-200 lg:sticky lg:top-0 lg:visible lg:translate-x-0 {open
		? 'visible translate-x-0'
		: 'invisible -translate-x-full'}"
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
		<button
			onclick={onClose}
			aria-label="Close menu"
			class="flex h-6.5 w-6.5 items-center justify-center rounded-lg text-muted hover:bg-panel-hover hover:text-ink lg:hidden"
		>
			<X size={14} strokeWidth={1.9} />
		</button>
	</div>

	<nav class="flex flex-col gap-0.5">
		{#each items as item (item.href)}
			<a
				href={item.href}
				onclick={() => onClose?.()}
				aria-current={isActive(item.href) ? 'page' : undefined}
				class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] font-medium transition-colors duration-100 hover:bg-panel-hover"
				class:bg-panel-strong={isActive(item.href)}
				class:text-ink={isActive(item.href)}
				class:text-subtle={!isActive(item.href)}
			>
				<item.icon size={16} strokeWidth={1.9} />
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="mt-auto flex flex-col gap-3">
		<button
			onclick={handleManageAccounts}
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
		<a
			href="/categories"
			onclick={() => onClose?.()}
			class="flex items-center gap-2.5 rounded-[10px] border border-border bg-panel-2 px-2.5 py-2.5 text-left transition-colors duration-100 hover:bg-panel-hover"
		>
			<div
				class="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-lg bg-panel-strong text-dim"
			>
				<Tag size={13} strokeWidth={2} />
			</div>
			<div class="min-w-0 leading-tight">
				<div class="text-xs font-semibold text-ink">Manage categories</div>
				<div class="text-[11px] text-muted">{categoryCount} tracked</div>
			</div>
		</a>
		<button
			onclick={onSignOut}
			class="flex items-center gap-2.5 rounded-[10px] border border-border bg-panel-2 px-2.5 py-2.5 text-left transition-colors duration-100 hover:bg-panel-hover"
		>
			<div
				class="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-lg bg-panel-strong text-dim"
			>
				<LogOut size={13} strokeWidth={2} />
			</div>
			<div class="min-w-0 leading-tight">
				<div class="text-xs font-semibold text-ink">Sign out</div>
			</div>
		</button>
	</div>
</aside>
