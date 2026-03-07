# NexPrint System Verification Script
$ports = @{
    3001 = "Print Shop / Shop Admin Portal"
    3002 = "Super Admin Dashboard"
    3003 = "User Web Application"
}

Write-Host "Verifying NexPrint Ecosystem..." -ForegroundColor Cyan

foreach ($port in $ports.Keys) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "[ONLINE] Port $port : $($ports[$port])" -ForegroundColor Green
    }
    else {
        Write-Host "[OFFLINE] Port $port : $($ports[$port])" -ForegroundColor Red
    }
}

Write-Host "`nReady for Publishing Review." -ForegroundColor Magenta
