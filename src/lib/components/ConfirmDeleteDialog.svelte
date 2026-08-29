<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description: string;
		confirmLabel?: string;
		onConfirm: () => void;
		triggerTitle?: string;
		triggerClass?: string;
		trigger: Snippet;
	}

	let {
		title,
		description,
		confirmLabel = 'Delete',
		onConfirm,
		triggerTitle,
		triggerClass,
		trigger
	}: Props = $props();
</script>

<AlertDialog.Root>
	<AlertDialog.Trigger title={triggerTitle} class={triggerClass}>
		{@render trigger()}
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<div>
				<AlertDialog.Title>{title}</AlertDialog.Title>
				<AlertDialog.Description>{description}</AlertDialog.Description>
			</div>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={onConfirm}>{confirmLabel}</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
