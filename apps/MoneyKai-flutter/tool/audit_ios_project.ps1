param(
    [string]$ExpectedBundleId = "com.moneykai.mobile",
    [string]$ExpectedDisplayName = "MoneyKai",
    [Version]$MinimumIosDeploymentTarget = "13.0"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Join-ChildPath {
    param(
        [Parameter(Mandatory = $true)][string]$BasePath,
        [Parameter(Mandatory = $true)][string[]]$Children
    )

    $path = $BasePath
    foreach ($child in $Children) {
        $path = Join-Path $path $child
    }

    return $path
}

$appRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$iosRoot = Join-Path $appRoot "ios"
$pubspecPath = Join-Path $appRoot "pubspec.yaml"
$infoPlistPath = Join-ChildPath $iosRoot @("Runner", "Info.plist")
$projectPath = Join-ChildPath $iosRoot @("Runner.xcodeproj", "project.pbxproj")
$workspacePath = Join-ChildPath $iosRoot @("Runner.xcworkspace", "contents.xcworkspacedata")
$appDelegatePath = Join-ChildPath $iosRoot @("Runner", "AppDelegate.swift")
$sceneDelegatePath = Join-ChildPath $iosRoot @("Runner", "SceneDelegate.swift")
$appIconContentsPath = Join-ChildPath $iosRoot @("Runner", "Assets.xcassets", "AppIcon.appiconset", "Contents.json")
$launchImageContentsPath = Join-ChildPath $iosRoot @("Runner", "Assets.xcassets", "LaunchImage.imageset", "Contents.json")

function Assert-FileExists {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Missing required file: $Path"
    }
}

function Assert-DirectoryExists {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
        throw "Missing required directory: $Path"
    }
}

function Assert-Equal {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [AllowNull()][string]$Actual,
        [Parameter(Mandatory = $true)][string]$Expected
    )

    if ($Actual -ne $Expected) {
        throw "$Label expected '$Expected' but found '$Actual'."
    }
}

function Get-PlistValue {
    param(
        [Parameter(Mandatory = $true)][xml]$Plist,
        [Parameter(Mandatory = $true)][string]$Key
    )

    $dictChildren = @($Plist.DocumentElement.dict.ChildNodes)
    for ($index = 0; $index -lt $dictChildren.Count; $index++) {
        if ($dictChildren[$index].Name -eq "key" -and $dictChildren[$index].InnerText -eq $Key) {
            if ($index + 1 -ge $dictChildren.Count) {
                return $null
            }

            return $dictChildren[$index + 1].InnerText
        }
    }

    return $null
}

function Assert-AssetFile {
    param(
        [Parameter(Mandatory = $true)][string]$AssetSetDir,
        [Parameter(Mandatory = $true)][string]$FileName
    )

    $assetPath = Join-Path $AssetSetDir $FileName
    Assert-FileExists $assetPath

    $item = Get-Item -LiteralPath $assetPath
    if ($item.Length -le 0) {
        throw "Asset file is empty: $assetPath"
    }
}

Assert-DirectoryExists $iosRoot
Assert-FileExists $pubspecPath
Assert-FileExists $infoPlistPath
Assert-FileExists $projectPath
Assert-FileExists $workspacePath
Assert-FileExists $appDelegatePath
Assert-FileExists $sceneDelegatePath
Assert-FileExists $appIconContentsPath
Assert-FileExists $launchImageContentsPath

$pubspecText = Get-Content -LiteralPath $pubspecPath -Raw
$pubspecVersionMatch = [regex]::Match($pubspecText, "(?m)^version:\s*(?<version>\S+)\s*$")
if (-not $pubspecVersionMatch.Success) {
    throw "pubspec.yaml does not define a version."
}

$plist = [xml](Get-Content -LiteralPath $infoPlistPath -Raw)
Assert-Equal "CFBundleDisplayName" (Get-PlistValue -Plist $plist -Key "CFBundleDisplayName") $ExpectedDisplayName
Assert-Equal "CFBundleName" (Get-PlistValue -Plist $plist -Key "CFBundleName") $ExpectedDisplayName
Assert-Equal "CFBundleIdentifier" (Get-PlistValue -Plist $plist -Key "CFBundleIdentifier") '$(PRODUCT_BUNDLE_IDENTIFIER)'
Assert-Equal "CFBundleShortVersionString" (Get-PlistValue -Plist $plist -Key "CFBundleShortVersionString") '$(FLUTTER_BUILD_NAME)'
Assert-Equal "CFBundleVersion" (Get-PlistValue -Plist $plist -Key "CFBundleVersion") '$(FLUTTER_BUILD_NUMBER)'
Assert-Equal "UILaunchStoryboardName" (Get-PlistValue -Plist $plist -Key "UILaunchStoryboardName") "LaunchScreen"

$sensitivePermissionKeys = @(
    "NSCameraUsageDescription",
    "NSMicrophoneUsageDescription",
    "NSLocationWhenInUseUsageDescription",
    "NSLocationAlwaysAndWhenInUseUsageDescription",
    "NSContactsUsageDescription",
    "NSPhotoLibraryUsageDescription"
)

foreach ($key in $sensitivePermissionKeys) {
    $value = Get-PlistValue -Plist $plist -Key $key
    if ($null -ne $value) {
        throw "Unexpected iOS sensitive permission key present: $key"
    }
}

if ($null -ne (Get-PlistValue -Plist $plist -Key "UIBackgroundModes")) {
    throw "Unexpected UIBackgroundModes entry present."
}

$projectText = Get-Content -LiteralPath $projectPath -Raw
$bundleMatches = [regex]::Matches($projectText, "PRODUCT_BUNDLE_IDENTIFIER\s*=\s*([^;]+);")
$runnerBundleIds = @(@(
    foreach ($match in $bundleMatches) {
        $value = $match.Groups[1].Value.Trim()
        if ($value -notlike "*.RunnerTests") {
            $value
        }
    }
) | Select-Object -Unique)

if ($runnerBundleIds.Count -ne 1 -or $runnerBundleIds[0] -ne $ExpectedBundleId) {
    throw "Runner PRODUCT_BUNDLE_IDENTIFIER must be '$ExpectedBundleId'; found: $($runnerBundleIds -join ', ')"
}

$deploymentMatches = [regex]::Matches($projectText, "IPHONEOS_DEPLOYMENT_TARGET\s*=\s*([^;]+);")
if ($deploymentMatches.Count -eq 0) {
    throw "No IPHONEOS_DEPLOYMENT_TARGET values found."
}

foreach ($match in $deploymentMatches) {
    $target = [Version]($match.Groups[1].Value.Trim())
    if ($target -lt $MinimumIosDeploymentTarget) {
        throw "IPHONEOS_DEPLOYMENT_TARGET $target is below required minimum $MinimumIosDeploymentTarget."
    }
}

$appIconDir = Split-Path -Parent $appIconContentsPath
$appIconManifest = Get-Content -LiteralPath $appIconContentsPath -Raw | ConvertFrom-Json
$appIconFiles = @(@($appIconManifest.images | Where-Object { $_.filename } | ForEach-Object { $_.filename }) | Select-Object -Unique)
if (-not ($appIconFiles -contains "Icon-App-1024x1024@1x.png")) {
    throw "App icon set is missing the 1024x1024 marketing icon."
}

foreach ($fileName in $appIconFiles) {
    Assert-AssetFile -AssetSetDir $appIconDir -FileName $fileName
}

$launchImageDir = Split-Path -Parent $launchImageContentsPath
$launchImageManifest = Get-Content -LiteralPath $launchImageContentsPath -Raw | ConvertFrom-Json
$launchImageFiles = @(@($launchImageManifest.images | Where-Object { $_.filename } | ForEach-Object { $_.filename }) | Select-Object -Unique)
foreach ($fileName in @("LaunchImage.png", "LaunchImage@2x.png", "LaunchImage@3x.png")) {
    if (-not ($launchImageFiles -contains $fileName)) {
        throw "Launch image set is missing $fileName."
    }

    Assert-AssetFile -AssetSetDir $launchImageDir -FileName $fileName
}

$forbiddenAndroidOnlyDependencies = @(
    "telephony",
    "another_telephony",
    "flutter_sms_inbox",
    "notification_listener_service",
    "android_intent_plus",
    "webview_flutter_android"
)

foreach ($dependencyName in $forbiddenAndroidOnlyDependencies) {
    if ($pubspecText -match "(?m)^\s{2}$([regex]::Escape($dependencyName))\s*:") {
        throw "Android-only dependency is not allowed in the shared iOS-ready app: $dependencyName"
    }
}

Write-Host "MoneyKai iOS static project audit"
Write-Host "App root: $appRoot"
Write-Host "Bundle id: $ExpectedBundleId"
Write-Host "Display name: $ExpectedDisplayName"
Write-Host "Flutter version: $($pubspecVersionMatch.Groups['version'].Value)"
Write-Host "Deployment targets: $((@($deploymentMatches | ForEach-Object { $_.Groups[1].Value.Trim() }) | Select-Object -Unique) -join ', ')"
Write-Host "App icon files: $($appIconFiles.Count)"
Write-Host "Launch image files: $($launchImageFiles.Count)"
Write-Host "Sensitive iOS permissions: none declared"
Write-Host "Android-only dependency audit: passed"
