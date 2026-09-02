import type { AccountTypeValue } from './schema';

export type AccountType = AccountTypeValue;

export interface Account {
	id: number;
	name: string;
	type: AccountType;
	balance: number;
}

export interface Category {
	id: number;
	name: string;
	monthly_cap: number;
}

export interface CategorySpend {
	name: string;
	baseAmount: number;
	color: string;
}

export interface AccountSpend {
	name: string;
	baseAmount: number;
}

export interface Transaction {
	id: number;
	name: string;
	account: string;
	category: string;
	date: string;
	amount: number;
	hasReceipt: boolean;
}
