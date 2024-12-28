#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define the Go version to use
goVersion="1.23.4"

# Checkout code (assuming the script is run in the repository root)
echo "Checking out code..."
# No action needed for local script

# Verify Go installation
go version

# Install dependencies
echo "Installing dependencies..."
go mod tidy

# Run tests
echo "Running tests..."
go test ./...

# Build the project
echo "Building project..."
go build -v ./...

echo "Continuous Integration script completed successfully."