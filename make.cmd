@echo off
setlocal

if "%~1"=="" (
  npm.cmd run mobile:start
  exit /b %errorlevel%
)

if /I "%~1"=="start" (
  npm.cmd run mobile:start
) else if /I "%~1"=="web" (
  npm.cmd run web:start
) else if /I "%~1"=="mobile" (
  npm.cmd run mobile:start
) else if /I "%~1"=="android" (
  npm.cmd run mobile:android
) else if /I "%~1"=="ios" (
  npm.cmd run mobile:ios
) else if /I "%~1"=="lint" (
  npm.cmd run lint
) else if /I "%~1"=="typecheck" (
  npm.cmd run typecheck
) else if /I "%~1"=="install" (
  npm.cmd run install
) else if /I "%~1"=="clean" (
  if exist .expo rmdir /s /q .expo
  if exist .expo-shared rmdir /s /q .expo-shared
  if exist apps\MoneyKai-mobile\.expo rmdir /s /q apps\MoneyKai-mobile\.expo
  if exist apps\MoneyKai-mobile\.expo-shared rmdir /s /q apps\MoneyKai-mobile\.expo-shared
  if exist apps\MoneyKai-mobile\web-build rmdir /s /q apps\MoneyKai-mobile\web-build
  if exist apps\MoneyKai-mobile\dist rmdir /s /q apps\MoneyKai-mobile\dist
  if exist apps\MoneyKai-web\.expo rmdir /s /q apps\MoneyKai-web\.expo
  if exist apps\MoneyKai-web\.expo-shared rmdir /s /q apps\MoneyKai-web\.expo-shared
  if exist apps\MoneyKai-web\web-build rmdir /s /q apps\MoneyKai-web\web-build
  if exist apps\MoneyKai-web\dist rmdir /s /q apps\MoneyKai-web\dist
  if exist web-build rmdir /s /q web-build
  if exist dist rmdir /s /q dist
  if exist coverage rmdir /s /q coverage
  if exist .eslintcache del /q .eslintcache
) else (
  echo Usage: make [start^|web^|mobile^|android^|ios^|install^|lint^|typecheck^|clean]
  exit /b 1
)

endlocal
