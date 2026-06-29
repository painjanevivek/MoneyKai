param(
    [string]$DeviceId,
    [string]$ApkPath = "build/app/outputs/flutter-apk/app-debug.apk",
    [string]$OutputDir = "../../.codex-artifacts",
    [switch]$Install,
    [switch]$ClearAppData,
    [switch]$RequirePhysical
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$packageName = "com.moneykai.mobile"
$mainActivity = "com.moneykai.mobile/.MainActivity"
$appRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$resolvedApkPath = [System.IO.Path]::GetFullPath((Join-Path $appRoot $ApkPath))
$resolvedOutputDir = [System.IO.Path]::GetFullPath((Join-Path $appRoot $OutputDir))

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

function Invoke-Adb {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

    $adbArguments = @()
    if ($script:SelectedDeviceId) {
        $adbArguments += @("-s", $script:SelectedDeviceId)
    }
    $adbArguments += $Arguments

    & $script:Adb @adbArguments
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

if ($Install) {
    if (-not (Test-Path -LiteralPath $resolvedApkPath)) {
        throw "APK not found: $resolvedApkPath"
    }
    Invoke-Adb install -r $resolvedApkPath
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

Invoke-Adb shell am force-stop $packageName | Out-Null
$launchOutput = Invoke-Adb shell am start -W -n $mainActivity
$launchOutput | Set-Content -LiteralPath $launchPath -Encoding UTF8

Start-Sleep -Seconds 3
Invoke-Adb shell uiautomator dump /sdcard/moneykai-runtime-window.xml | Out-Null
Invoke-Adb pull /sdcard/moneykai-runtime-window.xml $windowPath | Out-Null
Invoke-AdbBinaryOutput -OutputPath $screenshotPath exec-out screencap -p

$summary = @(
    "# MoneyKai Android Runtime QA Evidence",
    "",
    "Captured: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') local time",
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
    '```text',
    ($launchOutput -join "`n"),
    '```',
    "",
    "## Artifacts",
    "",
    "- Window hierarchy: $windowPath",
    "- Screenshot: $screenshotPath",
    "- Launch timing: $launchPath",
    "- Device properties: $propsPath",
    "",
    "## Manual Checks Still Required",
    "",
    "- Inspect the screenshot for correct first-frame rendering.",
    "- Run TalkBack spoken-output QA manually.",
    "- Repeat on a physical Android device with `-RequirePhysical` before Play Store internal testing."
)

$summary | Set-Content -LiteralPath $summaryPath -Encoding UTF8

Write-Host "MoneyKai Android runtime QA evidence captured."
Write-Host "Summary: $summaryPath"
Write-Host "Screenshot: $screenshotPath"
Write-Host "Window hierarchy: $windowPath"
