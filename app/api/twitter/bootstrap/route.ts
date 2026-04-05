import { NextResponse } from 'next/server';

const AUTHORIZE_PROFILE_URL = "https://api.x.com/2/users/me?user.fields=created_at,description,verified,public_metrics,profile_image_url";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";

const createLimitedProfile = (detail: string) => ({
  id: "restricted-profile",
  name: "Cuenta de X conectada",
  username: "perfil_no_disponible",
  description: detail,
});

const isUnauthorizedTwitterError = (detail: string) =>
  detail.includes('"status":401') ||
  detail.includes('"title":"Unauthorized"') ||
  detail.includes("Unauthorized");

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_X_CLIENT_ID?.trim();
  const redirectUri =
    process.env.X_REDIRECT_URI?.trim() ||
    process.env.NEXT_PUBLIC_X_REDIRECT_URI?.trim() ||
    "http://localhost:3000/";
  const accessToken = process.env.X_ACCESS_TOKEN?.trim();
  const refreshToken = process.env.X_REFRESH_TOKEN?.trim();

  if (!clientId || (!accessToken && !refreshToken)) {
    return NextResponse.json({
      ok: false,
      message: "Falta X_CLIENT_ID y/o tokens en las variables de entorno para bootstrap de X.",
    }, { status: 400 });
  }

  const requestProfile = async (token: string) => {
    const response = await fetch(AUTHORIZE_PROFILE_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "No se pudo consultar el perfil de X.");
    }

    const payload = await response.json();
    if (!payload.data) throw new Error("X no devolvió el perfil autenticado.");

    return {
      id: payload.data.id,
      name: payload.data.name,
      username: payload.data.username,
      description: payload.data.description,
      verified: payload.data.verified,
      profileImageUrl: payload.data.profile_image_url,
      createdAt: payload.data.created_at,
      publicMetrics: payload.data.public_metrics ? {
        followersCount: payload.data.public_metrics.followers_count,
        followingCount: payload.data.public_metrics.following_count,
        tweetCount: payload.data.public_metrics.tweet_count,
        listedCount: payload.data.public_metrics.listed_count,
      } : undefined,
    };
  };

  const refreshTokenSet = async () => {
    if (!refreshToken) throw new Error("No hay refresh token disponible para X.");

    const body = new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      client_id: clientId,
    });

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "No se pudo refrescar el token de X.");
    }

    return await response.json();
  };

  try {
    let activeAccessToken = accessToken || "";
    let activeRefreshToken = refreshToken || null;
    let scope = "users.read tweet.read offline.access";
    let tokenType = "bearer";
    let expiresAt: number | null = null;

    try {
      if (!activeAccessToken) throw new Error("Sin access token actual.");
      const profile = await requestProfile(activeAccessToken);
      return NextResponse.json({
        ok: true,
        message: `Sesión local importada para @${profile.username}.`,
        session: {
          clientId,
          redirectUri,
          connectedAt: Date.now(),
          token: { accessToken: activeAccessToken, refreshToken: activeRefreshToken, tokenType, scope, expiresAt },
          profile,
        },
      });
    } catch (profileError: any) {
      const detail = profileError.message || "X rechazó la consulta del perfil.";
      if (!isUnauthorizedTwitterError(detail)) {
        return NextResponse.json({
          ok: true,
          message: "Sesión local importada, pero X no permite consultar el perfil.",
          session: {
            clientId,
            redirectUri,
            connectedAt: Date.now(),
            token: { accessToken: activeAccessToken, refreshToken: activeRefreshToken, tokenType, scope, expiresAt },
            profile: createLimitedProfile(detail),
          },
        });
      }

      const refreshed = await refreshTokenSet();
      activeAccessToken = refreshed.access_token;
      activeRefreshToken = refreshed.refresh_token ?? activeRefreshToken;
      tokenType = refreshed.token_type ?? "bearer";
      scope = refreshed.scope ?? scope;
      expiresAt = refreshed.expires_in ? Date.now() + refreshed.expires_in * 1000 : null;

      let profile;
      try {
        profile = await requestProfile(activeAccessToken);
      } catch (e: any) {
        profile = createLimitedProfile(e.message);
      }

      return NextResponse.json({
        ok: true,
        message: "Sesión local refrescada e importada.",
        session: {
          clientId,
          redirectUri,
          connectedAt: Date.now(),
          token: { accessToken: activeAccessToken, refreshToken: activeRefreshToken, tokenType, scope, expiresAt },
          profile,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}
