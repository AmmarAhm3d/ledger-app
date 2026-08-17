<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		class?: string;
	}

	let { width = '100%', height = '1em', class: className = '' }: Props = $props();
</script>

<span
	class="skeleton-pulse inline-block rounded-md bg-panel-strong {className}"
	style="width:{width}; height:{height}"
></span>

<style>
	.skeleton-pulse {
		animation: skeleton-pulse 1.4s ease-in-out infinite;
	}

	@keyframes skeleton-pulse {
		0%,
		100% {
			opacity: 0.55;
		}
		50% {
			opacity: 1;
		}
	}
</style>
