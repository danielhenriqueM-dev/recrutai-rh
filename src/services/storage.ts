import {
  Candidate,
  Job,
  Application,
  Interview,
  Evaluation,
  AuditLog,
  SystemSettings,
  RankingResult,
  CandidateStatus,
} from '../types';

export interface IRepository<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  find(predicate: (item: T) => boolean): Promise<T[]>;
}

export class LocalStorageRepository<T extends { id: string }> implements IRepository<T> {
  private storageKey: string;

  constructor(key: string) {
    this.storageKey = `recruitai_${key}`;
  }

  private read(): T[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error(`Erro ao ler ${this.storageKey} do LocalStorage`, e);
      return [];
    }
  }

  private write(data: T[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('recruitai_storage_change', { detail: { key: this.storageKey } }));
    } catch (e) {
      console.error(`Erro ao gravar ${this.storageKey} no LocalStorage`, e);
    }
  }

  async getAll(): Promise<T[]> {
    return this.read();
  }

  async getById(id: string): Promise<T | null> {
    const items = this.read();
    return items.find((item) => item.id === id) || null;
  }

  async create(item: T): Promise<T> {
    const items = this.read();
    items.unshift(item);
    this.write(items);
    return item;
  }

  async update(id: string, partial: Partial<T>): Promise<T | null> {
    const items = this.read();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const updated = { ...items[index], ...partial, updatedAt: new Date().toISOString() };
    items[index] = updated;
    this.write(items);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const items = this.read();
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    this.write(filtered);
    return true;
  }

  async find(predicate: (item: T) => boolean): Promise<T[]> {
    const items = this.read();
    return items.filter(predicate);
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.storageKey);
    window.dispatchEvent(new CustomEvent('recruitai_storage_change', { detail: { key: this.storageKey } }));
  }

  async setAll(items: T[]): Promise<void> {
    this.write(items);
  }
}

export const DEFAULT_SETTINGS: SystemSettings = {
  companyName: 'TechVanguard Soluções em RH',
  defaultWeights: {
    experience: 30,
    skills: 30,
    education: 15,
    certifications: 10,
    languages: 5,
    customCriteria: 10,
  },
  autoMatchingOnUpload: true,
  lgpdRetentionDays: 365,
  enableDuplicateDetection: true,
  duplicateSimilarityThreshold: 0.85,
  enableAI: true,
  aiMode: 'hybrid',
  aiWeight: 0.3,
  matchingWeight: 0.7,
};

class StorageFacade {
  public candidates = new LocalStorageRepository<Candidate>('candidates');
  public jobs = new LocalStorageRepository<Job>('jobs');
  public applications = new LocalStorageRepository<Application>('applications');
  public interviews = new LocalStorageRepository<Interview>('interviews');
  public evaluations = new LocalStorageRepository<Evaluation>('evaluations');
  public auditLogs = new LocalStorageRepository<AuditLog>('audit_logs');
  private settingsKey = 'recruitai_settings';

  getSettings(): SystemSettings {
    try {
      const data = localStorage.getItem(this.settingsKey);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: SystemSettings): void {
    localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('recruitai_storage_change', { detail: { key: this.settingsKey } }));
  }

  async logAudit(action: string, entityType: AuditLog['entityType'], description: string, entityId?: string, user = 'Recrutador RH'): Promise<void> {
    const log: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      action,
      entityType,
      entityId,
      description,
      timestamp: new Date().toISOString(),
      user,
    };
    await this.auditLogs.create(log);
  }

  async resetAllData(): Promise<void> {
    await this.candidates.clear();
    await this.jobs.clear();
    await this.applications.clear();
    await this.interviews.clear();
    await this.evaluations.clear();
    await this.auditLogs.clear();
    localStorage.removeItem(this.settingsKey);
    window.dispatchEvent(new CustomEvent('recruitai_storage_change', { detail: { key: 'all' } }));
  }

  async exportAllData(): Promise<string> {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      candidates: await this.candidates.getAll(),
      jobs: await this.jobs.getAll(),
      applications: await this.applications.getAll(),
      interviews: await this.interviews.getAll(),
      evaluations: await this.evaluations.getAll(),
      auditLogs: await this.auditLogs.getAll(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.candidates)) await this.candidates.setAll(data.candidates);
      if (Array.isArray(data.jobs)) await this.jobs.setAll(data.jobs);
      if (Array.isArray(data.applications)) await this.applications.setAll(data.applications);
      if (Array.isArray(data.interviews)) await this.interviews.setAll(data.interviews);
      if (Array.isArray(data.evaluations)) await this.evaluations.setAll(data.evaluations);
      if (Array.isArray(data.auditLogs)) await this.auditLogs.setAll(data.auditLogs);
      if (data.settings) this.saveSettings(data.settings);
      
      await this.logAudit('IMPORT_BACKUP', 'system', 'Restauração de backup realizada com sucesso');
      return { success: true, message: 'Dados importados com sucesso!' };
    } catch (e: any) {
      return { success: false, message: `Erro ao importar: ${e.message || 'Arquivo inválido'}` };
    }
  }
}

export const storageService = new StorageFacade();
