# MoneyKai project helpers

.DEFAULT_GOAL := start

.PHONY: start web ios android backend server install lint typecheck clean setup

# Start the Expo dev server with hot reloading.
# Expo already handles live reload/hot refresh, so no extra watcher is required.
start:
	npm.cmd run mobile:start

# Start the FastAPI backend server in development mode.
backend:
	npm.cmd run backend:dev

# Alias for starting the backend server.
server: backend

# Open the app in the browser.
web:
	npm.cmd run web:start

# Open the app in an Android emulator/device.
android:
	npm.cmd run mobile:android

# Open the app in an iOS simulator.
ios:
	npm.cmd run mobile:ios

# Install dependencies for a fresh checkout.
install:
	npm.cmd run install

# Run lint checks.
lint:
	npm.cmd run lint

# Run TypeScript type checking.
typecheck:
	npm.cmd run typecheck

# Recommended setup for first-time use: install dependencies and verify tooling.
setup: install lint typecheck

# Remove Expo and build caches plus local generated artifacts.
clean:
	@if exist .expo rmdir /s /q .expo
	@if exist .expo-shared rmdir /s /q .expo-shared
	@if exist apps\MoneyKai-mobile\.expo rmdir /s /q apps\MoneyKai-mobile\.expo
	@if exist apps\MoneyKai-mobile\.expo-shared rmdir /s /q apps\MoneyKai-mobile\.expo-shared
	@if exist apps\MoneyKai-mobile\web-build rmdir /s /q apps\MoneyKai-mobile\web-build
	@if exist apps\MoneyKai-mobile\dist rmdir /s /q apps\MoneyKai-mobile\dist
	@if exist apps\MoneyKai-web\.expo rmdir /s /q apps\MoneyKai-web\.expo
	@if exist apps\MoneyKai-web\.expo-shared rmdir /s /q apps\MoneyKai-web\.expo-shared
	@if exist apps\MoneyKai-web\web-build rmdir /s /q apps\MoneyKai-web\web-build
	@if exist apps\MoneyKai-web\dist rmdir /s /q apps\MoneyKai-web\dist
	@if exist web-build rmdir /s /q web-build
	@if exist dist rmdir /s /q dist
	@if exist coverage rmdir /s /q coverage
	@if exist .eslintcache del /q .eslintcache


