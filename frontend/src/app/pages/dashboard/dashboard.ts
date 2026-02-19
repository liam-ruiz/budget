import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';
import { Account, Budget, Transaction } from '../../models/models';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, RouterLink],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
})
export class DashboardPage implements OnInit {
    private api = inject(ApiService);

    accounts: Account[] = [];
    budgets: Budget[] = [];
    recentTransactions: Transaction[] = [];
    loading = true;

    ngOnInit() {
        this.api.getAccounts().subscribe({
            next: (data) => (this.accounts = data ?? []),
            error: () => (this.accounts = []),
        });
        this.api.getBudgets().subscribe({
            next: (data) => (this.budgets = data ?? []),
            error: () => (this.budgets = []),
        });
        this.api.getTransactions().subscribe({
            next: (data) => {
                this.recentTransactions = (data ?? []).slice(0, 5);
                this.loading = false;
            },
            error: () => {
                this.recentTransactions = [];
                this.loading = false;
            },
        });
    }

    totalBalance(): string {
        const total = this.accounts.reduce((sum, a) => sum + parseFloat(a.current_balance || '0'), 0);
        return total.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    formatCurrency(value: string): string {
        const n = parseFloat(value || '0');
        return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    parseFloat(value: string): number {
        return parseFloat(value || '0');
    }
}
