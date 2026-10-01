import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountDeletionPanel } from './AccountDeletionPanel';
const state = vi.hoisted(() => {
  let cursor = 0; let slots: unknown[] = [];
  return {
    authenticated: true, hydrating: false, configured: true, deleteAccount: vi.fn(),
    reset: () => { cursor = 0; slots = []; },
    render: <T,>(fn: () => T): T => { cursor = 0; return fn(); },
    useState: (initial: unknown) => { const index = cursor++; if (!(index in slots)) slots[index] = initial;
      return [slots[index], (next: unknown) => { slots[index] = next; }]; },
    useRef: (initial: unknown) => { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
  };
});
vi.mock('react', async original => ({ ...await original<typeof React>(), useState: state.useState, useRef: state.useRef }));
vi.mock('react-native', () => ({ View: 'view', Text: 'text', Pressable: 'pressable', Dimensions: { get: () => ({ width: 360, height: 800 }) } }));
vi.mock('expo-router', () => ({ Link: 'link' }));
vi.mock('@/components/marketing/PublicShell', () => ({ SectionCard: 'card' }));
vi.mock('@/components/ui/Input', () => ({ Input: 'input' }));
vi.mock('@/hooks/useTheme', () => ({ useTheme: () => ({ colors: {} }) }));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: (select: (s: unknown) => unknown) => select({ user: { id: 'owner', email: 'owner@example.test' }, isAuthenticated: state.authenticated, isHydratingSession: state.hydrating }) }));
vi.mock('@/services/backendApi', () => ({ isBackendConfigured: () => state.configured }));
vi.mock('@/services/accountDeletion', () => ({ deleteConfirmedAccount: state.deleteAccount }));

function nodes(tree: any): any[] {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
const panel = () => state.render(AccountDeletionPanel);
function form() {
  const child = nodes(panel()).find(node => node.props?.ownerId === 'owner');
  state.reset();
  const completed = vi.fn();
  const render = () => state.render(() => child.type({ ...child.props, onComplete: completed }));
  const button = () => nodes(render()).find(node => node.props?.accessibilityRole === 'button');
  const input = () => nodes(render()).find(node => node.props?.label === 'Type DELETE to confirm');
  return { render, button, input, completed };
}
describe('deletion panel interaction contract (mocked hooks; not a live deletion)', () => {
  beforeEach(() => { state.reset(); state.authenticated = true; state.hydrating = false; state.configured = true; state.deleteAccount.mockReset(); });
  it('offers sign-in when signed out and does not run a deletion on render', () => {
    state.authenticated = false;
    expect(nodes(panel()).find(node => node.props?.href === '/login')).toBeTruthy();
    expect(state.deleteAccount).not.toHaveBeenCalled();
  });
  it('has no destructive action while session hydration is pending', () => {
    state.hydrating = true;
    expect(nodes(panel()).some(node => node.props?.ownerId)).toBe(false);
  });
  it('requires exact DELETE and respects unavailable backend', () => {
    const f = form(); expect(f.button().props.disabled).toBe(true);
    f.input().props.onChangeText('delete'); expect(f.button().props.disabled).toBe(true);
    f.input().props.onChangeText('DELETE'); expect(f.button().props.disabled).toBe(false);
    state.configured = false; expect(f.button().props.disabled).toBe(true);
    f.button().props.onPress(); expect(state.deleteAccount).not.toHaveBeenCalled();
  });
  it('blocks repeated presses while busy and retains the idempotency key on retry', async () => {
    let reject!: (reason: Error) => void;
    state.deleteAccount.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
    const f = form(); f.input().props.onChangeText('DELETE');
    const click = f.button().props.onPress; click(); click();
    expect(state.deleteAccount).toHaveBeenCalledOnce();
    expect(f.button().props.accessibilityState.busy).toBe(true);
    expect(f.input().props.editable).toBe(false);
    reject(new Error('Not confirmed')); await new Promise(resolve => setTimeout(resolve, 0));
    expect(nodes(f.render()).find(node => node.props?.accessibilityRole === 'alert')?.props.children).toBe('Not confirmed');
    expect(f.completed).not.toHaveBeenCalled();
    state.deleteAccount.mockResolvedValueOnce({ localSessionCleared: true });
    f.button().props.onPress(); await new Promise(resolve => setTimeout(resolve, 0));
    expect(state.deleteAccount.mock.calls[1][2]).toBe(state.deleteAccount.mock.calls[0][2]);
    expect(f.completed).toHaveBeenCalledWith({ localSessionCleared: true });
  });
});
