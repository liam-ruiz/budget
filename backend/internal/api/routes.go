package api

import (
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/go-chi/chi/v5"
	"github.com/liam-ruiz/budget/internal/auth"
)

var (
	corsOriginsOnce sync.Once
	allowedOrigins  map[string]struct{}
)

// Routes builds and returns the HTTP handler with all routes.
func (h *Handler) Routes() http.Handler {
	r := chi.NewRouter()

	// CORS middleware
	r.Use(corsMiddleware)

	// Public auth routes
	r.Post("/api/auth/register", h.authHandler.Register)
	r.Post("/api/auth/login", h.authHandler.Login)

	// Protected routes — require a valid JWT
	r.Group(func(r chi.Router) {
		r.Use(auth.Middleware(h.JWTSecret))

		// validate route for frontend
		r.Get("/api/auth/validate", h.authHandler.Validate)

		r.Get("/api/accounts", h.acctHandler.GetAccounts)
		r.Delete("/api/accounts/{id}", h.acctHandler.DeleteAccount)
		r.Get("/api/transactions", h.acctHandler.GetTransactions)
		r.Delete("/api/transactions/{id}", h.acctHandler.DeleteTransaction)
		r.Post("/api/budgets", h.acctHandler.CreateBudget)
		r.Get("/api/budgets", h.acctHandler.GetBudgets)
		r.Put("/api/budgets/{id}", h.acctHandler.UpdateBudget)
		r.Delete("/api/budgets/{id}", h.acctHandler.DeleteBudget)
		r.Post("/api/plaid/exchange", h.plaidHandler.ExchangePlaidPublicToken)
		r.Post("/api/plaid/link-token", h.plaidHandler.CreateLinkToken)
	})

	//
	r.Post("/api/plaid/webhook", h.plaidHandler.HandleWebhook)
	return r
}

// corsMiddleware adds CORS headers so the frontend can reach the API.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		corsOriginsOnce.Do(func() {
			allowedOrigins = make(map[string]struct{})
			for origin := range strings.SplitSeq(os.Getenv("ALLOWED_ORIGINS"), ",") {
				origin = strings.TrimSpace(origin)
				if origin != "" {
					allowedOrigins[origin] = struct{}{}
				}
			}
		})

		origin := r.Header.Get("Origin")
		if _, ok := allowedOrigins[origin]; ok {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
