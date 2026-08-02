<script lang="ts">
	import { authClient } from '$lib/auth-client';

	let error = $state('');
	let loading = $state(false);

	async function signInWithGitHub() {
		error = '';
		loading = true;

		const { error: authError } = await authClient.signIn.social({
			provider: 'github',
			callbackURL: '/'
		});

		loading = false;

		if (authError) {
			error = authError.message ?? 'Something went wrong';
		}
	}
</script>

<svelte:head><title>Log in — Ledger</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-bg px-4">
	<div class="w-full max-w-[360px] rounded-[14px] border border-border bg-panel p-6">
		<h1 class="mb-1 text-[17px] font-semibold tracking-tight text-ink">Log in</h1>
		<p class="mb-5 text-[12.5px] text-muted">Access your ledger dashboard.</p>

		{#if error}
			<p class="mb-3 text-[12px] text-red">{error}</p>
		{/if}

		<button
			type="button"
			onclick={signInWithGitHub}
			disabled={loading}
			class="flex w-full items-center justify-center gap-2 rounded-[9px] bg-ink px-3 py-2 text-[13px] font-semibold text-bg transition-colors duration-150 hover:bg-dim disabled:opacity-60"
		>
			<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
				<path
					d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
				/>
			</svg>
			{loading ? 'Redirecting…' : 'Sign in with GitHub'}
		</button>
	</div>
</div>
