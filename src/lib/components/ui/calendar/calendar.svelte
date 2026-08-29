<script lang="ts">
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		class: className,
		weekdayFormat = 'short',
		...restProps
	}: CalendarPrimitive.RootProps = $props();
</script>

<CalendarPrimitive.Root
	bind:ref
	bind:value={value as never}
	bind:placeholder
	{weekdayFormat}
	class={cn('p-2.5', className)}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		{#each months as month (month.value.toString())}
			<CalendarPrimitive.Header class="flex items-center justify-between px-0.5 pb-2.5">
				<CalendarPrimitive.PrevButton
					class="flex h-7 w-7 items-center justify-center rounded-lg text-dim transition-colors duration-100 hover:bg-panel-hover hover:text-ink disabled:pointer-events-none disabled:opacity-30"
				>
					<ChevronLeft size={15} strokeWidth={2.2} />
				</CalendarPrimitive.PrevButton>
				<CalendarPrimitive.Heading class="text-[12.5px] font-semibold text-ink" />
				<CalendarPrimitive.NextButton
					class="flex h-7 w-7 items-center justify-center rounded-lg text-dim transition-colors duration-100 hover:bg-panel-hover hover:text-ink disabled:pointer-events-none disabled:opacity-30"
				>
					<ChevronRight size={15} strokeWidth={2.2} />
				</CalendarPrimitive.NextButton>
			</CalendarPrimitive.Header>
			<CalendarPrimitive.Grid class="w-full border-collapse select-none space-y-1">
				<CalendarPrimitive.GridHead>
					<CalendarPrimitive.GridRow class="flex justify-between">
						{#each weekdays as weekday (weekday)}
							<CalendarPrimitive.HeadCell
								class="w-8 flex-1 text-center font-mono text-[10.5px] font-medium text-muted"
							>
								{weekday.slice(0, 2)}
							</CalendarPrimitive.HeadCell>
						{/each}
					</CalendarPrimitive.GridRow>
				</CalendarPrimitive.GridHead>
				<CalendarPrimitive.GridBody>
					{#each month.weeks as weekDates (weekDates.map((d) => d.toString()).join('-'))}
						<CalendarPrimitive.GridRow class="flex w-full justify-between">
							{#each weekDates as date (date.toString())}
								<CalendarPrimitive.Cell {date} month={month.value} class="relative w-8 flex-1 p-0 text-center">
									<CalendarPrimitive.Day
										class="flex h-8 w-8 items-center justify-center rounded-lg text-[12.5px] text-ink outline-none transition-colors duration-100 hover:bg-panel-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-30 data-[outside-month]:text-faint data-[selected]:bg-accent data-[selected]:font-semibold data-[selected]:text-bg data-[unavailable]:pointer-events-none data-[unavailable]:text-faint data-[unavailable]:line-through"
									/>
								</CalendarPrimitive.Cell>
							{/each}
						</CalendarPrimitive.GridRow>
					{/each}
				</CalendarPrimitive.GridBody>
			</CalendarPrimitive.Grid>
		{/each}
	{/snippet}
</CalendarPrimitive.Root>
