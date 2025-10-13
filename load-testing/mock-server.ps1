# Simple Mock Server for Load Testing Demo
# This creates a basic HTTP server to demonstrate load testing capabilities

param(
    [int]$Port = 8081
)

Write-Host "=== Starting Mock Server for Load Testing Demo ===" -ForegroundColor Green
Write-Host "Port: $Port" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Create HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")

try {
    $listener.Start()
    Write-Host "Mock server started at http://localhost:$Port" -ForegroundColor Green
    Write-Host "Available endpoints:" -ForegroundColor Cyan
    Write-Host "  GET /api/stories - Returns mock stories" -ForegroundColor White
    Write-Host "  GET /api/stories/test - Returns test response" -ForegroundColor White
    Write-Host "  GET /actuator/health - Returns health status" -ForegroundColor White
    Write-Host "  POST /api/auth/login - Mock login endpoint" -ForegroundColor White
    Write-Host ""

    $requestCount = 0
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $requestCount++
        $timestamp = Get-Date -Format "HH:mm:ss"
        
        # Log the request
        Write-Host "[$timestamp] $($request.HttpMethod) $($request.Url.PathAndQuery) from $($request.RemoteEndPoint)" -ForegroundColor Gray
        
        # Set CORS headers
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        # Handle preflight requests
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }
        
        # Route requests
        $path = $request.Url.AbsolutePath
        $method = $request.HttpMethod
        
        $responseText = ""
        $statusCode = 200
        
        switch -Regex ($path) {
            "^/api/stories$" {
                if ($method -eq "GET") {
                    $responseText = @{
                        success = $true
                        data = @(
                            @{ id = 1; title = "Mock Story 1"; author = "Test Author"; content = "This is a mock story for load testing." },
                            @{ id = 2; title = "Mock Story 2"; author = "Test Author"; content = "Another mock story for testing purposes." }
                        )
                        total = 2
                        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
                    } | ConvertTo-Json -Depth 3
                } else {
                    $statusCode = 405
                    $responseText = '{"error": "Method not allowed"}'
                }
            }
            "^/api/stories/test$" {
                $responseText = @{
                    success = $true
                    message = "Test endpoint working"
                    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
                    requestNumber = $requestCount
                } | ConvertTo-Json
            }
            "^/actuator/health$" {
                $responseText = @{
                    status = "UP"
                    components = @{
                        db = @{ status = "UP" }
                        diskSpace = @{ status = "UP" }
                    }
                    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
                } | ConvertTo-Json -Depth 3
            }
            "^/api/auth/login$" {
                if ($method -eq "POST") {
                    $responseText = @{
                        success = $true
                        token = "mock-jwt-token-" + (Get-Random -Minimum 1000 -Maximum 9999)
                        user = @{
                            id = 1
                            username = "testuser"
                            email = "test@example.com"
                        }
                        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
                    } | ConvertTo-Json -Depth 3
                } else {
                    $statusCode = 405
                    $responseText = '{"error": "Method not allowed"}'
                }
            }
            default {
                $statusCode = 404
                $responseText = @{
                    error = "Not Found"
                    path = $path
                    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
                } | ConvertTo-Json
            }
        }
        
        # Add some random delay to simulate processing time
        $delay = Get-Random -Minimum 10 -Maximum 100
        Start-Sleep -Milliseconds $delay
        
        # Send response
        $response.StatusCode = $statusCode
        $response.ContentType = "application/json"
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseText)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.Close()
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    Write-Host ""
    Write-Host "Mock server stopped. Total requests handled: $requestCount" -ForegroundColor Yellow
}