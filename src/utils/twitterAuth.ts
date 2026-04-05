interface TwitterEnv {
  NEXT_PUBLIC_X_CLIENT_ID?: string;
  NEXT_PUBLIC_X_REDIRECT_URI?: string;
  NEXT_PUBLIC_X_SCOPES?: string;
}

export interface TwitterOAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface TwitterTokenSet {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  scope: string;
  expiresAt: number | null;
}

export interface TwitterProfile {
  id: string;
  name: string;
  username: string;
  description?: string;
  verified?: boolean;
  profileImageUrl?: string;
  createdAt?: string;
  publicMetrics?: {
    followersCount?: number;
    followingCount?: number;
    tweetCount?: number;
    listedCount?: number;
  };
}

const createLimitedProfile = (detail: string): TwitterProfile => ({
  id: 'restricted-profile',
  name: 'Cuenta de X conectada',
  username: 'perfil_no_disponible',
  description: detail,
});

export interface TwitterSession {
  clientId: string;
  redirectUri: string;
  connectedAt: number;
  token: TwitterTokenSet;
  profile: TwitterProfile;
}

interface PendingTwitterAuth {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeVerifier: string;
  codeChallengeMethod: 'S256' | 'plain';
  requestedAt: number;
}

type CallbackResult =
  | { status: 'success'; message: string; session: TwitterSession }
  | { status: 'error'; message: string };

const STORAGE_PREFIX = 'granja_twitter_oauth_v1';
const CONFIG_STORAGE_KEY = `${STORAGE_PREFIX}_config`;
const SESSION_STORAGE_KEY = `${STORAGE_PREFIX}_session`;
const PENDING_STORAGE_KEY = `${STORAGE_PREFIX}_pending`;
const DEFAULT_SCOPE_LIST = ['tweet.read', 'users.read', 'tweet.write', 'offline.access'];
const AUTHORIZE_URL = 'https://x.com/i/oauth2/authorize';
const TOKEN_URL = 'https://api.x.com/2/oauth2/token';
const REVOKE_URL = 'https://api.x.com/2/oauth2/revoke';
const ME_URL =
  'https://api.x.com/2/users/me?user.fields=created_at,description,verified,public_metrics,profile_image_url';

const getEnv = (): TwitterEnv => ({
  NEXT_PUBLIC_X_CLIENT_ID: process.env.NEXT_PUBLIC_X_CLIENT_ID,
  NEXT_PUBLIC_X_REDIRECT_URI: process.env.NEXT_PUBLIC_X_REDIRECT_URI,
  NEXT_PUBLIC_X_SCOPES: process.env.NEXT_PUBLIC_X_SCOPES,
});

const canUseWindow = () => typeof window !== 'undefined';

const getFallbackRedirectUri = () => {
  if (!canUseWindow()) {
    return '';
  }

  return `${window.location.origin}${window.location.pathname}`;
};

const sanitizeScopes = (value: string | string[] | undefined | null): string[] => {
  const entries = Array.isArray(value) ? value : String(value ?? '').split(/[\s,]+/);
  const unique = new Set(entries.map((entry) => entry.trim()).filter(Boolean));
  return unique.size > 0 ? [...unique] : [...DEFAULT_SCOPE_LIST];
};

const safelyParse = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const readLocalStorage = <T>(key: string): T | null => {
  if (!canUseWindow()) {
    return null;
  }

  return safelyParse<T>(window.localStorage.getItem(key));
};

const writeLocalStorage = (key: string, value: unknown) => {
  if (!canUseWindow()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const readSessionStorage = <T>(key: string): T | null => {
  if (!canUseWindow()) {
    return null;
  }

  return safelyParse<T>(window.sessionStorage.getItem(key));
};

const writeSessionStorage = (key: string, value: unknown) => {
  if (!canUseWindow()) {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
};

const removeSessionStorage = (key: string) => {
  if (!canUseWindow()) {
    return;
  }

  window.sessionStorage.removeItem(key);
};

const removeLocalStorage = (key: string) => {
  if (!canUseWindow()) {
    return;
  }

  window.localStorage.removeItem(key);
};

const randomString = (length: number) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
};

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const sha256Base64Url = async (value: string) => {
  const buffer = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return toBase64Url(new Uint8Array(digest));
};

const normalizeConfig = (value?: Partial<TwitterOAuthConfig> | null): TwitterOAuthConfig => {
  const env = getEnv();
  const defaultRedirect = env.NEXT_PUBLIC_X_REDIRECT_URI?.trim() || getFallbackRedirectUri();

  return {
    clientId: value?.clientId?.trim() || env.NEXT_PUBLIC_X_CLIENT_ID?.trim() || '',
    redirectUri: value?.redirectUri?.trim() || defaultRedirect,
    scopes: sanitizeScopes(value?.scopes ?? env.NEXT_PUBLIC_X_SCOPES),
  };
};

const normalizeTokenSet = (payload: {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
}): TwitterTokenSet => ({
  accessToken: payload.access_token,
  refreshToken: payload.refresh_token ?? null,
  tokenType: payload.token_type ?? 'bearer',
  scope: payload.scope ?? DEFAULT_SCOPE_LIST.join(' '),
  expiresAt: typeof payload.expires_in === 'number' ? Date.now() + payload.expires_in * 1000 : null,
});

const normalizeProfile = (payload: {
  id: string;
  name: string;
  username: string;
  description?: string;
  verified?: boolean;
  profile_image_url?: string;
  created_at?: string;
  public_metrics?: {
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
    listed_count?: number;
  };
}): TwitterProfile => ({
  id: payload.id,
  name: payload.name,
  username: payload.username,
  description: payload.description,
  verified: payload.verified,
  profileImageUrl: payload.profile_image_url,
  createdAt: payload.created_at,
  publicMetrics: payload.public_metrics
    ? {
        followersCount: payload.public_metrics.followers_count,
        followingCount: payload.public_metrics.following_count,
        tweetCount: payload.public_metrics.tweet_count,
        listedCount: payload.public_metrics.listed_count,
      }
    : undefined,
});

const cleanOAuthParamsFromUrl = () => {
  if (!canUseWindow()) {
    return;
  }

  const url = new URL(window.location.href);
  ['code', 'state', 'error', 'error_description'].forEach((key) => url.searchParams.delete(key));
  window.history.replaceState({}, document.title, url.toString());
};

const parseTwitterError = async (response: Response) => {
  let detail = response.statusText || 'Solicitud rechazada por X.';

  try {
    const payload = await response.json();
    const nestedError =
      payload?.error_description ||
      payload?.detail ||
      payload?.title ||
      payload?.errors?.[0]?.message ||
      payload?.errors?.[0]?.detail;

    if (nestedError) {
      detail = nestedError;
    }
  } catch {
    // Ignore JSON parsing failures and keep the status text.
  }

  return detail;
};

const requestTwitterProfile = async (accessToken: string) => {
  const response = await fetch(ME_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseTwitterError(response));
  }

  const payload = (await response.json()) as {
    data?: {
      id: string;
      name: string;
      username: string;
      description?: string;
      verified?: boolean;
      profile_image_url?: string;
      created_at?: string;
      public_metrics?: {
        followers_count?: number;
        following_count?: number;
        tweet_count?: number;
        listed_count?: number;
      };
    };
  };

  if (!payload.data) {
    throw new Error('X no devolvio el perfil autenticado.');
  }

  return normalizeProfile(payload.data);
};

export const getDefaultTwitterConfig = () => normalizeConfig();

export const loadTwitterConfig = () => normalizeConfig(readLocalStorage<Partial<TwitterOAuthConfig>>(CONFIG_STORAGE_KEY));

export const saveTwitterConfig = (config: TwitterOAuthConfig) => {
  const normalized = normalizeConfig(config);
  writeLocalStorage(CONFIG_STORAGE_KEY, normalized);
  return normalized;
};

export const loadTwitterSession = () => {
  const value = readLocalStorage<TwitterSession>(SESSION_STORAGE_KEY);
  return value ?? null;
};

export const saveTwitterSession = (session: TwitterSession) => {
  writeLocalStorage(SESSION_STORAGE_KEY, session);
  return session;
};

export const clearTwitterSession = () => {
  removeLocalStorage(SESSION_STORAGE_KEY);
};

export const hasTwitterOAuthCallbackParams = () => {
  if (!canUseWindow()) {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return params.has('code') || params.has('error');
};

export const startTwitterOAuth = async (inputConfig: TwitterOAuthConfig) => {
  if (!canUseWindow()) {
    throw new Error('Twitter OAuth solo puede iniciarse en el navegador.');
  }

  const config = normalizeConfig(inputConfig);

  if (!config.clientId) {
    throw new Error('Falta el Client ID de X.');
  }

  if (!config.redirectUri) {
    throw new Error('Falta la Redirect URI de X.');
  }

  const state = randomString(48);
  const codeVerifier = randomString(96);
  const canHash = typeof crypto !== 'undefined' && !!crypto.subtle;
  const codeChallengeMethod: 'S256' | 'plain' = canHash ? 'S256' : 'plain';
  const codeChallenge = canHash ? await sha256Base64Url(codeVerifier) : codeVerifier;

  const pendingAuth: PendingTwitterAuth = {
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scope: config.scopes.join(' '),
    state,
    codeVerifier,
    codeChallengeMethod,
    requestedAt: Date.now(),
  };

  writeSessionStorage(PENDING_STORAGE_KEY, pendingAuth);

  const authorizeUrl = new URL(AUTHORIZE_URL);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', config.clientId);
  authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);
  authorizeUrl.searchParams.set('scope', config.scopes.join(' '));
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', codeChallengeMethod);

  window.location.assign(authorizeUrl.toString());
};

export const handleTwitterOAuthCallback = async (
  inputConfig?: Partial<TwitterOAuthConfig>,
): Promise<CallbackResult | null> => {
  if (!canUseWindow()) {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');
  const errorDescription = params.get('error_description');

  if (!code && !error) {
    return null;
  }

  cleanOAuthParamsFromUrl();

  const pendingAuth = readSessionStorage<PendingTwitterAuth>(PENDING_STORAGE_KEY);
  removeSessionStorage(PENDING_STORAGE_KEY);

  if (error) {
    return {
      status: 'error',
      message: errorDescription || `X devolvio un error de autorizacion: ${error}.`,
    };
  }

  if (!pendingAuth) {
    return {
      status: 'error',
      message: 'No se encontro el contexto de autorizacion pendiente para X.',
    };
  }

  if (!state || state !== pendingAuth.state) {
    return {
      status: 'error',
      message: 'El estado OAuth de X no coincide con la solicitud iniciada.',
    };
  }

  const config = normalizeConfig(inputConfig);
  const clientId = config.clientId || pendingAuth.clientId;
  const redirectUri = config.redirectUri || pendingAuth.redirectUri;

  if (!clientId || !redirectUri) {
    return {
      status: 'error',
      message: 'Falta el Client ID o la Redirect URI para completar la conexion con X.',
    };
  }

  const tokenBody = new URLSearchParams({
    code: code ?? '',
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: pendingAuth.codeVerifier,
  });

  const tokenResponse = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenBody.toString(),
  });

  if (!tokenResponse.ok) {
    return {
      status: 'error',
      message: await parseTwitterError(tokenResponse),
    };
  }

  const tokenPayload = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
    expires_in?: number;
  };

  const token = normalizeTokenSet(tokenPayload);
  let profile: TwitterProfile;
  let message = 'Conexion completada correctamente.';

  try {
    profile = await requestTwitterProfile(token.accessToken);
    message = `Conexion completada con @${profile.username}.`;
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message
        : 'X no permitio consultar el perfil por el nivel actual de acceso.';
    profile = createLimitedProfile(detail);
    message = 'Conexion completada, pero X no permite consultar el perfil con este nivel de acceso.';
  }

  const session: TwitterSession = {
    clientId,
    redirectUri,
    connectedAt: Date.now(),
    token,
    profile,
  };

  saveTwitterSession(session);

  return {
    status: 'success',
    message,
    session,
  };
};

export const refreshTwitterSession = async (
  inputConfig: Partial<TwitterOAuthConfig> | undefined,
  session: TwitterSession,
) => {
  const clientId = inputConfig?.clientId?.trim() || session.clientId;

  if (!session.token.refreshToken || !clientId) {
    return session;
  }

  if (session.token.expiresAt && session.token.expiresAt - Date.now() > 60_000) {
    return session;
  }

  const tokenBody = new URLSearchParams({
    refresh_token: session.token.refreshToken,
    grant_type: 'refresh_token',
    client_id: clientId,
  });

  const tokenResponse = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenBody.toString(),
  });

  if (!tokenResponse.ok) {
    throw new Error(await parseTwitterError(tokenResponse));
  }

  const payload = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
    expires_in?: number;
  };

  const refreshedSession: TwitterSession = {
    ...session,
    clientId,
    token: {
      ...normalizeTokenSet(payload),
      refreshToken: payload.refresh_token ?? session.token.refreshToken,
    },
  };

  saveTwitterSession(refreshedSession);
  return refreshedSession;
};

export const revokeTwitterSession = async (
  inputConfig: Partial<TwitterOAuthConfig> | undefined,
  session: TwitterSession,
) => {
  const clientId = inputConfig?.clientId?.trim() || session.clientId;
  const token = session.token.refreshToken || session.token.accessToken;

  if (!clientId || !token) {
    clearTwitterSession();
    return;
  }

  const body = new URLSearchParams({
    token,
    client_id: clientId,
  });

  const response = await fetch(REVOKE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(await parseTwitterError(response));
  }

  clearTwitterSession();
};
