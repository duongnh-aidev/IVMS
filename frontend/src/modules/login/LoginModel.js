/** Sign-in against the IVMS server (POST /auth/login through the auth service). */
export class LoginModel {
  constructor({ auth }) {
    this.auth = auth;
  }

  /** Field names that are required and empty. */
  missingFields({ server, user, pass }, { requireServer }) {
    return [requireServer && !server && 'server', !user && 'user', !pass && 'pass'].filter(Boolean);
  }

  /** Resolves once signed in, rejects with a user-facing message (ApiError). */
  signIn({ user, pass, remember }) {
    return this.auth.signIn(user.trim(), pass, remember);
  }

  /** Fresh install: no user exists yet, the form creates the admin account instead. */
  setupRequired() {
    return this.auth.setupRequired();
  }

  createAdmin({ user, pass, remember }) {
    return this.auth.setup(user.trim(), pass, remember);
  }
}
