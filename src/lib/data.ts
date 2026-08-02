import type { Account, CategorySpend, Transaction } from './types';

export const initialAccounts: Account[] = [
	{ id: 1, name: 'Meezan Bank', type: 'Bank · savings', balance: 12480 },
	{ id: 2, name: 'Bank Alfalah', type: 'Bank · company', balance: 9200 },
	{ id: 3, name: 'JazzCash', type: 'Microfinance / Wallet', balance: 1340 },
	{ id: 4, name: 'SadaPay', type: 'Microfinance / Wallet', balance: 980 },
	{ id: 5, name: 'Easypaisa', type: 'Microfinance / Wallet', balance: 318 }
];

export const monthlyIncome = 8240;
export const monthlyExpenses = 3178;
export const monthlyBudgetCap = 4200;

export const categorySpend: CategorySpend[] = [
	{ name: 'Housing', baseAmount: 1840, color: '#F4F4F5' },
	{ name: 'Food & Drink', baseAmount: 612, color: '#818CF8' },
	{ name: 'Transport', baseAmount: 284, color: '#818CF8' },
	{ name: 'Software', baseAmount: 199, color: '#6366F1' },
	{ name: 'Health', baseAmount: 145, color: '#4338CA' },
	{ name: 'Other', baseAmount: 98, color: '#3F3F46' }
];

export const weeklySpend: number[] = [180, 96, 210, 140, 88, 250, 165, 120, 305, 198, 142, 96];

export const transactions: Transaction[] = [
	{
		name: 'Blue Bottle Coffee',
		account: 'Amex ·· 4021',
		category: 'Food & Drink',
		date: 'Feb 14',
		amount: -18.4,
		receiptDays: 26
	},
	{
		name: 'Rent — 214 Kearny St',
		account: 'Chase ·· 8871',
		category: 'Housing',
		date: 'Feb 12',
		amount: -1840.0,
		receiptDays: 24
	},
	{
		name: 'Vercel Pro',
		account: 'Amex ·· 4021',
		category: 'Software',
		date: 'Feb 11',
		amount: -20.0,
		receiptDays: 0
	},
	{
		name: 'Payroll — Northwind',
		account: 'Chase ·· 8871',
		category: 'Income',
		date: 'Feb 10',
		amount: 4120.0,
		receiptDays: 0
	},
	{
		name: 'Caltrain monthly',
		account: 'Amex ·· 4021',
		category: 'Transport',
		date: 'Feb 09',
		amount: -96.0,
		receiptDays: 21
	},
	{
		name: 'Sutter Health copay',
		account: 'Chase ·· 8871',
		category: 'Health',
		date: 'Feb 08',
		amount: -45.0,
		receiptDays: 3
	},
	{
		name: 'Rainbow Grocery',
		account: 'Amex ·· 4021',
		category: 'Food & Drink',
		date: 'Feb 07',
		amount: -132.86,
		receiptDays: 19
	}
];
