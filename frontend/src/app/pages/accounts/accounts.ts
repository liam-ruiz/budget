import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { PlaidService } from '../../services/plaid';
import { Account } from '../../models/models';

@Component({
    selector: 'app-accounts',
    imports: [CommonModule],
    templateUrl: './accounts.html',
    styleUrl: './accounts.css',
})
export class AccountsPage implements OnInit {
    private api = inject(ApiService);
    private plaid = inject(PlaidService);

    accounts: Account[] = [];
    loading = true;
    linking = false;
    linkError = '';

    ngOnInit() {
        this.loadAccounts();
    }

    loadAccounts() {
        this.loading = true;
        this.api.getAccounts().subscribe({
            next: (data) => {
                this.accounts = data ?? [];
                this.loading = false;
            },
            error: () => {
                this.accounts = [];
                this.loading = false;
            },
        });
    }

    async linkAccount() {
        this.linkError = '';
        this.linking = true;
        try {
            await this.plaid.open();
            this.loadAccounts();
        } catch (err: any) {
            this.linkError = err?.message || 'Failed to link account.';
        } finally {
            this.linking = false;
        }
    }

    formatCurrency(value: string): string {
        const n = parseFloat(value || '0');
        return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
}
