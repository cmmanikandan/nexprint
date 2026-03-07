# NexPrint Universal Launcher
$apps = @(
    @{ name="User Web"; port=3003; dir="apps\user-web" },
    @{ name="Shop Admin"; port=3001; dir="apps\print-shop-admin" },
    @{ name="Global Admin"; port=3002; dir="apps\admin-dashboard" }
)

Write-Host "--- NEXPRINT ECOSYSTEM STARTUP ---" -ForegroundColor Cyan

foreach ($app in $apps) {
    $path = "$PSScriptRoot\$($app.dir)"
    if (Test-Path $path) {
        Write-Host "[+] Launching $($app.name) on http://localhost:$($app.port)..." -ForegroundColor Green
        Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location '$path'; npm run dev" -WindowStyle Normal
        Start-Process "http://localhost:$($app.port)"
    }
}

Write-Host "`nAll systems engaged. Check background windows for logs." -ForegroundColor Yellow