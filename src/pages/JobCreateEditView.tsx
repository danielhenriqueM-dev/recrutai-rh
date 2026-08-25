import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sliders,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Job, JobCustomCriterion, MatchingWeights, EducationLevel, JobWorkplaceType } from '../types';

export const JobCreateEditView: React.FC = () => {
  const { createJob, updateJob, jobs, editingJobId, setEditingJobId, setActiveTab, settings } = useApp();

  const isEditing = Boolean(editingJobId);
  const jobToEdit = isEditing ? jobs.find((j) => j.id === editingJobId) : null;

  const [mode, setMode] = useState<'simples' | 'avancado'>('avancado');

  // Form states
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engenharia de Software');
  const [location, setLocation] = useState('São Paulo, SP');
  const [workplaceType, setWorkplaceType] = useState<JobWorkplaceType>('remoto');
  const [salaryRange, setSalaryRange] = useState('');
  const [description, setDescription] = useState('');

  // Criteria
  const [minExperienceYears, setMinExperienceYears] = useState(3);
  const [minEducationLevel, setMinEducationLevel] = useState<EducationLevel>('graduacao');

  // Required vs Desirable Skills
  const [reqSkillsInput, setReqSkillsInput] = useState('React, TypeScript, Node.js');
  const [desSkillsInput, setDesSkillsInput] = useState('Docker, AWS, Tailwind CSS');

  // Certifications
  const [reqCertsInput, setReqCertsInput] = useState('');
  const [desCertsInput, setDesCertsInput] = useState('AWS Certified Solutions Architect');

  // Languages
  const [languagesInput, setLanguagesInput] = useState('Inglês');

  // Custom Criteria list
  const [customCriteria, setCustomCriteria] = useState<JobCustomCriterion[]>([
    {
      id: 'crit_1',
      title: 'Clean Architecture',
      type: 'obrigatorio',
      description: 'Experiência prática em arquitetura limpa e SOLID',
    },
  ]);

  // Weights
  const [weights, setWeights] = useState<MatchingWeights>(settings.defaultWeights || {
    experience: 30,
    skills: 30,
    education: 15,
    certifications: 10,
    languages: 5,
    customCriteria: 10,
  });

  useEffect(() => {
    if (jobToEdit) {
      setTitle(jobToEdit.title);
      setDepartment(jobToEdit.department);
      setLocation(jobToEdit.location);
      setWorkplaceType(jobToEdit.workplaceType);
      setSalaryRange(jobToEdit.salaryRange || '');
      setDescription(jobToEdit.description);
      setMinExperienceYears(jobToEdit.minExperienceYears);
      setMinEducationLevel(jobToEdit.minEducationLevel);
      setReqSkillsInput(jobToEdit.requiredSkills.join(', '));
      setDesSkillsInput(jobToEdit.desirableSkills.join(', '));
      setReqCertsInput(jobToEdit.requiredCertifications?.join(', ') || '');
      setDesCertsInput(jobToEdit.desirableCertifications.join(', '));
      setLanguagesInput(jobToEdit.languages.join(', '));
      setCustomCriteria(jobToEdit.customCriteria || []);
      setWeights(jobToEdit.weights || settings.defaultWeights);
    }
  }, [jobToEdit, settings.defaultWeights]);

  const totalWeights =
    weights.experience +
    weights.skills +
    weights.education +
    weights.certifications +
    weights.languages +
    weights.customCriteria;

  const handleAddCriterion = () => {
    setCustomCriteria([
      ...customCriteria,
      {
        id: 'crit_' + Date.now(),
        title: '',
        type: 'desejavel',
        description: '',
      },
    ]);
  };

  const handleRemoveCriterion = (id: string) => {
    setCustomCriteria(customCriteria.filter((c) => c.id !== id));
  };

  const handleCriterionChange = (id: string, field: keyof JobCustomCriterion, value: any) => {
    setCustomCriteria(
      customCriteria.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleGoBack = () => {
    setEditingJobId(null);
    setActiveTab('jobs');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parseList = (str: string) =>
      str
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    if (isEditing && editingJobId) {
      await updateJob(editingJobId, {
        title: title.trim(),
        department: department.trim() || 'Geral',
        location: location.trim() || 'São Paulo, SP',
        workplaceType,
        salaryRange: salaryRange.trim() || undefined,
        description: description.trim() || 'Descrição da oportunidade',
        minExperienceYears: mode === 'simples' ? 1 : minExperienceYears,
        minEducationLevel: mode === 'simples' ? 'ensino_medio' : minEducationLevel,
        requiredSkills: parseList(reqSkillsInput),
        desirableSkills: mode === 'simples' ? [] : parseList(desSkillsInput),
        requiredCertifications: mode === 'simples' ? [] : parseList(reqCertsInput),
        desirableCertifications: mode === 'simples' ? [] : parseList(desCertsInput),
        languages: parseList(languagesInput),
        customCriteria: mode === 'simples' ? [] : customCriteria.filter((c) => c.title.trim().length > 0),
        weights,
        updatedAt: new Date().toISOString(),
      });
      setEditingJobId(null);
      setActiveTab('jobs');
      return;
    }

    const newJob: Job = {
      id: 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      department: department.trim() || 'Geral',
      location: location.trim() || 'São Paulo, SP',
      workplaceType,
      salaryRange: salaryRange.trim() || undefined,
      description: description.trim() || 'Descrição da oportunidade',
      minExperienceYears: mode === 'simples' ? 1 : minExperienceYears,
      minEducationLevel: mode === 'simples' ? 'ensino_medio' : minEducationLevel,
      requiredSkills: parseList(reqSkillsInput),
      desirableSkills: mode === 'simples' ? [] : parseList(desSkillsInput),
      requiredCertifications: mode === 'simples' ? [] : parseList(reqCertsInput),
      desirableCertifications: mode === 'simples' ? [] : parseList(desCertsInput),
      languages: parseList(languagesInput),
      customCriteria: mode === 'simples' ? [] : customCriteria.filter((c) => c.title.trim().length > 0),
      weights,
      status: 'aberta',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createJob(newJob);
    setEditingJobId(null);
    setActiveTab('jobs');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para Vagas
          </button>
          <span className="text-sm font-bold text-gray-900">
            {isEditing ? `Editando: ${jobToEdit?.title || 'Vaga'}` : 'Cadastrar Nova Vaga'}
          </span>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center p-0.5 bg-gray-100 rounded-md border border-gray-200">
          <button
            type="button"
            onClick={() => setMode('simples')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              mode === 'simples'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Modo Rápido
          </button>
          <button
            type="button"
            onClick={() => setMode('avancado')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              mode === 'avancado'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Modo Completo
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
            <div className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Informações Básicas da Vaga</h3>
              <p className="text-xs text-gray-500">Dados cadastrais e detalhes de contratação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Título do Cargo / Vaga *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Desenvolvedor(a) Frontend Sênior"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden font-medium text-gray-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Departamento</label>
              <input
                type="text"
                placeholder="Ex: Tecnologia, Financeiro, RH..."
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Localização</label>
              <input
                type="text"
                placeholder="Ex: São Paulo, SP ou Nacional"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Regime de Trabalho</label>
              <select
                value={workplaceType}
                onChange={(e: any) => setWorkplaceType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900 font-medium"
              >
                <option value="remoto">100% Remoto</option>
                <option value="hibrido">Híbrido</option>
                <option value="presencial">Presencial</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Faixa Salarial (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: R$ 8.000 - R$ 11.000"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900 font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700 block mb-1">Descrição e Responsabilidades</label>
              <textarea
                rows={4}
                required
                placeholder="Descreva as principais atribuições e responsabilidades do cargo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-md focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden leading-relaxed text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Requirements Card (Advanced Mode) */}
        {mode === 'avancado' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
              <div className="w-6 h-6 rounded bg-gray-800 text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Critérios Obrigatórios e Desejáveis</h3>
                <p className="text-xs text-gray-500">
                  Requisitos desejáveis agregam pontuação sem eliminar o candidato
                </p>
              </div>
            </div>

            {/* Experience & Education */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Experiência Mínima (anos)
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={minExperienceYears}
                  onChange={(e) => setMinExperienceYears(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Escolaridade Mínima
                </label>
                <select
                  value={minEducationLevel}
                  onChange={(e: any) => setMinEducationLevel(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900 font-medium"
                >
                  <option value="ensino_medio">Ensino Médio</option>
                  <option value="tecnico">Ensino Técnico</option>
                  <option value="graduacao">Graduação Superior</option>
                  <option value="pos_graduacao">Pós-Graduação / MBA</option>
                  <option value="mestrado">Mestrado</option>
                  <option value="doutorado">Doutorado</option>
                </select>
              </div>
            </div>

            {/* Skills: Required vs Desirable */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-md bg-gray-50 border border-gray-200 space-y-2">
                <label className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  Habilidades OBRIGATÓRIAS (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: React, TypeScript, Node.js, SQL"
                  value={reqSkillsInput}
                  onChange={(e) => setReqSkillsInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900 font-medium"
                />
                <p className="text-[11px] text-gray-500">Se ausente, sinaliza como pendência técnica.</p>
              </div>

              <div className="p-3.5 rounded-md bg-gray-50 border border-gray-200 space-y-2">
                <label className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-600" />
                  Habilidades DESEJÁVEIS (Diferenciais)
                </label>
                <input
                  type="text"
                  placeholder="Ex: AWS, Docker, GraphQL, Next.js"
                  value={desSkillsInput}
                  onChange={(e) => setDesSkillsInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900 font-medium"
                />
                <p className="text-[11px] text-gray-500">Agrega pontuação positiva sem eliminar.</p>
              </div>
            </div>

            {/* Certifications & Languages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Certificações Desejáveis
                </label>
                <input
                  type="text"
                  placeholder="Ex: AWS Certified Solutions Architect, ITIL"
                  value={desCertsInput}
                  onChange={(e) => setDesCertsInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Idiomas</label>
                <input
                  type="text"
                  placeholder="Ex: Inglês, Espanhol"
                  value={languagesInput}
                  onChange={(e) => setLanguagesInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-900 font-medium"
                />
              </div>
            </div>

            {/* Custom Criteria Section */}
            <div className="pt-3 border-t border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Critérios Específicos Adicionais</h4>
                  <p className="text-[11px] text-gray-500">Adicione outros requisitos chave para esta vaga</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCriterion}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Critério
                </button>
              </div>

              {customCriteria.map((crit) => (
                <div key={crit.id} className="p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Nome do critério (ex: Liderança, Metodologias Ágeis)..."
                    value={crit.title}
                    onChange={(e) => handleCriterionChange(crit.id, 'title', e.target.value)}
                    className="flex-1 px-3 py-1 text-xs bg-white border border-gray-300 rounded text-gray-900 font-medium"
                  />
                  <select
                    value={crit.type}
                    onChange={(e) => handleCriterionChange(crit.id, 'type', e.target.value)}
                    className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 font-medium"
                  >
                    <option value="desejavel">Desejável</option>
                    <option value="obrigatorio">Obrigatório</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(crit.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Matching Weights */}
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-gray-500" />
                    Pesos de Avaliação
                  </h4>
                  <p className="text-[11px] text-gray-500">Defina o peso percentual de cada critério</p>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  totalWeights === 100 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  Total: {totalWeights}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Experiência ({weights.experience}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={weights.experience}
                    onChange={(e) => setWeights({ ...weights, experience: parseInt(e.target.value) || 0 })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Habilidades ({weights.skills}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={weights.skills}
                    onChange={(e) => setWeights({ ...weights, skills: parseInt(e.target.value) || 0 })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Formação ({weights.education}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={weights.education}
                    onChange={(e) => setWeights({ ...weights, education: parseInt(e.target.value) || 0 })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Certificações ({weights.certifications}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={weights.certifications}
                    onChange={(e) => setWeights({ ...weights, certifications: parseInt(e.target.value) || 0 })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Idiomas ({weights.languages}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={weights.languages}
                    onChange={(e) => setWeights({ ...weights, languages: parseInt(e.target.value) || 0 })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Específicos ({weights.customCriteria}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={weights.customCriteria}
                    onChange={(e) => setWeights({ ...weights, customCriteria: parseInt(e.target.value) || 0 })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleGoBack}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
          >
            {isEditing ? 'Salvar Alterações da Vaga' : 'Salvar e Publicar Vaga'}
          </button>
        </div>
      </form>
    </div>
  );
};
