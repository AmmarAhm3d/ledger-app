/**
 * Tracks in-flight mutations by scope (e.g. 'transactions', 'categories', 'accounts')
 * so screens whose add/update modals live outside the page that renders their list
 * (mounted in +layout.svelte) can still show a skeleton while `invalidateAll()` reruns.
 */
class PendingMutations {
	scopes = $state(new Set<string>());

	start(scope: string) {
		this.scopes.add(scope);
	}

	end(scope: string) {
		this.scopes.delete(scope);
	}

	isPending(scope: string) {
		return this.scopes.has(scope);
	}
}

export const pending = new PendingMutations();
