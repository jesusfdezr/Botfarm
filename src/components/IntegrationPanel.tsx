import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Link as LinkIcon,
  Cloud,
  Database,
  Server,
  Shield,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  RefreshCw
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  features: string[];
  color: string;
}

const integrationTone = {
  green: {
    soft: 'bg-emerald-500/20',
    text: 'text-emerald-400',
  },
  black: {
    soft: 'bg-slate-500/20',
    text: 'text-slate-200',
  },
  purple: {
    soft: 'bg-violet-500/20',
    text: 'text-violet-400',
  },
  yellow: {
    soft: 'bg-amber-500/20',
    text: 'text-amber-400',
  },
  red: {
    soft: 'bg-rose-500/20',
    text: 'text-rose-400',
  },
  orange: {
    soft: 'bg-orange-500/20',
    text: 'text-orange-400',
  },
  blue: {
    soft: 'bg-blue-500/20',
    text: 'text-blue-400',
  },
  cyan: {
    soft: 'bg-cyan-500/20',
    text: 'text-cyan-400',
  },
} as const;

export const IntegrationPanel = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Base de datos en tiempo real y autenticación',
      icon: <Database className="w-5 h-5" />,
      status: 'connected',
      features: ['Almacenamiento de bots', 'Logs en tiempo real', 'Sincronización'],
      color: 'green'
    },
    {
      id: 'vercel',
      name: 'Vercel',
      description: 'Despliegue y serverless functions',
      icon: <Cloud className="w-5 h-5" />,
      status: 'connected',
      features: ['Despliegue automático', 'Edge Functions', 'Analytics'],
      color: 'black'
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Control de versiones y CI/CD',
      icon: <Settings className="w-5 h-5" />,
      status: 'connected',
      features: ['Versionado', 'Actions automatizadas', 'Collaboration'],
      color: 'purple'
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare Workers',
      description: 'Edge computing distribuido',
      icon: <Zap className="w-5 h-5" />,
      status: 'disconnected',
      features: ['Edge execution', 'Distributed bots', 'Low latency'],
      color: 'yellow'
    },
    {
      id: 'redis',
      name: 'Upstash Redis',
      description: 'Cache y cola de tareas',
      icon: <Server className="w-5 h-5" />,
      status: 'disconnected',
      features: ['Task queue', 'Real-time cache', 'Session storage'],
      color: 'red'
    },
    {
      id: 'n8n',
      name: 'n8n.io',
      description: 'Automatización de workflows',
      icon: <LinkIcon className="w-5 h-5" />,
      status: 'disconnected',
      features: ['Workflow automation', 'API integrations', 'Custom triggers'],
      color: 'orange'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Conexiones con 5000+ apps',
      icon: <Zap className="w-5 h-5" />,
      status: 'disconnected',
      features: ['Multi-app triggers', 'Automated actions', 'Webhooks'],
      color: 'blue'
    },
    {
      id: 'monitoring',
      name: 'Uptime Kuma',
      description: 'Monitoreo y alertas',
      icon: <Shield className="w-5 h-5" />,
      status: 'disconnected',
      features: ['Health checks', 'Alerts', 'Performance metrics'],
      color: 'cyan'
    }
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(integration => {
      if (integration.id === id) {
        const newStatus = integration.status === 'connected' ? 'disconnected' : 'connected';
        return { ...integration, status: newStatus };
      }
      return integration;
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'configuring': return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConnectedCount = () => {
    return integrations.filter(i => i.status === 'connected').length;
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Plataformas Integradas</h3>
            <p className="text-gray-400 text-sm mt-1">
              {getConnectedCount()} de {integrations.length} servicios conectados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-medium">SISTEMA ONLINE</span>
            </div>
          </div>
        </div>

        {/* Active Integrations */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {integrations.filter(i => i.status === 'connected').map((integration) => {
            const tone = integrationTone[integration.color as keyof typeof integrationTone];

            return (
            <div 
              key={integration.id}
              className="bg-gray-800/50 rounded-lg p-3 border border-green-500/30 flex items-center gap-2"
            >
              <div className={`p-2 rounded ${tone.soft}`}>
                {integration.icon}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{integration.name}</p>
                <p className="text-green-400 text-xs">Conectado</p>
              </div>
            </div>
          )})}
        </div>
      </motion.div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration, index) => {
          const tone = integrationTone[integration.color as keyof typeof integrationTone];

          return (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-gray-900/50 backdrop-blur-sm border rounded-xl p-6 transition-all cursor-pointer hover:scale-105 ${
              integration.status === 'connected' 
                ? 'border-green-500/50' 
                : 'border-gray-700/50 hover:border-gray-600/50'
            }`}
            onClick={() => setSelectedIntegration(integration.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${tone.soft}`}>
                <div className={tone.text}>
                  {integration.icon}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(integration.status)}
                <span className={`text-xs px-2 py-1 rounded ${
                  integration.status === 'connected' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {integration.status.toUpperCase()}
                </span>
              </div>
            </div>

            <h4 className="text-white font-semibold mb-2">{integration.name}</h4>
            <p className="text-gray-400 text-sm mb-4">{integration.description}</p>

            <div className="space-y-2 mb-4">
              {integration.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleIntegration(integration.id);
              }}
              className={`w-full py-2 rounded-lg font-medium transition-all ${
                integration.status === 'connected'
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
              }`}
            >
              {integration.status === 'connected' ? 'Desconectar' : 'Conectar'}
            </button>
          </motion.div>
        )})}
      </div>

      {/* Configuration Panel */}
      {selectedIntegration && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Configuración de {integrations.find(i => i.id === selectedIntegration)?.name}
            </h3>
            <button
              onClick={() => setSelectedIntegration(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">API Key / Token</label>
              <input
                type="password"
                placeholder="Ingrese su clave API..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Endpoint (opcional)</label>
              <input
                type="text"
                placeholder="https://..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-all">
                Guardar Configuración
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* System Status */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-400" />
          Estado del Sistema
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Uptime', value: '99.9%', color: 'green' },
            { label: 'Latencia', value: '23ms', color: 'blue' },
            { label: 'Requests/min', value: '1,234', color: 'purple' },
            { label: 'Error Rate', value: '0.01%', color: 'green' },
          ].map((stat) => {
            const tone = integrationTone[stat.color as keyof typeof integrationTone];

            return (
            <div key={stat.label} className="bg-gray-800/50 rounded-lg p-4 text-center">
              <p className={`text-2xl font-bold ${tone.text}`}>{stat.value}</p>
              <p className="text-gray-400 text-xs mt-1">{stat.label}</p>
            </div>
          )})}
        </div>
      </motion.div>
    </div>
  );
};
