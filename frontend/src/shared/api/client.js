/** Error from the IVMS API (RFC 9457 problem+json). `message` is user-facing. */
export class ApiError extends Error {
  constructor(status, problem = {}) {
    super(problem.detail || problem.title || `Request failed (${status})`);
    this.status = status;
    // Field errors of a 422: [{ field, message }]
    this.errors = problem.errors || [];
  }
}

/**
 * JSON client for the IVMS REST API (docs/backend-api.md). Sends the access token,
 * turns error responses into `ApiError`, and reports a rejected token through `onUnauthorized`.
 */
export class ApiClient {
  constructor({ baseUrl = '/api/v1', getToken = () => null, onUnauthorized = () => {}, fetchFn } = {}) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
    this.onUnauthorized = onUnauthorized;
    this.fetchFn = fetchFn || ((...args) => fetch(...args));
  }

  get = (path) => this.request('GET', path);
  post = (path, body) => this.request('POST', path, body);
  patch = (path, body) => this.request('PATCH', path, body);
  delete = (path) => this.request('DELETE', path);

  async request(method, path, body) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = this.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    let res;
    try {
      res = await this.fetchFn(this.baseUrl + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, { detail: 'Cannot reach the IVMS server.' });
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Expired or revoked token: the session is over, the user must sign in again
      if (res.status === 401 && token) this.onUnauthorized();
      throw new ApiError(res.status, data);
    }
    return data;
  }
}
