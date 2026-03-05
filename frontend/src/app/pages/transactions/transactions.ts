import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Transaction } from '../../models/models';

@Component({
    selector: 'app-transactions',
    imports: [CommonModule],
    templateUrl: './transactions.html',
    styleUrl: './transactions.css',
})
export class TransactionsPage implements OnInit {
    private api = inject(ApiService);

    transactions: WritableSignal<Transaction[]> = signal<Transaction[]>([]);
    loading: WritableSignal<boolean> = signal(true);
    deletingTransactionId: WritableSignal<string | null> = signal(null);
    deleting: WritableSignal<boolean> = signal(false);

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
