import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api';
import { UiStateService } from '../../services/ui-state';
import { Budget, CreateBudgetRequest, Transaction, UpdateBudgetRequest } from '../../models/models';

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
    'PERSONAL',
    'OTHER',

];

@Component({
    selector: 'app-budgets',
    imports: [CommonModule, FormsModule],
    templateUrl: './budgets.html',
    styleUrl: './budgets.css',
})
export class BudgetsPage implements OnInit, OnDestroy {
    private api = inject(ApiService);
    private uiState = inject(UiStateService);
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

    // Edit state
    editingBudgetId: WritableSignal<string | null> = signal(null);
    editForm: UpdateBudgetRequest = {};

    // Delete confirmation state
    deletingBudgetId: WritableSignal<string | null> = signal(null);
    selectedBudgetId: WritableSignal<string | null> = signal(null);
    selectedBudget: WritableSignal<Budget | null> = signal(null);
    selectedBudgetTransactions: WritableSignal<Transaction[]> = signal<Transaction[]>([]);
    detailLoading: WritableSignal<boolean> = signal(false);
    detailError: WritableSignal<string> = signal('');

    form: CreateBudgetRequest = {
        name: '',
        limit_amount: '',
        period: 'monthly',
        start_date: new Date().toISOString().slice(0, 10),
    };

    ngOnInit() {
        this.loadBudgets();
    }

    ngOnDestroy() {
        this.unlockPageScroll();
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

        if (!payload.category) {
            delete payload.category;
        }

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

    // ── Edit ──

    startEdit(b: Budget) {
        this.editingBudgetId.set(b.id);
        this.editForm = {
            name: b.name,
            category: b.category ?? '',
            limit_amount: b.limit_amount,
            period: b.period,
            start_date: b.start_date,
            end_date: b.end_date ?? undefined,
        };
    }

    openBudgetDetail(budgetId: string) {
        if (this.editingBudgetId() === budgetId || this.deletingBudgetId() === budgetId) {
            return;
        }

        this.selectedBudgetId.set(budgetId);
        this.selectedBudget.set(null);
        this.selectedBudgetTransactions.set([]);
        this.detailError.set('');
        this.detailLoading.set(true);
        this.lockPageScroll();

        forkJoin({
            budget: this.api.getBudget(budgetId),
            transactions: this.api.getBudgetTransactions(budgetId),
        }).subscribe({
            next: ({ budget, transactions }) => {
                this.selectedBudget.set(budget);
                this.selectedBudgetTransactions.set(transactions ?? []);
                this.detailLoading.set(false);
            },
            error: () => {
                this.detailError.set('Failed to load budget details.');
                this.detailLoading.set(false);
            },
        });
    }

    closeBudgetDetail() {
        this.selectedBudgetId.set(null);
        this.selectedBudget.set(null);
        this.selectedBudgetTransactions.set([]);
        this.detailError.set('');
        this.detailLoading.set(false);
        this.unlockPageScroll();
    }

    cancelEdit() {
        this.editingBudgetId.set(null);
        this.editForm = {};
    }

    saveEdit() {
        const id = this.editingBudgetId();
        if (!id) return;

        this.saving.set(true);

        const payload: UpdateBudgetRequest = { ...this.editForm };

        // Ensure limit_amount is a string
        if (payload.limit_amount !== undefined) {
            payload.limit_amount = String(payload.limit_amount);
        }

        // If category was cleared, signal the backend to null it out
        if (!payload.category || payload.category === '') {
            payload.clear_category = true;
            delete payload.category;
        }

        this.api.updateBudget(id, payload).subscribe({
            next: () => {
                this.saving.set(false);
                this.editingBudgetId.set(null);
                this.editForm = {};
                this.loadBudgets();
            },
            error: () => {
                this.saving.set(false);
            },
        });
    }

    // ── Delete ──

    confirmDelete(b: Budget) {
        this.deletingBudgetId.set(b.id);
    }

    cancelDelete() {
        this.deletingBudgetId.set(null);
    }

    deleteBudget() {
        const id = this.deletingBudgetId();
        if (!id) return;

        this.api.deleteBudget(id).subscribe({
            next: () => {
                this.deletingBudgetId.set(null);
                if (this.selectedBudgetId() === id) {
                    this.closeBudgetDetail();
                }
                this.loadBudgets();
            },
            error: () => {
                this.deletingBudgetId.set(null);
            },
        });
    }

    // ── Helpers ──

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

    formatTransactionAmount(value: string): string {
        const amount = parseFloat(value || '0');
        if (amount < 0) {
            return `+${this.formatCurrency(String(Math.abs(amount)))}`;
        }

        return this.formatCurrency(value);
    }

    parseFloat(value: string): number {
        return parseFloat(value || '0');
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
        } else {
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

    private lockPageScroll() {
        this.uiState.openModal();
    }

    private unlockPageScroll() {
        this.uiState.closeModal();
    }
}
