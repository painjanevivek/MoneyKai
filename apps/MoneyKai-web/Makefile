# MoneyKai website helpers

.DEFAULT_GOAL := start

.PHONY: start web lint typecheck build install clean setup

start:
	npm.cmd run start

web:
	npm.cmd run web

lint:
	npm.cmd run lint

typecheck:
	npm.cmd run typecheck

build:
	npm.cmd run build

install:
	npm.cmd install

setup: install lint typecheck build

clean:
	@if exist .expo rmdir /s /q .expo
	@if exist .expo-shared rmdir /s /q .expo-shared
	@if exist dist rmdir /s /q dist
	@if exist web-build rmdir /s /q web-build
	@if exist coverage rmdir /s /q coverage
	@if exist .eslintcache del /q .eslintcache
