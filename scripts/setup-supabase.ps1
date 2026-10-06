# Requires: Supabase personal access token from
# https://supabase.com/dashboard/account/tokens
#
# Usage:
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_...."
#   .\scripts\setup-supabase.ps1

param(
  [string]$ProjectName = "utah-npost-practice",
  [string]$Region = "us-west-1",
  [string]$DbPassword = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Host "Set SUPABASE_ACCESS_TOKEN first (Supabase Dashboard -> Account -> Access Tokens)."
  exit 1
}

if (-not $DbPassword) {
  $DbPassword = -join ((48..57 + 65..90 + 97..122 | Get-Random -Count 24 | ForEach-Object { [char]$_ }))
  Write-Host "Generated database password (save this): $DbPassword"
}

Write-Host "Listing organizations..."
$orgs = npx --yes supabase@2.119.0 orgs list -o json | ConvertFrom-Json
if (-not $orgs -or $orgs.Count -eq 0) { throw "No Supabase organizations found for this token." }
$orgId = $orgs[0].id
Write-Host "Using org: $($orgs[0].name) ($orgId)"

Write-Host "Creating project $ProjectName (may take a few minutes)..."
$createJson = npx --yes supabase@2.119.0 projects create $ProjectName --org-id $orgId --db-password $DbPassword --region $Region -o json | ConvertFrom-Json
$ref = $createJson.id
if (-not $ref) { throw "Project creation did not return an id." }
Write-Host "Project ref: $ref"

Write-Host "Waiting for project to become active..."
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 10
  $status = npx --yes supabase@2.119.0 projects get $ref -o json | ConvertFrom-Json
  if ($status.status -eq "ACTIVE_HEALTHY") { break }
  Write-Host "  status: $($status.status)"
}
if ($status.status -ne "ACTIVE_HEALTHY") { throw "Project not healthy yet: $($status.status)" }

$url = "https://$ref.supabase.co"
Write-Host "Project URL: $url"

Write-Host "Fetching anon key..."
$keys = npx --yes supabase@2.119.0 projects api-keys $ref -o json | ConvertFrom-Json
$anon = ($keys | Where-Object { $_.name -eq "anon" }).api_key
if (-not $anon) { throw "Could not read anon key." }

$configPath = Join-Path $root "config.js"
@(
  "window.APP_CONFIG = {"
  "  supabaseUrl: '$url',"
  "  supabaseAnonKey: '$anon',"
  "};"
  ""
) | Set-Content -Path $configPath -Encoding utf8
Write-Host "Updated $configPath"

Write-Host "Applying database schema (db push)..."
$migDir = Join-Path $root "supabase\migrations"
New-Item -ItemType Directory -Force -Path $migDir | Out-Null
$migFile = Join-Path $migDir "20260306120000_practice_state.sql"
Copy-Item (Join-Path $root "supabase\schema.sql") $migFile -Force
Push-Location $root
npx --yes supabase@2.119.0 link --project-ref $ref --password $DbPassword --yes
npx --yes supabase@2.119.0 db push --yes
Pop-Location

$mcpPath = Join-Path $env:USERPROFILE ".cursor\mcp.json"
if (Test-Path $mcpPath) {
  $mcp = Get-Content $mcpPath -Raw | ConvertFrom-Json
  if ($mcp.mcpServers.supabase) {
    $mcp.mcpServers.supabase.url = "https://mcp.supabase.com/mcp?project_ref=$ref"
    $mcp | ConvertTo-Json -Depth 10 | Set-Content $mcpPath -Encoding utf8
    Write-Host "Updated Cursor MCP project_ref in $mcpPath"
  }
}

Write-Host ""
Write-Host "Manual steps in Supabase Dashboard:"
Write-Host "  1. Authentication -> URL Configuration -> Site URL:"
Write-Host "     https://sssamiam2-prog.github.io/utah-npost-practice-app/"
Write-Host "  2. Add Redirect URL (same as above)."
Write-Host "  3. Authentication -> Providers -> enable Email and/or Google."
Write-Host ""
Write-Host "Then commit and push config.js, or run: git add config.js; git commit -m 'Add Supabase keys'; git push"
