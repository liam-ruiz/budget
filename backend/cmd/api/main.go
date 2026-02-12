// cmd/api/main.go
package main

import (
	"log"

	"github.com/liam-ruiz/budget/internal/app"
	"github.com/liam-ruiz/budget/internal/config"
)

func main() {
	cfg, err := config.Load()
    if err != nil {
        log.Fatal(err)
    }

    if err := app.Run(cfg); err != nil {
        log.Fatal("Application failed: ", err)
    }
}
