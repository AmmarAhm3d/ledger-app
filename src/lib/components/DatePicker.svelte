<script lang="ts">
	import { CalendarDays } from '@lucide/svelte';
	import { CalendarDate, parseDate, today, getLocalTimeZone, type DateValue } from '@internationalized/date';
	import * as Popover from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar';
	import { cn } from '$lib/utils';

	interface Props {
		name: string;
		value: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		placeholder?: string;
		onValueChange?: (value: string) => void;
		inputRef?: HTMLInputElement | null;
	}

	let {
		name,
		value = $bindable(),
		required = false,
		disabled = false,
		class: className,
		placeholder = 'Select date',
		onValueChange,
		inputRef = $bindable(null)
	}: Props = $props();

	let open = $state(false);

	function toCalendarDate(iso: string): CalendarDate | undefined {
		if (!iso) return undefined;
		try {
			return parseDate(iso);
		} catch {
			return undefined;
		}
	}

	let calendarValue = $derived(toCalendarDate(value));

	let displayLabel = $derived(
		calendarValue
			? calendarValue.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				})
			: placeholder
	);

	function handleSelect(next: DateValue | undefined) {
		if (!next) return;
		value = next.toString();
		open = false;
		onValueChange?.(value);
	}
</script>

<input type="hidden" bind:this={inputRef} {name} {value} {required} />

<Popover.Root bind:open>
	<Popover.Trigger
		type="button"
		{disabled}
		class={cn(
			'flex items-center gap-1.5 rounded-lg border border-border-strong bg-bg px-2.75 py-2.25 text-left text-[13px] text-ink outline-none transition-colors duration-100 focus:border-accent focus:ring-3 focus:ring-accent/18 disabled:cursor-not-allowed disabled:opacity-50',
			!calendarValue && 'text-faint',
			className
		)}
	>
		<CalendarDays size={13} strokeWidth={2} class="flex-none text-muted" />
		<span class="truncate">{displayLabel}</span>
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0">
		<Calendar
			type="single"
			value={calendarValue}
			onValueChange={handleSelect}
			placeholder={calendarValue ?? today(getLocalTimeZone())}
		/>
	</Popover.Content>
</Popover.Root>
