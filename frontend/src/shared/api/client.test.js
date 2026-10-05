import { describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError } from './client';

const response = (status, body) => ({ ok: status < 400, status, json: async () => body });

function setup(res, token = 'tok') {
  const fetchFn = vi.fn().mockResolvedValue(res);
  const onUnauthorized = vi.fn();
  const api = new ApiClient({ getToken: () => token, onUnauthorized, fetchFn });
  return { api, fetchFn, onUnauthorized };
}

describe('ApiClient', () => {
  it('sends JSON with the bearer token', async () => {
    const { api, fetchFn } = setup(response(201, { id: 'x' }));
    expect(await api.post('/devices', { name: 'Gate' })).toEqual({ id: 'x' });
    expect(fetchFn).toHaveBeenCalledWith('/api/v1/devices', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
      body: '{"name":"Gate"}',
    });
  });

  it('turns problem+json into an ApiError', async () => {
    const { api } = setup(response(409, { title: 'Conflict', status: 409, detail: 'Already exists' }));
    const err = await api.get('/devices').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect([err.status, err.message]).toEqual([409, 'Already exists']);
  });

  it('ends the session when the token is rejected', async () => {
    const { api, onUnauthorized } = setup(response(401, { detail: 'Session expired, please sign in again' }));
    await expect(api.get('/devices')).rejects.toThrow('Session expired');
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('does not end a session on a failed sign-in (no token yet)', async () => {
    const { api, onUnauthorized } = setup(response(401, { detail: 'Wrong username or password' }), null);
    await expect(api.post('/auth/login', {})).rejects.toThrow('Wrong username or password');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('reports an unreachable server', async () => {
    const api = new ApiClient({ fetchFn: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) });
    await expect(api.get('/devices')).rejects.toMatchObject({ status: 0, message: 'Cannot reach the IVMS server.' });
  });
});
