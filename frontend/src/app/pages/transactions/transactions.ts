import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Transaction } from '../../models/models';

const PLAID_CATEGORIES = [
    'INCOME',
    'LOAN_DISBURSEMENTS',
    'LOAN_PAYMENTS',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'BANK_FEES',
    'ENTERTAINMENT',
    'FOOD_AND_DRINK',
    'GENERAL_MERCHANDISE',
    'HOME_IMPROVEMENT',
    'MEDICAL',
    'PERSONAL_CARE',
    'GENERAL_SERVICES',
    'GOVERNMENT_AND_NON_PROFIT',
    'TRANSPORTATION',
    'TRAVEL',
    'RENT_AND_UTILITIES',
    'PERSONAL',
    'OTHER',
] as const;

@Component({
    selector: 'app-transactions',
    imports: [CommonModule, FormsModule],
    templateUrl: './transactions.html',
    styleUrl: './transactions.css',
})
export class TransactionsPage implements OnInit {
    private api = inject(ApiService);

    transactions: WritableSignal<Transaction[]> = signal<Transaction[]>([]);
    loading: WritableSignal<boolean> = signal(true);
    deletingTransactionId: WritableSignal<string | null> = signal(null);
    deleting: WritableSignal<boolean> = signal(false);
    updatingCategoryIds: WritableSignal<Record<string, boolean>> = signal<Record<string, boolean>>({});
    categories = PLAID_CATEGORIES;

    ngOnInit() {
        this.loadTransactions();
    }

    loadTransactions() {
        this.loading.set(true);
        this.api.getTransactions().subscribe({
            next: (data) => {
                this.loading.set(false);
                this.transactions.set(data ?? []);
            },
            error: () => {
                this.loading.set(false);
                this.transactions.set([]);
            },
        });
    }

    confirmDelete(transaction: Transaction) {
        this.deletingTransactionId.set(transaction.transaction_id);
    }

    cancelDelete() {
        this.deletingTransactionId.set(null);
    }

    deleteTransaction() {
        const id = this.deletingTransactionId();
        if (!id) return;

        this.deleting.set(true);
        this.api.deleteTransaction(id).subscribe({
            next: () => {
                this.deleting.set(false);
                this.deletingTransactionId.set(null);
                this.loadTransactions();
            },
            error: () => {
                this.deleting.set(false);
                this.deletingTransactionId.set(null);
            },
        });
    }

    updateCategory(transaction: Transaction, category: string) {
        const normalizedCategory = category.trim().toUpperCase();
        const previousCategory = transaction.personal_finance_category || 'OTHER';

        if (!normalizedCategory || normalizedCategory === previousCategory) {
            return;
        }

        this.setTransactionCategory(transaction.transaction_id, normalizedCategory);
        this.setUpdatingCategory(transaction.transaction_id, true);

        this.api.updateTransactionCategory(transaction.transaction_id, { category: normalizedCategory }).subscribe({
            next: () => {
                this.setUpdatingCategory(transaction.transaction_id, false);
            },
            error: () => {
                this.setTransactionCategory(transaction.transaction_id, previousCategory);
                this.setUpdatingCategory(transaction.transaction_id, false);
            },
        });
    }

    isUpdatingCategory(transactionId: string): boolean {
        return !!this.updatingCategoryIds()[transactionId];
    }

    private setTransactionCategory(transactionId: string, category: string) {
        this.transactions.update((transactions) =>
            transactions.map((txn) =>
                txn.transaction_id === transactionId
                    ? { ...txn, personal_finance_category: category }
                    : txn
            )
        );
    }

    private setUpdatingCategory(transactionId: string, updating: boolean) {
        this.updatingCategoryIds.update((state) => {
            if (!updating) {
                const { [transactionId]: _, ...rest } = state;
                return rest;
            }

            return {
                ...state,
                [transactionId]: true,
            };
        });
    }

    formatCurrency(value: string): string {
        const n = parseFloat(value || '0');
        return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    parseFloat(value: string): number {
        return parseFloat(value || '0');
    }

    formatAmount(value: string): string {
        const n = parseFloat(value || '0');
        const abs = Math.abs(n);
        const formatted = abs.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        if (n < 0) {
            return '+' + formatted;
        }
        return formatted;
    }

    formatCategory(category: string): string {
        return category
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }
}
