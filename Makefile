# MoneyKai project helpers

.DEFAULT_GOAL := start

.PHONY: start web ios android install lint typecheck clean setup

# Start the Expo dev server with hot reloading.
# Expo already handles live reload/hot refresh, so no extra watcher is required.
start:
	npm.cmd run start

# Open the app in the browser.
web:
	npm.cmd run web

# Open the app in an Android emulator/device.
android:
	npm.cmd run android

# Open the app in an iOS simulator.
ios:
	npm.cmd run ios

# Install dependencies for a fresh checkout.
install:
	npm.cmd install

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
	@if exist web-build rmdir /s /q web-build
	@if exist dist rmdir /s /q dist
	@if exist coverage rmdir /s /q coverage
	@if exist .eslintcache del /q .eslintcache


