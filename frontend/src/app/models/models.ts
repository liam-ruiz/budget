// ── Auth ──

export interface AuthResponse {
    token: string;
    user: UserResponse;
}

export interface UserResponse {
    id: string;
    email: string;
}

// ── Accounts ──

export interface Account {
    id: string;
    institution_name: string;
    account_name: string;
    account_type: string;
    current_balance: string;
    available_balance: string;
    last_synced_at: string | null;
}

// ── Transactions ──

export interface Transaction {
    id: string;
    account_id: string;
    date: string;
    name: string;
    category: string;
    amount: string;
    pending: boolean;
    created_at: string;
}

// ── Budgets ──

export interface Budget {
    id: string;
    user_id: string;
    category: string;
    limit_amount: string;
    period: string;
    start_date: string;
    end_date: string | null;
    created_at: string;
}

export interface CreateBudgetRequest {
    category: string;
    limit_amount: string;
    period: string;
    start_date: string;
    end_date?: string;
}

// ── Plaid ──

export interface CreateLinkTokenResponse {
    link_token: string;
}

export interface ExchangeTokenRequest {
    public_token: string;
    institution_name: string;
    account_name: string;
    account_type: string;
}

export interface ExchangeTokenResponse {
    account_id: string;
    item_id: string;
}
