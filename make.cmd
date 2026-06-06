@echo off
setlocal

if "%~1"=="" (
  npm.cmd run start
  exit /b %errorlevel%
)

if /I "%~1"=="start" (
  npm.cmd run start
) else if /I "%~1"=="web" (
  npm.cmd run web
) else if /I "%~1"=="android" (
  npm.cmd run android
) else if /I "%~1"=="ios" (
  npm.cmd run ios
) else if /I "%~1"=="lint" (
  npm.cmd run lint
) else if /I "%~1"=="typecheck" (
  npm.cmd run typecheck
) else if /I "%~1"=="install" (
  npm.cmd install
) else if /I "%~1"=="clean" (
  if exist .expo rmdir /s /q .expo
  if exist .expo-shared rmdir /s /q .expo-shared
  if exist web-build rmdir /s /q web-build
  if exist dist rmdir /s /q dist
  if exist coverage rmdir /s /q coverage
  if exist .eslintcache del /q .eslintcache
) else (
  echo Usage: make [start^|web^|android^|ios^|install^|lint^|typecheck^|clean]
  exit /b 1
)

endlocal
