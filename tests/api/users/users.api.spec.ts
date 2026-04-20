import { test, expect } from '../../../fixtures';
import { API_ENDPOINTS, HTTP_STATUS } from '../../../data/test-data';
import { randomEmail } from '../../../utils/helpers';

test.describe('Users API', () => {
  test('GET /users — should return list of users when authenticated', async ({ authenticatedApiClient }) => {
    const response = await authenticatedApiClient.get(API_ENDPOINTS.users.list);

    expect(response.status()).toBe(HTTP_STATUS.OK);
    const body = await response.json();
    expect(Array.isArray(body) || Array.isArray(body.data)).toBeTruthy();
  });

  test('GET /users — should return 401 when not authenticated', async ({ apiClient }) => {
    const response = await apiClient.get(API_ENDPOINTS.users.list);
    expect(response.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('GET /users/:id — should return user by ID', async ({ authenticatedApiClient }) => {
    // First get the list to find a valid ID
    const listResponse = await authenticatedApiClient.get(API_ENDPOINTS.users.list);
    expect(listResponse.status()).toBe(HTTP_STATUS.OK);

    const body = await listResponse.json();
    const users = Array.isArray(body) ? body : body.data;

    if (!users || users.length === 0) {
      test.skip(true, 'No users available to test GET by ID');
      return;
    }

    const userId = users[0].id;
    const userResponse = await authenticatedApiClient.get(API_ENDPOINTS.users.detail(userId));

    expect(userResponse.status()).toBe(HTTP_STATUS.OK);
    const user = await userResponse.json();
    expect(user.id).toBe(userId);
  });

  test('GET /users/:id — should return 404 for non-existent user', async ({ authenticatedApiClient }) => {
    const response = await authenticatedApiClient.get(API_ENDPOINTS.users.detail(999999));
    expect(response.status()).toBe(HTTP_STATUS.NOT_FOUND);
  });
});
