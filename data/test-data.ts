import { ENV } from '../utils/env';

export const USERS = {
  standard: {
    email: ENV.TEST_USER_EMAIL,
    password: ENV.TEST_USER_PASSWORD,
    name: 'Test User',
  },
  admin: {
    email: ENV.TEST_ADMIN_EMAIL,
    password: ENV.TEST_ADMIN_PASSWORD,
    name: 'Admin User',
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'WrongPassword',
  },
};

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    me: '/auth/me',
  },
  users: {
    list: '/users',
    detail: (id: string | number) => `/users/${id}`,
  },
};

export const MESSAGES = {
  auth: {
    invalidCredentials: 'Invalid credentials',
    loginSuccess: 'Login successful',
  },
  general: {
    notFound: 'Not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
  },
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
