import { Component, inject, OnInit } from '@angular/core';
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

    transactions: Transaction[] = [];
    loading = true;

    ngOnInit() {
        this.api.getTransactions().subscribe({
            next: (data) => {
                this.transactions = data ?? [];
                this.loading = false;
            },
            error: () => {
                this.transactions = [];
                this.loading = false;
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
}
