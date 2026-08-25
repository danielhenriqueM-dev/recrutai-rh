import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Award,
  AlertCircle,
  CheckCircle,
  Sliders,
  Trash2,
  ExternalLink,
  ChevronRight,
  Edit3,
  Copy,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge, ScoreBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { formatEducationLevel, calculateCandidateMatch } from '../services/matchingEngine';
import { JobStatus, CandidateStatus } from '../types';

export const JobDetailView: React.FC = () => {
  const {
    jobs,
    selectedJobId,
    candidates,
    applications,
    setActiveTab,
    setSelectedCandidateId,
    setSelectedJobForRanking,
    setEditingJobId,
    updateJob,
    deleteJob,
    duplicateJob,
    moveApplicationStage,
  } = useApp();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const job = jobs.find((j) => j.id === selectedJobId);

  if (!job) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500 mb-4">Vaga não encontrada ou removida.</p>
        <button
          onClick={() => setActiveTab('jobs')}
          className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-md"
        >
          Voltar para Vagas
        </button>
      </div>
    );
  }

  // Linked candidates for this job
  const jobApplications = applications.filter((a) => a.jobId === job.id);
  const enrolledCandidates = jobApplications.map((app) => {
    const candidate = candidates.find((c) => c.id === app.candidateId);
    const match = candidate ? calculateCandidateMatch(candidate, job) : null;
    return { app, candidate, match };
  }).filter((item) => item.candidate !== undefined);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveTab('jobs')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para Vagas
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingJobId(job.id);
              setActiveTab('job_create');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md border border-gray-300 transition-colors shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Editar Vaga
          </button>

          <button
            type="button"
            onClick={async () => {
              const dup = await duplicateJob(job.id);
              setEditingJobId(dup.id);
              setActiveTab('job_create');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md border border-gray-300 transition-colors shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicar Vaga
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedJobForRanking(job.id);
              setActiveTab('job_ranking');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
          >
            <Award className="w-3.5 h-3.5" />
            Ranking e Triagem
          </button>
        </div>
      </div>

      {/* Main Job Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {job.title}
              </h1>
              <Badge variant={job.status === 'aberta' ? 'success' : 'default'} dot>
                {job.status === 'aberta' ? 'Aberta' : job.status === 'pausada' ? 'Pausada' : 'Encerrada'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
              <span className="font-semibold text-gray-700">{job.department}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                {job.location} ({job.workplaceType})
              </span>
              {job.salaryRange && (
                <>
                  <span>•</span>
                  <span className="font-bold text-gray-800">{job.salaryRange}</span>
                </>
              )}
            </p>
          </div>

          {/* Change Status */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-md border border-gray-200">
            <span className="text-xs font-medium text-gray-600 pl-2">Status da Vaga:</span>
            <select
              value={job.status}
              onChange={(e) => updateJob(job.id, { status: e.target.value as JobStatus })}
              className="text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded px-2.5 py-1 outline-hidden"
            >
              <option value="aberta">Aberta</option>
              <option value="pausada">Pausada</option>
              <option value="encerrada">Encerrada</option>
              <option value="rascunho">Rascunho</option>
            </select>
          </div>
        </div>

        {/* Job Description & Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
          <div className="lg:col-span-2 space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Descrição da Posição
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-md border border-gray-200">
                {job.description}
              </p>
            </div>

            {/* Requisitos Obrigatórios vs Desejáveis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-md bg-gray-50 border border-gray-200 space-y-2">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  Requisitos Obrigatórios ({job.requiredSkills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((sk) => (
                    <span key={sk} className="text-xs bg-white text-gray-800 border border-gray-300 px-2 py-0.5 rounded font-medium">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-md bg-gray-50 border border-gray-200 space-y-2">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-gray-600" />
                  Requisitos Desejáveis ({job.desirableSkills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.desirableSkills.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">Nenhum cadastrado.</span>
                  ) : (
                    job.desirableSkills.map((sk) => (
                      <span key={sk} className="text-xs bg-white text-gray-800 border border-gray-300 px-2 py-0.5 rounded font-medium">
                        {sk}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Parameters & Weights */}
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-gray-50 border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Critérios Objetivos
              </h4>

              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Experiência Mínima</span>
                  <span className="font-bold text-gray-900">{job.minExperienceYears} anos</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Escolaridade</span>
                  <span className="font-bold text-gray-900">{formatEducationLevel(job.minEducationLevel)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Idiomas</span>
                  <span className="font-bold text-gray-900">{job.languages.join(', ') || 'Não especificado'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Certificações</span>
                  <span className="font-bold text-gray-900">{job.desirableCertifications.join(', ') || 'Nenhuma'}</span>
                </div>
              </div>
            </div>

            {/* Pesos */}
            <div className="p-4 rounded-md bg-gray-50 border border-gray-200 space-y-2">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                <span>Pesos de Avaliação</span>
                <Sliders className="w-3.5 h-3.5 text-gray-500" />
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                <div>Exp: <strong className="text-gray-900">{job.weights.experience}%</strong></div>
                <div>Skills: <strong className="text-gray-900">{job.weights.skills}%</strong></div>
                <div>Formação: <strong className="text-gray-900">{job.weights.education}%</strong></div>
                <div>Certs: <strong className="text-gray-900">{job.weights.certifications}%</strong></div>
                <div>Idiomas: <strong className="text-gray-900">{job.weights.languages}%</strong></div>
                <div>Específicos: <strong className="text-gray-900">{job.weights.customCriteria}%</strong></div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir Vaga
            </button>
          </div>
        </div>
      </div>

      {/* Enrolled Candidates Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Candidatos Vinculados a esta Vaga ({enrolledCandidates.length})
            </h3>
            <p className="text-xs text-gray-500">Inscritos e compatibilidade preliminar</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedJobForRanking(job.id);
              setActiveTab('job_ranking');
            }}
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            Abrir Relatório de Ranking <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {enrolledCandidates.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-4">Nenhum candidato inscrito nesta vaga ainda.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {enrolledCandidates.map(({ app, candidate, match }) => {
              if (!candidate || !match) return null;

              return (
                <div key={app.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ScoreBadge score={match.score} />
                    <div>
                      <h4
                        onClick={() => {
                          setSelectedCandidateId(candidate.id);
                          setActiveTab('candidate_detail');
                        }}
                        className="text-xs font-bold text-gray-900 hover:text-red-600 cursor-pointer transition-colors"
                      >
                        {candidate.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {candidate.city} • {candidate.totalExperienceYears} anos exp • {candidate.skills.slice(0, 3).map((s) => s.name).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <select
                      value={app.stage}
                      onChange={(e) => moveApplicationStage(candidate.id, job.id, e.target.value as CandidateStatus)}
                      className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-300 rounded px-2.5 py-1 outline-hidden"
                    >
                      <option value="novo">Novo</option>
                      <option value="triagem">Triagem</option>
                      <option value="pre_selecionado">Pré-selecionado</option>
                      <option value="entrevista">Entrevista</option>
                      <option value="teste">Teste</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="contratado">Contratado</option>
                      <option value="reprovado">Reprovado</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCandidateId(candidate.id);
                        setActiveTab('candidate_detail');
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors"
                      title="Abrir perfil"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Exclusão da Vaga"
        subtitle={`Vaga: ${job.title}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Tem certeza de que deseja remover esta vaga? As candidaturas vinculadas a ela serão mantidas no banco de talentos global.
          </p>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                await deleteJob(job.id);
                setShowDeleteModal(false);
                setActiveTab('jobs');
              }}
              className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              Excluir Vaga
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
