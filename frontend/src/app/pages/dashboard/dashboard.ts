import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
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

    accounts: WritableSignal<Account[]> = signal<Account[]>([]);
    budgets: WritableSignal<Budget[]> = signal<Budget[]>([]);
    transactions: WritableSignal<Transaction[]> = signal<Transaction[]>([]);
    loading: WritableSignal<boolean> = signal(true);

    recentTransactions = computed(() => this.transactions().slice(0, 5));
    totalBalance = computed(() => {
        const total = this.accounts().reduce((sum, account) => sum + parseFloat(account.current_balance || '0'), 0);
        return total.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    });

    ngOnInit() {
        this.loadDashboard();
    }

    loadDashboard() {
        this.loading.set(true);

        forkJoin({
            accounts: this.api.getAccounts(),
            budgets: this.api.getBudgets(),
            transactions: this.api.getTransactions(),
        }).subscribe({
            next: ({ accounts, budgets, transactions }) => {
                this.accounts.set(accounts ?? []);
                this.budgets.set(budgets ?? []);
                this.transactions.set(transactions ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.accounts.set([]);
                this.budgets.set([]);
                this.transactions.set([]);
                this.loading.set(false);
            },
        });
    }

    formatCurrency(value: string): string {
        const n = parseFloat(value || '0');
        return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    parseFloat(value: string): number {
        return parseFloat(value || '0');
    }
}
