package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/liam-ruiz/budget/internal/api/types"
	"github.com/liam-ruiz/budget/internal/auth"
	"github.com/liam-ruiz/budget/internal/context"
	"github.com/liam-ruiz/budget/internal/db/sqlcdb"
	plaidlib "github.com/plaid/plaid-go/v20/plaid"
)

// Handler holds all service dependencies for the API.
type Handler struct {
	container *context.Container
}

// NewHandler creates a new API handler with all service dependencies.
func NewHandler(
	container *context.Container,
) *Handler {
	return &Handler{
		container: container,
	}
}

// Register creates a new user account.
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req types.AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Default().Printf("Error decoding request body: %v\n", err)
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	user, err := h.container.UserSvc.Register(r.Context(), req.Email, req.Password)
	if err != nil {
		log.Default().Printf("Error registering user: %v\n", err)
		writeError(w, http.StatusConflict, "email already in use")
		return
	}

	token, err := auth.GenerateJWT(user.ID, h.container.Cfg.JWTSecret)
	if err != nil {
		log.Default().Printf("Error generating JWT: %v\n", err)
		writeError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	writeJSON(w, http.StatusCreated, types.AuthResponse{
		Token: token,
		User: types.UserResponse{
			ID:    user.ID,
			Email: user.Email,
		},
	})
}

// Login authenticates a user and returns a JWT.
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req types.AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Default().Printf("Error decoding request body: %v\n", err)
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	user, err := h.container.UserSvc.Authenticate(r.Context(), req.Email, req.Password)
	if err != nil {
		log.Default().Printf("Error authenticating user: %v\n", err)
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	token, err := auth.GenerateJWT(user.ID, h.container.Cfg.JWTSecret)
	if err != nil {
		log.Default().Printf("Error generating JWT: %v\n", err)
		writeError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	writeJSON(w, http.StatusOK, types.AuthResponse{
		Token: token,
		User: types.UserResponse{
			ID:    user.ID,
			Email: user.Email,
		},
	})
}

// GetAccounts returns all linked bank accounts for the authenticated user.
func (h *Handler) GetAccounts(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserID(r.Context())
	if err != nil {
		log.Default().Printf("Error getting user ID: %v\n", err)
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	accounts, err := h.container.AccountSvc.GetAccounts(r.Context(), userID)
	if err != nil {
		log.Default().Printf("Error getting accounts: %v\n", err)
		writeError(w, http.StatusInternalServerError, "failed to fetch accounts")
		return
	}

	writeJSON(w, http.StatusOK, accounts)
}

// GetTransactions returns all transactions for the authenticated user.
func (h *Handler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserID(r.Context())
	if err != nil {
		log.Default().Printf("Error getting user ID: %v\n", err)
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	txns, err := h.container.TransactionSvc.GetByUser(r.Context(), userID)
	if err != nil {
		log.Default().Printf("Error getting transactions: %v\n", err)
		writeError(w, http.StatusInternalServerError, "failed to fetch transactions")
		return
	}

	writeJSON(w, http.StatusOK, txns)
}

// CreateBudget creates a new budget for the authenticated user.
func (h *Handler) CreateBudget(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserID(r.Context())
	if err != nil {
		log.Default().Printf("Error getting user ID: %v\n", err)
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req types.CreateBudgetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Default().Printf("Error decoding request body: %v\n", err)
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Category == "" || req.LimitAmount == "" || req.StartDate == "" {
		writeError(w, http.StatusBadRequest, "category, limit_amount, and start_date are required")
		return
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		log.Default().Printf("Error parsing start date: %v\n", err)
		writeError(w, http.StatusBadRequest, "start_date must be in YYYY-MM-DD format")
		return
	}

	period := req.Period
	if period == "" {
		period = "monthly"
	}

	params := sqlcdb.CreateBudgetParams{
		AppUserID:    userID,
		Category:     req.Category,
		LimitAmount:  req.LimitAmount,
		BudgetPeriod: period,
		StartDate:    startDate,
	}

	if req.EndDate != nil {
		endDate, err := time.Parse("2006-01-02", *req.EndDate)
		if err != nil {
			log.Default().Printf("Error parsing end date: %v\n", err)
			writeError(w, http.StatusBadRequest, "end_date must be in YYYY-MM-DD format")
			return
		}
		params.EndDate = sql.NullTime{Time: endDate, Valid: true}
	}

	budget, err := h.container.BudgetSvc.CreateBudget(r.Context(), params)
	if err != nil {
		log.Default().Printf("Error creating budget: %v\n", err)
		writeError(w, http.StatusInternalServerError, "failed to create budget")
		return
	}

	writeJSON(w, http.StatusCreated, budget)
}

// GetBudgets returns all budgets for the authenticated user.
func (h *Handler) GetBudgets(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserID(r.Context())
	if err != nil {
		log.Default().Printf("Error getting user ID: %v\n", err)
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	list, err := h.container.BudgetSvc.GetBudgets(r.Context(), userID)
	if err != nil {
		log.Default().Printf("Error getting budgets: %v\n", err)
		writeError(w, http.StatusInternalServerError, "failed to fetch budgets")
		return
	}

	writeJSON(w, http.StatusOK, list)
}

// --- Plaid Handlers ---

// ExchangePlaidPublicToken exchanges a Plaid public token for an access token
// and persists the linked account.
func (h *Handler) ExchangePlaidPublicToken(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserID(r.Context())
	if err != nil {
		log.Default().Printf("Error getting user ID: %v\n", err)
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req types.ExchangeTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Default().Printf("Error decoding request body: %v\n", err)
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.PublicToken == "" {

		writeError(w, http.StatusBadRequest, "public_token is required")
		return
	}

	// Exchange public token for access token via Plaid API
	exchangeReq := plaidlib.NewItemPublicTokenExchangeRequest(req.PublicToken)
	resp, _, err := h.container.PlaidClient.PlaidApi.ItemPublicTokenExchange(r.Context()).ItemPublicTokenExchangeRequest(*exchangeReq).Execute()
	if err != nil {
		log.Default().Printf("Error exchanging public token: %v\n", err)
		writeError(w, http.StatusBadGateway, fmt.Sprintf("plaid exchange failed: %v", err))
		return
	}

	// Step 1: persist the Plaid item (connection)
	item, err := h.container.AccountSvc.CreatePlaidItem(r.Context(), sqlcdb.CreatePlaidItemParams{
		UserID:           userID,
		PlaidItemID:      resp.GetItemId(),
		PlaidAccessToken: resp.GetAccessToken(),
		InstitutionName:  req.InstitutionName,
	})
	if err != nil {
		log.Default().Printf("Error saving plaid item: %v\n", err)
		writeError(w, http.StatusInternalServerError, "failed to save plaid item")
		return
	}

	// Step 2: create the bank account under that item
	account, err := h.container.AccountSvc.CreateBankAccount(r.Context(), sqlcdb.CreateBankAccountParams{
		ItemID:           item.ID,
		PlaidAccountID:   "", // TODO: populate from Plaid accounts response
		AccountName:      req.AccountName,
		AccountType:      req.AccountType,
		CurrentBalance:   "0",
		AvailableBalance: "0",
		IsoCurrencyCode:  "USD",
	})
	if err != nil {
		log.Default().Printf("Error saving bank account: %v\n", err)
		writeError(w, http.StatusInternalServerError, "failed to save bank account")
		return
	}

	writeJSON(w, http.StatusCreated, types.ExchangeTokenResponse{
		AccountID: account.ID,
		ItemID:    resp.GetItemId(),
	})
}

// CreateLinkToken generates a Plaid Link token for the authenticated user.
func (h *Handler) CreateLinkToken(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserID(r.Context())
	if err != nil {
		log.Default().Printf("Error getting user ID: %v\n", err)
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	products := []plaidlib.Products{plaidlib.PRODUCTS_TRANSACTIONS}
	countryCodes := []plaidlib.CountryCode{plaidlib.COUNTRYCODE_US}

	user := plaidlib.LinkTokenCreateRequestUser{
		ClientUserId: userID.String(),
	}

	linkReq := plaidlib.NewLinkTokenCreateRequest(
		"Budget",
		"en",
		countryCodes,
		user,
	)
	linkReq.SetProducts(products)

	resp, _, err := h.container.PlaidClient.PlaidApi.LinkTokenCreate(r.Context()).LinkTokenCreateRequest(*linkReq).Execute()
	if err != nil {
		log.Default().Printf("Error creating link token: %v\n", err)
		writeError(w, http.StatusBadGateway, fmt.Sprintf("failed to create link token: %v", err))
		return
	}

	writeJSON(w, http.StatusOK, types.CreateLinkTokenResponse{
		LinkToken: resp.GetLinkToken(),
	})
}

// --- Helpers ---

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, types.ErrorResponse{Error: msg})
}
