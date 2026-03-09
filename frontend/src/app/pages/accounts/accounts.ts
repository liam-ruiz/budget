import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api';
import { PlaidService } from '../../services/plaid';
import { Account, Transaction } from '../../models/models';

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
    selectedAccountId: WritableSignal<string | null> = signal(null);
    selectedAccount: WritableSignal<Account | null> = signal(null);
    selectedAccountTransactions: WritableSignal<Transaction[]> = signal<Transaction[]>([]);
    detailLoading: WritableSignal<boolean> = signal(false);
    detailError: WritableSignal<string> = signal('');

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

    openAccountDetail(accountId: string) {
        this.selectedAccountId.set(accountId);
        this.selectedAccount.set(null);
        this.selectedAccountTransactions.set([]);
        this.detailError.set('');
        this.detailLoading.set(true);

        forkJoin({
            account: this.api.getAccount(accountId),
            transactions: this.api.getAccountTransactions(accountId),
        }).subscribe({
            next: ({ account, transactions }) => {
                this.selectedAccount.set(account);
                this.selectedAccountTransactions.set(transactions ?? []);
                this.detailLoading.set(false);
            },
            error: () => {
                this.detailError.set('Failed to load account details.');
                this.detailLoading.set(false);
            },
        });
    }

    closeAccountDetail() {
        this.selectedAccountId.set(null);
        this.selectedAccount.set(null);
        this.selectedAccountTransactions.set([]);
        this.detailError.set('');
        this.detailLoading.set(false);
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
                if (this.selectedAccountId() === id) {
                    this.closeAccountDetail();
                }
                this.loadAccounts();
            },
            error: () => {
                this.deleting.set(false);
                this.deletingAccountId.set(null);
            },
        });
    }
}
