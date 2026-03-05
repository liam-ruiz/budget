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

    deleteAccount(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}/accounts/${id}`);
    }

    // Transactions
    getTransactions(): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.base}/transactions`);
    }

    deleteTransaction(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}/transactions/${id}`);
    }

    // Budgets
    getBudgets(): Observable<Budget[]> {
        return this.http.get<Budget[]>(`${this.base}/budgets`);
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
