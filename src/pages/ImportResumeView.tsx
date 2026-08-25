import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Copy,
  FileUp,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { extractTextFromFile } from '../services/documentParser';
import { parseCandidateFromText } from '../services/candidateParser';
import { checkForDuplicateCandidate } from '../services/duplicateDetector';
import { Candidate, DuplicateMatch } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

interface ProcessedFileItem {
  id: string;
  file: File | null;
  fileName: string;
  fileType: string;
  status: 'processando' | 'sucesso' | 'erro' | 'duplicado';
  candidateData: Candidate | null;
  duplicateMatch: DuplicateMatch | null;
  rawText: string;
  error?: string;
}

export const ImportResumeView: React.FC = () => {
  const {
    candidates,
    jobs,
    createCandidate,
    updateCandidate,
    applyCandidateToJob,
    setActiveTab,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<ProcessedFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  // Paste text mode
  const [pastedText, setPastedText] = useState('');
  const [pastedFileName, setPastedFileName] = useState('Curriculo_Manual.txt');
  const [isPasting, setIsPasting] = useState(false);

  // Review & Edit Modal
  const [editingItem, setEditingItem] = useState<ProcessedFileItem | null>(null);

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    const newItems: ProcessedFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const itemId = 'item_' + Date.now() + '_' + i;

      try {
        const extraction = await extractTextFromFile(file);
        const candidateData = parseCandidateFromText(
          extraction.text,
          file.name
        );

        const dupMatch = checkForDuplicateCandidate(candidateData, candidates);

        newItems.push({
          id: itemId,
          file,
          fileName: file.name,
          fileType: extraction.fileType,
          status: dupMatch.isDuplicate ? 'duplicado' : 'sucesso',
          candidateData,
          duplicateMatch: dupMatch,
          rawText: extraction.text,
        });
      } catch (err: any) {
        newItems.push({
          id: itemId,
          file,
          fileName: file.name,
          fileType: 'unknown',
          status: 'erro',
          candidateData: null,
          duplicateMatch: null,
          rawText: '',
          error: err?.message || 'Erro ao processar arquivo.',
        });
      }
    }

    setItems((prev) => [...prev, ...newItems]);
    setIsProcessing(false);
  };

  const handleManualPasteProcess = () => {
    if (!pastedText.trim()) return;

    try {
      const candidateData = parseCandidateFromText(pastedText, pastedFileName);
      const dupMatch = checkForDuplicateCandidate(candidateData, candidates);

      const newItem: ProcessedFileItem = {
        id: 'paste_' + Date.now(),
        file: null,
        fileName: pastedFileName,
        fileType: 'text/plain',
        status: dupMatch.isDuplicate ? 'duplicado' : 'sucesso',
        candidateData,
        duplicateMatch: dupMatch,
        rawText: pastedText,
      };

      setItems((prev) => [newItem, ...prev]);
      setPastedText('');
      setIsPasting(false);
    } catch (err: any) {
      alert('Erro ao analisar o texto colado.');
    }
  };

  const handleSaveItem = async (item: ProcessedFileItem, action: 'save_new' | 'update_existing' | 'skip') => {
    if (action === 'skip') {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      return;
    }

    if (!item.candidateData) return;

    if (action === 'update_existing' && item.duplicateMatch?.existingCandidate) {
      const existingId = item.duplicateMatch.existingCandidate.id;
      await updateCandidate(existingId, {
        experiences: item.candidateData.experiences.length > 0 ? item.candidateData.experiences : undefined,
        skills: item.candidateData.skills.length > 0 ? item.candidateData.skills : undefined,
        education: item.candidateData.education.length > 0 ? item.candidateData.education : undefined,
        totalExperienceYears: Math.max(
          item.duplicateMatch.existingCandidate.totalExperienceYears,
          item.candidateData.totalExperienceYears
        ),
        rawText: item.candidateData.rawText,
        resumeFileName: item.fileName,
      });

      if (selectedJobId) {
        await applyCandidateToJob(existingId, selectedJobId);
      }
    } else {
      // Save new
      await createCandidate(item.candidateData, true);

      if (selectedJobId) {
        await applyCandidateToJob(item.candidateData.id, selectedJobId);
      }
    }

    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleSaveAllValid = async () => {
    for (const item of items) {
      if (item.status === 'sucesso' && item.candidateData) {
        await createCandidate(item.candidateData, true);
        if (selectedJobId) {
          await applyCandidateToJob(item.candidateData.id, selectedJobId);
        }
      }
    }
    setItems((prev) => prev.filter((i) => i.status !== 'sucesso'));
    setActiveTab('candidates');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Importação & Extração de Currículos
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Suporte a arquivos PDF, DOCX, TXT e inserção manual. Extração com verificação de duplicidades
          </p>
        </div>

        {/* Target Job Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Vincular à Vaga:</span>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 text-xs font-semibold text-gray-900 bg-white border border-gray-300 rounded-md outline-hidden shadow-2xs"
          >
            <option value="">Banco de Talentos (Geral)</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Dropzone and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main File Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) {
              processFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className="md:col-span-2 border-2 border-dashed border-gray-300 hover:border-red-500 bg-white hover:bg-red-50/20 rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] shadow-xs"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
            className="hidden"
          />

          <div className="w-10 h-10 rounded-md bg-gray-100 text-gray-700 flex items-center justify-center mb-2.5">
            <FileUp className="w-5 h-5 text-gray-600" />
          </div>

          <h3 className="text-xs font-bold text-gray-900">
            Arraste currículos aqui ou <span className="text-red-600 underline">clique para selecionar</span>
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 max-w-sm">
            Formatos aceitos: <strong>PDF, DOCX e TXT</strong>. Suporte a seleção de múltiplos arquivos.
          </p>
        </div>

        {/* Option 2: Paste Raw Text */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="w-8 h-8 rounded-md bg-gray-100 text-gray-700 flex items-center justify-center mb-2.5">
              <Copy className="w-4 h-4 text-gray-600" />
            </div>
            <h4 className="text-xs font-bold text-gray-900">Colar Texto de Currículo</h4>
            <p className="text-[11px] text-gray-500 mt-1">
              Cole o texto de um currículo do LinkedIn, e-mail ou documento para extração direta.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPasting(true)}
            className="mt-4 w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-md border border-gray-300 transition-colors text-center shadow-2xs"
          >
            Inserir Texto
          </button>
        </div>
      </div>

      {/* Processing Status Banner */}
      {isProcessing && (
        <div className="p-3.5 rounded-md bg-gray-900 text-white flex items-center gap-3 shadow-xs">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <span className="text-xs font-semibold block">Extraindo e normalizando currículos...</span>
            <span className="text-[11px] text-gray-300">Analisando contatos, histórico profissional, escolaridade e competências</span>
          </div>
        </div>
      )}

      {/* Processed Items Review List */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Currículos Processados ({items.length})
            </h3>

            {items.some((i) => i.status === 'sucesso') && (
              <button
                type="button"
                onClick={handleSaveAllValid}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
              >
                Salvar Todos os Válidos
              </button>
            )}
          </div>

          <div className="space-y-2">
            {items.map((item) => {
              const { candidateData, duplicateMatch, status, fileName, error } = item;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg border p-4 shadow-xs transition-all ${
                    status === 'duplicado'
                      ? 'border-amber-300 bg-amber-50/20'
                      : status === 'erro'
                      ? 'border-red-200 bg-red-50/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Candidate Info / Extraction Summary */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                          status === 'duplicado'
                            ? 'bg-amber-100 text-amber-800'
                            : status === 'erro'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {status === 'duplicado' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : status === 'erro' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {candidateData ? candidateData.name : fileName}
                          </h4>
                          {status === 'duplicado' && (
                            <Badge variant="warning">Possível Duplicidade</Badge>
                          )}
                          {status === 'sucesso' && (
                            <Badge variant="success">Pronto para Cadastro</Badge>
                          )}
                        </div>

                        {candidateData ? (
                          <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-3">
                            <span>{candidateData.email || 'Sem e-mail'}</span>
                            <span>•</span>
                            <span>{candidateData.phone || 'Sem telefone'}</span>
                            <span>•</span>
                            <span>{candidateData.city || 'Sem cidade'}</span>
                            <span>•</span>
                            <span><strong>{candidateData.totalExperienceYears} anos</strong> exp</span>
                          </div>
                        ) : (
                          <p className="text-xs text-red-600 mt-1">{error}</p>
                        )}

                        {/* Duplicity reasons */}
                        {duplicateMatch?.isDuplicate && (
                          <div className="mt-2 text-xs bg-amber-50 p-2 rounded-md border border-amber-200 text-amber-900">
                            <strong>Motivo:</strong> {duplicateMatch.reasons.join(', ')}. Cadastro existente:{' '}
                            <strong>{duplicateMatch.existingCandidate?.name}</strong>.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {status === 'duplicado' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveItem(item, 'update_existing')}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md transition-colors"
                          >
                            Atualizar Existente
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveItem(item, 'save_new')}
                            className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-300 shadow-2xs"
                          >
                            Criar Novo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveItem(item, 'skip')}
                            className="p-1.5 text-gray-400 hover:text-red-600"
                            title="Descartar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : status === 'sucesso' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-300 shadow-2xs"
                          >
                            Revisar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveItem(item, 'save_new')}
                            className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md shadow-xs"
                          >
                            Salvar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveItem(item, 'skip')}
                          className="px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md border border-red-200"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Paste Raw Text */}
      <Modal
        isOpen={isPasting}
        onClose={() => setIsPasting(false)}
        title="Inserir Currículo em Texto"
        subtitle="Cole o texto do currículo para o motor estruturar os dados"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Identificador / Nome do Arquivo</label>
            <input
              type="text"
              value={pastedFileName}
              onChange={(e) => setPastedFileName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Texto do Currículo</label>
            <textarea
              rows={8}
              placeholder="Cole aqui o texto do currículo com contatos, experiências, formação..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full p-2.5 text-xs font-mono bg-white border border-gray-300 rounded-md focus:border-red-500 outline-hidden leading-relaxed text-gray-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsPasting(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleManualPasteProcess}
              disabled={!pastedText.trim()}
              className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
            >
              Processar e Estruturar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Review & Edit candidate before saving */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Revisar Dados Extraídos"
        subtitle="Confirme ou ajuste os dados antes de salvar"
        size="lg"
      >
        {editingItem?.candidateData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={editingItem.candidateData.name}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      candidateData: { ...editingItem.candidateData!, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">E-mail</label>
                <input
                  type="email"
                  value={editingItem.candidateData.email}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      candidateData: { ...editingItem.candidateData!, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Telefone</label>
                <input
                  type="text"
                  value={editingItem.candidateData.phone}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      candidateData: { ...editingItem.candidateData!, phone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Cidade / Estado</label>
                <input
                  type="text"
                  value={editingItem.candidateData.city}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      candidateData: { ...editingItem.candidateData!, city: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Experiência (Anos)</label>
                <input
                  type="number"
                  value={editingItem.candidateData.totalExperienceYears}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      candidateData: {
                        ...editingItem.candidateData!,
                        totalExperienceYears: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveItem(editingItem, 'save_new');
                  setEditingItem(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md shadow-xs"
              >
                Salvar Cadastro
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
