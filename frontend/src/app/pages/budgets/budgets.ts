import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Budget, CreateBudgetRequest } from '../../models/models';

@Component({
    selector: 'app-budgets',
    imports: [CommonModule, FormsModule],
    templateUrl: './budgets.html',
    styleUrl: './budgets.css',
})
export class BudgetsPage implements OnInit {
    private api = inject(ApiService);

    budgets: Budget[] = [];
    loading = true;
    showForm = false;
    saving = false;

    form: CreateBudgetRequest = {
        category: '',
        limit_amount: '',
        period: 'monthly',
        start_date: new Date().toISOString().slice(0, 10),
    };

    ngOnInit() {
        this.loadBudgets();
    }

    loadBudgets() {
        this.loading = true;
        this.api.getBudgets().subscribe({
            next: (data) => {
                this.budgets = data ?? [];
                this.loading = false;
            },
            error: () => {
                this.budgets = [];
                this.loading = false;
            },
        });
    }

    createBudget() {
        this.saving = true;
        this.api.createBudget(this.form).subscribe({
            next: () => {
                this.saving = false;
                this.showForm = false;
                this.resetForm();
                this.loadBudgets();
            },
            error: () => {
                this.saving = false;
            },
        });
    }

    formatCurrency(value: string): string {
        const n = parseFloat(value || '0');
        return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    private resetForm() {
        this.form = {
            category: '',
            limit_amount: '',
            period: 'monthly',
            start_date: new Date().toISOString().slice(0, 10),
        };
    }
}
