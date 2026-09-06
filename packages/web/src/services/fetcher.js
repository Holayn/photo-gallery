export class FetchError extends Error {
  constructor(status, message) {
    super(message || 'Something went wrong. Please try again.');

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }

    this.name = 'FetchError';
    this.status = status;
  }
}

function getError(status) {
  switch (status) {
    case 401:
      return 'Missing authentication.';
    case 403:
      return "Unauthorized.";
    case 404:
      return 'Not found.';
    case 500:
      return 'An unexpected error occurred on the server. Please try again.';
    default:
      return null;
  }
}

const fetcher = {
  async fetch(url, options = {}) {
    const res = await window.fetch(url, options);

    if (res.ok) {
      if (res.headers.get('Content-Type').includes('json')) {
        return res.json();
      }
      return true;
    }

    if (res.status === 401 && options.redirectOn401 !== false) {
      window.dispatchEvent(new CustomEvent('unauthorized'));
    }

    let message = getError(res.status);
    if (res.headers.get('Content-Type')?.includes('json')) {
      const body = await res.json().catch(() => null);
      if (body?.message) {
        message = body.message;
      }
    }

    throw new FetchError(res.status, message);
  }
}

export default fetcher;
