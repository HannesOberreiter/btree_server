import process from 'node:process';
import { expect } from 'vitest';

interface TestResponse {
  statusCode: number
  body: any
  errors: any
  header: Record<string, string>
  headers: Record<string, string>
}

export const demoUser = {
  email: 'test@btree.at',
  password: 'test_btree',
  name: 'Test Beekeeper',
  lang: 'en',
  newsletter: false,
  source: '0',
};

export class TestAgent {
  private cookieStore = new Map<string, string>();
  private baseUrl: string;

  constructor() {
    this.baseUrl = `http://localhost:${process.env.PORT}`;
  }

  private buildCookieHeader(): string {
    return Array.from(this.cookieStore.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  private storeCookies(headers: Headers) {
    const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
    const setCookies: string[] = getSetCookie ? getSetCookie.call(headers) : [];
    for (const cookie of setCookies) {
      const [nameVal] = cookie.split(';');
      const eqIdx = nameVal.indexOf('=');
      if (eqIdx >= 0) {
        const name = nameVal.substring(0, eqIdx).trim();
        const value = nameVal.substring(eqIdx + 1).trim();
        this.cookieStore.set(name, value);
      }
    }
  }

  async request(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, unknown> | null,
  ): Promise<TestResponse> {
    let url = `${this.baseUrl}${path}`;
    if (query) {
      const params = new URLSearchParams(
        Object.entries(query).map(([k, v]) => [k, String(v)]),
      );
      url = `${url}?${params.toString()}`;
    }

    const reqHeaders: Record<string, string> = {
      'Content-Type': process.env.CONTENT_TYPE!,
      'Accept': process.env.CONTENT_TYPE!,
      'Origin': process.env.ORIGIN!,
    };

    const cookieHeader = this.buildCookieHeader();
    if (cookieHeader) {
      reqHeaders.Cookie = cookieHeader;
    }

    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: reqHeaders,
      body:
        body !== null && body !== undefined && method.toUpperCase() !== 'GET'
          ? JSON.stringify(body)
          : undefined,
    });

    this.storeCookies(response.headers);

    let responseBody: any;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    }
    else {
      responseBody = await response.text();
    }

    const headerMap = Object.fromEntries(response.headers.entries());

    // Handle set-cookie headers specially (they need to be an array)
    const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
    if (getSetCookie) {
      const setCookies = getSetCookie.call(response.headers);
      if (setCookies.length > 0) {
        headerMap['set-cookie'] = setCookies as any;
      }
    }

    return {
      statusCode: response.status,
      body: responseBody,
      errors: responseBody?.errors || responseBody || null,
      header: headerMap,
      headers: headerMap,
    };
  }
}

export function createAgent(): TestAgent {
  return new TestAgent();
}

export async function createAuthenticatedAgent(): Promise<TestAgent> {
  const agent = new TestAgent();
  const res = await doRequest(agent, 'post', '/api/v1/auth/login', null, null, demoUser);
  if (res.statusCode !== 200) {
    console.error('Login failed:', {
      statusCode: res.statusCode,
      body: res.body,
      errors: res.errors,
    });
  }
  expect(res.statusCode).toEqual(200);
  return agent;
}

export async function doRequest(
  agent: TestAgent,
  method: string,
  route: string,
  id: string | number | null,
  _token: unknown,
  payload: unknown,
): Promise<TestResponse> {
  const path = id !== null ? `${route}/${id}` : route;
  return agent.request(method, path, payload ?? undefined);
}

export async function doQueryRequest(
  agent: TestAgent,
  route: string,
  id: string | number | null,
  _token: unknown,
  query: Record<string, unknown> | null,
): Promise<TestResponse> {
  const path = id !== null ? `${route}/${id}` : route;
  return agent.request('GET', path, undefined, query);
}

export function expectations(
  res: TestResponse,
  field: string,
  _err: string,
): void {
  expect(res.body.statusCode).toEqual(400);
  if (res.body.issue) {
    expect(res.body.issues).toBeInstanceOf(Array);
    expect(res.body.issues.length).toBeGreaterThan(0);
    expect(
      res.body.issues.filter((error: any) => error.path.includes(field)).length,
    ).toBeGreaterThanOrEqual(1);
  }
  if (res.body.cause) {
    expect(res.body.cause.type).toBe('ModelValidation');
  }
}
