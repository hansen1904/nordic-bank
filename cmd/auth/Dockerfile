# Start from golang base image
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN go build -o auth-service ./cmd/auth

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/auth-service .

# Expose ports
EXPOSE 8080 9080

# Run
CMD ["./auth-service"]
