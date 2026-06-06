param(
  [Parameter(Position=0)]
  [string]$Target = 'start'
)

switch ($Target.ToLowerInvariant()) {
  'start' { npm.cmd run start }
  'web' { npm.cmd run web }
  'android' { npm.cmd run android }
  'ios' { npm.cmd run ios }
  'lint' { npm.cmd run lint }
  'typecheck' { npm.cmd run typecheck }
  'install' { npm.cmd install }
  'clean' {
    if (Test-Path .expo) { Remove-Item .expo -Recurse -Force }
    if (Test-Path .expo-shared) { Remove-Item .expo-shared -Recurse -Force }
    if (Test-Path web-build) { Remove-Item web-build -Recurse -Force }
    if (Test-Path dist) { Remove-Item dist -Recurse -Force }
    if (Test-Path coverage) { Remove-Item coverage -Recurse -Force }
    if (Test-Path .eslintcache) { Remove-Item .eslintcache -Force }
  }
  default {
    Write-Host 'Usage: .\make.ps1 [start|web|android|ios|install|lint|typecheck|clean]'
    exit 1
  }
}

