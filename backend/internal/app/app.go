package app

import (
    "database/sql"
    "net/http"

	"github.com/liam-ruiz/budget/internal/api"
    "github.com/liam-ruiz/budget/internal/bank_accounts"
    "github.com/liam-ruiz/budget/internal/budgets"
    "github.com/liam-ruiz/budget/internal/config"
    "github.com/liam-ruiz/budget/internal/db/sqlcdb"
    "github.com/liam-ruiz/budget/internal/plaid"
    "github.com/liam-ruiz/budget/internal/transactions"
    "github.com/liam-ruiz/budget/internal/users"
	"github.com/liam-ruiz/budget/internal/context"
) 

type repositories struct {
    User users.Repository
    Account bank_accounts.Repository
    Budget budgets.Repository
    Transaction transactions.Repository
}

type services struct {
    User *users.Service
    Account *bank_accounts.Service
    Budget *budgets.Service
    Transaction *transactions.Service
}

func Run(cfg *config.Config) error {
    db, err := initDB(cfg.DBUrl)
    if err != nil {
        return err
    }
    defer db.Close()

    queries := sqlcdb.New(db)

    // Build the container
    cont := &context.Container{
        Cfg:         cfg,
        PlaidClient: plaid.NewPlaidClient(cfg.PlaidClientID, cfg.PlaidSecret, cfg.PlaidEnv),
        
        // Pass the repos directly into the services
        UserSvc:        users.NewService(users.NewRepository(queries)),
        AccountSvc:     bank_accounts.NewService(bank_accounts.NewRepository(queries)),
        BudgetSvc:      budgets.NewService(budgets.NewRepository(queries)),
        TransactionSvc: transactions.NewService(transactions.NewRepository(queries)),
    }

    // Now NewHandler only takes the container
    handler := api.NewHandler(cont)

    return http.ListenAndServe(":"+cfg.Port, handler.Routes())
}

func initDB(dbUrl string) (*sql.DB, error) {
    db, err := sql.Open("pgx", dbUrl)
    return db, err
}

func initRepositories(q *sqlcdb.Queries) repositories {
    return repositories{
        User: users.NewRepository(q),
        Account: bank_accounts.NewRepository(q),
        Budget: budgets.NewRepository(q),
        Transaction: transactions.NewRepository(q),
    }
}

func initServices(repos repositories) services {
    return services{
        User: users.NewService(repos.User),
        Account: bank_accounts.NewService(repos.Account),
        Budget: budgets.NewService(repos.Budget),
        Transaction: transactions.NewService(repos.Transaction),
    }
}