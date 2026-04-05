import React, { useState } from 'react';
import { Globe, Plus, Trash2, Activity, Users, MessageSquare, Link as LinkIcon } from 'lucide-react';

interface SocialNetwork {
  id: string;
  name: string;
  emoji: string;
  connected: boolean;
  account: string;
  status: 'active' | 'inactive' | 'error' | 'connecting';
  capabilities: string[];
  botCount: number;
  lastActivity: string;
}

interface NetworkAction {
  id: string;
  network: string;
  action: string;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: string;
  botsAssigned: number;
}

const availableNetworks = [
  { id: 'twitter', name: 'Twitter/X', emoji: '𝕏', capabilities: ['post', 'reply', 'like', 'retweet', 'trending', 'dm'] },
  { id: 'instagram', name: 'Instagram', emoji: '📸', capabilities: ['post', 'story', 'reel', 'comment', 'dm', 'like'] },
  { id: 'linkedin', name: 'LinkedIn', emoji: '💼', capabilities: ['post', 'comment', 'message', 'connect', 'share'] },
  { id: 'facebook', name: 'Facebook', emoji: '📘', capabilities: ['post', 'comment', 'share', 'message', 'group'] },
  { id: 'youtube', name: 'YouTube', emoji: '📺', capabilities: ['upload', 'comment', 'like', 'subscribe', 'live'] },
  { id: 'tiktok', name: 'TikTok', emoji: '🎵', capabilities: ['post', 'comment', 'like', 'duet', 'trend'] },
  { id: 'reddit', name: 'Reddit', emoji: '🤖', capabilities: ['post', 'comment', 'vote', 'message', 'moderate'] },
  { id: 'discord', name: 'Discord', emoji: '💬', capabilities: ['message', 'voice', 'moderate', 'bot', 'webhook'] },
  { id: 'telegram', name: 'Telegram', emoji: '✈️', capabilities: ['message', 'channel', 'bot', 'group', 'broadcast'] },
  { id: 'whatsapp', name: 'WhatsApp', emoji: '📱', capabilities: ['message', 'broadcast', 'group', 'status'] },
  { id: 'pinterest', name: 'Pinterest', emoji: '📌', capabilities: ['pin', 'board', 'comment', 'follow'] },
  { id: 'snapchat', name: 'Snapchat', emoji: '👻', capabilities: ['snap', 'story', 'chat', 'discover'] },
  { id: 'twitch', name: 'Twitch', emoji: '🎮', capabilities: ['stream', 'chat', 'follow', 'moderate'] },
  { id: 'signal', name: 'Signal', emoji: '🔒', capabilities: ['message', 'group', 'broadcast'] },
];

const SocialNetworksPanel: React.FC = () => {
  const [networks, setNetworks] = useState<SocialNetwork[]>([]);
  const [actions, setActions] = useState<NetworkAction[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [actionContent, setActionContent] = useState('');
  const [actionType, setActionType] = useState('');
  const [botsToAssign, setBotsToAssign] = useState(100);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNetworkId, setNewNetworkId] = useState('');
  const [newAccount, setNewAccount] = useState('');

  const connectNetwork = (networkId: string) => {
    const network = availableNetworks.find(n => n.id === networkId);
    if (!network) return;

    setNetworks(prev => [...prev, {
      id: network.id,
      name: network.name,
      emoji: network.emoji,
      connected: true,
      account: newAccount || `@bot_${network.id}`,
      status: 'connecting',
      capabilities: network.capabilities,
      botCount: 0,
      lastActivity: 'Never'
    }]);

    setShowAddModal(false);
    setNewNetworkId('');
    setNewAccount('');
  };

  const disconnectNetwork = (networkId: string) => {
    setNetworks(prev => prev.filter(n => n.id !== networkId));
  };

  const executeAction = () => {
    if (!selectedNetwork || !actionContent || !actionType) return;

    const newAction: NetworkAction = {
      id: `action_${Date.now()}`,
      network: selectedNetwork,
      action: actionType,
      content: actionContent,
      status: 'pending',
      timestamp: new Date().toISOString(),
      botsAssigned: botsToAssign
    };

    setActions(prev => [newAction, ...prev]);

    setTimeout(() => {
      setActions(prev => prev.map(a => 
        a.id === newAction.id ? { ...a, status: 'processing' } : a
      ));
    }, 1000);

    setTimeout(() => {
      setActions(prev => prev.map(a => 
        a.id === newAction.id ? { ...a, status: 'completed' } : a
      ));
      
      setNetworks(prev => prev.map(n => 
        n.id === selectedNetwork ? { ...n, lastActivity: 'Just now' } : n
      ));
    }, 3000);

    setActionContent('');
    setActionType('');
  };

  const getNetworkStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-purple-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Redes Sociales</h2>
              <p className="text-purple-300">Conecta y controla cualquier plataforma social</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Conectar Red
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networks.map(network => (
            <div key={network.id} className="bg-gray-900/80 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{network.emoji}</span>
                  <span className="font-semibold text-white">{network.name}</span>
                </div>
                <button
                  onClick={() => disconnectNetwork(network.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <LinkIcon className="w-3 h-3" />
                  <span>{network.account}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getNetworkStatusColor(network.status)}`}></div>
                  <span className="text-gray-400 capitalize">{network.status}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="w-3 h-3" />
                  <span>{network.botCount} bots asignados</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {network.capabilities.slice(0, 3).map(cap => (
                    <span key={cap} className="px-2 py-0.5 bg-purple-900/50 text-purple-300 text-xs rounded">
                      {cap}
                    </span>
                  ))}
                  {network.capabilities.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">
                      +{network.capabilities.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {networks.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay redes sociales conectadas</p>
              <p className="text-sm mt-2">Conecta tu primera red para empezar</p>
            </div>
          )}
        </div>
      </div>

      {networks.length > 0 && (
        <>
          <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-400" />
              Ejecutar Acción en Redes
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Red Social</label>
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">Selecciona una red</option>
                  {networks.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Acción</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">Selecciona acción</option>
                  {selectedNetwork && networks.find(n => n.id === selectedNetwork)?.capabilities.map(cap => (
                    <option key={cap} value={cap}>{cap.charAt(0).toUpperCase() + cap.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Bots a Asignar</label>
                <input
                  type="number"
                  value={botsToAssign}
                  onChange={(e) => setBotsToAssign(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  min="1"
                  max="25000"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={executeAction}
                  disabled={!selectedNetwork || !actionType || !actionContent}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                >
                  Ejecutar
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Contenido / Mensaje</label>
              <textarea
                value={actionContent}
                onChange={(e) => setActionContent(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-24"
                placeholder="Escribe el contenido que quieres publicar o la acción que quieres realizar..."
              />
            </div>
          </div>

          <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-400" />
              Historial de Acciones
            </h3>
            
            <div className="space-y-3">
              {actions.map(action => (
                <div key={action.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getActionStatusColor(action.status)}`}>
                      {action.status}
                    </div>
                    <div>
                      <p className="text-white font-medium">{action.action}</p>
                      <p className="text-sm text-gray-400">{action.content}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{action.network}</p>
                    <p className="text-xs text-gray-500">{action.botsAssigned} bots</p>
                  </div>
                </div>
              ))}
              
              {actions.length === 0 && (
                <p className="text-center text-gray-500 py-8">No hay acciones registradas</p>
              )}
            </div>
          </div>
        </>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Conectar Nueva Red Social</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Selecciona la Red</label>
                <select
                  value={newNetworkId}
                  onChange={(e) => setNewNetworkId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">Selecciona una red</option>
                  {availableNetworks.map(n => (
                    <option key={n.id} value={n.id}>{n.emoji} {n.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Cuenta / Usuario</label>
                <input
                  type="text"
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="@usuario"
                />
              </div>

              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-purple-300">
                  <strong>Nota:</strong> Para conectar redes sociales reales, necesitarás configurar las API keys en tu panel de desarrollador de cada plataforma. Los bots se conectarán automáticamente una vez autorizadas.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => connectNetwork(newNetworkId)}
                  disabled={!newNetworkId || !newAccount}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white"
                >
                  Conectar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialNetworksPanel;
