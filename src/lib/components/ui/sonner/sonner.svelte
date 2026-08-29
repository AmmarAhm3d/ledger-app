<script lang="ts">
	import { Toaster as Sonner } from 'svelte-sonner';
</script>

<Sonner
	theme="dark"
	class="toaster group"
	style="--normal-bg: var(--color-panel-2); --normal-text: var(--color-ink); --normal-border: var(--color-border-strong); --success-bg: var(--color-panel-2); --success-text: var(--color-green); --success-border: color-mix(in srgb, var(--color-green) 40%, transparent); --error-bg: var(--color-panel-2); --error-text: var(--color-red); --error-border: color-mix(in srgb, var(--color-red) 40%, transparent);"
	toastOptions={{ style: 'border-radius: 12px; font-size: 12.5px;' }}
/>
