param(
    [string]$DeviceId,
    [string]$ApkPath = "build/app/outputs/flutter-apk/app-debug.apk",
    [string]$AabPath = "build/app/outputs/bundle/release/app-release.aab",
    [string]$ApksPath = "../../.codex-artifacts/play-preupload/moneykai-release-physical.apks",
    [ValidateSet("Apk", "Aab", "Apks")]
    [string]$InstallMode = "Apk",
    [string]$BundletoolPath,
    [string]$ExpectedAabSha256,
    [string]$ExpectedInstallerPackage,
    [string[]]$ExpectedUiText = @("MoneyKai"),
    [string]$OutputDir = "../../.codex-artifacts",
    [switch]$Install,
    [switch]$ClearAppData,
    [switch]$RequirePhysical,
    [switch]$SkipLogcatCrashCheck,
    [int]$MonkeyEvents = 0,
    [int]$MaxLaunchTotalMs = 5000,
    [int]$MaxLaunchWaitMs = 6000
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$packageName = "com.moneykai.mobile"
$mainActivity = "com.moneykai.mobile/.MainActivity"
$appRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$resolvedApkPath = [System.IO.Path]::GetFullPath((Join-Path $appRoot $ApkPath))
$resolvedAabPath = [System.IO.Path]::GetFullPath((Join-Path $appRoot $AabPath))
$resolvedApksPath = [System.IO.Path]::GetFullPath((Join-Path $appRoot $ApksPath))
$resolvedOutputDir = [System.IO.Path]::GetFullPath((Join-Path $appRoot $OutputDir))
$pubspecPath = Join-Path $appRoot "pubspec.yaml"

if ($MaxLaunchTotalMs -le 0) {
    throw "MaxLaunchTotalMs must be greater than zero."
}

if ($MaxLaunchWaitMs -le 0) {
    throw "MaxLaunchWaitMs must be greater than zero."
}

if ($MonkeyEvents -lt 0) {
    throw "MonkeyEvents must be zero or greater."
}

function Resolve-Adb {
    $candidates = @(
        "adb",
        $(if ($env:ANDROID_HOME) { Join-Path $env:ANDROID_HOME "platform-tools/adb.exe" }),
        $(if ($env:ANDROID_HOME) { Join-Path $env:ANDROID_HOME "platform-tools/adb" }),
        $(if ($env:ANDROID_SDK_ROOT) { Join-Path $env:ANDROID_SDK_ROOT "platform-tools/adb.exe" }),
        $(if ($env:ANDROID_SDK_ROOT) { Join-Path $env:ANDROID_SDK_ROOT "platform-tools/adb" }),
        "D:\Android\Sdk\platform-tools\adb.exe",
        $(if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe" })
    ) | Where-Object { $_ }

    foreach ($candidate in $candidates) {
        $command = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($command) {
            return $command.Source
        }

        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    throw "Could not find adb. Add Android platform-tools to PATH or set ANDROID_HOME."
}

function Resolve-Java {
    $candidates = @(
        $(if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME "bin/java.exe" }),
        $(if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME "bin/java" }),
        "java"
    ) | Where-Object { $_ }

    foreach ($candidate in $candidates) {
        $command = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($command) {
            return $command.Source
        }

        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    throw "Could not find java. Add Java to PATH or set JAVA_HOME."
}

function Resolve-Bundletool {
    if ($BundletoolPath) {
        $resolved = if ([System.IO.Path]::IsPathRooted($BundletoolPath)) {
            [System.IO.Path]::GetFullPath($BundletoolPath)
        } else {
            [System.IO.Path]::GetFullPath((Join-Path $appRoot $BundletoolPath))
        }
        if (-not (Test-Path -LiteralPath $resolved)) {
            $resolved = [System.IO.Path]::GetFullPath($BundletoolPath)
        }

        if (-not (Test-Path -LiteralPath $resolved)) {
            throw "Bundletool was not found at: $BundletoolPath"
        }

        if ([System.IO.Path]::GetExtension($resolved) -eq ".jar") {
            return [pscustomobject]@{
                Mode = "Jar"
                Command = Resolve-Java
                Jar = $resolved
                Display = "java -jar $resolved"
            }
        }

        return [pscustomobject]@{
            Mode = "Executable"
            Command = $resolved
            Jar = $null
            Display = $resolved
        }
    }

    foreach ($candidate in @("bundletool", "bundletool.bat")) {
        $command = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($command) {
            return [pscustomobject]@{
                Mode = "Executable"
                Command = $command.Source
                Jar = $null
                Display = $command.Source
            }
        }
    }

    throw "Could not find bundletool. Add bundletool to PATH or pass -BundletoolPath C:\path\to\bundletool.jar."
}

function Invoke-Bundletool {
    param(
        [Parameter(Mandatory = $true)]$Bundletool,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )

    if ($Bundletool.Mode -eq "Jar") {
        $output = & $Bundletool.Command -jar $Bundletool.Jar @Arguments
    } else {
        $output = & $Bundletool.Command @Arguments
    }

    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "bundletool $($Arguments -join ' ') failed with exit code $exitCode."
    }

    return $output
}

function Invoke-Adb {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

    $adbArguments = @()
    if ($script:SelectedDeviceId) {
        $adbArguments += @("-s", $script:SelectedDeviceId)
    }
    $adbArguments += $Arguments

    $output = & $script:Adb @adbArguments
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "adb $($Arguments -join ' ') failed with exit code $exitCode."
    }

    return $output
}

function Invoke-AdbAllowFailure {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

    $adbArguments = @()
    if ($script:SelectedDeviceId) {
        $adbArguments += @("-s", $script:SelectedDeviceId)
    }
    $adbArguments += $Arguments

    $oldErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        $output = & $script:Adb @adbArguments 2>&1
        return [pscustomobject]@{
            ExitCode = $LASTEXITCODE
            Output = @($output)
        }
    } finally {
        $ErrorActionPreference = $oldErrorActionPreference
    }
}

function Invoke-AdbBinaryOutput {
    param(
        [Parameter(Mandatory = $true)][string]$OutputPath,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )

    $adbArguments = @()
    if ($script:SelectedDeviceId) {
        $adbArguments += @("-s", $script:SelectedDeviceId)
    }
    $adbArguments += $Arguments

    $process = Start-Process `
        -FilePath $script:Adb `
        -ArgumentList $adbArguments `
        -NoNewWindow `
        -PassThru `
        -Wait `
        -RedirectStandardOutput $OutputPath

    if ($process.ExitCode -ne 0) {
        throw "adb $($Arguments -join ' ') failed with exit code $($process.ExitCode)."
    }
}

function Get-ConnectedDevices {
    $lines = & $script:Adb devices
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "adb devices failed with exit code $exitCode."
    }

    $devices = @()
    foreach ($line in $lines) {
        if ($line -match "^(\S+)\s+device$") {
            $devices += $matches[1]
        }
    }
    return $devices
}

function Get-DeviceProp {
    param([Parameter(Mandatory = $true)][string]$Name)

    $value = Invoke-Adb shell getprop $Name
    return (($value -join "`n").Trim())
}

function Get-PubspecVersion {
    $versionLine = Get-Content -LiteralPath $pubspecPath |
        Where-Object { $_ -match "^\s*version:\s*(\S+)\s*$" } |
        Select-Object -First 1

    if (-not $versionLine -or $versionLine -notmatch "^\s*version:\s*([^+]+)\+(\d+)\s*$") {
        throw "Could not read Flutter versionName+versionCode from $pubspecPath."
    }

    return [pscustomobject]@{
        Name = $matches[1]
        Code = $matches[2]
    }
}

function Assert-NonEmptyFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Description
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "$Description was not created: $Path"
    }

    $file = Get-Item -LiteralPath $Path
    if ($file.Length -le 0) {
        throw "$Description is empty: $Path"
    }
}

function Assert-ArtifactHash {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$ExpectedSha256
    )

    $actualSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash
    if ($actualSha256 -ne $ExpectedSha256.ToUpperInvariant()) {
        throw "Artifact SHA-256 mismatch for $Path. Expected $ExpectedSha256 but found $actualSha256."
    }
}

function Assert-PngFile {
    param([Parameter(Mandatory = $true)][string]$Path)

    Assert-NonEmptyFile -Path $Path -Description "Screenshot PNG"

    $expectedSignature = [byte[]](0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
    $buffer = New-Object byte[] $expectedSignature.Length
    $stream = [System.IO.File]::OpenRead($Path)
    try {
        $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
    } finally {
        $stream.Dispose()
    }

    if ($bytesRead -ne $expectedSignature.Length) {
        throw "Screenshot PNG is too short: $Path"
    }

    for ($i = 0; $i -lt $expectedSignature.Length; $i++) {
        if ($buffer[$i] -ne $expectedSignature[$i]) {
            throw "Screenshot is not a valid PNG file: $Path"
        }
    }
}

function Assert-WindowContainsExpectedText {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string[]]$Text
    )

    if ($Text.Count -eq 0) {
        return
    }

    $content = Get-Content -Raw -LiteralPath $Path
    foreach ($expected in $Text) {
        if ([string]::IsNullOrWhiteSpace($expected)) {
            continue
        }

        $escaped = [System.Text.RegularExpressions.Regex]::Escape($expected)
        if ($content -notmatch "($escaped|text=`"$escaped`"|content-desc=`"$escaped`")") {
            throw "Window hierarchy does not include expected UI text/content description: $expected"
        }
    }
}

function Assert-LaunchOutput {
    param(
        [Parameter(Mandatory = $true)][string[]]$Output,
        [Parameter(Mandatory = $true)][int]$MaxTotalMs,
        [Parameter(Mandatory = $true)][int]$MaxWaitMs
    )

    $joinedOutput = $Output -join "`n"
    if ($joinedOutput -notmatch "(?m)^Status:\s*ok\s*$") {
        throw "Android launch did not report Status: ok."
    }

    $metrics = [ordered]@{}
    if ($joinedOutput -match "(?m)^ThisTime:\s*(\d+)\s*$") {
        $metrics["ThisTime"] = [int]$matches[1]
    } else {
        $metrics["ThisTime"] = $null
    }

    foreach ($metricName in @("TotalTime", "WaitTime")) {
        if ($joinedOutput -notmatch "(?m)^${metricName}:\s*(\d+)\s*$") {
            throw "Android launch timing output is incomplete; missing $metricName."
        }

        $metrics[$metricName] = [int]$matches[1]
    }

    if ($metrics["TotalTime"] -gt $MaxTotalMs) {
        throw "Android launch TotalTime $($metrics["TotalTime"]) ms exceeds limit $MaxTotalMs ms."
    }

    if ($metrics["WaitTime"] -gt $MaxWaitMs) {
        throw "Android launch WaitTime $($metrics["WaitTime"]) ms exceeds limit $MaxWaitMs ms."
    }

    return [pscustomobject]$metrics
}

function Assert-FocusedActivity {
    param(
        [Parameter(Mandatory = $true)][string[]]$Output,
        [Parameter(Mandatory = $true)][string]$ExpectedPackage
    )

    $joinedOutput = $Output -join "`n"
    $escapedPackage = [System.Text.RegularExpressions.Regex]::Escape($ExpectedPackage)
    if ($joinedOutput -notmatch $escapedPackage) {
        throw "Focused activity evidence does not include package $ExpectedPackage."
    }
}

function Assert-WindowHierarchy {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$ExpectedPackage
    )

    Assert-NonEmptyFile -Path $Path -Description "Window hierarchy"

    $content = Get-Content -Raw -LiteralPath $Path
    if ($content -notmatch "<hierarchy") {
        throw "Window hierarchy XML is malformed: $Path"
    }

    $escapedPackage = [System.Text.RegularExpressions.Regex]::Escape($ExpectedPackage)
    if ($content -notmatch "package=`"$escapedPackage`"") {
        throw "Window hierarchy does not include package $ExpectedPackage."
    }
}

function Assert-InstalledPackageEvidence {
    param(
        [Parameter(Mandatory = $true)][string[]]$Output,
        [Parameter(Mandatory = $true)][string]$ExpectedPackage,
        [Parameter(Mandatory = $true)][string]$ExpectedVersionName,
        [Parameter(Mandatory = $true)][string]$ExpectedVersionCode,
        [string]$ExpectedInstaller
    )

    $joinedOutput = $Output -join "`n"
    $escapedPackage = [System.Text.RegularExpressions.Regex]::Escape($ExpectedPackage)
    if ($joinedOutput -notmatch "Package \[$escapedPackage\]") {
        throw "Installed package evidence does not include $ExpectedPackage."
    }

    if ($joinedOutput -notmatch "versionName=$([System.Text.RegularExpressions.Regex]::Escape($ExpectedVersionName))") {
        throw "Installed package versionName does not match $ExpectedVersionName."
    }

    if ($joinedOutput -notmatch "versionCode=$([System.Text.RegularExpressions.Regex]::Escape($ExpectedVersionCode))") {
        throw "Installed package versionCode does not match $ExpectedVersionCode."
    }

    if ($ExpectedInstaller) {
        $escapedInstaller = [System.Text.RegularExpressions.Regex]::Escape($ExpectedInstaller)
        if ($joinedOutput -notmatch "installerPackageName=$escapedInstaller" -and $joinedOutput -notmatch "installerPackage=$escapedInstaller") {
            throw "Installed package does not report expected installer package $ExpectedInstaller."
        }
    }
}

function Assert-LogcatHasNoRuntimeCrash {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$ExpectedPackage
    )

    Assert-NonEmptyFile -Path $Path -Description "Launch logcat"

    $content = Get-Content -Raw -LiteralPath $Path
    $escapedPackage = [System.Text.RegularExpressions.Regex]::Escape($ExpectedPackage)
    $patterns = @(
        "FATAL EXCEPTION[\s\S]{0,2000}$escapedPackage",
        "AndroidRuntime[\s\S]{0,2000}$escapedPackage",
        "ANR in $escapedPackage",
        "am_crash[\s\S]{0,500}$escapedPackage"
    )

    foreach ($pattern in $patterns) {
        if ($content -match $pattern) {
            throw "Launch logcat contains MoneyKai crash/ANR evidence matching: $pattern"
        }
    }
}

function Assert-MonkeyOutput {
    param([Parameter(Mandatory = $true)][string[]]$Output)

    $joinedOutput = $Output -join "`n"
    if ($joinedOutput -match "\*\* (CRASH|ANR):" -or $joinedOutput -match "Monkey aborted") {
        throw "Monkey smoke output contains crash/ANR evidence."
    }
}

function Format-EvidenceArtifact {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string]$Path
    )

    Assert-NonEmptyFile -Path $Path -Description $Label
    $file = Get-Item -LiteralPath $Path
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash

    return "- ${Label}: $Path ($($file.Length) bytes, SHA-256 $hash)"
}

$script:Adb = Resolve-Adb
$devices = @(Get-ConnectedDevices)

if ($DeviceId) {
    if ($devices -notcontains $DeviceId) {
        throw "Requested device '$DeviceId' is not connected. Connected devices: $($devices -join ', ')"
    }
    $script:SelectedDeviceId = $DeviceId
} elseif ($devices.Count -eq 1) {
    $script:SelectedDeviceId = $devices[0]
} elseif ($devices.Count -eq 0) {
    throw "No connected Android device. Connect a physical device or launch MoneyKai_API_36, then rerun this script."
} else {
    throw "Multiple Android devices connected. Pass -DeviceId. Connected devices: $($devices -join ', ')"
}

$isEmulator = $script:SelectedDeviceId -like "emulator-*"
$qemu = Get-DeviceProp "ro.kernel.qemu"
if ($qemu -eq "1") {
    $isEmulator = $true
}

if ($RequirePhysical -and $isEmulator) {
    throw "Connected device '$script:SelectedDeviceId' is an emulator. Connect a physical Android device or omit -RequirePhysical."
}

New-Item -ItemType Directory -Force -Path $resolvedOutputDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$prefix = "moneykai-runtime-$timestamp"
$summaryPath = Join-Path $resolvedOutputDir "$prefix-summary.md"
$windowPath = Join-Path $resolvedOutputDir "$prefix-window.xml"
$screenshotPath = Join-Path $resolvedOutputDir "$prefix-screen.png"
$launchPath = Join-Path $resolvedOutputDir "$prefix-launch.txt"
$propsPath = Join-Path $resolvedOutputDir "$prefix-device.txt"
$packagePath = Join-Path $resolvedOutputDir "$prefix-package.txt"
$focusPath = Join-Path $resolvedOutputDir "$prefix-focus.txt"
$logcatPath = Join-Path $resolvedOutputDir "$prefix-logcat.txt"
$monkeyPath = Join-Path $resolvedOutputDir "$prefix-monkey.txt"

$expectedVersion = Get-PubspecVersion
$bundletool = $null

if ($ExpectedAabSha256) {
    if (-not (Test-Path -LiteralPath $resolvedAabPath)) {
        throw "ExpectedAabSha256 was provided, but AAB was not found: $resolvedAabPath"
    }
    Assert-ArtifactHash -Path $resolvedAabPath -ExpectedSha256 $ExpectedAabSha256
}

if ($Install) {
    if ($InstallMode -eq "Apk") {
        if (-not (Test-Path -LiteralPath $resolvedApkPath)) {
            throw "APK not found: $resolvedApkPath"
        }
        Invoke-Adb install -r $resolvedApkPath
    } elseif ($InstallMode -eq "Aab") {
        if (-not (Test-Path -LiteralPath $resolvedAabPath)) {
            throw "AAB not found: $resolvedAabPath"
        }

        $apksDirectory = [System.IO.Path]::GetDirectoryName($resolvedApksPath)
        New-Item -ItemType Directory -Force -Path $apksDirectory | Out-Null
        $bundletool = Resolve-Bundletool
        Invoke-Bundletool $bundletool validate "--bundle=$resolvedAabPath" | Out-Null
        Invoke-Bundletool $bundletool build-apks "--bundle=$resolvedAabPath" "--output=$resolvedApksPath" "--connected-device" "--device-id=$script:SelectedDeviceId" "--overwrite" | Out-Null
        Invoke-Bundletool $bundletool install-apks "--apks=$resolvedApksPath" "--device-id=$script:SelectedDeviceId" | Out-Null
    } elseif ($InstallMode -eq "Apks") {
        if (-not (Test-Path -LiteralPath $resolvedApksPath)) {
            throw "APK set not found: $resolvedApksPath"
        }

        $bundletool = Resolve-Bundletool
        Invoke-Bundletool $bundletool install-apks "--apks=$resolvedApksPath" "--device-id=$script:SelectedDeviceId" | Out-Null
    }
}

if ($ClearAppData) {
    Invoke-Adb shell pm clear $packageName
}

$deviceProps = [ordered]@{
    DeviceId = $script:SelectedDeviceId
    IsEmulator = $isEmulator
    Manufacturer = Get-DeviceProp "ro.product.manufacturer"
    Model = Get-DeviceProp "ro.product.model"
    AndroidRelease = Get-DeviceProp "ro.build.version.release"
    AndroidSdk = Get-DeviceProp "ro.build.version.sdk"
    BuildFingerprint = Get-DeviceProp "ro.build.fingerprint"
}

$deviceProps.GetEnumerator() | ForEach-Object { "$($_.Key): $($_.Value)" } |
    Set-Content -LiteralPath $propsPath -Encoding UTF8

Invoke-AdbAllowFailure logcat "-c" | Out-Null
Invoke-Adb shell am force-stop $packageName | Out-Null
$launchOutput = Invoke-Adb shell am start "-W" "-n" $mainActivity
$launchMetrics = Assert-LaunchOutput `
    -Output $launchOutput `
    -MaxTotalMs $MaxLaunchTotalMs `
    -MaxWaitMs $MaxLaunchWaitMs
$launchOutput | Set-Content -LiteralPath $launchPath -Encoding UTF8

Start-Sleep -Seconds 3
Invoke-Adb shell uiautomator dump /sdcard/moneykai-runtime-window.xml | Out-Null
Invoke-Adb pull /sdcard/moneykai-runtime-window.xml $windowPath | Out-Null
Invoke-AdbBinaryOutput -OutputPath $screenshotPath exec-out screencap "-p"
$packageEvidence = @()
$packageEvidence += "Expected package: $packageName"
$packageEvidence += "Expected version: $($expectedVersion.Name)+$($expectedVersion.Code)"
$packageEvidence += ""
$packageEvidence += "## dumpsys package"
$packageEvidence += Invoke-Adb shell dumpsys package $packageName
$packageEvidence += ""
$packageEvidence += "## package paths"
$packageEvidence += (Invoke-AdbAllowFailure shell cmd package path $packageName).Output
$packageEvidence += ""
$packageEvidence += "## package installer"
$packageEvidence += (Invoke-AdbAllowFailure shell cmd package list packages "-i" $packageName).Output
$packageEvidence | Set-Content -LiteralPath $packagePath -Encoding UTF8
$focusOutput = Invoke-Adb shell dumpsys window
$focusOutput | Set-Content -LiteralPath $focusPath -Encoding UTF8
Invoke-AdbAllowFailure logcat "-d" "-v" "time" | ForEach-Object { $_.Output } | Set-Content -LiteralPath $logcatPath -Encoding UTF8

if ($MonkeyEvents -gt 0) {
    $monkeyOutput = Invoke-Adb shell monkey "-p" $packageName "-v" $MonkeyEvents
    $monkeyOutput | Set-Content -LiteralPath $monkeyPath -Encoding UTF8
    Assert-MonkeyOutput -Output $monkeyOutput
}

Assert-WindowHierarchy -Path $windowPath -ExpectedPackage $packageName
Assert-WindowContainsExpectedText -Path $windowPath -Text $ExpectedUiText
Assert-PngFile -Path $screenshotPath
Assert-NonEmptyFile -Path $launchPath -Description "Launch timing"
Assert-NonEmptyFile -Path $propsPath -Description "Device properties"
Assert-NonEmptyFile -Path $packagePath -Description "Installed package evidence"
Assert-NonEmptyFile -Path $focusPath -Description "Focused activity evidence"
Assert-InstalledPackageEvidence `
    -Output $packageEvidence `
    -ExpectedPackage $packageName `
    -ExpectedVersionName $expectedVersion.Name `
    -ExpectedVersionCode $expectedVersion.Code `
    -ExpectedInstaller $ExpectedInstallerPackage
Assert-FocusedActivity -Output $focusOutput -ExpectedPackage $packageName

if (-not $SkipLogcatCrashCheck) {
    Assert-LogcatHasNoRuntimeCrash -Path $logcatPath -ExpectedPackage $packageName
}

$installSummary = if ($Install) { "$InstallMode install requested" } else { "No install requested; smoke tested the already-installed app" }
$installerSummary = if ($ExpectedInstallerPackage) { "$ExpectedInstallerPackage required and verified" } else { "Recorded; no installer package required" }
$logcatSummary = if ($SkipLogcatCrashCheck) { "Skipped by -SkipLogcatCrashCheck" } else { "No MoneyKai crash/ANR patterns found after launch" }
$artifactLines = @()
if (Test-Path -LiteralPath $resolvedAabPath) {
    $artifactLines += (Format-EvidenceArtifact -Label "Release AAB candidate" -Path $resolvedAabPath)
}
if (Test-Path -LiteralPath $resolvedApksPath) {
    $artifactLines += (Format-EvidenceArtifact -Label "Bundle-generated APK set" -Path $resolvedApksPath)
}
if ($InstallMode -eq "Apk" -and (Test-Path -LiteralPath $resolvedApkPath)) {
    $artifactLines += (Format-EvidenceArtifact -Label "Installed APK candidate" -Path $resolvedApkPath)
}
if ($artifactLines.Count -eq 0) {
    $artifactLines += "- No local install artifact metadata was available for this run."
}

$summary = @(
    "# MoneyKai Android Runtime QA Evidence",
    "",
    "Captured: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') local time",
    "Scope: physical-device/internal-test smoke evidence for `com.moneykai.mobile`.",
    "",
    "## Release Candidate",
    "",
    "- Install mode: $installSummary",
    "- Expected app version: $($expectedVersion.Name)+$($expectedVersion.Code)",
    "- Expected AAB SHA-256: $(if ($ExpectedAabSha256) { $ExpectedAabSha256.ToUpperInvariant() } else { 'not enforced by this run' })",
    "- Installer package: $installerSummary",
    "- Logcat crash check: $logcatSummary",
    "- Expected UI text/content: $(if ($ExpectedUiText.Count -eq 0) { 'not enforced by this run' } else { $ExpectedUiText -join ', ' })",
    "",
    "### Local Artifact Metadata",
    "",
    ($artifactLines -join "`n"),
    "",
    "## Device",
    "",
    "- Device ID: $($deviceProps.DeviceId)",
    "- Emulator: $($deviceProps.IsEmulator)",
    "- Manufacturer: $($deviceProps.Manufacturer)",
    "- Model: $($deviceProps.Model)",
    "- Android: $($deviceProps.AndroidRelease) / SDK $($deviceProps.AndroidSdk)",
    "",
    "## Launch Timing",
    "",
    "- ThisTime: $(if ($null -eq $launchMetrics.ThisTime) { 'not reported by this Android build' } else { "$($launchMetrics.ThisTime) ms" })",
    "- TotalTime: $($launchMetrics.TotalTime) ms (limit: $MaxLaunchTotalMs ms)",
    "- WaitTime: $($launchMetrics.WaitTime) ms (limit: $MaxLaunchWaitMs ms)",
    "",
    '```text',
    ($launchOutput -join "`n"),
    '```',
    "",
    "## Installed Package",
    "",
    "- Package: $packageName",
    "- Version: $($expectedVersion.Name)+$($expectedVersion.Code)",
    "- Focused activity evidence: package present in `dumpsys window` output",
    "",
    "## Smoke Results",
    "",
    "- Window hierarchy package check: passed",
    "- Expected UI text/content check: passed",
    "- Screenshot PNG signature check: passed",
    "- Launch logcat crash/ANR check: $logcatSummary",
    "- Monkey smoke: $(if ($MonkeyEvents -gt 0) { "$MonkeyEvents events passed" } else { 'not requested' })",
    "",
    "## Artifacts",
    "",
    (Format-EvidenceArtifact -Label "Window hierarchy" -Path $windowPath),
    (Format-EvidenceArtifact -Label "Screenshot" -Path $screenshotPath),
    (Format-EvidenceArtifact -Label "Launch timing" -Path $launchPath),
    (Format-EvidenceArtifact -Label "Device properties" -Path $propsPath),
    (Format-EvidenceArtifact -Label "Installed package evidence" -Path $packagePath),
    (Format-EvidenceArtifact -Label "Focused activity evidence" -Path $focusPath),
    (Format-EvidenceArtifact -Label "Launch logcat" -Path $logcatPath),
    $(if ($MonkeyEvents -gt 0) { Format-EvidenceArtifact -Label "Monkey smoke" -Path $monkeyPath }),
    "",
    "## Manual Checks Still Required",
    "",
    "- Inspect the screenshot for correct first-frame rendering.",
    "- Run TalkBack spoken-output QA manually.",
    "- If this was not installed from Play internal testing, repeat after installing from the Play opt-in link and pass `-ExpectedInstallerPackage com.android.vending`."
)

$summary | Set-Content -LiteralPath $summaryPath -Encoding UTF8

Write-Host "MoneyKai Android runtime QA evidence captured."
Write-Host "Summary: $summaryPath"
Write-Host "Screenshot: $screenshotPath"
Write-Host "Window hierarchy: $windowPath"
