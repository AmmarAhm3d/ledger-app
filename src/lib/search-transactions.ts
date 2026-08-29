export interface SearchResult {
	id: number;
	description: string | null;
	amount: number;
	date: string;
	is_transfer: boolean;
	account_id: number;
	category_id: number | null;
	account_name: string;
}
