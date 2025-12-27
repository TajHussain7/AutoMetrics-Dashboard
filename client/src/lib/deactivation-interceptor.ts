// Lightweight fetch interceptor to detect server responses indicating an account was deactivated.
// When a response with { code: 'ACCOUNT_DEACTIVATED' } is observed, we dispatch a custom event
// so the client application can react (show overlay, update user status, etc.).

export function setupDeactivationFetchInterceptor() {
  if (typeof window === "undefined" || !window.fetch) return () => {};

  const originalFetch = window.fetch.bind(window) as (
    input: string | URL | Request,
    init?: RequestInit
  ) => Promise<Response>;

  async function wrappedFetch(
    input: string | URL | Request,
    init?: RequestInit
  ) {
    const resp = await originalFetch(input as any, init);

    // Clone response so callers can still read it
    try {
      if (resp && resp.status === 403) {
        const clone = resp.clone();
        // Try parsing JSON safely
        try {
          const data = await clone.json();
          if (
            data &&
            (data.code === "ACCOUNT_DEACTIVATED" ||
              String(data.message)
                .toLowerCase()
                .includes("account deactivated"))
          ) {
            // Dispatch a custom event with the payload so other parts of the app can subscribe
            window.dispatchEvent(
              new CustomEvent("account-deactivated", { detail: data })
            );
          }
        } catch (err) {
          // ignore non-json responses
        }
      }
    } catch (err) {
      // Best-effort only; use centralized logger
      // Import added at top of file
      console.warn("Deactivation interceptor parse ignored non-JSON response");
    }

    return resp;
  }

  window.fetch = wrappedFetch;

  // Return cleanup function to restore original fetch
  return () => {
    window.fetch = originalFetch;
  };
}
