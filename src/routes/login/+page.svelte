<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';

	let mode = $state<'signin' | 'signup'>('signin');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		loading = true;

		const { error: authError } =
			mode === 'signin'
				? await authClient.signIn.email({ email, password })
				: await authClient.signUp.email({ name, email, password });

		loading = false;

		if (authError) {
			error = authError.message ?? 'Something went wrong';
			return;
		}

		await goto('/');
	}
</script>

<svelte:head><title>Log in — Ledger</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-bg px-4">
	<div class="w-full max-w-[360px] rounded-[14px] border border-border bg-panel p-6">
		<h1 class="mb-1 text-[17px] font-semibold tracking-tight text-ink">
			{mode === 'signin' ? 'Log in' : 'Create account'}
		</h1>
		<p class="mb-5 text-[12.5px] text-muted">Access your ledger dashboard.</p>

		<form class="flex flex-col gap-3" onsubmit={submit}>
			{#if mode === 'signup'}
				<input
					type="text"
					placeholder="Name"
					autocomplete="name"
					required
					bind:value={name}
					class="w-full rounded-[9px] border border-border bg-panel-2 px-3 py-2 text-[13px] text-ink outline-none placeholder:text-faint"
				/>
			{/if}
			<input
				type="email"
				placeholder="Email"
				autocomplete="email"
				required
				bind:value={email}
				class="w-full rounded-[9px] border border-border bg-panel-2 px-3 py-2 text-[13px] text-ink outline-none placeholder:text-faint"
			/>
			<input
				type="password"
				placeholder="Password"
				autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
				required
				minlength="8"
				bind:value={password}
				class="w-full rounded-[9px] border border-border bg-panel-2 px-3 py-2 text-[13px] text-ink outline-none placeholder:text-faint"
			/>

			{#if error}
				<p class="text-[12px] text-red">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="mt-1 flex items-center justify-center rounded-[9px] bg-ink px-3 py-2 text-[13px] font-semibold text-bg transition-colors duration-150 hover:bg-dim disabled:opacity-60"
			>
				{loading ? 'Please wait…' : mode === 'signin' ? 'Log in' : 'Sign up'}
			</button>
		</form>

		<button
			type="button"
			onclick={() => (mode = mode === 'signin' ? 'signup' : 'signin')}
			class="mt-4 w-full text-center text-[12px] text-muted hover:text-ink"
		>
			{mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
		</button>
	</div>
</div>
