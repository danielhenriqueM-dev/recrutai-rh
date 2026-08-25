import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  GraduationCap,
  Download,
  PlusCircle,
  ExternalLink,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScoreBadge, CandidateStatusBadge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { calculateCandidateMatch } from '../services/matchingEngine';
import { Candidate } from '../types';

export const TalentPoolView: React.FC = () => {
  const {
    candidates,
    jobs,
    setActiveTab,
    setSelectedCandidateId,
    applyCandidateToJob,
  } = useApp();

  // Search & Filters
  const [keyword, setKeyword] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillOperator, setSkillOperator] = useState<'AND' | 'OR'>('OR');
  const [minExp, setMinExp] = useState(0);
  const [maxExp, setMaxExp] = useState(20);
  const [cityFilter, setCityFilter] = useState('all');
  const [eduLevelFilter, setEduLevelFilter] = useState('all');

  // Simulation Matching Mode
  const [simulatedJobId, setSimulatedJobId] = useState<string>('');

  // Quick apply modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [targetCandidate, setTargetCandidate] = useState<Candidate | null>(null);
  const [targetJobId, setTargetJobId] = useState('');

  // Extract all distinct skills across pool
  const allUniqueSkills = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      c.skills.forEach((s) => set.add(s.name));
    });
    return Array.from(set).sort();
  }, [candidates]);

  // Extract distinct cities
  const allUniqueCities = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.city) set.add(c.city);
    });
    return Array.from(set).sort();
  }, [candidates]);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Filter pool
  const searchResults = useMemo(() => {
    return candidates.filter((c) => {
      // Keyword search
      if (keyword.trim()) {
        const q = keyword.toLowerCase();
        const inName = c.name.toLowerCase().includes(q);
        const inRaw = c.rawText.toLowerCase().includes(q);
        const inExp = c.experiences.some(
          (e) => e.role.toLowerCase().includes(q) || e.company.toLowerCase().includes(q)
        );
        if (!inName && !inRaw && !inExp) return false;
      }

      // Experience
      if (c.totalExperienceYears < minExp || c.totalExperienceYears > maxExp) return false;

      // City
      if (cityFilter !== 'all' && c.city !== cityFilter) return false;

      // Education Level
      if (eduLevelFilter !== 'all') {
        const hasLevel = c.education.some((e) => e.level === eduLevelFilter);
        if (!hasLevel) return false;
      }

      // Skills with AND / OR
      if (selectedSkills.length > 0) {
        const candSkillNames = c.skills.map((s) => s.name.toLowerCase());
        if (skillOperator === 'AND') {
          const hasAll = selectedSkills.every((s) =>
            candSkillNames.includes(s.toLowerCase())
          );
          if (!hasAll) return false;
        } else {
          const hasAny = selectedSkills.some((s) =>
            candSkillNames.includes(s.toLowerCase())
          );
          if (!hasAny) return false;
        }
      }

      return true;
    }).map((cand) => {
      let simulatedScore: number | null = null;
      if (simulatedJobId) {
        const job = jobs.find((j) => j.id === simulatedJobId);
        if (job) {
          const res = calculateCandidateMatch(cand, job);
          simulatedScore = res.score;
        }
      }
      return { cand, simulatedScore };
    }).sort((a, b) => {
      if (a.simulatedScore !== null && b.simulatedScore !== null) {
        return b.simulatedScore - a.simulatedScore;
      }
      return b.cand.totalExperienceYears - a.cand.totalExperienceYears;
    });
  }, [
    candidates,
    keyword,
    minExp,
    maxExp,
    cityFilter,
    eduLevelFilter,
    selectedSkills,
    skillOperator,
    simulatedJobId,
    jobs,
  ]);

  const exportFilteredTalentsCSV = () => {
    if (searchResults.length === 0) return;
    const headers = ['Nome', 'Email', 'Telefone', 'Cidade', 'Anos Exp', 'Habilidades', 'Formação'];
    const rows = searchResults.map(({ cand }) => [
      `"${cand.name}"`,
      `"${cand.email}"`,
      `"${cand.phone}"`,
      `"${cand.city}"`,
      cand.totalExperienceYears,
      `"${cand.skills.map((s) => s.name).join(', ')}"`,
      `"${cand.education[0]?.course || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Banco_de_Talentos_Filtrado.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplySubmit = async () => {
    if (!targetCandidate || !targetJobId) return;
    await applyCandidateToJob(targetCandidate.id, targetJobId);
    setIsApplyModalOpen(false);
    setTargetCandidate(null);
    setTargetJobId('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Banco de Talentos & Busca Ativa ({searchResults.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Filtros por competências, formação, experiência e simulação de aderência a vagas abertas
          </p>
        </div>

        <button
          type="button"
          onClick={exportFilteredTalentsCSV}
          disabled={searchResults.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md border border-gray-300 transition-colors shadow-2xs disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-gray-500" />
          Exportar lista (CSV)
        </button>
      </div>

      {/* Main Search & Simulator Controls */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs space-y-4">
        {/* Top: Keyword & Simulated Job Select */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por termos-chave, cargos anteriores ou texto do currículo..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden font-medium text-gray-900"
            />
          </div>

          <div>
            <select
              value={simulatedJobId}
              onChange={(e) => setSimulatedJobId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-red-50/50 border border-red-200 rounded-md font-semibold text-red-900 outline-hidden"
            >
              <option value="">Simular aderência com vaga (opcional)...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  Simular: {j.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Skills Tag Selector with AND / OR switch */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">
              Competências selecionadas ({selectedSkills.length}):
            </span>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium">Operador:</span>
              <div className="p-0.5 bg-gray-100 rounded border border-gray-200 flex">
                <button
                  type="button"
                  onClick={() => setSkillOperator('OR')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    skillOperator === 'OR'
                      ? 'bg-white text-red-700 shadow-2xs font-bold'
                      : 'text-gray-600'
                  }`}
                >
                  OU (Qualquer)
                </button>
                <button
                  type="button"
                  onClick={() => setSkillOperator('AND')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    skillOperator === 'AND'
                      ? 'bg-white text-red-700 shadow-2xs font-bold'
                      : 'text-gray-600'
                  }`}
                >
                  E (Todas)
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-gray-50 rounded-md border border-gray-200">
            {allUniqueSkills.map((sk) => {
              const isSelected = selectedSkills.includes(sk);
              return (
                <button
                  key={sk}
                  type="button"
                  onClick={() => toggleSkill(sk)}
                  className={`text-xs px-2 py-0.5 rounded font-medium transition-all ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {sk}
                </button>
              );
            })}
          </div>
        </div>

        {/* Experience Slider & Location Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">
              Experiência Mínima ({minExp} anos)
            </label>
            <input
              type="range"
              min={0}
              max={15}
              value={minExp}
              onChange={(e) => setMinExp(parseInt(e.target.value))}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Cidade / Região</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md text-gray-800"
            >
              <option value="all">Todas as Cidades</option>
              {allUniqueCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Formação Acadêmica</label>
            <select
              value={eduLevelFilter}
              onChange={(e) => setEduLevelFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md text-gray-800"
            >
              <option value="all">Todas as Formações</option>
              <option value="graduacao">Graduação Superior</option>
              <option value="pos_graduacao">Pós-Graduação / MBA</option>
              <option value="mestrado">Mestrado / Doutorado</option>
              <option value="tecnico">Técnico</option>
              <option value="ensino_medio">Ensino Médio</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count & Grid */}
      {searchResults.length === 0 ? (
        <EmptyState
          title="Nenhum talento encontrado"
          description="Nenhum candidato atende a todos os critérios e filtros selecionados. Experimente flexibilizar os termos de busca."
          actionLabel="Redefinir Filtros"
          onAction={() => {
            setKeyword('');
            setSelectedSkills([]);
            setMinExp(0);
            setCityFilter('all');
            setEduLevelFilter('all');
            setSimulatedJobId('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map(({ cand, simulatedScore }) => (
            <div
              key={cand.id}
              className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:border-gray-300 transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3
                      onClick={() => {
                        setSelectedCandidateId(cand.id);
                        setActiveTab('candidate_detail');
                      }}
                      className="text-sm font-bold text-gray-900 hover:text-red-600 cursor-pointer line-clamp-1 transition-colors"
                    >
                      {cand.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cand.city ? `${cand.city} - ${cand.state}` : 'Localidade não informada'}
                    </p>
                  </div>

                  {simulatedScore !== null ? (
                    <div className="text-right">
                      <ScoreBadge score={simulatedScore} size="sm" />
                      <span className="text-[10px] text-gray-500 block mt-0.5 font-medium">Aderência</span>
                    </div>
                  ) : (
                    <CandidateStatusBadge status={cand.status} />
                  )}
                </div>

                {/* Experience & Education */}
                <div className="p-3 bg-gray-50 rounded-md border border-gray-100 text-xs text-gray-700 space-y-1 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span><strong>{cand.totalExperienceYears} anos</strong> de experiência</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{cand.education[0]?.course || 'Formação Superior'}</span>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <div className="text-[10px] font-bold uppercase text-gray-500 mb-1.5">Competências</div>
                  <div className="flex flex-wrap gap-1">
                    {cand.skills.map((sk) => {
                      const isMatched = selectedSkills.includes(sk.name);
                      return (
                        <span
                          key={sk.id}
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            isMatched
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {sk.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setTargetCandidate(cand);
                    setIsApplyModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Vincular a vaga
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCandidateId(cand.id);
                    setActiveTab('candidate_detail');
                  }}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                >
                  Ver perfil <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Apply */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Vincular Candidato à Vaga"
        subtitle={targetCandidate ? `Candidato: ${targetCandidate.name}` : ''}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Selecione a Vaga</label>
            <select
              value={targetJobId}
              onChange={(e) => setTargetJobId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-800"
            >
              <option value="">Escolha uma oportunidade...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplySubmit}
              disabled={!targetJobId}
              className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
            >
              Confirmar Inscrição
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
