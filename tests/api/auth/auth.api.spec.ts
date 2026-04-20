import { test, expect } from '../../../fixtures';
import { USERS, API_ENDPOINTS, HTTP_STATUS } from '../../../data/test-data';

test.describe('Auth API', () => {
  test('POST /auth/login — should return token with valid credentials', async ({ apiClient }) => {
    const response = await apiClient.post(API_ENDPOINTS.auth.login, {
      email: USERS.standard.email,
      password: USERS.standard.password,
    });

    expect(response.status()).toBe(HTTP_STATUS.OK);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
  });

  test('POST /auth/login — should return 401 with invalid credentials', async ({ apiClient }) => {
    const response = await apiClient.post(API_ENDPOINTS.auth.login, {
      email: USERS.invalid.email,
      password: USERS.invalid.password,
    });

    expect(response.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('POST /auth/login — should return 400 with missing fields', async ({ apiClient }) => {
    const response = await apiClient.post(API_ENDPOINTS.auth.login, {});
    expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNAUTHORIZED]).toContain(response.status());
  });

  test('GET /auth/me — should return user profile when authenticated', async ({ authenticatedApiClient }) => {
    const response = await authenticatedApiClient.get(API_ENDPOINTS.auth.me);

    expect(response.status()).toBe(HTTP_STATUS.OK);
    const body = await response.json();
    expect(body).toHaveProperty('email');
  });

  test('GET /auth/me — should return 401 when not authenticated', async ({ apiClient }) => {
    const response = await apiClient.get(API_ENDPOINTS.auth.me);
    expect(response.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });
});
