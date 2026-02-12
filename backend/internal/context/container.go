
package context

import (
    "github.com/liam-ruiz/budget/internal/bank_accounts"
    "github.com/liam-ruiz/budget/internal/budgets"
    "github.com/liam-ruiz/budget/internal/config"
    
    "github.com/liam-ruiz/budget/internal/transactions"
    "github.com/liam-ruiz/budget/internal/users"

	plaid "github.com/plaid/plaid-go/v20/plaid"
)

type Container struct {
    UserSvc        *users.Service
    AccountSvc     *bank_accounts.Service
    BudgetSvc      *budgets.Service
    TransactionSvc *transactions.Service
    PlaidClient    *plaid.APIClient
    Cfg            *config.Config
}

func NewContainer(
    userSvc *users.Service,
    accountSvc *bank_accounts.Service,
    budgetSvc *budgets.Service,
    transactionSvc *transactions.Service,
    plaidClient *plaid.APIClient,
    cfg *config.Config,
) *Container {
    return &Container{
        UserSvc:        userSvc,
        AccountSvc:     accountSvc,
        BudgetSvc:      budgetSvc,
        TransactionSvc: transactionSvc,
        PlaidClient:    plaidClient,
        Cfg:            cfg,
    }
}
