const STORAGE_KEY = 'ledger:balance-pin';

export function getStoredPin(): string | null {
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

export function setStoredPin(pin: string): void {
	try {
		localStorage.setItem(STORAGE_KEY, pin);
	} catch {
		// localStorage unavailable (private browsing, disabled storage, etc) — lock silently no-ops
	}
}

export function clearStoredPin(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// see getStoredPin
	}
}
