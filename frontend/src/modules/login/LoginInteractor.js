/**
 * Authentication against the IVMS server (simulated until the backend auth API exists).
 * @param simulateError always reject, to preview the error state
 */
export class LoginInteractor {
  constructor({ simulateError = false } = {}) {
    this.simulateError = simulateError;
  }

  /** Field names that are required and empty. */
  missingFields({ server, user, pass }, { requireServer }) {
    return [requireServer && !server && 'server', !user && 'user', !pass && 'pass'].filter(Boolean);
  }

  /** Resolves with the session, rejects with a user-facing message. */
  signIn({ server, port, user, remember }) {
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        if (this.simulateError) reject(new Error('Incorrect username or password. 4 attempts remaining.'));
        else resolve({ server, port, user, remember });
      }, 1400),
    );
  }
}
