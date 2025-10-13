# Simple Load Testing Script using curl
# Alternative to JMeter for basic concurrency testing

param(
    [string]$BaseUrl = "http://localhost:8080",
    [int]$ConcurrentUsers = 100,
    [int]$RequestsPerUser = 10,
    [int]$DelayBetweenRequests = 1
)

Write-Host "=== Simple Nomanweb Load Test ===" -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "Concurrent Users: $ConcurrentUsers" -ForegroundColor Yellow
Write-Host "Requests per User: $RequestsPerUser" -ForegroundColor Yellow
Write-Host ""

# Test endpoints
$endpoints = @(
    @{ Method = "GET"; Path = "/api/stories"; Name = "Get Stories" },
    @{ Method = "GET"; Path = "/api/stories/test"; Name = "Test Endpoint" },
    @{ Method = "GET"; Path = "/actuator/health"; Name = "Health Check" }
)



# Function to simulate a user
$SimulateUserScript = {
    param($UserId, $BaseUrl, $RequestsPerUser, $DelayBetweenRequests)
    
    $endpoints = @(
        @{ Name = "Get Stories"; Url = "$BaseUrl/api/stories"; Method = "GET" },
        @{ Name = "Test Endpoint"; Url = "$BaseUrl/api/stories/test"; Method = "GET" },
        @{ Name = "Health Check"; Url = "$BaseUrl/actuator/health"; Method = "GET" }
    )
    
    $results = @()
    
    for ($i = 1; $i -le $RequestsPerUser; $i++) {
        foreach ($endpoint in $endpoints) {
            $startTime = Get-Date
            try {
                $response = Invoke-WebRequest -Uri $endpoint.Url -Method $endpoint.Method -UseBasicParsing -TimeoutSec 30
                $endTime = Get-Date
                $responseTime = ($endTime - $startTime).TotalMilliseconds
                
                $result = [PSCustomObject]@{
                    Success = $true
                    StatusCode = $response.StatusCode
                    ResponseTime = $responseTime
                    UserId = $UserId
                    RequestId = $i
                    Endpoint = $endpoint.Name
                    Error = $null
                }
            } catch {
                $endTime = Get-Date
                $responseTime = ($endTime - $startTime).TotalMilliseconds
                
                $result = [PSCustomObject]@{
                    Success = $false
                    StatusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 0 }
                    ResponseTime = $responseTime
                    UserId = $UserId
                    RequestId = $i
                    Endpoint = $endpoint.Name
                    Error = $_.Exception.Message
                }
            }
            
            $results += $result
            
            # Small delay between requests
            Start-Sleep -Milliseconds $DelayBetweenRequests
        }
    }
    
    return $results
}

Write-Host "Starting load test..." -ForegroundColor Green
$startTime = Get-Date

# Create jobs for concurrent users
$jobs = @()
for ($i = 1; $i -le $ConcurrentUsers; $i++) {
    $job = Start-Job -ScriptBlock $SimulateUserScript -ArgumentList $i, $BaseUrl, $RequestsPerUser, $DelayBetweenRequests
    $jobs += $job
    
    if ($i % 10 -eq 0) {
        Write-Host "Started $i users..." -ForegroundColor Cyan
    }
}

Write-Host "All users started. Waiting for completion..." -ForegroundColor Yellow

# Wait for all jobs to complete
$allResults = @()
foreach ($job in $jobs) {
    $result = Receive-Job -Job $job -Wait
    $allResults += $result
    Remove-Job -Job $job
}

$endTime = Get-Date
$totalDuration = ($endTime - $startTime).TotalSeconds

Write-Host ""
Write-Host "=== Load Test Results ===" -ForegroundColor Green
Write-Host "Total Duration: $([math]::Round($totalDuration, 2)) seconds" -ForegroundColor Yellow

# Calculate statistics
$successfulRequests = $allResults | Where-Object { $_.Success -eq $true }
$failedRequests = $allResults | Where-Object { $_.Success -eq $false }

$totalRequests = $allResults.Count
$successCount = $successfulRequests.Count
$failureCount = $failedRequests.Count
$successRate = if ($totalRequests -gt 0) { [math]::Round(($successCount / $totalRequests) * 100, 2) } else { 0 }

Write-Host ""
Write-Host "=== Summary Statistics ===" -ForegroundColor Cyan
Write-Host "Total Requests: $totalRequests" -ForegroundColor White
Write-Host "Successful: $successCount ($successRate%)" -ForegroundColor Green
Write-Host "Failed: $failureCount" -ForegroundColor Red

if ($successfulRequests.Count -gt 0) {
    $avgResponseTime = [math]::Round(($successfulRequests | Measure-Object -Property ResponseTime -Average).Average, 2)
    $minResponseTime = [math]::Round(($successfulRequests | Measure-Object -Property ResponseTime -Minimum).Minimum, 2)
    $maxResponseTime = [math]::Round(($successfulRequests | Measure-Object -Property ResponseTime -Maximum).Maximum, 2)
    
    Write-Host ""
    Write-Host "=== Response Time Statistics ===" -ForegroundColor Cyan
    Write-Host "Average: $avgResponseTime ms" -ForegroundColor White
    Write-Host "Minimum: $minResponseTime ms" -ForegroundColor Green
    Write-Host "Maximum: $maxResponseTime ms" -ForegroundColor Yellow
    
    $throughput = [math]::Round($successCount / $totalDuration, 2)
    Write-Host "Throughput: $throughput requests/second" -ForegroundColor Cyan
}

# Show endpoint-specific results
Write-Host ""
Write-Host "=== Endpoint Results ===" -ForegroundColor Cyan
foreach ($endpoint in $endpoints) {
    $endpointResults = $allResults | Where-Object { $_.Endpoint -eq $endpoint.Name }
    $endpointSuccess = ($endpointResults | Where-Object { $_.Success -eq $true }).Count
    $endpointTotal = $endpointResults.Count
    $endpointSuccessRate = if ($endpointTotal -gt 0) { [math]::Round(($endpointSuccess / $endpointTotal) * 100, 2) } else { 0 }
    
    Write-Host "$($endpoint.Name): $endpointSuccess/$endpointTotal ($endpointSuccessRate%)" -ForegroundColor White
}

# Show failures if any
if ($failedRequests.Count -gt 0) {
    Write-Host ""
    Write-Host "=== Failed Requests ===" -ForegroundColor Red
    $failedRequests | ForEach-Object {
        Write-Host "User $($_.UserId) - $($_.Endpoint): $($_.Error)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Load test completed!" -ForegroundColor Green