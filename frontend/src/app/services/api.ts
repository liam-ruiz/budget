import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    Account,
    Budget,
    CreateBudgetRequest,
    CreateLinkTokenResponse,
    ExchangeTokenRequest,
    ExchangeTokenResponse,
    Transaction,
    TransactionCategoryTotal,
    UpdateTransactionCategoryRequest,
    UpdateBudgetRequest,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private http = inject(HttpClient);
    private base = environment.apiUrl;

    // Accounts
    getAccounts(): Observable<Account[]> {
        return this.http.get<Account[]>(`${this.base}/accounts`);
    }

    getAccount(id: string): Observable<Account> {
        return this.http.get<Account>(`${this.base}/accounts/${id}`);
    }

    getAccountTransactions(id: string): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.base}/accounts/${id}/transactions`);
    }

    deleteAccount(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}/accounts/${id}`);
    }

    // Transactions
    getTransactions(): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.base}/transactions`);
    }

    getTransactionCategoryTotals(): Observable<TransactionCategoryTotal[]> {
        return this.http.get<TransactionCategoryTotal[]>(`${this.base}/transactions/categories/last-30-days`);
    }

    updateTransactionCategory(id: string, payload: UpdateTransactionCategoryRequest): Observable<void> {
        return this.http.put<void>(`${this.base}/transactions/${id}/category`, payload);
    }

    deleteTransaction(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}/transactions/${id}`);
    }

    // Budgets
    getBudgets(): Observable<Budget[]> {
        return this.http.get<Budget[]>(`${this.base}/budgets`);
    }

    getBudget(id: string): Observable<Budget> {
        return this.http.get<Budget>(`${this.base}/budgets/${id}`);
    }

    getBudgetTransactions(id: string): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.base}/budgets/${id}/transactions`);
    }

    createBudget(payload: CreateBudgetRequest): Observable<Budget> {
        return this.http.post<Budget>(`${this.base}/budgets`, payload);
    }

    updateBudget(id: string, payload: UpdateBudgetRequest): Observable<Budget> {
        return this.http.put<Budget>(`${this.base}/budgets/${id}`, payload);
    }

    deleteBudget(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}/budgets/${id}`);
    }

    // Plaid
    createLinkToken(): Observable<CreateLinkTokenResponse> {
        return this.http.post<CreateLinkTokenResponse>(`${this.base}/plaid/link-token`, {});
    }

    exchangePublicToken(payload: ExchangeTokenRequest): Observable<ExchangeTokenResponse> {
        return this.http.post<ExchangeTokenResponse>(`${this.base}/plaid/exchange`, payload);
    }
}
