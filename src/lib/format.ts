export function formatPKR(amount: number): string {
	return 'Rs ' + Math.round(amount).toLocaleString('en-PK');
}

export function initials(name: string): string {
	return name
		.replace(/[^A-Za-z ]/g, '')
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0].toUpperCase())
		.join('');
}
