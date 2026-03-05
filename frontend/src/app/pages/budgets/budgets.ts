import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Budget, CreateBudgetRequest } from '../../models/models';

// Plaid PFCv2 primary categories
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
];

@Component({
    selector: 'app-budgets',
    imports: [CommonModule, FormsModule],
    templateUrl: './budgets.html',
    styleUrl: './budgets.css',
})
export class BudgetsPage implements OnInit {
    private api = inject(ApiService);
    Math = Math;

    categories = PLAID_CATEGORIES;

    periods = {
        monthly: 'monthly',
        yearly: 'yearly',
        one_time: 'one-time',
    };

    budgets: WritableSignal<Budget[]> = signal<Budget[]>([]);
    loading: WritableSignal<boolean> = signal(true);
    showForm: WritableSignal<boolean> = signal(false);
    saving: WritableSignal<boolean> = signal(false);

    form: CreateBudgetRequest = {
        name: '',
        limit_amount: '',
        period: 'monthly',
        start_date: new Date().toISOString().slice(0, 10),
    };

    ngOnInit() {
        this.loadBudgets();
    }

    loadBudgets() {
        this.loading.set(true);
        this.api.getBudgets().subscribe({
            next: (data) => {
                this.budgets.set(data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.budgets.set([]);
                this.loading.set(false);
            },
        });
    }

    createBudget() {
        this.saving.set(true);
        const payload: CreateBudgetRequest = {
            ...this.form,
            limit_amount: String(this.form.limit_amount),
        };

        // If category is empty string or undefined, remove it so the backend gets null
        if (!payload.category) {
            delete payload.category;
        }

        // ensures end date is set based on period
        this.setEndDate(payload);

        this.api.createBudget(payload).subscribe({
            next: () => {
                this.saving.set(false);
                this.showForm.set(false);
                this.resetForm();
                this.loadBudgets();
            },
            error: () => {
                this.saving.set(false);
            },
        });
    }

    /** Format a category string for display, e.g. "FOOD_AND_DRINK" -> "Food And Drink" */
    formatCategory(category: string): string {
        return category
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    formatCurrency(value: string): string {
        const n = parseFloat(value || '0');
        return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    getSpentPercent(b: Budget): number {
        const limit = parseFloat(b.limit_amount || '0');
        const spent = parseFloat(b.amount_spent || '0');
        if (limit <= 0) return 0;
        return Math.round((spent / limit) * 100);
    }

    getRemainingNum(b: Budget): number {
        return parseFloat(b.limit_amount || '0') - parseFloat(b.amount_spent || '0');
    }

    getRemainingAmount(b: Budget): string {
        return this.getRemainingNum(b).toFixed(2);
    }

    getTimeElapsedPercent(b: Budget): number {
        const now: Date = new Date();
        const start: Date = this.dateStringToDate(b.start_date);
        const end: Date = this.dateStringToDate(b.end_date ?? b.start_date);

        if (now >= end) return 100;
        if (now <= start) return 0;

        const total: number = end.getTime() - start.getTime();
        const elapsed: number = now.getTime() - start.getTime();
        return Math.round((elapsed / total) * 100);
    }

    private setEndDate(payload: CreateBudgetRequest) {
        if (payload.period === this.periods.one_time) return;

        const endDate = this.dateStringToDate(payload.start_date);

        if (payload.period === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (payload.period === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else { // weekly
            endDate.setDate(endDate.getDate() + 7);
        }

        payload.end_date = endDate.toISOString().slice(0, 10);
    }

    private dateStringToDate(dateString: string): Date {
        return new Date(dateString + 'T00:00:00');
    }

    private resetForm() {
        this.form = {
            name: '',
            limit_amount: '',
            period: 'monthly',
            start_date: new Date().toISOString().slice(0, 10),
        };
    }
}
