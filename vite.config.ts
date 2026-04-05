import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type TwitterBootstrapResponse =
  | {
      ok: true;
      session: {
        clientId: string;
        redirectUri: string;
        connectedAt: number;
        token: {
          accessToken: string;
          refreshToken: string | null;
          tokenType: string;
          scope: string;
          expiresAt: number | null;
        };
        profile: {
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
        };
      };
      message: string;
    }
  | { ok: false; message: string };

const AUTHORIZE_PROFILE_URL =
  "https://api.x.com/2/users/me?user.fields=created_at,description,verified,public_metrics,profile_image_url";
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

const twitterBootstrapPlugin = (env: Record<string, string>): Plugin => ({
  name: "twitter-bootstrap-dev",
  configureServer(server) {
    server.middlewares.use("/api/twitter/bootstrap", async (_req, res) => {
      const clientId = env.X_CLIENT_ID?.trim();
      const redirectUri = env.X_REDIRECT_URI?.trim() || "http://localhost:4173/";
      const accessToken = env.X_ACCESS_TOKEN?.trim();
      const refreshToken = env.X_REFRESH_TOKEN?.trim();

      const send = (statusCode: number, payload: TwitterBootstrapResponse) => {
        res.statusCode = statusCode;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(payload));
      };

      if (!clientId || (!accessToken && !refreshToken)) {
        send(400, {
          ok: false,
          message: "Falta X_CLIENT_ID y/o tokens en .env.local para bootstrap de X.",
        });
        return;
      }

      const requestProfile = async (token: string) => {
        const response = await fetch(AUTHORIZE_PROFILE_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail || "No se pudo consultar el perfil de X.");
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
          throw new Error("X no devolvio el perfil autenticado.");
        }

        return {
          id: payload.data.id,
          name: payload.data.name,
          username: payload.data.username,
          description: payload.data.description,
          verified: payload.data.verified,
          profileImageUrl: payload.data.profile_image_url,
          createdAt: payload.data.created_at,
          publicMetrics: payload.data.public_metrics
            ? {
                followersCount: payload.data.public_metrics.followers_count,
                followingCount: payload.data.public_metrics.following_count,
                tweetCount: payload.data.public_metrics.tweet_count,
                listedCount: payload.data.public_metrics.listed_count,
              }
            : undefined,
        };
      };

      const refreshTokenSet = async () => {
        if (!refreshToken) {
          throw new Error("No hay refresh token disponible para X.");
        }

        const body = new URLSearchParams({
          refresh_token: refreshToken,
          grant_type: "refresh_token",
          client_id: clientId,
        });

        const response = await fetch(TOKEN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail || "No se pudo refrescar el token de X.");
        }

        return (await response.json()) as {
          access_token: string;
          refresh_token?: string;
          token_type?: string;
          scope?: string;
          expires_in?: number;
        };
      };

      try {
        let activeAccessToken = accessToken || "";
        let activeRefreshToken = refreshToken || null;
        let scope = "users.read tweet.read offline.access";
        let tokenType = "bearer";
        let expiresAt: number | null = null;

        try {
          if (!activeAccessToken) {
            throw new Error("Sin access token actual.");
          }
          const profile = await requestProfile(activeAccessToken);
          send(200, {
            ok: true,
            message: `Sesion local importada para @${profile.username}.`,
            session: {
              clientId,
              redirectUri,
              connectedAt: Date.now(),
              token: {
                accessToken: activeAccessToken,
                refreshToken: activeRefreshToken,
                tokenType,
                scope,
                expiresAt,
              },
              profile,
            },
          });
          return;
        } catch (profileError) {
          const detail =
            profileError instanceof Error
              ? profileError.message
              : "X rechazo la consulta del perfil.";

          if (!isUnauthorizedTwitterError(detail)) {
            send(200, {
              ok: true,
              message:
                "Sesion local importada, pero X no permite consultar el perfil con este nivel de acceso.",
              session: {
                clientId,
                redirectUri,
                connectedAt: Date.now(),
                token: {
                  accessToken: activeAccessToken,
                  refreshToken: activeRefreshToken,
                  tokenType,
                  scope,
                  expiresAt,
                },
                profile: createLimitedProfile(detail),
              },
            });
            return;
          }

          const refreshed = await refreshTokenSet();
          activeAccessToken = refreshed.access_token;
          activeRefreshToken = refreshed.refresh_token ?? activeRefreshToken;
          tokenType = refreshed.token_type ?? "bearer";
          scope = refreshed.scope ?? scope;
          expiresAt =
            typeof refreshed.expires_in === "number"
              ? Date.now() + refreshed.expires_in * 1000
              : null;

          let profile;
          let message = "Sesion local importada con exito.";

          try {
            profile = await requestProfile(activeAccessToken);
            message = `Sesion local importada para @${profile.username}.`;
          } catch (profileError) {
            const detail =
              profileError instanceof Error
                ? profileError.message
                : "X no permitio consultar el perfil con este nivel de acceso.";
            profile = createLimitedProfile(detail);
            message =
              "Sesion local importada, pero X no permite consultar el perfil con este nivel de acceso.";
          }

          send(200, {
            ok: true,
            message,
            session: {
              clientId,
              redirectUri,
              connectedAt: Date.now(),
              token: {
                accessToken: activeAccessToken,
                refreshToken: activeRefreshToken,
                tokenType,
                scope,
                expiresAt,
              },
              profile,
            },
          });
        }
      } catch (error) {
        send(500, {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "No se pudo importar la sesion local de X.",
        });
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss(), twitterBootstrapPlugin(env), viteSingleFile()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
