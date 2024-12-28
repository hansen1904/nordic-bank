# Use the official Golang image as the base image
FROM golang:1.23.4-alpine AS builder

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy go mod and sum files
COPY ../../go.mod ../../go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the entire source code into the container
COPY ../../ ./

# Build the Go app
RUN go build -o main ./cmd/accounting

# Start a new stage from scratch
FROM alpine:latest

# Set the Current Working Directory inside the container
WORKDIR /root/

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/main .

# Metadata
LABEL maintainer="Hansen1904"
LABEL version="1.0.0"
LABEL description="Accounting service for Nordic Bank"
LABEL org.opencontainers.image.source="https://github.com/hansen1904/nordic-bank"
LABEL org.opencontainers.image.licenses="MIT"

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["./main"]