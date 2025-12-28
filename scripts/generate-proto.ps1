# Generate Protocol Buffer code for all services
$ErrorActionPreference = "Stop"

$PROTO_DIR = "proto"
$OUT_DIR = "."

# Create output directory structure if it doesn't exist
# We are outputting relative to project root because go_package handles the path
# But we need basic folders

# Find all .proto files
$protoFiles = Get-ChildItem -Path $PROTO_DIR -Filter *.proto -Recurse

foreach ($protoFile in $protoFiles) {
    Write-Host "Generating code for $($protoFile.FullName)..."
    
    # Run protoc
    # We include current directory and proto directory as include paths
    protoc -I=$PROTO_DIR -I=. `
        --go_out=$OUT_DIR `
        --go_opt=module=nordic-bank `
        --go-grpc_out=$OUT_DIR `
        --go-grpc_opt=module=nordic-bank `
        $protoFile.FullName
        
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Protoc failed for $($protoFile.Name)"
    }
}

Write-Host "✅ Protocol Buffer code generated successfully" -ForegroundColor Green
