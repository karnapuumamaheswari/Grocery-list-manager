const apiBaseUrl = import.meta.env.VITE_API_URL ?? "/api";

export async function apiRequest(path: string, token: string, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new Error(
      `Unable to connect to the service. Check that the backend is running and your API URL is correct (${apiBaseUrl}).`,
    );
  }

  if (!response.ok) {
    let errorMessage = `API request failed (${response.status})`;
    try {
      const payload = await response.json();
      if (payload?.error) {
        errorMessage = payload.error;
      }
    } catch {
      // ignore non-json body
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
