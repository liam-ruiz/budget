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
    Math = Math;

    accounts: WritableSignal<Account[]> = signal<Account[]>([]);
    budgets: WritableSignal<Budget[]> = signal<Budget[]>([]);
    transactions: WritableSignal<Transaction[]> = signal<Transaction[]>([]);
    loading: WritableSignal<boolean> = signal(true);

    recentTransactions = computed(() => this.transactions().slice(0, 5));
    assetAccounts = computed(() => this.accounts().filter((account) => this.isAssetAccount(account)));
    activeBudgets = computed(() => this.budgets().filter((budget) => this.isActiveBudget(budget)).slice(0, 5));
    assetBalance = computed(() => {
        const total = this.assetAccounts().reduce((sum, account) => sum + parseFloat(account.current_balance || '0'), 0);
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

    isAssetAccount(account: Account): boolean {
        const type = account.account_type.trim().toLowerCase();
        const subtype = (account.account_subtype ?? '').trim().toLowerCase();

        return ['depository', 'deposit', 'investment', 'brokerage'].includes(type)
            || subtype === 'brokerage';
    }

    isActiveBudget(budget: Budget): boolean {
        const today = new Date();
        const start = this.dateStringToDate(budget.start_date);
        const end = budget.end_date ? this.dateStringToDate(budget.end_date) : null;

        if (today < start) return false;
        if (end && today > end) return false;

        return true;
    }

    formatCurrency(value: string): string {
        const n = parseFloat(value || '0');
        return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    parseFloat(value: string): number {
        return parseFloat(value || '0');
    }

    getSpentPercent(budget: Budget): number {
        const limit = parseFloat(budget.limit_amount || '0');
        const spent = parseFloat(budget.amount_spent || '0');
        if (limit <= 0) return 0;
        return Math.round((spent / limit) * 100);
    }

    getBudgetCircle(percent: number): string {
        const clamped = Math.min(Math.max(percent, 0), 100);
        return `conic-gradient(var(--success) 0% ${clamped}%, rgba(255, 255, 255, 0.12) ${clamped}% 100%)`;
    }

    private dateStringToDate(dateString: string): Date {
        return new Date(dateString + 'T00:00:00');
    }
}
