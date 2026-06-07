param(
  [Parameter(Position=0)]
  [string]$Target = 'start'
)

switch ($Target.ToLowerInvariant()) {
  'start' { npm.cmd run mobile:start }
  'web' { npm.cmd run web:start }
  'mobile' { npm.cmd run mobile:start }
  'android' { npm.cmd run mobile:android }
  'ios' { npm.cmd run mobile:ios }
  'lint' { npm.cmd run lint }
  'typecheck' { npm.cmd run typecheck }
  'install' { npm.cmd run install }
  'clean' {
    if (Test-Path .expo) { Remove-Item .expo -Recurse -Force }
    if (Test-Path .expo-shared) { Remove-Item .expo-shared -Recurse -Force }
    if (Test-Path 'apps\MoneyKai-mobile\.expo') { Remove-Item 'apps\MoneyKai-mobile\.expo' -Recurse -Force }
    if (Test-Path 'apps\MoneyKai-mobile\.expo-shared') { Remove-Item 'apps\MoneyKai-mobile\.expo-shared' -Recurse -Force }
    if (Test-Path 'apps\MoneyKai-mobile\web-build') { Remove-Item 'apps\MoneyKai-mobile\web-build' -Recurse -Force }
    if (Test-Path 'apps\MoneyKai-mobile\dist') { Remove-Item 'apps\MoneyKai-mobile\dist' -Recurse -Force }
    if (Test-Path web-build) { Remove-Item web-build -Recurse -Force }
    if (Test-Path dist) { Remove-Item dist -Recurse -Force }
    if (Test-Path coverage) { Remove-Item coverage -Recurse -Force }
    if (Test-Path .eslintcache) { Remove-Item .eslintcache -Force }
  }
  default {
    Write-Host 'Usage: .\make.ps1 [start|web|mobile|android|ios|install|lint|typecheck|clean]'
    exit 1
  }
}
