// internal/config/config.go
package config

import (
    "github.com/joho/godotenv"
    "os"
)

type Config struct {
    DBUrl         string
    JWTSecret     string
    PlaidClientID string
    PlaidSecret   string
    PlaidEnv      string
    Port          string
}

func Load() (*Config, error) {
    err := godotenv.Load()
    if err != nil {
        return nil, err
    }
    return &Config{
        DBUrl:         os.Getenv("DATABASE_URL"),
        JWTSecret:     os.Getenv("JWT_SECRET"),
        PlaidClientID: os.Getenv("PLAID_CLIENT_ID"),
        PlaidSecret:   os.Getenv("PLAID_SECRET"),
        PlaidEnv:      os.Getenv("PLAID_ENV"),
        Port:          os.Getenv("PORT"),
    }, nil
}
