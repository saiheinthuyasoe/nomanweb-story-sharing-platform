# Nomanweb Load Testing Script
# This script runs JMeter load tests for 1000 concurrent users

param(
    [string]$ServerHost = "localhost",
    [int]$ServerPort = 8080,
    [int]$Users = 1000,
    [int]$RampUp = 300,
    [int]$Duration = 600,
    [string]$JMeterPath = "C:\apache-jmeter\bin\jmeter.bat"
)

Write-Host "=== Nomanweb Load Testing Script ===" -ForegroundColor Green
Write-Host "Server: $ServerHost`:$ServerPort" -ForegroundColor Yellow
Write-Host "Users: $Users" -ForegroundColor Yellow
Write-Host "Ramp-up: $RampUp seconds" -ForegroundColor Yellow
Write-Host "Duration: $Duration seconds" -ForegroundColor Yellow
Write-Host ""

# Check if JMeter exists
if (-not (Test-Path $JMeterPath)) {
    Write-Host "JMeter not found at: $JMeterPath" -ForegroundColor Red
    Write-Host "Please install JMeter and update the JMeterPath parameter" -ForegroundColor Red
    Write-Host "Download from: https://jmeter.apache.org/download_jmeter.cgi" -ForegroundColor Yellow
    exit 1
}

# Create results directory
$ResultsDir = ".\results\$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
New-Item -ItemType Directory -Path $ResultsDir -Force | Out-Null

Write-Host "Results will be saved to: $ResultsDir" -ForegroundColor Cyan

# Run JMeter test
$JMeterArgs = @(
    "-n"  # Non-GUI mode
    "-t", ".\nomanweb-load-test.jmx"  # Test plan
    "-l", "$ResultsDir\results.jtl"  # Results file
    "-e"  # Generate HTML report
    "-o", "$ResultsDir\html-report"  # HTML report output directory
    "-Jserver=$ServerHost"
    "-Jport=$ServerPort"
    "-JUSERS=$Users"
    "-JRAMP_UP=$RampUp"
    "-JDURATION=$Duration"
)

Write-Host "Starting JMeter load test..." -ForegroundColor Green
Write-Host "Command: $JMeterPath $($JMeterArgs -join ' ')" -ForegroundColor Gray

try {
    & $JMeterPath $JMeterArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=== Load Test Completed Successfully ===" -ForegroundColor Green
        Write-Host "Results saved to: $ResultsDir" -ForegroundColor Cyan
        Write-Host "HTML Report: $ResultsDir\html-report\index.html" -ForegroundColor Cyan
        
        # Open HTML report if available
        $HtmlReport = "$ResultsDir\html-report\index.html"
        if (Test-Path $HtmlReport) {
            Write-Host "Opening HTML report..." -ForegroundColor Yellow
            Start-Process $HtmlReport
        }
    } else {
        Write-Host "Load test failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "Error running JMeter: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Green
Write-Host "Check the following for performance analysis:" -ForegroundColor Yellow
Write-Host "1. Response times and throughput in the HTML report" -ForegroundColor White
Write-Host "2. Error rates and failed requests" -ForegroundColor White
Write-Host "3. Server resource utilization (CPU, Memory, DB connections)" -ForegroundColor White
Write-Host "4. Database performance and connection pool usage" -ForegroundColor White