export function parseAmount(raw: FormDataEntryValue | null): number {
	const cleaned = String(raw ?? '').replace(/[^0-9.-]/g, '');
	return cleaned === '' ? NaN : Number(cleaned);
}

export function parseOptionalAmount(raw: FormDataEntryValue | null, fallback = 0): number {
	if (String(raw ?? '').trim() === '') return fallback;
	return parseAmount(raw);
}

export function parseId(raw: FormDataEntryValue | null): number {
	const id = Number(raw);
	return Number.isInteger(id) && id > 0 ? id : NaN;
}

export function parseOptionalId(raw: FormDataEntryValue | null): number | null {
	if (raw == null || String(raw).trim() === '') return null;
	const id = Number(raw);
	return Number.isInteger(id) && id > 0 ? id : NaN;
}
