# Performance Monitoring Script for Load Testing
# Monitors system resources during load testing

param(
    [int]$IntervalSeconds = 10,
    [int]$DurationMinutes = 15,
    [string]$OutputFile = "performance-metrics.csv"
)

Write-Host "=== Performance Monitoring Started ===" -ForegroundColor Green
Write-Host "Monitoring interval: $IntervalSeconds seconds" -ForegroundColor Yellow
Write-Host "Duration: $DurationMinutes minutes" -ForegroundColor Yellow
Write-Host "Output file: $OutputFile" -ForegroundColor Yellow
Write-Host ""

# Initialize CSV file
$csvHeader = "Timestamp,CPU_Percent,Memory_Used_MB,Memory_Available_MB,Memory_Percent,Disk_Read_MB,Disk_Write_MB,Network_Sent_MB,Network_Received_MB"
$csvHeader | Out-File -FilePath $OutputFile -Encoding UTF8

$startTime = Get-Date
$endTime = $startTime.AddMinutes($DurationMinutes)
$iteration = 0

# Get initial network counters
$initialNetworkSent = (Get-Counter "\Network Interface(*)\Bytes Sent/sec" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CounterSamples | Where-Object {$_.InstanceName -ne "_Total" -and $_.InstanceName -ne "Loopback*"} | Measure-Object -Property CookedValue -Sum).Sum
$initialNetworkReceived = (Get-Counter "\Network Interface(*)\Bytes Received/sec" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CounterSamples | Where-Object {$_.InstanceName -ne "_Total" -and $_.InstanceName -ne "Loopback*"} | Measure-Object -Property CookedValue -Sum).Sum

Write-Host "Starting monitoring loop..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop monitoring early" -ForegroundColor Yellow
Write-Host ""

try {
    while ((Get-Date) -lt $endTime) {
        $iteration++
        $currentTime = Get-Date
        
        # Get CPU usage
        $cpuPercent = (Get-Counter "\Processor(_Total)\% Processor Time" -ErrorAction SilentlyContinue).CounterSamples.CookedValue
        $cpuPercent = [math]::Round($cpuPercent, 2)
        
        # Get Memory usage
        $totalMemory = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1MB
        $availableMemory = (Get-Counter "\Memory\Available MBytes" -ErrorAction SilentlyContinue).CounterSamples.CookedValue
        $usedMemory = $totalMemory - $availableMemory
        $memoryPercent = [math]::Round(($usedMemory / $totalMemory) * 100, 2)
        
        # Get Disk I/O
        $diskRead = 0
        $diskWrite = 0
        try {
            $diskRead = (Get-Counter "\PhysicalDisk(_Total)\Disk Read Bytes/sec" -ErrorAction SilentlyContinue).CounterSamples.CookedValue / 1MB
            $diskWrite = (Get-Counter "\PhysicalDisk(_Total)\Disk Write Bytes/sec" -ErrorAction SilentlyContinue).CounterSamples.CookedValue / 1MB
        } catch {
            # Disk counters might not be available
        }
        
        # Get Network I/O
        $networkSent = 0
        $networkReceived = 0
        try {
            $currentNetworkSent = (Get-Counter "\Network Interface(*)\Bytes Sent/sec" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CounterSamples | Where-Object {$_.InstanceName -ne "_Total" -and $_.InstanceName -ne "Loopback*"} | Measure-Object -Property CookedValue -Sum).Sum
            $currentNetworkReceived = (Get-Counter "\Network Interface(*)\Bytes Received/sec" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CounterSamples | Where-Object {$_.InstanceName -ne "_Total" -and $_.InstanceName -ne "Loopback*"} | Measure-Object -Property CookedValue -Sum).Sum
            
            $networkSent = ($currentNetworkSent - $initialNetworkSent) / 1MB
            $networkReceived = ($currentNetworkReceived - $initialNetworkReceived) / 1MB
        } catch {
            # Network counters might not be available
        }
        
        # Round values
        $usedMemory = [math]::Round($usedMemory, 2)
        $availableMemory = [math]::Round($availableMemory, 2)
        $diskRead = [math]::Round($diskRead, 2)
        $diskWrite = [math]::Round($diskWrite, 2)
        $networkSent = [math]::Round($networkSent, 2)
        $networkReceived = [math]::Round($networkReceived, 2)
        
        # Create CSV row
        $csvRow = "$($currentTime.ToString('yyyy-MM-dd HH:mm:ss')),$cpuPercent,$usedMemory,$availableMemory,$memoryPercent,$diskRead,$diskWrite,$networkSent,$networkReceived"
        $csvRow | Out-File -FilePath $OutputFile -Append -Encoding UTF8
        
        # Display current metrics
        Write-Host "[$($currentTime.ToString('HH:mm:ss'))] CPU: $cpuPercent% | Memory: $memoryPercent% ($usedMemory MB used) | Disk R/W: $diskRead/$diskWrite MB/s | Network S/R: $networkSent/$networkReceived MB" -ForegroundColor White
        
        # Check for high resource usage
        if ($cpuPercent -gt 80) {
            Write-Host "WARNING: High CPU usage detected ($cpuPercent%)" -ForegroundColor Red
        }
        if ($memoryPercent -gt 80) {
            Write-Host "WARNING: High memory usage detected ($memoryPercent%)" -ForegroundColor Red
        }
        
        Start-Sleep -Seconds $IntervalSeconds
    }
} catch {
    Write-Host "Monitoring interrupted: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Performance Monitoring Completed ===" -ForegroundColor Green
Write-Host "Total samples collected: $iteration" -ForegroundColor Cyan
Write-Host "Results saved to: $OutputFile" -ForegroundColor Cyan

# Generate summary statistics
if (Test-Path $OutputFile) {
    Write-Host ""
    Write-Host "=== Performance Summary ===" -ForegroundColor Cyan
    
    $data = Import-Csv $OutputFile
    
    if ($data.Count -gt 0) {
        $avgCpu = [math]::Round(($data | Measure-Object -Property CPU_Percent -Average).Average, 2)
        $maxCpu = [math]::Round(($data | Measure-Object -Property CPU_Percent -Maximum).Maximum, 2)
        $avgMemory = [math]::Round(($data | Measure-Object -Property Memory_Percent -Average).Average, 2)
        $maxMemory = [math]::Round(($data | Measure-Object -Property Memory_Percent -Maximum).Maximum, 2)
        
        Write-Host "CPU Usage - Average: $avgCpu%, Peak: $maxCpu%" -ForegroundColor White
        Write-Host "Memory Usage - Average: $avgMemory%, Peak: $maxMemory%" -ForegroundColor White
        
        # Performance recommendations
        Write-Host ""
        Write-Host "=== Recommendations ===" -ForegroundColor Yellow
        
        if ($maxCpu -gt 90) {
            Write-Host "⚠️  CPU usage exceeded 90%. Consider:" -ForegroundColor Red
            Write-Host "   - Reducing concurrent users" -ForegroundColor White
            Write-Host "   - Optimizing application code" -ForegroundColor White
            Write-Host "   - Scaling horizontally" -ForegroundColor White
        } elseif ($maxCpu -gt 70) {
            Write-Host "⚠️  CPU usage exceeded 70%. Monitor closely." -ForegroundColor Yellow
        } else {
            Write-Host "✅ CPU usage is within acceptable limits." -ForegroundColor Green
        }
        
        if ($maxMemory -gt 90) {
            Write-Host "⚠️  Memory usage exceeded 90%. Consider:" -ForegroundColor Red
            Write-Host "   - Increasing JVM heap size" -ForegroundColor White
            Write-Host "   - Checking for memory leaks" -ForegroundColor White
            Write-Host "   - Adding more RAM" -ForegroundColor White
        } elseif ($maxMemory -gt 70) {
            Write-Host "⚠️  Memory usage exceeded 70%. Monitor closely." -ForegroundColor Yellow
        } else {
            Write-Host "✅ Memory usage is within acceptable limits." -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "Monitoring complete. Check $OutputFile for detailed metrics." -ForegroundColor Green