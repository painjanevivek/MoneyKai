$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot'
$env:ANDROID_HOME = 'C:\Users\ASUS\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:EXPO_PUBLIC_DEMO_MODE = 'true'
$env:PATH = "$env:JAVA_HOME\bin;C:\Users\ASUS\AppData\Local\Android\Sdk\platform-tools;C:\Users\ASUS\AppData\Local\Android\Sdk\cmdline-tools\latest\bin;C:\Users\ASUS\AppData\Local\Android\Sdk\emulator;$env:PATH"

Set-Location 'D:\Work\Project\MoneyKai\apps\MoneyKai-mobile'
npx.cmd expo start --dev-client --host lan --port 8081
