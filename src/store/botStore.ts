import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { generateAIResponse } from '../utils/ollama';
import { supabase } from '../utils/supabase';

export type BotRank = 'capitan' | 'teniente' | 'alferez' | 'sargento' | 'soldado';
export type BotStatus = 'idle' | 'working' | 'completed' | 'failed' | 'paused';
export type GroupStatus = 'active' | 'paused' | 'maintenance';
export type FleetProfile = 'light' | 'balanced' | 'heavy';
export type AutoscaleStatus = 'idle' | 'watching' | 'cooldown' | 'triggered' | 'limit';

export interface Bot {
  id: string;
  name: string;
  rank: BotRank;
  groupId: string;
  groupName: string;
  parentId: string | null;
  status: BotStatus;
  currentTask: string | null;
  completedTasks: number;
  failedTasks: number;
  efficiency: number;
  lastActive: Date;
  skills: string[];
  specialization: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  captainId: string | null;
  totalBots: number;
  activeBots: number;
  completedTasks: number;
  status: GroupStatus;
  profile: FleetProfile;
  focus: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  command: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  assignedGroup: string | null;
  assignedBots: string[];
  createdAt: Date;
  completedAt: Date | null;
  progress: number;
  result: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CommandLog {
  id: string;
  command: string;
  timestamp: Date;
  status: 'success' | 'error' | 'processing';
  response: string;
}

export interface AutoscaleSettings {
  enabled: boolean;
  queueThreshold: number;
  minIdleBots: number;
  cooldownSeconds: number;
  maxGroups: number;
  profile: FleetProfile;
  growthStep: number;
  nameBase: string;
  description: string;
  focus: string;
}

export interface AutoscaleState {
  status: AutoscaleStatus;
  lastCheckAt: Date | null;
  lastTriggeredAt: Date | null;
  lastReason: string;
  lastCreatedIds: string[];
}

interface CreateFarmInput {
  nameBase: string;
  description: string;
  focus: string;
  profile: FleetProfile;
  quantity: number;
}

interface BotStore {
  bots: Bot[];
  groups: Group[];
  tasks: Task[];
  commandLogs: CommandLog[];
  autoscaleSettings: AutoscaleSettings;
  autoscaleState: AutoscaleState;
  initializeBots: () => void;
  addCommand: (command: string) => string;
  updateCommandLog: (logId: string, status: CommandLog['status'], response: string) => void;
  executeCommand: (command: string) => Promise<void>;
  updateBotStatus: (botId: string, status: BotStatus, task?: string | null) => void;
  assignTaskToGroup: (groupId: string, task: Task) => void;
  createFarmGroups: (input: CreateFarmInput) => string[];
  setGroupStatus: (groupId: string, status: GroupStatus) => void;
  rebalanceFleet: () => void;
  updateAutoscaleSettings: (settings: Partial<AutoscaleSettings>) => void;
  runAutoscaleCycle: () => boolean;
  getStats: () => {
    totalBots: number;
    activeBots: number;
    totalTasks: number;
    completedTasks: number;
    successRate: number;
  };
  getGroupStats: (groupId: string) => {
    totalBots: number;
    activeBots: number;
    completedTasks: number;
    efficiency: number;
  };
}

const DEFAULT_GROUP_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet'];

const SKILLS = [
  'web-scraping',
  'data-analysis',
  'automation',
  'api-integration',
  'text-processing',
  'image-processing',
  'database-management',
  'cloud-services',
  'security-audit',
  'performance-optimization',
  'machine-learning',
  'natural-language',
  'code-generation',
  'testing',
  'deployment',
  'monitoring',
  'backup',
  'encryption',
];

const SPECIALIZATIONS = [
  'Data Processing',
  'Web Automation',
  'API Management',
  'Security Analysis',
  'Performance Optimization',
  'Code Generation',
  'Testing & QA',
  'Cloud Infrastructure',
  'Database Management',
  'Machine Learning',
  'Natural Language Processing',
  'Image Analysis',
];

const rankPrefix: Record<BotRank, string> = {
  capitan: 'CAP',
  teniente: 'TEN',
  alferez: 'ALF',
  sargento: 'SGT',
  soldado: 'SOL',
};

const rankBatchSize: Record<Task['priority'], number> = {
  low: 14,
  medium: 24,
  high: 36,
  critical: 48,
};

export const fleetShape: Record<
  FleetProfile,
  { tenientes: number; alferecesPerTeniente: number; sargentosPerAlferez: number; soldadosPerSargento: number }
> = {
  light: { tenientes: 2, alferecesPerTeniente: 3, sargentosPerAlferez: 4, soldadosPerSargento: 10 },
  balanced: { tenientes: 3, alferecesPerTeniente: 4, sargentosPerAlferez: 6, soldadosPerSargento: 12 },
  heavy: { tenientes: 3, alferecesPerTeniente: 5, sargentosPerAlferez: 8, soldadosPerSargento: 20 },
};

export const getFleetSize = (profile: FleetProfile) => {
  const shape = fleetShape[profile];
  return (
    1 +
    shape.tenientes +
    shape.tenientes * shape.alferecesPerTeniente +
    shape.tenientes * shape.alferecesPerTeniente * shape.sargentosPerAlferez +
    shape.tenientes * shape.alferecesPerTeniente * shape.sargentosPerAlferez * shape.soldadosPerSargento
  );
};

const defaultAutoscaleSettings: AutoscaleSettings = {
  enabled: true,
  queueThreshold: 6,
  minIdleBots: 6000,
  cooldownSeconds: 20,
  maxGroups: 24,
  profile: 'balanced',
  growthStep: 1,
  nameBase: 'Sector Auto',
  description: 'Sector generado automaticamente para reforzar la granja',
  focus: 'Respuesta automatica a picos de carga',
};

const defaultAutoscaleState: AutoscaleState = {
  status: defaultAutoscaleSettings.enabled ? 'watching' : 'idle',
  lastCheckAt: null,
  lastTriggeredAt: null,
  lastReason: 'Autoscaler listo para vigilar la carga.',
  lastCreatedIds: [],
};

const getGroupId = (index: number) => `GRP-${String(index + 1).padStart(2, '0')}`;

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const generateBotName = (rank: BotRank, groupId: string, index: number) =>
  `${rankPrefix[rank]}-${groupId}-${String(index).padStart(3, '0')}`;

const pickSpecialization = (focus?: string) => focus?.trim() || SPECIALIZATIONS[Math.floor(Math.random() * SPECIALIZATIONS.length)];

const makeBot = (rank: BotRank, groupId: string, groupName: string, index: number, parentId: string | null, skillDepth: number, focus?: string): Bot => ({
  id: uuidv4(),
  name: generateBotName(rank, groupId, index),
  rank,
  groupId,
  groupName,
  parentId,
  status: 'idle',
  currentTask: null,
  completedTasks: 0,
  failedTasks: 0,
  efficiency: 96 + Math.floor(Math.random() * 5),
  lastActive: new Date(),
  skills: SKILLS.slice(0, skillDepth),
  specialization: pickSpecialization(focus),
});

const createHierarchy = (groupId: string, groupName: string, profile: FleetProfile, focus?: string): Bot[] => {
  const shape = fleetShape[profile];
  const bots: Bot[] = [];

  const captain = makeBot('capitan', groupId, groupName, 1, null, SKILLS.length, focus);
  bots.push(captain);

  const tenientes: Bot[] = [];
  for (let index = 1; index <= shape.tenientes; index += 1) {
    const teniente = makeBot('teniente', groupId, groupName, index, captain.id, Math.min(12, 6 + index), focus);
    bots.push(teniente);
    tenientes.push(teniente);
  }

  const alfereces: Bot[] = [];
  tenientes.forEach((teniente, tenienteIndex) => {
    for (let index = 1; index <= shape.alferecesPerTeniente; index += 1) {
      const alferez = makeBot(
        'alferez',
        groupId,
        groupName,
        tenienteIndex * shape.alferecesPerTeniente + index,
        teniente.id,
        8,
        focus,
      );
      bots.push(alferez);
      alfereces.push(alferez);
    }
  });

  const sargentos: Bot[] = [];
  alfereces.forEach((alferez, alferezIndex) => {
    for (let index = 1; index <= shape.sargentosPerAlferez; index += 1) {
      const sargento = makeBot(
        'sargento',
        groupId,
        groupName,
        alferezIndex * shape.sargentosPerAlferez + index,
        alferez.id,
        6,
        focus,
      );
      bots.push(sargento);
      sargentos.push(sargento);
    }
  });

  sargentos.forEach((sargento, sargentoIndex) => {
    for (let index = 1; index <= shape.soldadosPerSargento; index += 1) {
      bots.push(
        makeBot(
          'soldado',
          groupId,
          groupName,
          sargentoIndex * shape.soldadosPerSargento + index,
          sargento.id,
          4,
          focus,
        ),
      );
    }
  });

  return bots;
};

const createGroupRecord = (
  name: string,
  index: number,
  profile: FleetProfile,
  focus: string,
  description: string,
  allBots: Bot[],
): Group => {
  const groupId = getGroupId(index);
  const groupBots = createHierarchy(groupId, name, profile, focus);
  allBots.push(...groupBots);

  return {
    id: groupId,
    name,
    description,
    captainId: groupBots.find((bot) => bot.rank === 'capitan')?.id ?? null,
    totalBots: groupBots.length,
    activeBots: 0,
    completedTasks: 0,
    status: 'active',
    profile,
    focus,
    createdAt: new Date(),
  };
};

const resolveTargetGroup = (command: string, groups: Group[]) => {
  const normalizedCommand = normalizeText(command);
  return groups.find((group) => normalizedCommand.includes(normalizeText(group.name)))?.id ?? null;
};

const getQueueSize = (tasks: Task[]) => tasks.filter((task) => task.status === 'pending' || task.status === 'processing').length;

const getIdleBots = (bots: Bot[]) => bots.filter((bot) => bot.status === 'idle').length;

export const useBotStore = create<BotStore>((set, get) => ({
  bots: [],
  groups: [],
  tasks: [],
  commandLogs: [],
  autoscaleSettings: defaultAutoscaleSettings,
  autoscaleState: defaultAutoscaleState,

  initializeBots: async () => {
    try {
      const { data: dbGroups, error: groupsError } = await supabase.from('groups').select('*');
      const { data: dbBots, error: botsError } = await supabase.from('bots').select('*');

      if (groupsError || botsError) throw new Error('Error al cargar datos de Supabase');

      if (dbGroups && dbGroups.length > 0) {
        set({ 
          groups: dbGroups.map(g => ({ ...g, createdAt: new Date(g.created_at) })), 
          bots: dbBots.map(b => ({ ...b, lastActive: new Date(b.last_active) })) 
        });
        return;
      }

      // First initialization if DB is empty
      const allBots: Bot[] = [];
      const groups = DEFAULT_GROUP_NAMES.map((name, index) =>
        createGroupRecord(name, index, 'heavy', SPECIALIZATIONS[index % SPECIALIZATIONS.length], `Grupo de operaciones ${name}`, allBots),
      );

      // Save to Supabase
      await supabase.from('groups').insert(groups.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        captain_id: g.captainId,
        total_bots: g.totalBots,
        active_bots: g.activeBots,
        completed_tasks: g.completedTasks,
        status: g.status,
        profile: g.profile,
        focus: g.focus
      })));

      await supabase.from('bots').insert(allBots.map(b => ({
        id: b.id,
        name: b.name,
        rank: b.rank,
        group_id: b.groupId,
        group_name: b.groupName,
        parent_id: b.parentId,
        status: b.status,
        current_task: b.currentTask,
        completed_tasks: b.completedTasks,
        failed_tasks: b.failedTasks,
        efficiency: b.efficiency,
        specialization: b.specialization,
        skills: b.skills
      })));

      set({ bots: allBots, groups });
    } catch (err) {
      console.error('Persistence Error:', err);
    }
  },

  addCommand: (command) => {
    const id = uuidv4();
    const log: CommandLog = {
      id,
      command,
      timestamp: new Date(),
      status: 'processing',
      response: 'Orden recibida. Preparando asignacion y recursos.',
    };

    set((state) => ({ commandLogs: [log, ...state.commandLogs].slice(0, 120) }));
    return id;
  },

  updateCommandLog: (logId, status, response) => {
    set((state) => ({
      commandLogs: state.commandLogs.map((log) => (log.id === logId ? { ...log, status, response } : log)),
    }));
  },

  executeCommand: async (command) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) {
      return;
    }

    const normalizedCommand = normalizeText(trimmedCommand);
    const { addCommand, updateCommandLog, updateBotStatus } = get();
    const logId = addCommand(trimmedCommand);
    const groups = get().groups;
    const targetGroup = resolveTargetGroup(trimmedCommand, groups);

    let priority: Task['priority'] = 'medium';
    let assignedBots: string[] = [];

    if (normalizedCommand.includes('urgente') || normalizedCommand.includes('critico') || normalizedCommand.includes('critica')) {
      priority = 'critical';
    } else if (normalizedCommand.includes('importante') || normalizedCommand.includes('prioridad alta')) {
      priority = 'high';
    } else if (normalizedCommand.includes('baja') || normalizedCommand.includes('bajo impacto')) {
      priority = 'low';
    }

    const task: Task = {
      id: uuidv4(),
      command: trimmedCommand,
      status: 'pending',
      assignedGroup: targetGroup,
      assignedBots: [],
      createdAt: new Date(),
      completedAt: null,
      progress: 0,
      result: null,
      priority,
    };

    set((state) => ({ tasks: [task, ...state.tasks].slice(0, 500) }));
    
    // Log task to Supabase
    await supabase.from('tasks').insert([{
      id: task.id,
      command: task.command,
      status: task.status,
      assigned_group: task.assignedGroup,
      priority: task.priority,
      progress: task.progress
    }]);

    setTimeout(async () => {
      task.status = 'processing';
      task.progress = 8;
      set((state) => ({ tasks: state.tasks.map((currentTask) => (currentTask.id === task.id ? { ...task } : currentTask)) }));

      const availableBots = get().bots
        .filter((bot) => (!targetGroup || bot.groupId === targetGroup) && bot.status === 'idle')
        .slice(0, rankBatchSize[priority]);

      if (availableBots.length === 0) {
        task.status = 'failed';
        task.progress = 0;
        task.result = 'No hay bots disponibles con el filtro actual. Reintenta o libera capacidad.';
        updateCommandLog(logId, 'error', task.result);
        set((state) => ({ tasks: state.tasks.map((currentTask) => (currentTask.id === task.id ? { ...task } : currentTask)) }));
        return;
      }

      assignedBots = availableBots.map((bot) => bot.id);
      task.assignedBots = assignedBots;
      assignedBots.forEach((botId) => updateBotStatus(botId, 'working', trimmedCommand));

    updateCommandLog(logId, 'processing', `Orden en curso. ${assignedBots.length} bots asignados${targetGroup ? ` en ${targetGroup}` : ''}.`);

    try {
      const systemPrompt = `
        Eres el Orquestador Central de una "Granja de Bots Jerarquica". 
        Tu objetivo es interpretar las ordenes del operador y actuar como la inteligencia superior del sistema.
        
        Contexto del sistema:
        - Grupos: Alpha, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel, India, Juliet.
        - Rangos: Capitan, Teniente, Alferez, Sargento, Soldado.
        - Estado actual: El sistema esta operativo y los bots estan ejecutando la orden: "${trimmedCommand}".
        - Bots asignados: ${assignedBots.length} bots.
        - Prioridad: ${priority}.
        - Grupo objetivo: ${targetGroup || 'Global (Toda la flota)'}.

        Instrucciones:
        1. Responde de forma profesional, tecnica y futurista.
        2. Confirma que la orden se esta procesando segun los parametros indicados.
        3. Si la orden implica seguridad, analisis o rebalanceo, menciona brevemente como los bots de rango superior (Capitanes/Tenientes) estan supervisando la operacion.
        4. Mantén la respuesta concisa (máximo 3-4 frases).
        5. Habla en español.
      `;

      const aiResponse = await generateAIResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: trimmedCommand },
      ]);

      let progress = 12;
      const interval = setInterval(() => {
        progress += 12 + Math.random() * 18;

        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          task.status = 'completed';
          task.progress = progress;
          task.completedAt = new Date();
          task.result = aiResponse;

          assignedBots.forEach((botId) => updateBotStatus(botId, 'completed'));
          set((state) => ({ tasks: state.tasks.map((currentTask) => (currentTask.id === task.id ? { ...task } : currentTask)) }));
          updateCommandLog(logId, 'success', aiResponse);

          // Final sync to Supabase
          supabase.from('tasks').update({ 
            status: 'completed', 
            progress: 100, 
            result: aiResponse,
            completed_at: task.completedAt.toISOString()
          }).eq('id', task.id).then();

          setTimeout(() => {
            assignedBots.forEach((botId) => updateBotStatus(botId, 'idle'));
          }, 900);
          return;
        }

        task.progress = progress;
        set((state) => ({ tasks: state.tasks.map((currentTask) => (currentTask.id === task.id ? { ...task } : currentTask)) }));
        
        // Async update progress in Supabase
        supabase.from('tasks').update({ progress }).eq('id', task.id).then();
      }, 450);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el motor AI.';
      task.status = 'failed';
      task.result = `Fallo en el orquestador: ${errorMessage}`;
      updateCommandLog(logId, 'error', task.result);
      set((state) => ({ tasks: state.tasks.map((currentTask) => (currentTask.id === task.id ? { ...task } : currentTask)) }));
      assignedBots.forEach((botId) => updateBotStatus(botId, 'idle'));
      
      // Sync failure to Supabase
      supabase.from('tasks')
        .update({ status: 'failed', result: task.result })
        .eq('id', task.id)
        .then();
    }
    }, 600);
  },

  updateBotStatus: (botId, status, task) => {
    set((state) => ({
      bots: state.bots.map((bot) =>
        bot.id === botId
          ? {
              ...bot,
              status,
              currentTask: status === 'working' ? task ?? bot.currentTask : null,
              lastActive: new Date(),
              completedTasks: status === 'completed' ? bot.completedTasks + 1 : bot.completedTasks,
              failedTasks: status === 'failed' ? bot.failedTasks + 1 : bot.failedTasks,
            }
          : bot,
      ),
    }));

    // Sync bot status to Supabase
    const updatedBot = get().bots.find(b => b.id === botId);
    if (updatedBot) {
      supabase.from('bots').update({
        status: updatedBot.status,
        current_task: updatedBot.currentTask,
        completed_tasks: updatedBot.completedTasks,
        failed_tasks: updatedBot.failedTasks,
        last_active: updatedBot.lastActive.toISOString()
      }).eq('id', botId).then();
    }
  },

  assignTaskToGroup: (groupId, task) => {
    set((state) => ({
      tasks: state.tasks.map((currentTask) => (currentTask.id === task.id ? { ...currentTask, assignedGroup: groupId } : currentTask)),
    }));
  },

  createFarmGroups: ({ nameBase, description, focus, profile, quantity }) => {
    const createdIds: string[] = [];

    set((state) => {
      const nextBots = [...state.bots];
      const nextGroups = [...state.groups];
      const safeQuantity = Math.max(1, Math.min(quantity, 6));
      const cleanBase = nameBase.trim() || 'Sector';
      const cleanDescription = description.trim() || `Flota ${cleanBase}`;
      const cleanFocus = focus.trim() || pickSpecialization();

      for (let index = 0; index < safeQuantity; index += 1) {
        const suffix = safeQuantity > 1 ? ` ${String(index + 1).padStart(2, '0')}` : '';
        const group = createGroupRecord(
          `${cleanBase}${suffix}`,
          nextGroups.length,
          profile,
          cleanFocus,
          cleanDescription,
          nextBots,
        );
        nextGroups.push(group);
        createdIds.push(group.id);
      }

      return { bots: nextBots, groups: nextGroups };
    });

    const command = `${createdIds.length} grupos creados para la granja con perfil ${profile}.`;
    const logId = get().addCommand(command);
    get().updateCommandLog(logId, 'success', `Granja ampliada: ${createdIds.join(', ')}.`);
    return createdIds;
  },

  setGroupStatus: (groupId, status) => {
    set((state) => ({
      groups: state.groups.map((group) => (group.id === groupId ? { ...group, status } : group)),
      bots: state.bots.map((bot) =>
        bot.groupId === groupId
          ? {
              ...bot,
              status: status === 'paused' ? 'paused' : bot.status === 'paused' ? 'idle' : bot.status,
              currentTask: status === 'paused' ? null : bot.currentTask,
            }
          : bot,
      ),
    }));
  },

  rebalanceFleet: () => {
    set((state) => ({
      bots: state.bots.map((bot) => ({
        ...bot,
        efficiency: Math.min(100, Math.max(88, bot.efficiency + Math.floor(Math.random() * 7) - 2)),
        status: bot.status === 'failed' ? 'idle' : bot.status,
      })),
    }));

    const logId = get().addCommand('Rebalanceo general de la granja');
    get().updateCommandLog(logId, 'success', 'La granja redistribuyo capacidad y estabilizo la eficiencia general.');
  },

  updateAutoscaleSettings: (settings) => {
    set((state) => {
      const nextSettings = {
        ...state.autoscaleSettings,
        ...settings,
      };

      return {
        autoscaleSettings: nextSettings,
        autoscaleState: {
          ...state.autoscaleState,
          status: nextSettings.enabled ? state.autoscaleState.status === 'idle' ? 'watching' : state.autoscaleState.status : 'idle',
          lastReason: nextSettings.enabled
            ? state.autoscaleState.lastReason
            : 'Autoscaler pausado por operador.',
        },
      };
    });
  },

  runAutoscaleCycle: () => {
    const {
      autoscaleSettings,
      autoscaleState,
      bots,
      groups,
      tasks,
      createFarmGroups,
      addCommand,
      updateCommandLog,
    } = get();

    const now = new Date();
    const queueSize = getQueueSize(tasks);
    const idleBots = getIdleBots(bots);

    if (!autoscaleSettings.enabled) {
      set((state) => ({
        autoscaleState: {
          ...state.autoscaleState,
          status: 'idle',
          lastCheckAt: now,
          lastReason: 'Autoscaler pausado por operador.',
        },
      }));
      return false;
    }

    const remainingGroupSlots = autoscaleSettings.maxGroups - groups.length;
    if (remainingGroupSlots <= 0) {
      set((state) => ({
        autoscaleState: {
          ...state.autoscaleState,
          status: 'limit',
          lastCheckAt: now,
          lastReason: `Limite alcanzado: ${groups.length}/${autoscaleSettings.maxGroups} grupos.`,
        },
      }));
      return false;
    }

    const cooldownMs = autoscaleSettings.cooldownSeconds * 1000;
    const lastTriggeredAt = autoscaleState.lastTriggeredAt ? new Date(autoscaleState.lastTriggeredAt).getTime() : 0;
    if (lastTriggeredAt && now.getTime() - lastTriggeredAt < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - (now.getTime() - lastTriggeredAt)) / 1000);
      set((state) => ({
        autoscaleState: {
          ...state.autoscaleState,
          status: 'cooldown',
          lastCheckAt: now,
          lastReason: `Cooldown activo. Siguiente ventana en ${remainingSeconds}s.`,
        },
      }));
      return false;
    }

    const queuePressure = queueSize >= autoscaleSettings.queueThreshold;
    const reservePressure = queueSize > 0 && idleBots <= autoscaleSettings.minIdleBots;

    if (!queuePressure && !reservePressure) {
      set((state) => ({
        autoscaleState: {
          ...state.autoscaleState,
          status: 'watching',
          lastCheckAt: now,
          lastReason: `Monitorizando. Cola ${queueSize}/${autoscaleSettings.queueThreshold} y reserva ${idleBots}/${autoscaleSettings.minIdleBots}.`,
        },
      }));
      return false;
    }

    const reasonParts: string[] = [];
    if (queuePressure) {
      reasonParts.push(`cola ${queueSize}/${autoscaleSettings.queueThreshold}`);
    }
    if (reservePressure) {
      reasonParts.push(`reserva ${idleBots}/${autoscaleSettings.minIdleBots}`);
    }

    const quantity = Math.max(1, Math.min(autoscaleSettings.growthStep, remainingGroupSlots, 6));
    const createdIds = createFarmGroups({
      nameBase: autoscaleSettings.nameBase,
      description: autoscaleSettings.description,
      focus: autoscaleSettings.focus,
      profile: autoscaleSettings.profile,
      quantity,
    });

    const reason = reasonParts.join(' y ');
    const logId = addCommand('Autoscaler: expansion automatica');
    updateCommandLog(
      logId,
      'success',
      `Autoscaler activado por ${reason}. Refuerzo desplegado: ${createdIds.join(', ')}.`,
    );

    set((state) => ({
      autoscaleState: {
        ...state.autoscaleState,
        status: 'triggered',
        lastCheckAt: now,
        lastTriggeredAt: now,
        lastReason: `Expansion automatica ejecutada por ${reason}.`,
        lastCreatedIds: createdIds,
      },
    }));

    return createdIds.length > 0;
  },

  getStats: () => {
    const { bots, tasks } = get();
    const totalBots = bots.length;
    const activeBots = bots.filter((bot) => bot.status === 'working').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === 'completed').length;
    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
    return { totalBots, activeBots, totalTasks, completedTasks, successRate };
  },

  getGroupStats: (groupId) => {
    const { bots, tasks } = get();
    const groupBots = bots.filter((bot) => bot.groupId === groupId);
    const totalBots = groupBots.length;
    const activeBots = groupBots.filter((bot) => bot.status === 'working').length;
    const completedTasks = tasks.filter((task) => task.assignedGroup === groupId && task.status === 'completed').length;
    const efficiency = totalBots > 0 ? groupBots.reduce((sum, bot) => sum + bot.efficiency, 0) / totalBots : 0;
    return { totalBots, activeBots, completedTasks, efficiency };
  },
}));
