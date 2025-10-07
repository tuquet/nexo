# Testing Guide for Supabase Authentication

This document outlines the testing strategy and setup for the Supabase authentication feature.

## Test Structure

```
src/
├── lib/supabase/
│   ├── __tests__/
│   │   ├── auth.test.ts          # Service layer tests
│   │   ├── client.test.ts        # Client configuration tests
│   │   └── errors.test.ts        # Error handling tests
│   └── store/
│       └── __tests__/
│           └── auth-supabase.test.ts  # Store tests
```

## Test Setup

### 1. Install Testing Dependencies

```bash
pnpm add -D vitest @vitest/ui jsdom
pnpm add -D @vue/test-utils
```

### 2. Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '#': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3. Test Setup File

```typescript
// src/test/setup.ts
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
  },
  writable: true,
});

// Mock console.error to avoid noise in tests
global.console.error = vi.fn();
global.console.warn = vi.fn();
```

## Unit Tests Examples

### Auth Service Tests

```typescript
// src/lib/supabase/__tests__/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseAuthService } from '../auth';

// Mock the client
vi.mock('../client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      // ... other methods
    },
  },
}));

describe('SupabaseAuthService', () => {
  let authService: SupabaseAuthService;

  beforeEach(() => {
    authService = new SupabaseAuthService();
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      // Test implementation
    });

    it('should handle invalid credentials', async () => {
      // Test implementation
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      // Test implementation
    });
  });
});
```

### Store Tests

```typescript
// src/store/__tests__/auth-supabase.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSupabaseAuthStore } from '../auth-supabase';

// Mock the auth service
vi.mock('#/lib/supabase', () => ({
  authService: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    // ... other methods
  },
}));

describe('Supabase Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const store = useSupabaseAuthStore();

    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
    expect(store.session).toBeNull();
  });

  it('should handle successful login', async () => {
    const store = useSupabaseAuthStore();

    // Mock successful login
    const mockResult = {
      success: true,
      session: { access_token: 'token' },
      user: { id: '1', email: 'test@example.com' },
    };

    // Test login
    const result = await store.signIn('test@example.com', 'password');
    expect(result.success).toBe(true);
  });
});
```

## Integration Tests

### Authentication Flow Tests

```typescript
// src/test/integration/auth-flow.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SupabaseLogin from '@/views/_core/authentication/supabase/supabase-login.vue';

describe('Authentication Flow Integration', () => {
  it('should complete login flow', async () => {
    const wrapper = mount(SupabaseLogin);

    // Fill form
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('input[type="password"]').setValue('password');

    // Submit form
    await wrapper.find('form').trigger('submit');

    // Verify expectations
    expect(wrapper.emitted('login')).toBeTruthy();
  });

  it('should handle login errors', async () => {
    // Test error scenarios
  });
});
```

## E2E Tests (Playwright)

### Setup

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### E2E Test Examples

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Supabase Authentication', () => {
  test('should login with email and password', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle magic link authentication', async ({ page }) => {
    await page.goto('/auth/login');

    // Switch to magic link tab
    await page.click('[data-testid="magic-link-tab"]');

    // Fill email
    await page.fill('[data-testid="magic-email-input"]', 'test@example.com');

    // Submit
    await page.click('[data-testid="magic-link-button"]');

    // Verify success message
    await expect(page.locator('.ant-notification-notice')).toContainText(
      'Magic link sent',
    );
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    // ... login steps ...

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Verify redirect to login
    await expect(page).toHaveURL('/auth/login');
  });
});
```

## Test Utilities

### Mock Factories

```typescript
// src/test/factories/auth.ts
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  ...overrides,
});

export const createMockSession = (overrides = {}) => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600000,
  user: createMockUser(),
  ...overrides,
});

export const createMockAuthResponse = (success = true, overrides = {}) => {
  if (success) {
    return {
      success: true,
      session: createMockSession(),
      user: createMockUser(),
      userInfo: {
        userId: 'user-1',
        username: 'test@example.com',
        realName: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        roles: ['user'],
      },
      ...overrides,
    };
  }

  return {
    success: false,
    error: 'Authentication failed',
    ...overrides,
  };
};
```

### Test Helpers

```typescript
// src/test/helpers/auth.ts
import { useSupabaseAuthStore } from '@/store/auth-supabase';
import { createMockSession, createMockUser } from '../factories/auth';

export const loginTestUser = async () => {
  const store = useSupabaseAuthStore();
  const mockUser = createMockUser();
  const mockSession = createMockSession({ user: mockUser });

  store.setUser(mockUser);
  store.setSession(mockSession);

  return { user: mockUser, session: mockSession };
};

export const logoutTestUser = () => {
  const store = useSupabaseAuthStore();
  store.clearAuth();
};
```

## Running Tests

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test auth.test.ts

# Run tests in watch mode
pnpm test --watch

# Run with coverage
pnpm test --coverage
```

### E2E Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run in headed mode
pnpm test:e2e --headed

# Run specific test
pnpm test:e2e auth.spec.ts
```

## Test Coverage Goals

- **Unit Tests**: 90%+ coverage for service and store layers
- **Integration Tests**: Cover all authentication flows
- **E2E Tests**: Cover critical user journeys

### Coverage Areas

✅ **Service Layer**:

- All authentication methods
- Error handling scenarios
- Session management
- localStorage operations

✅ **Store Layer**:

- State management
- VBen integration
- Smart user detection
- Error propagation

✅ **Component Layer**:

- Form validation
- User interactions
- Loading states
- Error display

✅ **Integration**:

- Complete auth flows
- Router integration
- Cross-tab synchronization

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test --coverage

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

This testing strategy ensures comprehensive coverage and confidence in the Supabase authentication system.
