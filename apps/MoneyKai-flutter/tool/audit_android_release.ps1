param(
    [switch]$RequireSigned
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$appRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$debugApk = Join-Path $appRoot "build\app\outputs\flutter-apk\app-debug.apk"
$releaseApk = Join-Path $appRoot "build\app\outputs\flutter-apk\app-release.apk"
$releaseAab = Join-Path $appRoot "build\app\outputs\bundle\release\app-release.aab"
$pubspecPath = Join-Path $appRoot "pubspec.yaml"
$androidBuildFile = Join-Path $appRoot "android\app\build.gradle.kts"
$androidManifestPath = Join-Path $appRoot "android\app\src\main\AndroidManifest.xml"
$backupRulesPath = Join-Path $appRoot "android\app\src\main\res\xml\backup_rules.xml"
$dataExtractionRulesPath = Join-Path $appRoot "android\app\src\main\res\xml\data_extraction_rules.xml"
$networkSecurityConfigPath = Join-Path $appRoot "android\app\src\main\res\xml\network_security_config.xml"

$isWindows = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform(
    [System.Runtime.InteropServices.OSPlatform]::Windows
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-RepositoryRoot {
    $oldErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        $gitRoot = & git -C $appRoot rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($gitRoot)) {
            return [System.IO.Path]::GetFullPath($gitRoot.Trim())
        }
    } finally {
        $ErrorActionPreference = $oldErrorActionPreference
    }

    return [System.IO.Path]::GetFullPath((Join-Path $appRoot "..\.."))
}

function Test-IsPathWithinDirectory {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Directory
    )

    $separators = [char[]]@(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )
    $fullPath = [System.IO.Path]::GetFullPath($Path).TrimEnd($separators)
    $fullDirectory = [System.IO.Path]::GetFullPath($Directory).TrimEnd($separators)
    $fullDirectoryWithSeparator = "$fullDirectory$([System.IO.Path]::DirectorySeparatorChar)"

    return $fullPath.StartsWith(
        $fullDirectoryWithSeparator,
        [System.StringComparison]::OrdinalIgnoreCase
    )
}

function Resolve-AndroidBuildTool {
    param([Parameter(Mandatory = $true)][string[]]$Names)

    $sdkRoots = @(
        $env:ANDROID_HOME,
        $env:ANDROID_SDK_ROOT,
        $(if ($isWindows) { "D:\Android\Sdk" }),
        $(if ($isWindows -and $env:LOCALAPPDATA) { "$env:LOCALAPPDATA\Android\Sdk" }),
        $(if (-not $isWindows) { "/usr/local/lib/android/sdk" }),
        $(if (-not $isWindows -and $env:HOME) { "$env:HOME/Android/Sdk" })
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -Unique

    foreach ($root in $sdkRoots) {
        $buildTools = Join-Path $root "build-tools"
        if (-not (Test-Path -LiteralPath $buildTools)) {
            continue
        }

        $candidate = Get-ChildItem -LiteralPath $buildTools -Directory |
            Sort-Object Name -Descending |
            ForEach-Object {
                foreach ($name in $Names) {
                    $toolPath = Join-Path $_.FullName $name
                    if (Test-Path -LiteralPath $toolPath) {
                        $toolPath
                    }
                }
            } |
            Select-Object -First 1

        if ($candidate) {
            return $candidate
        }
    }

    foreach ($name in $Names) {
        $pathCandidate = Get-Command $name -ErrorAction SilentlyContinue
        if ($pathCandidate) {
            return $pathCandidate.Source
        }
    }

    throw "Could not find Android build tool: $($Names -join ' or ')"
}

function Assert-Artifact {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing Android artifact: $Path"
    }
}

function Assert-SourceAndroidBackupHardening {
    if (-not (Test-Path -LiteralPath $androidManifestPath)) {
        throw "Missing Android manifest: $androidManifestPath"
    }

    if (-not (Test-Path -LiteralPath $backupRulesPath)) {
        throw "Missing Android backup rules: $backupRulesPath"
    }

    if (-not (Test-Path -LiteralPath $dataExtractionRulesPath)) {
        throw "Missing Android data extraction rules: $dataExtractionRulesPath"
    }

    if (-not (Test-Path -LiteralPath $networkSecurityConfigPath)) {
        throw "Missing Android network security config: $networkSecurityConfigPath"
    }

    [xml]$manifest = Get-Content -LiteralPath $androidManifestPath -Raw
    $application = $manifest.manifest.application
    if ($null -eq $application) {
        throw "AndroidManifest.xml is missing an application element."
    }

    $androidNamespace = "http://schemas.android.com/apk/res/android"
    if ($application.GetAttribute("allowBackup", $androidNamespace) -ne "false") {
        throw "AndroidManifest.xml must set android:allowBackup to false."
    }

    if ($application.GetAttribute("fullBackupContent", $androidNamespace) -ne "@xml/backup_rules") {
        throw "AndroidManifest.xml must point android:fullBackupContent to @xml/backup_rules."
    }

    if ($application.GetAttribute("dataExtractionRules", $androidNamespace) -ne "@xml/data_extraction_rules") {
        throw "AndroidManifest.xml must point android:dataExtractionRules to @xml/data_extraction_rules."
    }

    if ($application.GetAttribute("networkSecurityConfig", $androidNamespace) -ne "@xml/network_security_config") {
        throw "AndroidManifest.xml must point android:networkSecurityConfig to @xml/network_security_config."
    }

    if ($application.GetAttribute("usesCleartextTraffic", $androidNamespace) -ne "false") {
        throw "AndroidManifest.xml must set android:usesCleartextTraffic to false."
    }

    [xml]$backupRules = Get-Content -LiteralPath $backupRulesPath -Raw
    $backupExclude = @($backupRules."full-backup-content".exclude | Where-Object {
        $_.domain -eq "root" -and $_.path -eq "."
    })
    if ($backupExclude.Count -ne 1) {
        throw "backup_rules.xml must exclude the root domain."
    }

    [xml]$dataExtractionRules = Get-Content -LiteralPath $dataExtractionRulesPath -Raw
    $cloudExclude = @($dataExtractionRules."data-extraction-rules"."cloud-backup".exclude | Where-Object {
        $_.domain -eq "root" -and $_.path -eq "."
    })
    if ($cloudExclude.Count -ne 1) {
        throw "data_extraction_rules.xml must exclude root cloud backup."
    }

    $transferExclude = @($dataExtractionRules."data-extraction-rules"."device-transfer".exclude | Where-Object {
        $_.domain -eq "root" -and $_.path -eq "."
    })
    if ($transferExclude.Count -ne 1) {
        throw "data_extraction_rules.xml must exclude root device transfer."
    }

    [xml]$networkSecurityConfig = Get-Content -LiteralPath $networkSecurityConfigPath -Raw
    $baseConfig = $networkSecurityConfig."network-security-config"."base-config"
    if ($null -eq $baseConfig -or $baseConfig.cleartextTrafficPermitted -ne "false") {
        throw "network_security_config.xml must disable cleartext traffic in base-config."
    }

    Write-Host "Android source backup hardening audit: passed"
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

function Get-PubspecVersion {
    $versionLine = Get-Content -LiteralPath $pubspecPath |
        Where-Object { $_ -match "^\s*version:\s*(\S+)\s*$" } |
        Select-Object -First 1

    if (-not $versionLine -or $versionLine -notmatch "^\s*version:\s*([^+]+)\+(\d+)\s*$") {
        throw "Could not read Flutter versionName+versionCode from $pubspecPath."
    }

    return [PSCustomObject]@{
        Name = $matches[1]
        Code = $matches[2]
    }
}

function Get-GradleStringValue {
    param(
        [Parameter(Mandatory = $true)][string]$Key,
        [Parameter(Mandatory = $true)][string]$Path
    )

    $pattern = "^\s*$([System.Text.RegularExpressions.Regex]::Escape($Key))\s*=\s*`"([^`"]+)`"\s*$"
    $line = Get-Content -LiteralPath $Path |
        Where-Object { $_ -match $pattern } |
        Select-Object -First 1

    if (-not $line -or $line -notmatch $pattern) {
        throw "Could not read '$Key' from $Path."
    }

    return $matches[1]
}

function Get-ApkPermissions {
    param(
        [Parameter(Mandatory = $true)][string]$Aapt2,
        [Parameter(Mandatory = $true)][string]$ApkPath
    )

    & $Aapt2 dump permissions $ApkPath
}

function Get-ApkBadging {
    param(
        [Parameter(Mandatory = $true)][string]$Aapt2,
        [Parameter(Mandatory = $true)][string]$ApkPath
    )

    $badging = & $Aapt2 dump badging $ApkPath
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "aapt2 dump badging failed for $ApkPath with exit code $exitCode."
    }

    return $badging
}

function Get-ApkManifest {
    param(
        [Parameter(Mandatory = $true)][string]$Aapt2,
        [Parameter(Mandatory = $true)][string]$ApkPath
    )

    $manifest = & $Aapt2 dump xmltree --file AndroidManifest.xml $ApkPath
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "aapt2 dump manifest failed for $ApkPath with exit code $exitCode."
    }

    return $manifest
}

function Get-NormalizedPermissionSurface {
    param([Parameter(Mandatory = $true)][string[]]$PermissionDump)

    $surface = @()
    foreach ($line in $PermissionDump) {
        if ($line -match "^uses-permission:\s+name='(?<name>[^']+)'") {
            $surface += "uses-permission:$($matches['name'])"
            continue
        }

        if ($line -match "^permission:\s+name='(?<name>[^']+)'") {
            $surface += "permission:$($matches['name'])"
            continue
        }

        if ($line -match "^permission:\s+(?<name>\S+)\s*$") {
            $surface += "permission:$($matches['name'])"
        }
    }

    return @($surface | Sort-Object -Unique)
}

function Assert-AllowedPermissions {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string[]]$PermissionDump,
        [Parameter(Mandatory = $true)][string]$ExpectedPackage,
        [Parameter(Mandatory = $true)][bool]$AllowInternet
    )

    $dynamicReceiverPermission = "$ExpectedPackage.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
    $expectedSurface = @(
        "permission:$dynamicReceiverPermission",
        "uses-permission:$dynamicReceiverPermission"
    )

    if ($AllowInternet) {
        $expectedSurface += "uses-permission:android.permission.INTERNET"
    }

    $actualSurface = @(Get-NormalizedPermissionSurface -PermissionDump $PermissionDump)
    $expectedSurface = @($expectedSurface | Sort-Object -Unique)
    $unexpected = @($actualSurface | Where-Object { $_ -notin $expectedSurface })
    $missing = @($expectedSurface | Where-Object { $_ -notin $actualSurface })

    if ($unexpected.Count -gt 0) {
        throw "$Label includes unexpected permissions: $($unexpected -join ', ')"
    }

    if ($missing.Count -gt 0) {
        throw "$Label is missing expected permissions: $($missing -join ', ')"
    }

    Write-Host "$Label permission allowlist audit: passed"
}

function Assert-AabStructure {
    param([Parameter(Mandatory = $true)][string]$AabPath)

    $requiredEntries = @(
        "BundleConfig.pb",
        "base/manifest/AndroidManifest.xml",
        "base/resources.pb",
        "base/dex/classes.dex",
        "base/assets/flutter_assets/AssetManifest.bin",
        "base/assets/flutter_assets/FontManifest.json",
        "base/lib/arm64-v8a/libapp.so",
        "base/lib/arm64-v8a/libdartjni.so",
        "base/lib/arm64-v8a/libflutter.so",
        "BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map",
        "BUNDLE-METADATA/com.android.tools.build.profiles/baseline.prof",
        "BUNDLE-METADATA/com.android.tools.build.profiles/baseline.profm",
        "BUNDLE-METADATA/com.android.tools.build.debugsymbols/arm64-v8a/libapp.so.sym",
        "BUNDLE-METADATA/com.android.tools.build.debugsymbols/arm64-v8a/libdartjni.so.sym",
        "BUNDLE-METADATA/com.android.tools.build.debugsymbols/arm64-v8a/libflutter.so.sym"
    )

    $archive = [System.IO.Compression.ZipFile]::OpenRead($AabPath)
    try {
        foreach ($entryName in $requiredEntries) {
            $entry = $archive.GetEntry($entryName)
            if (-not $entry) {
                throw "Release AAB is missing required entry: $entryName"
            }

            if ($entry.Length -le 0) {
                throw "Release AAB required entry is empty: $entryName"
            }
        }
    } finally {
        $archive.Dispose()
    }

    Write-Host "Release AAB structure audit: passed"
}

function Assert-ReleaseManifestHardening {
    param(
        [Parameter(Mandatory = $true)][string[]]$ManifestDump,
        [Parameter(Mandatory = $true)][string]$ExpectedLaunchActivity
    )

    $joinedManifest = $ManifestDump -join "`n"
    if ($joinedManifest -match "debuggable\(.*\)=true") {
        throw "Release APK manifest is debuggable."
    }

    if ($joinedManifest -match "usesCleartextTraffic\(.*\)=true") {
        throw "Release APK manifest allows cleartext traffic."
    }

    if ($joinedManifest -notmatch "usesCleartextTraffic\(.*\).*(false|\(type 0x12\)0x0)") {
        throw "Release APK manifest must explicitly disable cleartext traffic."
    }

    if ($joinedManifest -notmatch "networkSecurityConfig\(.*\)=") {
        throw "Release APK manifest must include networkSecurityConfig."
    }

    if ($joinedManifest -match "allowBackup\(.*\)=true") {
        throw "Release APK manifest allows Android backup."
    }

    if ($joinedManifest -notmatch "allowBackup\(.*\).*(false|\(type 0x12\)0x0)") {
        throw "Release APK manifest must explicitly disable Android backup."
    }

    if ($joinedManifest -notmatch "fullBackupContent\(.*\)=") {
        throw "Release APK manifest must include fullBackupContent rules."
    }

    if ($joinedManifest -notmatch "dataExtractionRules\(.*\)=") {
        throw "Release APK manifest must include dataExtractionRules."
    }

    if ($joinedManifest -match "extractNativeLibs\(.*\)=true") {
        throw "Release APK manifest extracts native libraries."
    }

    if ($joinedManifest -notmatch "extractNativeLibs\(.*\).*(false|\(type 0x12\)0x0)") {
        throw "Release APK manifest must explicitly disable native library extraction."
    }

    Assert-ReleaseManifestExportedComponents `
        -ManifestDump $ManifestDump `
        -ExpectedLaunchActivity $ExpectedLaunchActivity

    Write-Host "Release APK manifest hardening audit: passed"
}

function Get-ManifestComponentBlocks {
    param([Parameter(Mandatory = $true)][string[]]$ManifestDump)

    $components = @()
    for ($index = 0; $index -lt $ManifestDump.Count; $index++) {
        $line = $ManifestDump[$index]
        if ($line -notmatch "^(?<indent>\s*)E: (?<type>activity|activity-alias|service|receiver|provider)\b") {
            continue
        }

        $indentLength = $matches["indent"].Length
        $type = $matches["type"]
        $blockLines = @($line)

        for ($nextIndex = $index + 1; $nextIndex -lt $ManifestDump.Count; $nextIndex++) {
            $nextLine = $ManifestDump[$nextIndex]
            if ($nextLine -match "^(?<indent>\s*)E: " -and $matches["indent"].Length -le $indentLength) {
                break
            }

            $blockLines += $nextLine
        }

        $components += [PSCustomObject]@{
            Type = $type
            Lines = $blockLines
        }
    }

    return $components
}

function Get-ManifestBlockAttribute {
    param(
        [Parameter(Mandatory = $true)][string[]]$Lines,
        [Parameter(Mandatory = $true)][string]$AttributeName
    )

    $attributeLine = $Lines |
        Where-Object { $_ -match "A: http://schemas\.android\.com/apk/res/android:$([regex]::Escape($AttributeName))\(" } |
        Select-Object -First 1

    if (-not $attributeLine) {
        return $null
    }

    if ($attributeLine -match '="([^"]*)"') {
        return $matches[1]
    }

    if ($attributeLine -match "\)=([^\s]+)") {
        return $matches[1]
    }

    return $attributeLine.Trim()
}

function Assert-ReleaseManifestExportedComponents {
    param(
        [Parameter(Mandatory = $true)][string[]]$ManifestDump,
        [Parameter(Mandatory = $true)][string]$ExpectedLaunchActivity
    )

    $allowedExportedComponents = @(
        [PSCustomObject]@{
            Type = "activity"
            Name = $ExpectedLaunchActivity
            Permission = $null
        },
        [PSCustomObject]@{
            Type = "receiver"
            Name = "androidx.profileinstaller.ProfileInstallReceiver"
            Permission = "android.permission.DUMP"
        }
    )

    $exportedComponents = @()
    foreach ($component in Get-ManifestComponentBlocks -ManifestDump $ManifestDump) {
        $exported = Get-ManifestBlockAttribute -Lines $component.Lines -AttributeName "exported"
        if ($exported -notmatch "^(true|\(type 0x12\)0xffffffff)$") {
            continue
        }

        $exportedComponents += [PSCustomObject]@{
            Type = $component.Type
            Name = Get-ManifestBlockAttribute -Lines $component.Lines -AttributeName "name"
            Permission = Get-ManifestBlockAttribute -Lines $component.Lines -AttributeName "permission"
        }
    }

    foreach ($component in $exportedComponents) {
        $allowed = $allowedExportedComponents | Where-Object {
            $_.Type -eq $component.Type -and
                $_.Name -eq $component.Name -and
                $_.Permission -eq $component.Permission
        } | Select-Object -First 1

        if (-not $allowed) {
            throw "Unexpected exported Android component: $($component.Type) $($component.Name) permission=$($component.Permission)"
        }
    }

    $launchActivity = $exportedComponents | Where-Object {
        $_.Type -eq "activity" -and $_.Name -eq $ExpectedLaunchActivity
    }
    if (@($launchActivity).Count -ne 1) {
        throw "Release APK manifest must expose exactly one launcher activity: $ExpectedLaunchActivity"
    }

    Write-Host "Release APK exported component audit: passed"
}

function Assert-ApkIdentity {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string[]]$Badging,
        [Parameter(Mandatory = $true)][string]$ExpectedPackage,
        [Parameter(Mandatory = $true)][string]$ExpectedVersionName,
        [Parameter(Mandatory = $true)][string]$ExpectedVersionCode,
        [Parameter(Mandatory = $true)][string]$ExpectedAppLabel,
        [Parameter(Mandatory = $true)][string]$ExpectedLaunchActivity,
        [Parameter(Mandatory = $true)][string]$RequiredAbi,
        [Parameter(Mandatory = $true)][string]$ExpectedMinSdk,
        [Parameter(Mandatory = $true)][string]$ExpectedTargetSdk,
        [Parameter(Mandatory = $true)][string]$ExpectedCompileSdk
    )

    $packageLine = $Badging | Where-Object { $_ -match "^package:" } | Select-Object -First 1
    if (-not $packageLine -or $packageLine -notmatch "name='([^']+)'") {
        throw "$Label package id was not found."
    }
    $actualPackage = $matches[1]
    if ($actualPackage -ne $ExpectedPackage) {
        throw "$Label package id does not match $ExpectedPackage."
    }

    if ($packageLine -notmatch "versionCode='([^']+)'") {
        throw "$Label versionCode was not found."
    }
    $actualVersionCode = $matches[1]
    if ($actualVersionCode -ne $ExpectedVersionCode) {
        throw "$Label versionCode does not match $ExpectedVersionCode."
    }

    if ($packageLine -notmatch "versionName='([^']+)'") {
        throw "$Label versionName was not found."
    }
    $actualVersionName = $matches[1]
    if ($actualVersionName -ne $ExpectedVersionName) {
        throw "$Label versionName does not match $ExpectedVersionName."
    }

    if ($packageLine -notmatch "compileSdkVersion='([^']+)'") {
        throw "$Label compileSdkVersion was not found."
    }
    $actualCompileSdk = $matches[1]
    if ($actualCompileSdk -ne $ExpectedCompileSdk) {
        throw "$Label compileSdkVersion does not match $ExpectedCompileSdk."
    }

    $minSdkLine = $Badging | Where-Object { $_ -match "^minSdkVersion:" } | Select-Object -First 1
    if (-not $minSdkLine -or $minSdkLine -notmatch "minSdkVersion:'([^']+)'") {
        throw "$Label minSdkVersion was not found."
    }
    $actualMinSdk = $matches[1]
    if ($actualMinSdk -ne $ExpectedMinSdk) {
        throw "$Label minSdkVersion does not match $ExpectedMinSdk."
    }

    $targetSdkLine = $Badging | Where-Object { $_ -match "^targetSdkVersion:" } | Select-Object -First 1
    if (-not $targetSdkLine -or $targetSdkLine -notmatch "targetSdkVersion:'([^']+)'") {
        throw "$Label targetSdkVersion was not found."
    }
    $actualTargetSdk = $matches[1]
    if ($actualTargetSdk -ne $ExpectedTargetSdk) {
        throw "$Label targetSdkVersion does not match $ExpectedTargetSdk."
    }

    $labelLine = $Badging | Where-Object { $_ -match "^application-label:" } | Select-Object -First 1
    if (-not $labelLine -or $labelLine -notmatch "^application-label:'([^']+)'") {
        throw "$Label application label was not found."
    }
    $actualAppLabel = $matches[1]
    if ($actualAppLabel -ne $ExpectedAppLabel) {
        throw "$Label application label does not match $ExpectedAppLabel."
    }

    $activityLine = $Badging | Where-Object { $_ -match "^launchable-activity:" } | Select-Object -First 1
    if (-not $activityLine -or $activityLine -notmatch "name='([^']+)'") {
        throw "$Label launchable activity was not found."
    }
    $actualLaunchActivity = $matches[1]
    if ($actualLaunchActivity -ne $ExpectedLaunchActivity) {
        throw "$Label launchable activity does not match $ExpectedLaunchActivity."
    }

    $nativeCodeLine = $Badging | Where-Object { $_ -match "^native-code:" } | Select-Object -First 1
    if (-not $nativeCodeLine -or $nativeCodeLine -notmatch "'$([System.Text.RegularExpressions.Regex]::Escape($RequiredAbi))'") {
        throw "$Label does not include required native ABI $RequiredAbi."
    }

    Write-Host "$Label identity audit: passed ($ExpectedPackage $ExpectedVersionName+$ExpectedVersionCode, min $ExpectedMinSdk, target $ExpectedTargetSdk, compile $ExpectedCompileSdk, $ExpectedAppLabel, $ExpectedLaunchActivity, $RequiredAbi)"
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

if ($setSigningEnv.Count -eq $signingEnvNames.Count) {
    $uploadStoreFile = [Environment]::GetEnvironmentVariable("MONEYKAI_UPLOAD_STORE_FILE")
    $resolvedStoreFile = [System.IO.Path]::GetFullPath($uploadStoreFile)
    if (-not (Test-Path -LiteralPath $resolvedStoreFile -PathType Leaf)) {
        throw "MONEYKAI_UPLOAD_STORE_FILE does not point to an existing keystore file: $resolvedStoreFile"
    }

    $storeFileItem = Get-Item -LiteralPath $resolvedStoreFile
    if ($storeFileItem.Length -le 0) {
        throw "MONEYKAI_UPLOAD_STORE_FILE points to an empty keystore file: $resolvedStoreFile"
    }

    $repoRoot = Get-RepositoryRoot
    if (Test-IsPathWithinDirectory -Path $resolvedStoreFile -Directory $repoRoot) {
        throw "MONEYKAI_UPLOAD_STORE_FILE must point outside the repository root: $repoRoot"
    }
}

$expectedVersion = Get-PubspecVersion
$expectedPackage = Get-GradleStringValue -Key "applicationId" -Path $androidBuildFile
$expectedNamespace = Get-GradleStringValue -Key "namespace" -Path $androidBuildFile
$expectedAppLabel = "MoneyKai"
$expectedLaunchActivity = "$expectedPackage.MainActivity"
$requiredAbi = "arm64-v8a"
$expectedMinSdk = "24"
$expectedTargetSdk = "36"
$expectedCompileSdk = "36"

if ($expectedNamespace -ne $expectedPackage) {
    throw "Android namespace '$expectedNamespace' does not match applicationId '$expectedPackage'."
}

Assert-SourceAndroidBackupHardening

$aapt2 = Resolve-AndroidBuildTool @("aapt2.exe", "aapt2")
$apkSigner = Resolve-AndroidBuildTool @("apksigner.bat", "apksigner")

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
$debugBadging = @(Get-ApkBadging -Aapt2 $aapt2 -ApkPath $debugApk)
$releaseBadging = @(Get-ApkBadging -Aapt2 $aapt2 -ApkPath $releaseApk)
$releaseManifest = @(Get-ApkManifest -Aapt2 $aapt2 -ApkPath $releaseApk)
Assert-ApkIdentity `
    -Label "Debug APK" `
    -Badging $debugBadging `
    -ExpectedPackage $expectedPackage `
    -ExpectedVersionName $expectedVersion.Name `
    -ExpectedVersionCode $expectedVersion.Code `
    -ExpectedAppLabel $expectedAppLabel `
    -ExpectedLaunchActivity $expectedLaunchActivity `
    -RequiredAbi $requiredAbi `
    -ExpectedMinSdk $expectedMinSdk `
    -ExpectedTargetSdk $expectedTargetSdk `
    -ExpectedCompileSdk $expectedCompileSdk
Assert-ApkIdentity `
    -Label "Release APK" `
    -Badging $releaseBadging `
    -ExpectedPackage $expectedPackage `
    -ExpectedVersionName $expectedVersion.Name `
    -ExpectedVersionCode $expectedVersion.Code `
    -ExpectedAppLabel $expectedAppLabel `
    -ExpectedLaunchActivity $expectedLaunchActivity `
    -RequiredAbi $requiredAbi `
    -ExpectedMinSdk $expectedMinSdk `
    -ExpectedTargetSdk $expectedTargetSdk `
    -ExpectedCompileSdk $expectedCompileSdk
Assert-AllowedPermissions `
    -Label "Debug APK" `
    -PermissionDump $debugPermissions `
    -ExpectedPackage $expectedPackage `
    -AllowInternet $true
Assert-AllowedPermissions `
    -Label "Release APK" `
    -PermissionDump $releasePermissions `
    -ExpectedPackage $expectedPackage `
    -AllowInternet $false
Assert-ReleaseManifestHardening -ManifestDump $releaseManifest -ExpectedLaunchActivity $expectedLaunchActivity
Assert-AabStructure -AabPath $releaseAab
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
    if ($setSigningEnv.Count -eq 0 -and $releaseApkSigning.Signed) {
        throw "Release APK is unexpectedly signed without MONEYKAI_UPLOAD_* variables."
    }

    if ($setSigningEnv.Count -eq 0 -and $releaseAabSigning.Signed) {
        throw "Release AAB is unexpectedly signed without MONEYKAI_UPLOAD_* variables."
    }

    $apkState = if ($releaseApkSigning.Signed) { "signed" } else { "unsigned inspection artifact" }
    $aabState = if ($releaseAabSigning.Signed) { "signed" } else { "unsigned inspection artifact" }
    Write-Host "Release APK signing state: $apkState"
    Write-Host "Release AAB signing state: $aabState"
    Write-Host "Use -RequireSigned after building with upload-key environment variables."
}
