import { APIRequestContext, APIResponse } from '@playwright/test';
import { ENV } from './env';

export class ApiClient {
  private request: APIRequestContext;
  private baseURL: string;
  private authToken: string | undefined;

  constructor(request: APIRequestContext, baseURL: string = ENV.API_URL) {
    this.request = request;
    this.baseURL = baseURL;
    this.authToken = ENV.API_AUTH_TOKEN || undefined;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extra,
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  async get(endpoint: string, params?: Record<string, string>): Promise<APIResponse> {
    return this.request.get(`${this.baseURL}${endpoint}`, {
      headers: this.buildHeaders(),
      params,
    });
  }

  async post(endpoint: string, body?: unknown): Promise<APIResponse> {
    return this.request.post(`${this.baseURL}${endpoint}`, {
      headers: this.buildHeaders(),
      data: body,
    });
  }

  async put(endpoint: string, body?: unknown): Promise<APIResponse> {
    return this.request.put(`${this.baseURL}${endpoint}`, {
      headers: this.buildHeaders(),
      data: body,
    });
  }

  async patch(endpoint: string, body?: unknown): Promise<APIResponse> {
    return this.request.patch(`${this.baseURL}${endpoint}`, {
      headers: this.buildHeaders(),
      data: body,
    });
  }

  async delete(endpoint: string): Promise<APIResponse> {
    return this.request.delete(`${this.baseURL}${endpoint}`, {
      headers: this.buildHeaders(),
    });
  }

  async login(email: string, password: string): Promise<string> {
    const response = await this.post('/auth/login', { email, password });
    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
    }
    const body = await response.json();
    const token = body.token ?? body.access_token ?? body.accessToken;
    if (!token) {
      throw new Error('No token found in login response');
    }
    this.setAuthToken(token);
    return token;
  }
}
