# Run once from this folder: powershell -ExecutionPolicy Bypass -File .\setup.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
}
npm install
npx prisma generate
npx prisma db push
npm run db:seed
Write-Host "Done. Start the app with: npm run dev"
