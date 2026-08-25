import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  FileJson,
  RotateCcw,
  Cloud,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MatchingWeights } from '../types';
import { Modal } from '../components/common/Modal';
import { defaultFirebaseConfig, syncToFirestore, getFirebaseFirestore } from '../services/firebase';

export const SettingsView: React.FC = () => {
  const {
    settings,
    saveSettings,
    exportBackup,
    importBackup,
    reloadSeedData,
    candidates,
    jobs,
    applications,
    interviews,
    evaluations,
    auditLogs,
  } = useApp();

  const [weights, setWeights] = useState<MatchingWeights>(settings.defaultWeights);
  const [retentionDays, setRetentionDays] = useState<number>(settings.lgpdRetentionDays || 730);
  const [companyName, setCompanyName] = useState<string>(settings.companyName || 'RecruitAI RH Corp');

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Firebase sync state
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<string | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);

  const totalWeights =
    weights.experience +
    weights.skills +
    weights.education +
    weights.certifications +
    weights.languages +
    weights.customCriteria;

  const handleSaveWeights = () => {
    saveSettings({
      ...settings,
      defaultWeights: weights,
      lgpdRetentionDays: retentionDays,
      companyName,
    });
    alert('Configurações salvas com sucesso!');
  };

  const handleExportJSON = async () => {
    const dataStr = await exportBackup();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RecruitAI_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const res = await importBackup(jsonContent);
        if (res.success) {
          setImportStatus('Backup importado com sucesso!');
        } else {
          setImportStatus(`Erro ao importar backup: ${res.message}`);
        }
      } catch (err) {
        setImportStatus('Erro na leitura do arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSeed = async () => {
    await reloadSeedData();
    setShowResetConfirm(false);
    alert('Banco de dados restaurado com os dados de demonstração iniciais.');
  };

  const handleSyncFirebase = async () => {
    setIsSyncingFirebase(true);
    setFirebaseSyncStatus('Sincronizando dados com o Firestore...');
    try {
      await syncToFirestore('candidates', candidates);
      await syncToFirestore('jobs', jobs);
      await syncToFirestore('applications', applications);
      await syncToFirestore('interviews', interviews);
      await syncToFirestore('evaluations', evaluations);
      await syncToFirestore('audit_logs', auditLogs);
      setFirebaseSyncStatus('Sincronização com o Firebase concluída com sucesso!');
    } catch (err: any) {
      setFirebaseSyncStatus(`Falha na sincronização: ${err.message || 'Verifique as regras do Firestore'}`);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  const firestoreRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /candidates/{candidateId} { allow read, write: if true; }
    match /jobs/{jobId} { allow read, write: if true; }
    match /applications/{applicationId} { allow read, write: if true; }
    match /interviews/{interviewId} { allow read, write: if true; }
    match /evaluations/{evaluationId} { allow read, write: if true; }
    match /audit_logs/{logId} { allow read, write: if true; }
    match /settings/{settingId} { allow read, write: if true; }
    match /{document=**} { allow read, write: if true; }
  }
}`;

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(firestoreRulesText);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
          Configurações do Sistema & Governança LGPD
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Pesos globais do motor de matching, conformidade de dados e gerenciamento de backups
        </p>
      </div>

      {/* Card 1: Default Matching Weights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gray-600" />
              Pesos Padrão do Motor de Compatibilidade (0-100)
            </h3>
            <p className="text-xs text-gray-500">
              Esses pesos são aplicados por padrão ao cadastrar novas vagas no sistema
            </p>
          </div>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
              totalWeights === 100
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            Total: {totalWeights}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3.5 bg-gray-50 rounded-md border border-gray-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-800">
              <span>Experiência Profissional</span>
              <span>{weights.experience}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={weights.experience}
              onChange={(e) => setWeights({ ...weights, experience: parseInt(e.target.value) || 0 })}
              className="w-full accent-red-600 cursor-pointer"
            />
            <p className="text-[11px] text-gray-500">Tempo de atuação e cargos correlatos</p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-md border border-gray-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-800">
              <span>Habilidades Técnicas</span>
              <span>{weights.skills}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={weights.skills}
              onChange={(e) => setWeights({ ...weights, skills: parseInt(e.target.value) || 0 })}
              className="w-full accent-red-600 cursor-pointer"
            />
            <p className="text-[11px] text-gray-500">Requisitos obrigatórios e diferenciais</p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-md border border-gray-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-800">
              <span>Formação Acadêmica</span>
              <span>{weights.education}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={weights.education}
              onChange={(e) => setWeights({ ...weights, education: parseInt(e.target.value) || 0 })}
              className="w-full accent-red-600 cursor-pointer"
            />
            <p className="text-[11px] text-gray-500">Graduação, pós, mestrado ou técnico</p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-md border border-gray-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-800">
              <span>Certificações</span>
              <span>{weights.certifications}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={weights.certifications}
              onChange={(e) => setWeights({ ...weights, certifications: parseInt(e.target.value) || 0 })}
              className="w-full accent-red-600 cursor-pointer"
            />
            <p className="text-[11px] text-gray-500">Credenciais oficiais exigidas</p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-md border border-gray-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-800">
              <span>Idiomas</span>
              <span>{weights.languages}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={weights.languages}
              onChange={(e) => setWeights({ ...weights, languages: parseInt(e.target.value) || 0 })}
              className="w-full accent-red-600 cursor-pointer"
            />
            <p className="text-[11px] text-gray-500">Fluência e idiomas adicionais</p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-md border border-gray-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-800">
              <span>Critérios Específicos</span>
              <span>{weights.customCriteria}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={weights.customCriteria}
              onChange={(e) => setWeights({ ...weights, customCriteria: parseInt(e.target.value) || 0 })}
              className="w-full accent-red-600 cursor-pointer"
            />
            <p className="text-[11px] text-gray-500">Requisitos customizados por vaga</p>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSaveWeights}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
          >
            Salvar Pesos Padrão
          </button>
        </div>
      </div>

      {/* Card 2: LGPD & Privacy */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-5">
        <div className="pb-3 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Políticas de Retenção e Governança LGPD
          </h3>
          <p className="text-xs text-gray-500">
            Diretrizes de privacidade e conformidade com a Lei Geral de Proteção de Dados
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Prazo de Retenção de Currículos (Dias)
            </label>
            <input
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value) || 365)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md font-medium text-gray-900"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Padrão corporativo recomendado: 730 dias (2 anos)
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Organização / Empresa
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md font-medium text-gray-900"
            />
          </div>
        </div>

        <div className="p-3.5 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-700 space-y-1">
          <h4 className="font-bold flex items-center gap-1.5 text-gray-900">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Privacidade por Design (Privacy by Design)
          </h4>
          <p className="text-gray-600 leading-relaxed">
            O RecruitAI RH armazena dados estruturados para triagem técnica. Todos os dados possuem suporte a exportação e exclusão a pedido do titular.
          </p>
        </div>
      </div>

      {/* Card 3: Database, Backups and Demo Data */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-5">
        <div className="pb-3 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-600" />
            Backup, Restauração e Dados de Teste
          </h3>
          <p className="text-xs text-gray-500">
            Exportação em lote de todos os registros e restauração de dados
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Export */}
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200 flex flex-col justify-between">
            <div>
              <FileJson className="w-5 h-5 text-gray-600 mb-2" />
              <h4 className="text-xs font-bold text-gray-900">Exportar Backup Completo</h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Gera um arquivo .json com {candidates.length} candidatos, {jobs.length} vagas e {applications.length} candidaturas.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportJSON}
              className="mt-4 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 text-xs font-semibold rounded-md border border-gray-300 transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              Baixar JSON
            </button>
          </div>

          {/* Import */}
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200 flex flex-col justify-between">
            <div>
              <Upload className="w-5 h-5 text-gray-600 mb-2" />
              <h4 className="text-xs font-bold text-gray-900">Restaurar de Backup</h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Carregue um arquivo JSON gerado anteriormente para restaurar os dados.
              </p>
            </div>
            <label className="mt-4 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 text-xs font-semibold rounded-md border border-gray-300 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer text-center shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-gray-500" />
              Selecionar JSON
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset Demo Data */}
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200 flex flex-col justify-between">
            <div>
              <RotateCcw className="w-5 h-5 text-gray-600 mb-2" />
              <h4 className="text-xs font-bold text-gray-900">Recarregar Dados Demo</h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Restaura a base padrão de candidatos e vagas para testes do sistema.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="mt-4 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 text-xs font-semibold rounded-md border border-gray-300 transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              Recarregar Demo
            </button>
          </div>
        </div>

        {importStatus && (
          <div className="p-2.5 bg-gray-50 text-gray-800 rounded-md text-xs border border-gray-200">
            {importStatus}
          </div>
        )}
      </div>

      {/* Card 4: Firebase Firestore Connection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-red-600" />
              Conexão com Firebase Firestore
            </h3>
            <p className="text-xs text-gray-500">
              Projeto configurado: <strong className="font-mono text-gray-800">{defaultFirebaseConfig.projectId}</strong>
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
            Configurado
          </span>
        </div>

        <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-3 text-xs text-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-bold text-gray-900">Sincronização em Nuvem</p>
              <p className="text-[11px] text-gray-500">
                Sincronize candidatos, vagas, candidaturas e entrevistas diretamente com sua base no Firestore.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSyncFirebase}
              disabled={isSyncingFirebase}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFirebase ? 'animate-spin' : ''}`} />
              {isSyncingFirebase ? 'Sincronizando...' : 'Sincronizar com Firebase'}
            </button>
          </div>

          {firebaseSyncStatus && (
            <div className="p-2.5 bg-white rounded border border-gray-300 font-medium text-gray-800 text-xs">
              {firebaseSyncStatus}
            </div>
          )}
        </div>

        {/* Firestore Rules Helper */}
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900">
              Regras do Firestore (firestore.rules)
            </h4>
            <button
              type="button"
              onClick={copyRulesToClipboard}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-gray-900 bg-white px-2.5 py-1 rounded border border-gray-300 shadow-2xs"
            >
              {copiedRules ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  Copiar Regras
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-gray-900 text-gray-100 rounded text-[11px] font-mono overflow-x-auto max-h-36">
            {firestoreRulesText}
          </pre>
          <p className="text-[11px] text-gray-500">
            Cole essas regras no Console do Firebase em <em>Firestore Database &gt; Regras</em> para habilitar leitura e escrita.
          </p>
        </div>
      </div>

      {/* Confirmation Modal for Resetting to Demo */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Confirmar Restauração de Dados Demo"
        subtitle="Todos os dados cadastrados atualmente serão substituídos pela base de teste."
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Deseja realmente recarregar os dados de demonstração? Se você cadastrou novos candidatos ou vagas que deseja preservar, faça o download do backup JSON antes.
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleResetSeed}
              className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              Confirmar Restauração
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
