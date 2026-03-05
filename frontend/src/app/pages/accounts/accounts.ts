import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
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

    accounts: WritableSignal<Account[]> = signal<Account[]>([]);
    loading: WritableSignal<boolean> = signal(true);
    linking: WritableSignal<boolean> = signal(false);
    linkError: WritableSignal<string> = signal('');
    deletingAccountId: WritableSignal<string | null> = signal(null);
    deleting: WritableSignal<boolean> = signal(false);

    ngOnInit() {
        this.loadAccounts();
    }

    loadAccounts() {
        this.loading.set(true);
        this.api.getAccounts().subscribe({
            next: (data) => {
                this.loading.set(false);
                this.accounts.set(data ?? []);
            },
            error: () => {
                this.loading.set(false);
                this.accounts.set([]);
            },
        });
    }

    async linkAccount() {
        this.linkError.set('');
        this.linking.set(true);
        try {
            await this.plaid.open();
            this.loadAccounts();
        } catch (err: any) {
            this.linkError.set(err?.message || 'Failed to link account.');
        } finally {
            this.linking.set(false);
        }
    }

    formatCurrency(value: string): string {
        const n = parseFloat(value || '0');
        return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    confirmDelete(account: Account) {
        this.deletingAccountId.set(account.account_id);
    }

    cancelDelete() {
        this.deletingAccountId.set(null);
    }

    deleteAccount() {
        const id = this.deletingAccountId();
        if (!id) return;

        this.deleting.set(true);
        this.api.deleteAccount(id).subscribe({
            next: () => {
                this.deleting.set(false);
                this.deletingAccountId.set(null);
                this.loadAccounts();
            },
            error: () => {
                this.deleting.set(false);
                this.deletingAccountId.set(null);
            },
        });
    }
}
