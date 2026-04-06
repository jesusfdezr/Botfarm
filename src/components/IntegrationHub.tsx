import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  AtSign,
  BarChart3,
  Bot,
  BrainCircuit,
  Cloud,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Link2,
  LoaderCircle,
  MessageSquare,
  RefreshCcw,
  Rocket,
  Save,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Workflow,
} from 'lucide-react';
import {
  clearTwitterSession,
  getDefaultTwitterConfig,
  handleTwitterOAuthCallback,
  hasTwitterOAuthCallbackParams,
  loadTwitterConfig,
  loadTwitterSession,
  refreshTwitterSession,
  revokeTwitterSession,
  saveTwitterConfig,
  saveTwitterSession,
  startTwitterOAuth,
  type TwitterOAuthConfig,
  type TwitterSession,
} from '../utils/twitterAuth';
import { ReportBlockPanel } from './ReportBlockPanel';
import { ReportWorkspace } from './ReportWorkspace';

type IntegrationCategory = 'ai' | 'social' | 'storage' | 'automation' | 'security' | 'analytics' | 'deployment';
type IntegrationStatus = 'connected' | 'disconnected' | 'limited' | 'error';
type Accent = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky';

interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  description: string;
  features: string[];
  freeLimit: string;
  botsAssigned: number;
  apiKey: string;
  showKey: boolean;
  accent: Accent;
}

const accents = {
  cyan: { card: 'border-cyan-400/20 bg-cyan-400/8', text: 'text-cyan-100', button: 'border-cyan-400/24 bg-cyan-400/12 text-cyan-100 hover:bg-cyan-400/18' },
  violet: { card: 'border-violet-400/20 bg-violet-400/8', text: 'text-violet-100', button: 'border-violet-400/24 bg-violet-400/12 text-violet-100 hover:bg-violet-400/18' },
  emerald: { card: 'border-emerald-400/20 bg-emerald-400/8', text: 'text-emerald-100', button: 'border-emerald-400/24 bg-emerald-400/12 text-emerald-100 hover:bg-emerald-400/18' },
  amber: { card: 'border-amber-400/20 bg-amber-400/8', text: 'text-amber-100', button: 'border-amber-400/24 bg-amber-400/12 text-amber-100 hover:bg-amber-400/18' },
  rose: { card: 'border-rose-400/20 bg-rose-400/8', text: 'text-rose-100', button: 'border-rose-400/24 bg-rose-400/12 text-rose-100 hover:bg-rose-400/18' },
  sky: { card: 'border-sky-400/20 bg-sky-400/8', text: 'text-sky-100', button: 'border-sky-400/24 bg-sky-400/12 text-sky-100 hover:bg-sky-400/18' },
};

const statusTone = {
  connected: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
  disconnected: 'border-slate-400/20 bg-slate-400/8 text-slate-200',
  limited: 'border-amber-400/20 bg-amber-400/8 text-amber-100',
  error: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
};

const categoryMeta = {
  all: { label: 'Todas', icon: Globe },
  ai: { label: 'IA', icon: BrainCircuit },
  social: { label: 'Social', icon: MessageSquare },
  storage: { label: 'Datos', icon: Database },
  automation: { label: 'Automatizacion', icon: Workflow },
  security: { label: 'Seguridad', icon: ShieldCheck },
  analytics: { label: 'Analytics', icon: BarChart3 },
  deployment: { label: 'Deploy', icon: Rocket },
};

const categoryIcon = { ai: BrainCircuit, social: MessageSquare, storage: Database, automation: Workflow, security: ShieldCheck, analytics: BarChart3, deployment: Cloud };

const initialIntegrations: Integration[] = [
  { id: 'twitter', name: 'X / Twitter', category: 'social', status: 'disconnected', description: 'Conexion OAuth 2.0 PKCE con una cuenta real de X desde la app.', features: ['OAuth 2.0 PKCE', 'users.read', 'tweet.write', 'offline.access'], freeLimit: 'Segun tu plan de X API', botsAssigned: 0, apiKey: '', showKey: false, accent: 'sky' },
  { id: 'reportblock', name: 'Report & Block', category: 'security', status: 'connected', description: 'Detecta y bloquea spam bots en X/Twitter sin API. Chrome extension incluida.', features: ['Auto-detect spam', '1-click report', 'Auto-block', 'Sin API needed', '100% local'], freeLimit: 'Ilimitado', botsAssigned: 0, apiKey: '', showKey: false, accent: 'rose' },
  { id: 'discord', name: 'Discord', category: 'social', status: 'connected', description: 'Comunicacion operativa y notificaciones en vivo.', features: ['Webhooks', 'Channels', 'Notifications'], freeLimit: 'Sin coste base', botsAssigned: 42, apiKey: '', showKey: false, accent: 'sky' },
  { id: 'telegram', name: 'Telegram', category: 'social', status: 'disconnected', description: 'Canales, bots y control remoto ligero.', features: ['Bot API', 'Channels', 'Broadcast'], freeLimit: 'Ilimitado', botsAssigned: 0, apiKey: '', showKey: false, accent: 'cyan' },
  { id: 'huggingface', name: 'Hugging Face', category: 'ai', status: 'disconnected', description: 'Modelos abiertos para NLP, vision y tareas experimentales.', features: ['Text generation', 'Embeddings', 'Image analysis'], freeLimit: 'Tier gratuito amplio', botsAssigned: 0, apiKey: '', showKey: false, accent: 'violet' },
  { id: 'gemini', name: 'Google Gemini', category: 'ai', status: 'limited', description: 'Razonamiento y contexto largo para flujos complejos.', features: ['Reasoning', 'Long context', 'Code assistance'], freeLimit: 'Uso gratuito limitado', botsAssigned: 18, apiKey: '', showKey: false, accent: 'cyan' },
  { id: 'supabase', name: 'Supabase', category: 'storage', status: 'connected', description: 'Base de datos, auth y storage para persistencia en tiempo real.', features: ['Database', 'Realtime', 'Auth'], freeLimit: '500MB DB + 1GB storage', botsAssigned: 320, apiKey: '', showKey: false, accent: 'emerald' },
  { id: 'cloudflare', name: 'Cloudflare', category: 'security', status: 'connected', description: 'Capa perimetral con DNS, CDN y proteccion.', features: ['DNS', 'WAF', 'DDoS'], freeLimit: 'Plan gratuito', botsAssigned: 26, apiKey: '', showKey: false, accent: 'amber' },
  { id: 'posthog', name: 'PostHog', category: 'analytics', status: 'limited', description: 'Eventos, funnels y analitica de producto.', features: ['Events', 'Funnels', 'Flags'], freeLimit: '1M eventos/mes', botsAssigned: 12, apiKey: '', showKey: false, accent: 'violet' },
  { id: 'vercel', name: 'Vercel', category: 'deployment', status: 'connected', description: 'Despliegues rapidos para frontend y funciones.', features: ['Deploy', 'Functions', 'Preview'], freeLimit: 'Hobby tier', botsAssigned: 24, apiKey: '', showKey: false, accent: 'emerald' },
];

const splitScopes = (value: string) => value.split(/[\s,]+/).map((scope) => scope.trim()).filter(Boolean);
const formatExpiry = (session: TwitterSession | null) => session?.token.expiresAt ? new Date(session.token.expiresAt).toLocaleString() : 'Sin fecha reportada';

interface TwitterBootstrapApiSuccess {
  ok: true;
  message: string;
  session: TwitterSession;
}

interface TwitterBootstrapApiError {
  ok: false;
  message: string;
}

const IntegrationHub = () => {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>('twitter');
  const [search, setSearch] = useState('');
  const [twitterConfig, setTwitterConfig] = useState<TwitterOAuthConfig>(() => loadTwitterConfig());
  const [twitterSession, setTwitterSession] = useState<TwitterSession | null>(() => loadTwitterSession());
  const [twitterBusy, setTwitterBusy] = useState(false);
  const [twitterNotice, setTwitterNotice] = useState<string | null>(null);
  const [twitterError, setTwitterError] = useState<string | null>(null);

  const syncTwitter = (session: TwitterSession | null, isError = false) => {
    setTwitterSession(session);
    setIntegrations((current) => current.map((item) => item.id === 'twitter' ? { ...item, status: isError ? 'error' : session ? 'connected' : 'disconnected' } : item));
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const stored = loadTwitterSession();
      if (stored) syncTwitter(stored);
      if (hasTwitterOAuthCallbackParams()) {
        setSelectedCategory('social');
        setExpandedId('twitter');
        setTwitterBusy(true);
        setTwitterNotice('Procesando autorizacion de X...');
        const result = await handleTwitterOAuthCallback(loadTwitterConfig());
        if (cancelled || !result) return;
        if (result.status === 'success') {
          syncTwitter(result.session);
          setTwitterConfig(loadTwitterConfig());
          setTwitterNotice(result.message);
          setTwitterError(null);
        } else {
          syncTwitter(stored ?? null, true);
          setTwitterNotice(null);
          setTwitterError(result.message);
        }
        setTwitterBusy(false);
        return;
      }
      if (stored) {
        try {
          const refreshed = await refreshTwitterSession(loadTwitterConfig(), stored);
          if (!cancelled) syncTwitter(refreshed);
        } catch (error) {
          if (!cancelled) {
            syncTwitter(stored, true);
            setTwitterError(error instanceof Error ? error.message : 'No se pudo refrescar la sesion de X.');
          }
        }
      }
    };
    void init();
    return () => { cancelled = true; };
  }, []);

  const filteredIntegrations = integrations.filter((integration) => {
    const query = search.trim().toLowerCase();
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = query ? integration.name.toLowerCase().includes(query) || integration.description.toLowerCase().includes(query) : true;
    return matchesCategory && matchesSearch;
  });

  const connectedCount = integrations.filter((item) => item.status === 'connected').length;
  const limitedCount = integrations.filter((item) => item.status === 'limited').length;
  const totalBotsAssigned = integrations.reduce((sum, item) => sum + item.botsAssigned, 0);

  const updateGeneric = (id: string, changes: Partial<Integration>) => setIntegrations((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  const toggleGeneric = (id: string) => setIntegrations((current) => current.map((item) => item.id === id ? { ...item, status: item.status === 'connected' ? 'disconnected' : 'connected' } : item));

  const saveTwitterSettings = () => {
    const normalized = saveTwitterConfig({ clientId: twitterConfig.clientId.trim(), redirectUri: twitterConfig.redirectUri.trim(), scopes: twitterConfig.scopes });
    setTwitterConfig(normalized);
    setTwitterNotice('Configuracion de X guardada en este navegador.');
    setTwitterError(null);
  };

  const connectTwitter = async () => {
    setTwitterBusy(true);
    setTwitterError(null);
    setTwitterNotice('Redirigiendo a X para autorizar la cuenta...');
    try {
      const normalized = saveTwitterConfig({ clientId: twitterConfig.clientId.trim(), redirectUri: twitterConfig.redirectUri.trim(), scopes: twitterConfig.scopes });
      setTwitterConfig(normalized);
      await startTwitterOAuth(normalized);
    } catch (error) {
      setTwitterBusy(false);
      setTwitterNotice(null);
      setTwitterError(error instanceof Error ? error.message : 'No se pudo iniciar el OAuth de X.');
    }
  };

  const refreshTwitter = async () => {
    if (!twitterSession) return;
    setTwitterBusy(true);
    setTwitterError(null);
    setTwitterNotice('Renovando token de X...');
    try {
      const refreshed = await refreshTwitterSession(twitterConfig, twitterSession);
      syncTwitter(refreshed);
      setTwitterNotice('Token de X renovado correctamente.');
    } catch (error) {
      syncTwitter(twitterSession, true);
      setTwitterNotice(null);
      setTwitterError(error instanceof Error ? error.message : 'No se pudo renovar el token.');
    } finally {
      setTwitterBusy(false);
    }
  };

  const disconnectTwitter = async () => {
    setTwitterBusy(true);
    setTwitterError(null);
    setTwitterNotice('Revocando acceso de X...');
    try {
      if (twitterSession) await revokeTwitterSession(twitterConfig, twitterSession);
      else clearTwitterSession();
      syncTwitter(null);
      setTwitterNotice('Cuenta de X desconectada.');
    } catch (error) {
      setTwitterNotice(null);
      setTwitterError(error instanceof Error ? error.message : 'No se pudo desconectar la cuenta.');
    } finally {
      setTwitterBusy(false);
    }
  };

  const importLocalTwitterSession = async () => {
    setTwitterBusy(true);
    setTwitterError(null);
    setTwitterNotice('Importando sesion local de X desde el servidor de desarrollo...');

    try {
      const response = await fetch('/api/twitter/bootstrap');
      const payload = (await response.json()) as TwitterBootstrapApiSuccess | TwitterBootstrapApiError;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || 'No se pudo importar la sesion local de X.');
      }

      saveTwitterSession(payload.session);
      setTwitterConfig({
        clientId: payload.session.clientId,
        redirectUri: payload.session.redirectUri,
        scopes: splitScopes(payload.session.token.scope),
      });
      syncTwitter(payload.session);
      setTwitterNotice(payload.message);
    } catch (error) {
      setTwitterNotice(null);
      setTwitterError(error instanceof Error ? error.message : 'No se pudo importar la sesion local de X.');
    } finally {
      setTwitterBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="panel panel-glow rounded-[30px] p-6 sm:p-7">
        <div className="relative z-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full pill-glow px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100"><Globe className="h-4 w-4" />Centro de integraciones</div>
            <h2 className="mt-4 text-3xl font-semibold text-gradient">X/Twitter ya puede autenticarse</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">La app ahora incorpora OAuth 2.0 PKCE real para X, con callback, refresh, revoke y perfil conectado desde la propia interfaz.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {(Object.keys(categoryMeta) as Array<keyof typeof categoryMeta>).map((key) => {
                const Icon = categoryMeta[key].icon;
                const isActive = selectedCategory === key;
                return <button key={key} type="button" onClick={() => setSelectedCategory(key as IntegrationCategory | 'all')} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${isActive ? 'border-cyan-400/24 bg-cyan-400/12 text-cyan-100' : 'border-white/8 bg-white/4 text-slate-300 hover:bg-white/6'}`}><Icon className="h-4 w-4" />{categoryMeta[key].label}</button>;
              })}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Conectadas</p><p className="mt-3 text-3xl font-semibold text-emerald-100">{connectedCount}</p><p className="mt-2 text-sm text-slate-300">Servicios listos para operar</p></div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Limitadas</p><p className="mt-3 text-3xl font-semibold text-amber-100">{limitedCount}</p><p className="mt-2 text-sm text-slate-300">Necesitan vigilar cuota</p></div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bots asignados</p><p className="mt-3 text-3xl font-semibold text-cyan-100">{totalBotsAssigned.toLocaleString()}</p><p className="mt-2 text-sm text-slate-300">Distribucion visible</p></div>
          </div>
        </div>
      </section>

      <section className="panel rounded-[30px] p-6"><div className="relative z-10"><label className="relative block"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar integracion por nombre o descripcion" className="w-full rounded-2xl border border-white/8 bg-slate-950/65 py-3 pl-11 pr-4 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15" /></label></div></section>

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredIntegrations.map((integration) => {
          const accent = accents[integration.accent];
          const Icon = categoryIcon[integration.category];
          const expanded = expandedId === integration.id;
          const isTwitter = integration.id === 'twitter';
          return (
            <div key={integration.id} className={`panel rounded-[28px] p-6 ${accent.card}`}>
              <div className="relative z-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-3"><Icon className={`h-5 w-5 ${accent.text}`} /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-slate-100">{integration.name}</h3><span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusTone[integration.status]}`}>{integration.status.toUpperCase()}</span></div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{integration.description}</p>
                    </div>
                  </div>
                  {isTwitter ? (
                    twitterSession ? <button type="button" onClick={() => void disconnectTwitter()} disabled={twitterBusy} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${accent.button}`}>{twitterBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ToggleRight className="h-4 w-4" />}Desconectar</button>
                      : <button type="button" onClick={() => void connectTwitter()} disabled={twitterBusy} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${accent.button}`}>{twitterBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Conectar con X</button>
                  ) : (
                    <button type="button" onClick={() => toggleGeneric(integration.id)} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${accent.button}`}>{integration.status === 'connected' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}{integration.status === 'connected' ? 'Desconectar' : 'Conectar'}</button>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">{integration.features.map((feature) => <span key={feature} className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-slate-300">{feature}</span>)}</div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Categoria</p><p className="mt-3 text-sm font-medium text-slate-100">{categoryMeta[integration.category].label}</p></div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Gratis</p><p className="mt-3 text-sm font-medium text-slate-100">{integration.freeLimit}</p></div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bots</p><p className="mt-3 text-sm font-medium text-slate-100">{integration.botsAssigned.toLocaleString()}</p></div>
                </div>
                <button type="button" onClick={() => setExpandedId(expanded ? null : integration.id)} className="mt-5 text-sm font-medium text-cyan-100 transition hover:text-cyan-50">{expanded ? 'Ocultar detalles' : 'Mostrar detalles'}</button>

                {expanded ? isTwitter ? (
                  <div className="mt-5 space-y-4 rounded-[24px] border border-white/8 bg-slate-950/55 p-5">
                    {twitterSession ? (
                      <div className="rounded-[24px] border border-emerald-400/18 bg-emerald-400/8 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65">{twitterSession.profile.profileImageUrl ? <img src={twitterSession.profile.profileImageUrl} alt={twitterSession.profile.username} className="h-full w-full object-cover" /> : <AtSign className="h-6 w-6 text-cyan-100" />}</div>
                            <div><p className="text-base font-semibold text-slate-100">{twitterSession.profile.name}</p><p className="mt-1 text-sm text-slate-300">@{twitterSession.profile.username}</p><p className="mt-1 text-xs text-slate-400">Token valido hasta: {formatExpiry(twitterSession)}</p></div>
                          </div>
                          <div className="grid gap-2 text-sm text-slate-200 sm:text-right"><span>Seguidores: {twitterSession.profile.publicMetrics?.followersCount?.toLocaleString() ?? 'n/d'}</span><span>Tweets: {twitterSession.profile.publicMetrics?.tweetCount?.toLocaleString() ?? 'n/d'}</span></div>
                        </div>
                      </div>
                    ) : null}

                    {twitterNotice ? <div className="rounded-2xl border border-cyan-400/18 bg-cyan-400/8 px-4 py-3 text-sm text-slate-200">{twitterNotice}</div> : null}
                    {twitterError ? <div className="rounded-2xl border border-rose-400/18 bg-rose-400/8 px-4 py-3 text-sm text-slate-200">{twitterError}</div> : null}

                    <div className="grid gap-4 lg:grid-cols-2">
                      <label className="space-y-2"><span className="text-sm text-slate-300">Client ID de X</span><input value={twitterConfig.clientId} onChange={(event) => setTwitterConfig((current) => ({ ...current, clientId: event.target.value }))} placeholder="Introduce el Client ID OAuth 2.0" className="w-full rounded-2xl border border-white/8 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15" /></label>
                      <label className="space-y-2"><span className="text-sm text-slate-300">Redirect URI</span><input value={twitterConfig.redirectUri} onChange={(event) => setTwitterConfig((current) => ({ ...current, redirectUri: event.target.value }))} placeholder="http://localhost:4173/" className="w-full rounded-2xl border border-white/8 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15" /></label>
                    </div>
                    <label className="space-y-2"><span className="text-sm text-slate-300">Scopes OAuth</span><input value={twitterConfig.scopes.join(' ')} onChange={(event) => setTwitterConfig((current) => ({ ...current, scopes: splitScopes(event.target.value) }))} placeholder="tweet.read users.read tweet.write offline.access" className="w-full rounded-2xl border border-white/8 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15" /></label>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={saveTwitterSettings} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${accent.button}`}><Save className="h-4 w-4" />Guardar config</button>
                      <button type="button" onClick={() => setTwitterConfig((current) => ({ ...current, redirectUri: getDefaultTwitterConfig().redirectUri }))} className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/6"><RefreshCcw className="h-4 w-4" />Usar URL actual</button>
                      {twitterSession ? <button type="button" onClick={() => void refreshTwitter()} disabled={twitterBusy} className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-60">{twitterBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}Renovar token</button> : <button type="button" onClick={() => void connectTwitter()} disabled={twitterBusy} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${accent.button}`}>{twitterBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Conectar con X</button>}
                      <button type="button" onClick={() => void importLocalTwitterSession()} disabled={twitterBusy} className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-60">{twitterBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}Importar sesion local</button>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm leading-6 text-slate-300"><p className="font-medium text-slate-100">Checklist rapido</p><p className="mt-2">1. Activa OAuth 2.0 en tu app de X.</p><p>2. Registra exactamente esta callback: {twitterConfig.redirectUri || 'pendiente'}.</p><p>3. Usa al menos users.read, tweet.read y offline.access.</p></div>
                      <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm leading-6 text-slate-300"><p className="font-medium text-slate-100">Referencia oficial</p><p className="mt-2">El flujo sigue la documentacion oficial de X para Authorization Code con PKCE en clientes publicos.</p><a href="https://docs.x.com/fundamentals/authentication/oauth-2-0/user-access-token" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-cyan-100 hover:text-cyan-50">Abrir documentacion oficial<ExternalLink className="h-4 w-4" /></a></div>
                    </div>
                  </div>
                ) : integration.id === 'reportblock' ? (
                  <div className="mt-5">
                    <ReportBlockPanel />
                  </div>
                ) : (
                  <div className="mt-5 space-y-4 rounded-[24px] border border-white/8 bg-slate-950/55 p-5">
                    <div><label className="mb-2 block text-sm text-slate-300">API key o token</label><div className="relative"><KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type={integration.showKey ? 'text' : 'password'} value={integration.apiKey} onChange={(event) => updateGeneric(integration.id, { apiKey: event.target.value })} placeholder="Introduce la credencial" className="w-full rounded-2xl border border-white/8 bg-slate-950/75 py-3 pl-11 pr-12 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15" /><button type="button" onClick={() => updateGeneric(integration.id, { showKey: !integration.showKey })} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-white/8 bg-white/4 p-2 text-slate-300 transition hover:bg-white/6">{integration.showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                    <div><label className="mb-2 block text-sm text-slate-300">Bots asignados</label><div className="flex gap-3"><div className="relative flex-1"><Bot className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="number" min={0} value={integration.botsAssigned} onChange={(event) => updateGeneric(integration.id, { botsAssigned: Math.max(0, Number(event.target.value)) })} className="w-full rounded-2xl border border-white/8 bg-slate-950/75 py-3 pl-11 pr-4 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15" /></div><button type="button" className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${accent.button}`}>Guardar</button></div></div>
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm leading-6 text-slate-300">Ajuste rapido: esta tarjeta concentra conexion, cuota, clave y recursos en una sola superficie.</div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel rounded-[30px] p-6"><div className="relative z-10"><h3 className="text-xl font-semibold text-slate-100">Acciones rapidas</h3><div className="mt-4 space-y-3 text-sm text-slate-300"><div className="rounded-2xl border border-cyan-400/18 bg-cyan-400/8 p-4">Configura el Client ID de X y usa la Redirect URI exacta del entorno local.</div><div className="rounded-2xl border border-violet-400/18 bg-violet-400/8 p-4">Mantener offline.access permite renovar la sesion sin pedir login cada vez.</div><div className="rounded-2xl border border-emerald-400/18 bg-emerald-400/8 p-4">El resto de integraciones conserva el flujo visual unificado del panel.</div></div></div></div>
        <div className="panel rounded-[30px] p-6"><div className="relative z-10"><h3 className="text-xl font-semibold text-slate-100">Estado del conector X</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/8 bg-white/4 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sesion</p><p className="mt-3 text-sm leading-6 text-slate-300">{twitterSession ? `Conectado como @${twitterSession.profile.username}` : 'Sin cuenta conectada'}</p></div><div className="rounded-2xl border border-white/8 bg-white/4 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Redirect URI</p><p className="mt-3 break-all text-sm leading-6 text-slate-300">{twitterConfig.redirectUri || 'No configurada'}</p></div><div className="rounded-2xl border border-white/8 bg-white/4 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scopes</p><p className="mt-3 text-sm leading-6 text-slate-300">{twitterConfig.scopes.join(' ') || 'Sin scopes'}</p></div><div className="rounded-2xl border border-white/8 bg-white/4 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Seguridad</p><p className="mt-3 text-sm leading-6 text-slate-300">OAuth 2.0 PKCE implementado para cliente publico y revocacion soportada.</p></div></div>{twitterError ? <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-400/18 bg-rose-400/8 p-4 text-sm text-slate-200"><AlertTriangle className="mt-0.5 h-5 w-5 text-rose-100" /><span>{twitterError}</span></div> : null}</div></div>
      </section>

      <ReportWorkspace />
    </div>
  );
};

export default IntegrationHub;
