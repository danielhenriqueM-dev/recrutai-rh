import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  Plus,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { Interview, AIInterviewScript } from '../types';

export const InterviewsView: React.FC = () => {
  const {
    interviews,
    candidates,
    jobs,
    scheduleInterview,
    updateInterview,
    setActiveTab,
    setSelectedCandidateId,
    generateInterviewScript,
    showToast,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Scheduling Form
  const [formCandidateId, setFormCandidateId] = useState('');
  const [formJobId, setFormJobId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formInterviewer, setFormInterviewer] = useState('Recrutador RH');
  const [formType, setFormType] = useState<'online' | 'presencial' | 'telefone'>('online');
  const [formStage, setFormStage] = useState('Entrevista de Triagem Técnica');

  // Feedback Modal
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'realizada' | 'cancelada'>('realizada');

  // AI Script Generator Modal
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [scriptCandidateId, setScriptCandidateId] = useState('');
  const [scriptJobId, setScriptJobId] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<AIInterviewScript | null>(null);
  const [hasCopiedScript, setHasCopiedScript] = useState(false);

  const filteredInterviews = interviews
    .filter((int) => {
      if (statusFilter !== 'all' && int.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const handleGenerateScript = async () => {
    if (!scriptCandidateId || !scriptJobId) return;
    setIsGeneratingScript(true);
    try {
      const script = await generateInterviewScript(scriptCandidateId, scriptJobId);
      setGeneratedScript(script);
    } catch (err) {
      console.error('Erro ao gerar roteiro:', err);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleCopyScript = () => {
    if (!generatedScript) return;
    const cand = candidates.find((c) => c.id === scriptCandidateId);
    const job = jobs.find((j) => j.id === scriptJobId);

    const text = [
      `ROTEIRO DE ENTREVISTA ESTRUTURADO - ${job?.title || 'Vaga'}`,
      `Candidato: ${cand?.name || 'Candidato'}`,
      `Tempo Estimado: ${generatedScript.estimatedDurationMinutes} minutos`,
      `Foco Principal: ${generatedScript.focusSummary}`,
      '',
      ...generatedScript.questions.map(
        (q, i) =>
          `[${q.category.toUpperCase()}] ${i + 1}. ${q.question}\n- O que avaliar: ${q.expectedAnswerNotes}\n- Pontos de Atenção: ${q.redFlags}`
      ),
      '',
      `Critérios de Avaliação (1 a 5): ${generatedScript.evaluationRubric.join(' | ')}`,
    ].join('\n\n');

    navigator.clipboard.writeText(text);
    setHasCopiedScript(true);
    showToast('success', 'Roteiro Copiado', 'Conteúdo transferido para a área de transferência.');
    setTimeout(() => setHasCopiedScript(false), 3000);
  };

  const handleApplyScriptToSchedule = () => {
    if (!scriptCandidateId || !scriptJobId) return;
    setFormCandidateId(scriptCandidateId);
    setFormJobId(scriptJobId);
    setFormStage(`Entrevista Técnica (${jobs.find((j) => j.id === scriptJobId)?.title})`);
    setIsScriptModalOpen(false);
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCandidateId || !formJobId || !formDate) return;

    await scheduleInterview({
      candidateId: formCandidateId,
      jobId: formJobId,
      scheduledAt: formDate,
      interviewer: formInterviewer,
      type: formType,
      status: 'agendada',
      stage: formStage,
    });

    setIsScheduleModalOpen(false);
    setFormCandidateId('');
    setFormJobId('');
    setFormDate('');
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedInterview) return;
    await updateInterview(selectedInterview.id, {
      status: feedbackStatus,
      feedback: feedbackText,
    });
    setIsFeedbackModalOpen(false);
    setSelectedInterview(null);
    setFeedbackText('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Agenda de Entrevistas ({filteredInterviews.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Agendamentos, geração de roteiros estruturados e registro de pareceres técnicos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (candidates.length > 0) setScriptCandidateId(candidates[0].id);
              if (jobs.length > 0) setScriptJobId(jobs[0].id);
              setIsScriptModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md border border-gray-300 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            Gerar Roteiro
          </button>

          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Agendar Entrevista
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Filtrar por Status:</span>
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'agendada', label: 'Agendadas' },
              { id: 'realizada', label: 'Realizadas' },
              { id: 'cancelada', label: 'Canceladas' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === st.id
                    ? 'bg-red-50 text-red-700 border border-red-200 font-semibold'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interviews List */}
      {filteredInterviews.length === 0 ? (
        <EmptyState
          title="Nenhuma entrevista encontrada"
          description="Nenhuma sessão agendada para os critérios selecionados."
          actionLabel="Agendar Entrevista"
          onAction={() => setIsScheduleModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInterviews.map((int) => {
            const cand = candidates.find((c) => c.id === int.candidateId);
            const job = jobs.find((j) => j.id === int.jobId);
            const intDate = new Date(int.scheduledAt);

            return (
              <div
                key={int.id}
                className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-gray-300 transition-all"
              >
                <div>
                  {/* Top Status & Date */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      {intDate.toLocaleDateString('pt-BR')} às{' '}
                      {intDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <Badge
                      variant={
                        int.status === 'realizada'
                          ? 'success'
                          : int.status === 'agendada'
                          ? 'primary'
                          : 'danger'
                      }
                      dot
                    >
                      {int.status === 'agendada' ? 'Agendada' : int.status === 'realizada' ? 'Realizada' : 'Cancelada'}
                    </Badge>
                  </div>

                  {/* Candidate & Job */}
                  <div className="pt-3 space-y-1">
                    <h3
                      onClick={() => {
                        if (cand) {
                          setSelectedCandidateId(cand.id);
                          setActiveTab('candidate_detail');
                        }
                      }}
                      className="text-sm font-bold text-gray-900 hover:text-red-600 cursor-pointer transition-colors"
                    >
                      {cand?.name || 'Candidato'}
                    </h3>
                    <p className="text-xs font-medium text-gray-700">
                      Vaga: <span className="font-semibold text-gray-900">{job?.title || 'Vaga'}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Etapa: <span className="text-gray-700">{int.stage}</span>
                    </p>
                  </div>

                  {/* Meta info */}
                  <div className="mt-3 p-2.5 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-700 space-y-1">
                    <div>Entrevistador: <strong className="text-gray-900">{int.interviewer}</strong></div>
                    <div className="flex items-center gap-1 capitalize">
                      {int.type === 'online' ? (
                        <Video className="w-3.5 h-3.5 text-blue-600" />
                      ) : int.type === 'presencial' ? (
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      Modalidade: <span className="font-medium">{int.type}</span>
                    </div>
                  </div>

                  {/* Feedback preview */}
                  {int.feedback && (
                    <div className="mt-2 text-xs bg-gray-50 text-gray-800 p-2.5 rounded-md border border-gray-200 leading-relaxed">
                      <strong className="block text-gray-900 font-semibold mb-0.5">Parecer:</strong> {int.feedback}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInterview(int);
                      setFeedbackText(int.feedback || '');
                      setFeedbackStatus(int.status === 'cancelada' ? 'cancelada' : 'realizada');
                      setIsFeedbackModalOpen(true);
                    }}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Registrar Parecer / Feedback
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Schedule */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Agendar Sessão de Entrevista"
        subtitle="Informe candidato, vaga, responsável e horário"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Candidato *</label>
            <select
              required
              value={formCandidateId}
              onChange={(e) => setFormCandidateId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
            >
              <option value="">Selecione o candidato...</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Vaga *</label>
            <select
              required
              value={formJobId}
              onChange={(e) => setFormJobId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
            >
              <option value="">Selecione a vaga...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Data & Hora *</label>
              <input
                type="datetime-local"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Modalidade</label>
              <select
                value={formType}
                onChange={(e: any) => setFormType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
              >
                <option value="online">Online (Vídeo)</option>
                <option value="presencial">Presencial</option>
                <option value="telefone">Telefone</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Entrevistador Responsável</label>
            <input
              type="text"
              value={formInterviewer}
              onChange={(e) => setFormInterviewer(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Etapa / Tipo de Entrevista</label>
            <input
              type="text"
              value={formStage}
              onChange={(e) => setFormStage(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md shadow-xs"
            >
              Agendar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Feedback */}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Registrar Parecer da Entrevista"
        subtitle={selectedInterview ? `Horário: ${new Date(selectedInterview.scheduledAt).toLocaleString('pt-BR')}` : ''}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Status da Sessão</label>
            <select
              value={feedbackStatus}
              onChange={(e: any) => setFeedbackStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
            >
              <option value="realizada">Realizada com Sucesso</option>
              <option value="cancelada">Cancelada / Reagendar</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Parecer / Feedback do Entrevistador
            </label>
            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Descreva pontos positivos observados, fit cultural, desenvoltura técnica..."
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-md leading-relaxed text-gray-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsFeedbackModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleFeedbackSubmit}
              className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs"
            >
              Salvar Parecer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Gerador de Roteiro IA */}
      <Modal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        title="Gerador de Roteiro Estruturado de Entrevista"
        subtitle="Formule perguntas comportamentais, técnicas e situacionais com base no cargo e no perfil do candidato"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Candidato *</label>
              <select
                value={scriptCandidateId}
                onChange={(e) => {
                  setScriptCandidateId(e.target.value);
                  setGeneratedScript(null);
                }}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md outline-hidden text-gray-800"
              >
                <option value="">Selecione um candidato...</option>
                {candidates.map((cand) => (
                  <option key={cand.id} value={cand.id}>
                    {cand.name} ({cand.totalExperienceYears} anos exp)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Vaga *</label>
              <select
                value={scriptJobId}
                onChange={(e) => {
                  setScriptJobId(e.target.value);
                  setGeneratedScript(null);
                }}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md outline-hidden text-gray-800"
              >
                <option value="">Selecione uma vaga...</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleGenerateScript}
              disabled={!scriptCandidateId || !scriptJobId || isGeneratingScript}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-all shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingScript ? 'animate-spin' : ''}`} />
              {isGeneratingScript ? 'Gerando Roteiro...' : 'Gerar Roteiro'}
            </button>

            {generatedScript && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md border border-gray-300 transition-colors shadow-2xs"
                >
                  {hasCopiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {hasCopiedScript ? 'Copiado!' : 'Copiar'}
                </button>

                <button
                  type="button"
                  onClick={handleApplyScriptToSchedule}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Agendar com este roteiro
                </button>
              </div>
            )}
          </div>

          {/* Render Generated Script */}
          {generatedScript && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-white border border-gray-200 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">Foco Recomendado para a Sessão:</span>
                  <span className="text-[11px] font-semibold bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                    ~{generatedScript.estimatedDurationMinutes} minutos
                  </span>
                </div>
                <p className="text-xs text-gray-700 mt-1">{generatedScript.focusSummary}</p>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Perguntas Estruturadas:</h4>
                {generatedScript.questions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-white border border-gray-200 rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {q.category}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">#{idx + 1}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-900 leading-relaxed">{q.question}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-gray-100">
                      <div className="bg-gray-50 p-2 rounded border border-gray-200 text-gray-800">
                        <strong className="block text-[10px] uppercase text-gray-600 font-bold mb-0.5">O que observar na resposta:</strong>
                        {q.expectedAnswerNotes}
                      </div>
                      <div className="bg-gray-50 p-2 rounded border border-gray-200 text-gray-800">
                        <strong className="block text-[10px] uppercase text-red-700 font-bold mb-0.5">Sinais de alerta:</strong>
                        {q.redFlags}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rubric */}
              <div className="p-3 bg-white border border-gray-200 rounded-md">
                <h5 className="text-xs font-bold text-gray-800 mb-1.5">Critérios de Avaliação (1 a 5):</h5>
                <div className="flex flex-wrap gap-1.5">
                  {generatedScript.evaluationRubric.map((rubric, rIdx) => (
                    <span key={rIdx} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200 font-medium">
                      {rubric}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
