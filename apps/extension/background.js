// Comitai LinkedIn extension — background service worker.
//
// Owns every network call to the Comitai API. A Manifest V3 service worker
// with the target host in `host_permissions` bypasses normal page-context
// CORS, and cookies the API sets (including the httpOnly refresh-token
// cookie scoped to /v1/auth) land in the browser's normal cookie jar for
// that domain — the same mechanism the Comitai web app itself relies on,
// just from the extension's privileged context instead of a page's.
//
// [PRECISA SER VALIDADO] This session has no live browser to test against,
// so the login/refresh cookie flow below is unverified in practice — test
// it for real once this is loaded as an unpacked extension. If cookies
// don't come through, the likely fix is adding this extension's exact
// `chrome-extension://<id>` origin to the backend's CORS_ORIGINS (it
// shouldn't be needed per Chrome's documented host_permissions behavior,
// but confirm empirically before relying on it).

const DEFAULT_API_BASE = 'http://localhost:3001/v1';
// The API's JWT_ACCESS_TTL defaults to 15 minutes — treat tokens as
// expiring a minute early so a request never races the real expiry.
const ACCESS_TOKEN_TTL_MS = 14 * 60_000;
const REFRESH_MARGIN_MS = 60_000;

async function getApiBase() {
  const { apiBase } = await chrome.storage.local.get('apiBase');
  return apiBase || DEFAULT_API_BASE;
}

async function getStoredAuth() {
  const { accessToken, accessTokenExpiresAt, user } =
    await chrome.storage.local.get([
      'accessToken',
      'accessTokenExpiresAt',
      'user',
    ]);
  return { accessToken, accessTokenExpiresAt, user };
}

async function storeAuth({ accessToken, user }) {
  await chrome.storage.local.set({
    accessToken,
    user,
    accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
  });
}

async function clearAuth() {
  await chrome.storage.local.remove([
    'accessToken',
    'accessTokenExpiresAt',
    'user',
  ]);
}

async function refreshAccessToken() {
  const apiBase = await getApiBase();
  const res = await fetch(`${apiBase}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    await clearAuth();
    return null;
  }
  const data = await res.json();
  await storeAuth(data);
  return data.accessToken;
}

// Returns a usable access token — refreshing first if missing/stale — or
// null if the BDR needs to log back in via the popup.
async function getValidAccessToken() {
  const { accessToken, accessTokenExpiresAt } = await getStoredAuth();
  if (
    accessToken &&
    accessTokenExpiresAt &&
    Date.now() < accessTokenExpiresAt - REFRESH_MARGIN_MS
  ) {
    return accessToken;
  }
  return refreshAccessToken();
}

async function login(email, password) {
  const apiBase = await getApiBase();
  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body.message || 'Login falhou.' };
  }
  const data = await res.json();
  await storeAuth(data);
  return { success: true, user: data.user };
}

async function logout() {
  const apiBase = await getApiBase();
  const token = await getValidAccessToken();
  if (token) {
    await fetch(`${apiBase}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {
      // Best-effort — we clear local auth state either way below.
    });
  }
  await clearAuth();
}

async function observeProfile(payload) {
  let token = await getValidAccessToken();
  if (!token) return { success: false, error: 'not_authenticated' };

  const apiBase = await getApiBase();
  const doFetch = (accessToken) =>
    fetch(`${apiBase}/linkedin/observe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

  let res = await doFetch(token);
  if (res.status === 401) {
    // The access token may have been invalidated elsewhere (logout-all,
    // reuse detection) — one retry after a forced refresh, then give up.
    token = await refreshAccessToken();
    if (!token) return { success: false, error: 'not_authenticated' };
    res = await doFetch(token);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body.message || `HTTP ${res.status}` };
  }
  return { success: true, result: await res.json() };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'LOGIN':
        sendResponse(await login(message.email, message.password));
        break;
      case 'LOGOUT':
        await logout();
        sendResponse({ success: true });
        break;
      case 'GET_STATUS': {
        const { user } = await getStoredAuth();
        sendResponse({ loggedIn: !!user, user: user || null });
        break;
      }
      case 'SET_API_BASE':
        await chrome.storage.local.set({ apiBase: message.apiBase });
        sendResponse({ success: true });
        break;
      case 'GET_API_BASE':
        sendResponse({ apiBase: await getApiBase() });
        break;
      case 'OBSERVE_PROFILE':
        sendResponse(await observeProfile(message.payload));
        break;
      default:
        sendResponse({ success: false, error: 'unknown_message_type' });
    }
  })();
  return true; // keep the message channel open for the async response
});
