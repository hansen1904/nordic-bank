package main

import (
	"context"
	"log"
	"nordic-bank/internal/accounting/router"
	"nordic-bank/internal/shared/database"
	"nordic-bank/internal/shared/otel"
)

func main() {
	shutdownTracer, shutdownMeter, err := otel.InitTelemetry("accounting-service", "1.0.0")
	if err != nil {
		log.Fatalf("failed to initialize tracer: %v", err)
	}
	defer shutdownTracer(context.Background())
	defer shutdownMeter(context.Background())

	database.InitDB()

	r := router.SetupRouter()

	r.Run(":8080")
}
