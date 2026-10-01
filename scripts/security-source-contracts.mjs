/** Source-level regression evidence; this does not replace runtime auth tests. */
export function hasExactMobileGoogleCallback(source) {
  if (source.includes('moneykai-mobile://auth/google')) return true;
  return [
    'const isGoogleOAuthCallback',
    'new URL(url)',
    "parsed.protocol === 'moneykai-mobile:'",
    "parsed.hostname === 'auth'",
    "parsed.pathname === '/google'",
    'if (!isGoogleOAuthCallback(url))',
  ].every(snippet => source.includes(snippet));
}
