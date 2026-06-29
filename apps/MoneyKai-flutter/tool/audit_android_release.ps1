param(
    [switch]$RequireSigned
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$appRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$debugApk = Join-Path $appRoot "build\app\outputs\flutter-apk\app-debug.apk"
$releaseApk = Join-Path $appRoot "build\app\outputs\flutter-apk\app-release.apk"
$releaseAab = Join-Path $appRoot "build\app\outputs\bundle\release\app-release.aab"

$restrictedPermissions = @(
    "android.permission.READ_SMS",
    "android.permission.RECEIVE_MMS",
    "android.permission.RECEIVE_SMS",
    "android.permission.RECEIVE_WAP_PUSH",
    "android.permission.SEND_SMS",
    "android.permission.WRITE_SMS",
    "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
    "android.permission.READ_CONTACTS",
    "android.permission.WRITE_CONTACTS",
    "android.permission.CAMERA",
    "android.permission.RECORD_AUDIO",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE"
)

function Resolve-AndroidBuildTool {
    param([Parameter(Mandatory = $true)][string]$Name)

    $sdkRoots = @(
        $env:ANDROID_HOME,
        $env:ANDROID_SDK_ROOT,
        "D:\Android\Sdk",
        "$env:LOCALAPPDATA\Android\Sdk"
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -Unique

    foreach ($root in $sdkRoots) {
        $buildTools = Join-Path $root "build-tools"
        if (-not (Test-Path -LiteralPath $buildTools)) {
            continue
        }

        $candidate = Get-ChildItem -LiteralPath $buildTools -Directory |
            Sort-Object Name -Descending |
            ForEach-Object {
                $toolPath = Join-Path $_.FullName $Name
                if (Test-Path -LiteralPath $toolPath) {
                    $toolPath
                }
            } |
            Select-Object -First 1

        if ($candidate) {
            return $candidate
        }
    }

    $pathCandidate = Get-Command $Name -ErrorAction SilentlyContinue
    if ($pathCandidate) {
        return $pathCandidate.Source
    }

    throw "Could not find Android build tool: $Name"
}

function Assert-Artifact {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing Android artifact: $Path"
    }
}

function Write-ArtifactMetadata {
    param([Parameter(Mandatory = $true)][string]$Path)

    $item = Get-Item -LiteralPath $Path
    $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $Path
    Write-Host "Artifact: $Path"
    Write-Host "  Size: $($item.Length) bytes"
    Write-Host "  Built: $($item.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')) local time"
    Write-Host "  SHA-256: $($hash.Hash)"
}

function Get-ApkPermissions {
    param(
        [Parameter(Mandatory = $true)][string]$Aapt2,
        [Parameter(Mandatory = $true)][string]$ApkPath
    )

    & $Aapt2 dump permissions $ApkPath
}

function Assert-NoRestrictedPermissions {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string[]]$PermissionDump
    )

    $found = @()
    foreach ($permission in $restrictedPermissions) {
        if ($PermissionDump -match [regex]::Escape($permission)) {
            $found += $permission
        }
    }

    if ($found.Count -gt 0) {
        throw "$Label includes restricted permissions: $($found -join ', ')"
    }

    Write-Host "$Label restricted permission audit: passed"
}

function Test-ApkSigned {
    param(
        [Parameter(Mandatory = $true)][string]$ApkSigner,
        [Parameter(Mandatory = $true)][string]$ApkPath
    )

    $oldErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        $output = & $ApkSigner verify --verbose $ApkPath 2>&1
        $signed = $LASTEXITCODE -eq 0
        return [PSCustomObject]@{
            Signed = $signed
            Output = $output
        }
    } finally {
        $ErrorActionPreference = $oldErrorActionPreference
    }
}

function Test-AabSigned {
    param([Parameter(Mandatory = $true)][string]$AabPath)

    $oldErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        $output = & jarsigner -verify -verbose -certs $AabPath 2>&1
        $signed = ($LASTEXITCODE -eq 0) -and -not (($output -join "`n") -match "jar is unsigned|no manifest")
        return [PSCustomObject]@{
            Signed = $signed
            Output = $output
        }
    } finally {
        $ErrorActionPreference = $oldErrorActionPreference
    }
}

$signingEnvNames = @(
    "MONEYKAI_UPLOAD_STORE_FILE",
    "MONEYKAI_UPLOAD_STORE_PASSWORD",
    "MONEYKAI_UPLOAD_KEY_ALIAS",
    "MONEYKAI_UPLOAD_KEY_PASSWORD"
)

$setSigningEnv = @(
    foreach ($name in $signingEnvNames) {
        if (-not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
            $name
        }
    }
)

if ($setSigningEnv.Count -gt 0 -and $setSigningEnv.Count -lt $signingEnvNames.Count) {
    throw "Partial signing environment detected. Set all MONEYKAI_UPLOAD_* variables or unset all of them."
}

if ($RequireSigned -and $setSigningEnv.Count -ne $signingEnvNames.Count) {
    throw "-RequireSigned requires all MONEYKAI_UPLOAD_* variables to be set."
}

$aapt2 = Resolve-AndroidBuildTool "aapt2.exe"
$apkSigner = Resolve-AndroidBuildTool "apksigner.bat"

Assert-Artifact $debugApk
Assert-Artifact $releaseApk
Assert-Artifact $releaseAab

Write-Host "MoneyKai Android release audit"
Write-Host "App root: $appRoot"
Write-Host "aapt2: $aapt2"
Write-Host "apksigner: $apkSigner"
Write-Host "Signing env: $($setSigningEnv.Count) of $($signingEnvNames.Count) variables set"
Write-Host ""

Write-ArtifactMetadata $debugApk
Write-ArtifactMetadata $releaseApk
Write-ArtifactMetadata $releaseAab
Write-Host ""

$debugPermissions = @(Get-ApkPermissions -Aapt2 $aapt2 -ApkPath $debugApk)
$releasePermissions = @(Get-ApkPermissions -Aapt2 $aapt2 -ApkPath $releaseApk)
Assert-NoRestrictedPermissions -Label "Debug APK" -PermissionDump $debugPermissions
Assert-NoRestrictedPermissions -Label "Release APK" -PermissionDump $releasePermissions
Write-Host ""

$releaseApkSigning = Test-ApkSigned -ApkSigner $apkSigner -ApkPath $releaseApk
$releaseAabSigning = Test-AabSigned -AabPath $releaseAab

if ($RequireSigned) {
    if (-not $releaseApkSigning.Signed) {
        throw "Release APK is not signed."
    }

    if (-not $releaseAabSigning.Signed) {
        throw "Release AAB is not signed."
    }

    Write-Host "Release signing audit: signed APK and AAB verified"
} else {
    $apkState = if ($releaseApkSigning.Signed) { "signed" } else { "unsigned inspection artifact" }
    $aabState = if ($releaseAabSigning.Signed) { "signed" } else { "unsigned inspection artifact" }
    Write-Host "Release APK signing state: $apkState"
    Write-Host "Release AAB signing state: $aabState"
    Write-Host "Use -RequireSigned after building with upload-key environment variables."
}
