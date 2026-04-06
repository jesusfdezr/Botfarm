import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Download,
  ExternalLink,
  Flag,
  Shield,
  ShieldCheck,
  UserX,
  Users,
} from 'lucide-react';

interface ReportedAccount {
  id: string;
  username: string;
  displayName: string;
  reason: 'spam' | 'harassment' | 'fake' | 'abusive';
  status: 'pending' | 'reported' | 'blocked';
  timestamp: Date;
}

const reasons = {
  spam: { label: 'Spam', icon: '🤖', color: 'from-amber-400 to-orange-500' },
  harassment: { label: 'Acoso', icon: '⚠️', color: 'from-rose-400 to-red-500' },
  fake: { label: 'Fake', icon: '🎭', color: 'from-violet-400 to-purple-500' },
  abusive: { label: 'Abusivo', icon: '🚫', color: 'from-cyan-400 to-blue-500' },
};

const statusTone = {
  pending: 'bg-white/5 text-slate-400',
  reported: 'bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-300',
  blocked: 'bg-gradient-to-r from-rose-400/20 to-red-500/20 text-rose-300',
};

export const ReportBlockPanel = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'accounts' | 'extension'>('extension');
  const [targetUsername, setTargetUsername] = useState('');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [reportedAccounts, setReportedAccounts] = useState<ReportedAccount[]>([
    {
      id: '1',
      username: 'spambot123456',
      displayName: 'Follow4Follow',
      reason: 'spam',
      status: 'reported',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      username: 'fakeuser789',
      displayName: 'Crypto Giveaway',
      reason: 'fake',
      status: 'blocked',
      timestamp: new Date(Date.now() - 7200000),
    },
  ]);
  const [showWarning, setShowWarning] = useState(true);

  const handleReport = () => {
    if (!targetUsername || !selectedReason) return;

    const newAccount: ReportedAccount = {
      id: Date.now().toString(),
      username: targetUsername,
      displayName: targetUsername,
      reason: selectedReason as any,
      status: 'pending',
      timestamp: new Date(),
    };

    setReportedAccounts([newAccount, ...reportedAccounts]);
    setTargetUsername('');
    setSelectedReason('');
  };

  const updateStatus = (id: string, status: 'reported' | 'blocked') => {
    setReportedAccounts(
      reportedAccounts.map((acc) =>
        acc.id === id ? { ...acc, status } : acc
      )
    );
  };

  const stats = {
    total: reportedAccounts.length,
    reported: reportedAccounts.filter((a) => a.status === 'reported').length,
    blocked: reportedAccounts.filter((a) => a.status === 'blocked').length,
    pending: reportedAccounts.filter((a) => a.status === 'pending').length,
  };

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-[16px] bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-300">Uso responsable requerido</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Estas herramientas son solo para spam/harassment legítimo. Reportes falsos pueden resultar en suspensión de cuenta.
                  </p>
                </div>
                <button
                  onClick={() => setShowWarning(false)}
                  className="text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-[12px] bg-white/5 p-3 text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Total</p>
        </div>
        <div className="rounded-[12px] bg-gradient-to-br from-amber-400/20 to-orange-500/20 p-3 text-center">
          <p className="text-2xl font-bold text-amber-300">{stats.reported}</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Reportados</p>
        </div>
        <div className="rounded-[12px] bg-gradient-to-br from-rose-400/20 to-red-500/20 p-3 text-center">
          <p className="text-2xl font-bold text-rose-300">{stats.blocked}</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Bloqueados</p>
        </div>
        <div className="rounded-[12px] bg-white/5 p-3 text-center">
          <p className="text-2xl font-bold text-slate-300">{stats.pending}</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Pendientes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'extension' as const, label: 'Extensión', icon: Download },
          { id: 'manual' as const, label: 'Manual', icon: Flag },
          { id: 'accounts' as const, label: 'Cuentas', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${isActive
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Extension Tab */}
      {activeTab === 'extension' && (
        <div className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Chrome Extension</p>
              <p className="text-xs text-slate-400">Automatiza detección y reporte de spam</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-white/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <p className="text-sm font-semibold text-white">Características</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-400">Escaneo de notificaciones</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-400">Detección automática de spam</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-400">Reporte con un clic</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-400">Bloqueo con un clic</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-400">Sin API requerida</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-400">100% local y privado</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-4">
              <p className="mb-3 text-sm font-semibold text-white">Instalación</p>
              <ol className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-[10px] font-bold text-cyan-300">
                    1
                  </span>
                  <span>Abre Chrome y navega a <code className="rounded bg-white/10 px-1.5 py-0.5">chrome://extensions/</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-[10px] font-bold text-cyan-300">
                    2
                  </span>
                  <span>Activa <strong className="text-white">Modo de desarrollador</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-[10px] font-bold text-cyan-300">
                    3
                  </span>
                  <span>Haz clic en <strong className="text-white">Cargar descomprimida</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-[10px] font-bold text-cyan-300">
                    4
                  </span>
                  <span>Selecciona la carpeta <code className="rounded bg-white/10 px-1.5 py-0.5">chrome-extension</code></span>
                </li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110">
                <Download className="h-4 w-4" />
                Ver documentación
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
                <ExternalLink className="h-4 w-4" />
                Abrir Twitter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Report Tab */}
      {activeTab === 'manual' && (
        <div className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
              <Flag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Reporte Manual</p>
              <p className="text-xs text-slate-400">Reportea cuentas específicas</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs text-slate-400">Username objetivo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">@</span>
                <input
                  type="text"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  placeholder="username"
                  className="w-full rounded-xl bg-white/5 py-3 pl-8 pr-4 text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-400">Motivo del reporte</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(reasons).map(([key, reason]) => {
                  const isSelected = selectedReason === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedReason(key)}
                      className={`rounded-xl p-3 text-left text-sm font-medium transition-all ${isSelected
                          ? `bg-gradient-to-r ${reason.color} text-white shadow-md`
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      <span className="text-base">{reason.icon}</span>
                      <span className="ml-2">{reason.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleReport}
              disabled={!targetUsername || !selectedReason}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Flag className="mr-2 inline h-4 w-4" />
              Agregar a lista de reportes
            </button>
          </div>
        </div>
      )}

      {/* Accounts List Tab */}
      {activeTab === 'accounts' && (
        <div className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-red-500 text-white shadow-lg">
                <UserX className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Cuentas Reporteadas</p>
                <p className="text-xs text-slate-400">{reportedAccounts.length} cuentas</p>
              </div>
            </div>
          </div>

          <div className="max-h-[400px] space-y-2 overflow-y-auto scrollbar-hide">
            {reportedAccounts.length === 0 ? (
              <div className="rounded-xl bg-white/5 p-8 text-center text-sm text-slate-500">
                Sin cuentas reporteadas
              </div>
            ) : (
              reportedAccounts.map((account) => {
                const reason = reasons[account.reason];
                return (
                  <div key={account.id} className="rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg bg-gradient-to-br ${reason.color} px-2.5 py-1.5 text-sm`}>
                          {reason.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">@{account.username}</p>
                          <p className="text-[10px] text-slate-500">
                            {account.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${statusTone[account.status]}`}>
                          {account.status.toUpperCase()}
                        </span>
                        {account.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(account.id, 'reported')}
                              className="rounded-lg bg-amber-400/20 px-3 py-1.5 text-[10px] font-bold text-amber-300 transition hover:bg-amber-400/30"
                            >
                              Reporteado
                            </button>
                            <button
                              onClick={() => updateStatus(account.id, 'blocked')}
                              className="rounded-lg bg-rose-400/20 px-3 py-1.5 text-[10px] font-bold text-rose-300 transition hover:bg-rose-400/30"
                            >
                              Bloqueado
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
