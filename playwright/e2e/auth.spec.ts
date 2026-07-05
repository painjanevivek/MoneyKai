import { test, expect, type Page } from '@playwright/test';
import { resetMoneyKaiState } from '../support/moneykai';

const googleUnsafeReturnUser = {
  uid: 'google-unsafe-return-user',
  email: 'unsafe.return@moneykai.test',
  displayName: 'Unsafe Return User',
  photoUrl: 'https://example.test/unsafe-return.png',
};

const createMockFirebaseIdToken = (uid: string, email: string, displayName: string, photoUrl: string) => {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

  return [
    encode({ alg: 'RS256', typ: 'JWT' }),
    encode({
      iss: 'https://securetoken.google.com/placeholder-project',
      aud: 'placeholder-project',
      auth_time: now,
      iat: now,
      exp: now + 3600,
      sub: uid,
      user_id: uid,
      email,
      email_verified: true,
      name: displayName,
      picture: photoUrl,
      firebase: { sign_in_provider: 'custom' },
    }),
    'mock-signature',
  ].join('.');
};

const mockFirebaseCustomTokenSignIn = async (page: Page, googleUser = googleUnsafeReturnUser) => {
  const mockIdToken = createMockFirebaseIdToken(
    googleUser.uid,
    googleUser.email,
    googleUser.displayName,
    googleUser.photoUrl,
  );

  await page.route('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'identitytoolkit#VerifyCustomTokenResponse',
        idToken: mockIdToken,
        refreshToken: 'mock-google-refresh-token',
        expiresIn: '3600',
        isNewUser: false,
        localId: googleUser.uid,
        email: googleUser.email,
        displayName: googleUser.displayName,
        photoUrl: googleUser.photoUrl,
      }),
    });
  });

  await page.route('https://identitytoolkit.googleapis.com/v1/accounts:lookup**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'identitytoolkit#GetAccountInfoResponse',
        users: [
          {
            localId: googleUser.uid,
            email: googleUser.email,
            emailVerified: true,
            displayName: googleUser.displayName,
            photoUrl: googleUser.photoUrl,
            providerUserInfo: [
              {
                providerId: 'google.com',
                rawId: googleUser.uid,
                email: googleUser.email,
                displayName: googleUser.displayName,
                photoUrl: googleUser.photoUrl,
              },
            ],
          },
        ],
      }),
    });
  });
};

test.describe('MoneyKai auth journeys', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await resetMoneyKaiState(page);
  });

  test('login validation shows required and malformed credential errors', async ({ page }) => {
    await page.goto('/login');

    await page.getByTestId('login-submit').click();

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();

    await page.getByTestId('login-email').fill('not-an-email');
    await page.getByTestId('login-password').fill('short');
    await page.getByTestId('login-submit').click();

    await expect(page.getByText('Enter a valid email')).toBeVisible();
    await expect(page.getByText('Minimum 6 characters')).toBeVisible();
  });

  test('signup validation covers required fields and password mismatch', async ({ page }) => {
    await page.goto('/signup');

    await page.getByTestId('signup-submit').click();

    await expect(page.getByText('First name must be at least 2 characters')).toBeVisible();
    await expect(page.getByText('Enter a valid email')).toBeVisible();
    await expect(page.getByText('Minimum 8 characters')).toBeVisible();

    await page.getByTestId('signup-first-name').fill('Kai');
    await page.getByTestId('signup-surname').fill('Tester');
    await page.getByTestId('signup-email').fill('kai@example.com');
    await page.getByTestId('signup-password').fill('Password123!');
    await page.getByTestId('signup-confirm-password').fill('Password123?');
    await page.getByTestId('signup-submit').click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('protected dashboard redirects signed-out users to login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('Google login starts through the same-origin web auth route', async ({ page }) => {
    const legacyBackendCalls: string[] = [];
    const authStartCalls: string[] = [];

    await page.route('http://localhost:8000/**', async (route) => {
      legacyBackendCalls.push(route.request().url());
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'legacy backend route should not be used first' }),
      });
    });

    await page.route('**/api/v1/auth/google/start', async (route) => {
      authStartCalls.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authorizationUrl: new URL('/auth/google/callback?error=Mocked%20Google%20failure', page.url()).toString(),
        }),
      });
    });

    await page.goto('/login');
    await page.getByTestId('login-google').click();

    await expect(page).toHaveURL(/\/auth\/google\/callback/);
    await expect(page.getByText('Google sign-in failed')).toBeVisible();
    expect(authStartCalls).toHaveLength(1);
    expect(legacyBackendCalls).toEqual([]);
  });

  test('Google login falls back to Firebase popup when the gateway route is missing', async ({ page }) => {
    const firebaseAuthCalls: string[] = [];

    await page.route('**/api/v1/auth/google/start', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: '404', message: 'The page could not be found' } }),
      });
    });

    await page.route('http://localhost:8000/v1/auth/google/start', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: '404', message: 'The page could not be found' } }),
      });
    });

    await page.route('https://identitytoolkit.googleapis.com/**', async (route) => {
      firebaseAuthCalls.push(route.request().url());
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 400,
            message: 'OPERATION_NOT_ALLOWED',
            errors: [{ message: 'OPERATION_NOT_ALLOWED' }],
          },
        }),
      });
    });

    await page.goto('/login');
    await page.getByTestId('login-google').click();

    await expect(page.getByRole('alert')).toContainText(
      'Google sign-in is not configured for this deployment yet. Check the Firebase Google provider and authorized domains, then try again.'
    );
    expect(firebaseAuthCalls.some((url) => url.includes('accounts:createAuthUri'))).toBe(true);
    await expect(page.getByText('Please check your details and try again.')).toBeHidden();
  });

  test('Google callback shows provider errors without exchanging a code', async ({ page }) => {
    const exchangeRequests: string[] = [];

    await page.route('**/api/v1/auth/google/exchange', async (route) => {
      exchangeRequests.push(route.request().url());
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Exchange should not run for provider errors' }),
      });
    });

    await page.goto('/auth/google/callback?error=access_denied');

    await expect(page.getByText('Google sign-in failed')).toBeVisible();
    await expect(page.getByText('access_denied')).toBeVisible();
    await page.getByText('Back to sign in').click();
    await expect(page).toHaveURL(/\/login$/);
    expect(exchangeRequests).toEqual([]);
  });

  test('Google callback rejects missing codes before calling the gateway', async ({ page }) => {
    const exchangeRequests: string[] = [];

    await page.route('**/api/v1/auth/google/exchange', async (route) => {
      exchangeRequests.push(route.request().url());
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Exchange should not run without a code' }),
      });
    });

    await page.goto('/auth/google/callback');

    await expect(page.getByText('Google sign-in failed')).toBeVisible();
    await expect(page.getByText('Google sign-in did not return a usable sign-in code.')).toBeVisible();
    expect(exchangeRequests).toEqual([]);
  });

  test('Google callback surfaces gateway exchange failures without storing a session', async ({ page }) => {
    const exchangeRequests: Array<{ url: string; body: unknown }> = [];

    await page.route('**/api/v1/auth/google/exchange', async (route) => {
      exchangeRequests.push({
        url: route.request().url(),
        body: route.request().postDataJSON(),
      });
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Google sign-in code has already been used.' }),
      });
    });

    await page.goto('/auth/google/callback?code=replayed-google-code');

    await expect(page.getByText('Google sign-in failed')).toBeVisible();
    await expect(page.getByText('Google sign-in code has already been used.')).toBeVisible();
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem('moneykai-auth');
          return raw ? JSON.parse(raw).state : null;
        })
      )
      .not.toMatchObject({ isAuthenticated: true });
    expect(exchangeRequests).toEqual([
      {
        url: expect.stringContaining('/api/v1/auth/google/exchange'),
        body: { code: 'replayed-google-code' },
      },
    ]);
  });

  test('Google callback exchanges the code, stores the session, and redirects after login', async ({ page }) => {
    const legacyBackendCalls: string[] = [];
    const exchangeRequests: Array<{ url: string; body: unknown }> = [];
    const firebaseTokenRequests: Array<{ url: string; body: unknown }> = [];
    const firebaseLookupRequests: Array<{ url: string; body: unknown }> = [];
    const googleUser = {
      uid: 'google-e2e-user',
      email: 'google.e2e@moneykai.test',
      displayName: 'Google E2E User',
      photoUrl: 'https://example.test/google-e2e.png',
    };
    const mockIdToken = createMockFirebaseIdToken(
      googleUser.uid,
      googleUser.email,
      googleUser.displayName,
      googleUser.photoUrl,
    );

    await page.route('http://localhost:8000/**', async (route) => {
      legacyBackendCalls.push(route.request().url());
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'legacy backend route should not be used first' }),
      });
    });

    await page.route('**/api/v1/auth/google/exchange', async (route) => {
      exchangeRequests.push({
        url: route.request().url(),
        body: route.request().postDataJSON(),
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          customToken: 'mock-google-custom-token',
          returnTo: '/settings',
        }),
      });
    });

    await page.route('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken**', async (route) => {
      firebaseTokenRequests.push({
        url: route.request().url(),
        body: route.request().postDataJSON(),
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kind: 'identitytoolkit#VerifyCustomTokenResponse',
          idToken: mockIdToken,
          refreshToken: 'mock-google-refresh-token',
          expiresIn: '3600',
          isNewUser: false,
          localId: googleUser.uid,
          email: googleUser.email,
          displayName: googleUser.displayName,
          photoUrl: googleUser.photoUrl,
        }),
      });
    });

    await page.route('https://identitytoolkit.googleapis.com/v1/accounts:lookup**', async (route) => {
      firebaseLookupRequests.push({
        url: route.request().url(),
        body: route.request().postDataJSON(),
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kind: 'identitytoolkit#GetAccountInfoResponse',
          users: [
            {
              localId: googleUser.uid,
              email: googleUser.email,
              emailVerified: true,
              displayName: googleUser.displayName,
              photoUrl: googleUser.photoUrl,
              providerUserInfo: [
                {
                  providerId: 'google.com',
                  rawId: googleUser.uid,
                  email: googleUser.email,
                  displayName: googleUser.displayName,
                  photoUrl: googleUser.photoUrl,
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto('/auth/google/callback?code=mock-google-code');

    await expect(page).toHaveURL(/\/settings$/);
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem('moneykai-auth');
          return raw ? JSON.parse(raw).state : null;
        })
      )
      .toMatchObject({
        isAuthenticated: true,
        user: {
          id: googleUser.uid,
          email: googleUser.email,
          full_name: googleUser.displayName,
          avatar_url: googleUser.photoUrl,
          auth_provider: 'google',
        },
      });

    expect(exchangeRequests).toEqual([
      {
        url: expect.stringContaining('/api/v1/auth/google/exchange'),
        body: { code: 'mock-google-code' },
      },
    ]);
    expect(firebaseTokenRequests).toEqual([
      {
        url: expect.stringContaining('/accounts:signInWithCustomToken'),
        body: {
          token: 'mock-google-custom-token',
          returnSecureToken: true,
        },
      },
    ]);
    expect(firebaseLookupRequests).toEqual([
      {
        url: expect.stringContaining('/accounts:lookup'),
        body: { idToken: mockIdToken },
      },
    ]);
    expect(legacyBackendCalls).toEqual([]);
  });

  test('Google callback falls back to the dashboard for unsafe gateway return paths', async ({ page }) => {
    const exchangeRequests: Array<{ url: string; body: unknown }> = [];

    await mockFirebaseCustomTokenSignIn(page);

    await page.route('**/api/v1/auth/google/exchange', async (route) => {
      exchangeRequests.push({
        url: route.request().url(),
        body: route.request().postDataJSON(),
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          customToken: 'mock-google-custom-token',
          returnTo: '/%0Aevil.example',
        }),
      });
    });

    await page.goto('/auth/google/callback?code=unsafe-return-code');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem('moneykai-auth');
          return raw ? JSON.parse(raw).state : null;
        })
      )
      .toMatchObject({
        isAuthenticated: true,
        user: {
          id: googleUnsafeReturnUser.uid,
          email: googleUnsafeReturnUser.email,
          full_name: googleUnsafeReturnUser.displayName,
          avatar_url: googleUnsafeReturnUser.photoUrl,
          auth_provider: 'google',
        },
      });
    expect(exchangeRequests).toEqual([
      {
        url: expect.stringContaining('/api/v1/auth/google/exchange'),
        body: { code: 'unsafe-return-code' },
      },
    ]);
  });
});
