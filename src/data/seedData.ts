import {
  Candidate,
  Job,
  Application,
  Interview,
  Evaluation,
  AuditLog,
} from '../types';
import { calculateCandidateMatch } from '../services/matchingEngine';

export const SEED_JOBS: Job[] = [
  {
    id: 'job_fullstack_sr',
    title: 'Desenvolvedor(a) Full Stack Sênior',
    department: 'Engenharia de Software',
    location: 'São Paulo, SP',
    workplaceType: 'remoto',
    salaryRange: 'R$ 13.000 - R$ 17.000',
    description:
      'Buscamos profissional experiente para atuar no desenvolvimento e arquitetura de sistemas web escaláveis. Atuação com React, Node.js, TypeScript e ecossistema Cloud (AWS/Docker).',
    minExperienceYears: 5,
    minEducationLevel: 'graduacao',
    requiredSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Git'],
    desirableSkills: ['AWS', 'Kubernetes', 'Next.js', 'CI/CD', 'GraphQL', 'Tailwind CSS'],
    requiredCertifications: [],
    desirableCertifications: ['AWS Certified Solutions Architect', 'AWS Certified Developer'],
    languages: ['Inglês'],
    customCriteria: [
      {
        id: 'crit_clean_arch',
        title: 'Clean Architecture',
        type: 'obrigatorio',
        description: 'Domínio de boas práticas de arquitetura e SOLID',
      },
      {
        id: 'crit_mentoring',
        title: 'Liderança de Equipes',
        type: 'desejavel',
        description: 'Experiência prévia em mentoria de desenvolvedores juniores e plenos',
      },
    ],
    weights: {
      experience: 30,
      skills: 35,
      education: 10,
      certifications: 10,
      languages: 5,
      customCriteria: 10,
    },
    status: 'aberta',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'job_suporte_n2',
    title: 'Analista de Suporte de TI N2',
    department: 'Infraestrutura & Operações',
    location: 'São Paulo, SP',
    workplaceType: 'presencial',
    salaryRange: 'R$ 4.500 - R$ 6.200',
    description:
      'Responsável pelo suporte avançado a usuários corporativos, administração de redes locais, servidores Windows Server e Active Directory, gestão de chamados e atendimento N2.',
    minExperienceYears: 3,
    minEducationLevel: 'tecnico',
    requiredSkills: ['Windows Server', 'Active Directory', 'Redes', 'Suporte N2', 'Service Desk'],
    desirableSkills: ['Linux', 'VMware', 'Firewall', 'PowerShell', 'DNS', 'DHCP'],
    requiredCertifications: [],
    desirableCertifications: ['ITIL 4 Foundation', 'CompTIA Network+', 'Cisco CCNA'],
    languages: ['Inglês'],
    customCriteria: [
      {
        id: 'crit_itil',
        title: 'ITIL',
        type: 'desejavel',
        description: 'Conhecimento em processos ITIL para incidentes e requisições',
      },
    ],
    weights: {
      experience: 30,
      skills: 30,
      education: 15,
      certifications: 15,
      languages: 5,
      customCriteria: 5,
    },
    status: 'aberta',
    createdAt: '2026-08-05T10:30:00.000Z',
    updatedAt: '2026-08-05T10:30:00.000Z',
  },
  {
    id: 'job_scrum_master',
    title: 'Gerente de Projetos Ágeis / Scrum Master',
    department: 'Gestão & Transformação Digital',
    location: 'Curitiba, PR',
    workplaceType: 'hibrido',
    salaryRange: 'R$ 10.000 - R$ 14.000',
    description:
      'Facilitação de cerimônias ágeis (Scrum/Kanban), remoção de impedimentos, métricas de produtividade (Throughput, Lead Time) e alinhamento com stakeholders de produto.',
    minExperienceYears: 4,
    minEducationLevel: 'graduacao',
    requiredSkills: ['Scrum', 'Kanban', 'Jira', 'Gestão de Projetos', 'Liderança de Equipes'],
    desirableSkills: ['PMBOK', 'Figma', 'Confluence', 'Power BI', 'Comunicação'],
    requiredCertifications: ['Scrum Master'],
    desirableCertifications: ['PSM I', 'PMP - Project Management Professional', 'PMI-ACP'],
    languages: ['Inglês'],
    customCriteria: [
      {
        id: 'crit_metrics',
        title: 'Métricas Ágeis',
        type: 'desejavel',
        description: 'Acompanhamento de métricas de fluxo e ciclo de entrega',
      },
    ],
    weights: {
      experience: 25,
      skills: 30,
      education: 15,
      certifications: 20,
      languages: 5,
      customCriteria: 5,
    },
    status: 'aberta',
    createdAt: '2026-08-10T14:00:00.000Z',
    updatedAt: '2026-08-10T14:00:00.000Z',
  },
];

export const SEED_CANDIDATES: Candidate[] = [
  {
    id: 'cand_1_lucas',
    name: 'Lucas Almeida Santos',
    email: 'lucas.almeida.dev@email.com',
    phone: '(11) 98765-4321',
    city: 'São Paulo',
    state: 'SP',
    education: [
      {
        id: 'edu_1',
        level: 'graduacao',
        course: 'Bacharelado em Ciência da Computação',
        institution: 'Universidade de São Paulo (USP)',
        completionYear: 2019,
        status: 'completo',
      },
      {
        id: 'edu_1b',
        level: 'pos_graduacao',
        course: 'Especialização em Arquitetura de Software Cloud',
        institution: 'FIAP',
        completionYear: 2022,
        status: 'completo',
      },
    ],
    experiences: [
      {
        id: 'exp_1',
        role: 'Tech Lead / Desenvolvedor Sênior',
        company: 'Fintech Nexus Digital',
        startDate: '2022',
        endDate: 'Atual',
        current: true,
        years: 4,
        description:
          'Liderança técnica de squad com 6 desenvolvedores. Arquitetura de microsserviços Node.js, TypeScript e React com Next.js, deploy na AWS via Docker e Terraform.',
      },
      {
        id: 'exp_2',
        role: 'Desenvolvedor Full Stack Pleno',
        company: 'InovaTech Sistemas',
        startDate: '2019',
        endDate: '2022',
        current: false,
        years: 3,
        description:
          'Desenvolvimento web com React, Node.js, Express, PostgreSQL e testes com Jest e Cypress.',
      },
    ],
    skills: [
      { id: 'sk_1', name: 'React', level: 'especialista', category: 'tecnica' },
      { id: 'sk_2', name: 'TypeScript', level: 'especialista', category: 'tecnica' },
      { id: 'sk_3', name: 'Node.js', level: 'especialista', category: 'tecnica' },
      { id: 'sk_4', name: 'PostgreSQL', level: 'avancado', category: 'tecnica' },
      { id: 'sk_5', name: 'Docker', level: 'avancado', category: 'ferramenta' },
      { id: 'sk_6', name: 'AWS', level: 'avancado', category: 'ferramenta' },
      { id: 'sk_7', name: 'Git', level: 'especialista', category: 'ferramenta' },
      { id: 'sk_8', name: 'Next.js', level: 'avancado', category: 'tecnica' },
      { id: 'sk_9', name: 'Clean Architecture', level: 'avancado', category: 'tecnica' },
      { id: 'sk_10', name: 'Liderança de Equipes', level: 'avancado', category: 'comportamental' },
    ],
    certifications: [
      { id: 'cert_1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', year: 2023 },
    ],
    languages: ['Inglês (Avançado)', 'Espanhol (Básico)'],
    totalExperienceYears: 7,
    rawText: `Lucas Almeida Santos
E-mail: lucas.almeida.dev@email.com | Tel: (11) 98765-4321 | São Paulo - SP
Resumo: Engenheiro de Software com 7 anos de experiência em desenvolvimento Full Stack (React, Node.js, TypeScript).
Formação: Bacharelado em Ciência da Computação (USP) e Pós-Graduação em Arquitetura de Software (FIAP).
Experiência:
- Fintech Nexus Digital (2022 - Atual): Tech Lead, liderando squad com Node.js, TypeScript, React, Docker e AWS. Práticas de Clean Architecture e SOLID.
- InovaTech Sistemas (2019 - 2022): Desenvolvedor Full Stack React, Node.js, PostgreSQL, Docker, Git.
Habilidades: React, TypeScript, Node.js, PostgreSQL, Docker, AWS, Git, Next.js, GraphQL, Clean Architecture, Liderança de Equipes.
Certificações: AWS Certified Solutions Architect.
Idiomas: Inglês Avançado.`,
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-08-02T10:00:00.000Z',
    status: 'entrevista',
    resumeFileName: 'Curriculo_Lucas_Almeida_FullStack.pdf',
  },
  {
    id: 'cand_2_mariana',
    name: 'Mariana Costa Ribeiro',
    email: 'mariana.costa.dev@gmail.com',
    phone: '(11) 97123-9876',
    city: 'São Paulo',
    state: 'SP',
    education: [
      {
        id: 'edu_2',
        level: 'graduacao',
        course: 'Sistemas de Informação',
        institution: 'Universidade Presbiteriana Mackenzie',
        completionYear: 2020,
        status: 'completo',
      },
    ],
    experiences: [
      {
        id: 'exp_2a',
        role: 'Desenvolvedora Full Stack Pleno',
        company: 'Logix Soluções Digitais',
        startDate: '2021',
        endDate: 'Atual',
        current: true,
        years: 5,
        description: 'Construção de SPAs em React, APIs RESTful em Node.js com Express e PostgreSQL, containerização com Docker.',
      },
      {
        id: 'exp_2b',
        role: 'Desenvolvedora Frontend Júnior',
        company: 'Agência WebPulse',
        startDate: '2019',
        endDate: '2021',
        current: false,
        years: 2,
        description: 'Criação de interfaces com React, JavaScript, HTML5, CSS3 e Git.',
      },
    ],
    skills: [
      { id: 'sk_20', name: 'React', level: 'avancado', category: 'tecnica' },
      { id: 'sk_21', name: 'TypeScript', level: 'avancado', category: 'tecnica' },
      { id: 'sk_22', name: 'Node.js', level: 'intermediario', category: 'tecnica' },
      { id: 'sk_23', name: 'PostgreSQL', level: 'intermediario', category: 'tecnica' },
      { id: 'sk_24', name: 'Docker', level: 'intermediario', category: 'ferramenta' },
      { id: 'sk_25', name: 'Git', level: 'avancado', category: 'ferramenta' },
      { id: 'sk_26', name: 'Tailwind CSS', level: 'avancado', category: 'tecnica' },
    ],
    certifications: [],
    languages: ['Inglês (Intermediário)'],
    totalExperienceYears: 6,
    rawText: `Mariana Costa Ribeiro
São Paulo - SP | mariana.costa.dev@gmail.com | (11) 97123-9876
Graduação em Sistemas de Informação (Mackenzie, 2020).
Experiência: 6 anos atuando em desenvolvimento web.
- Logix Soluções Digitais (2021 - Atual): Full Stack Developer com React, TypeScript, Node.js, Express, PostgreSQL e Docker.
- Agência WebPulse (2019 - 2021): Frontend Developer React, HTML5, CSS3, Tailwind CSS, Git.
Habilidades: React, TypeScript, Node.js, PostgreSQL, Docker, Git, Tailwind CSS, Clean Code.
Idiomas: Inglês Intermediário.`,
    createdAt: '2026-08-03T11:00:00.000Z',
    updatedAt: '2026-08-03T11:00:00.000Z',
    status: 'pre_selecionado',
    resumeFileName: 'Mariana_Costa_CV.docx',
  },
  {
    id: 'cand_3_rodrigo',
    name: 'Rodrigo Mendonça Silva',
    email: 'rodrigo.mendonca.infra@outlook.com',
    phone: '(11) 98456-1122',
    city: 'São Paulo',
    state: 'SP',
    education: [
      {
        id: 'edu_3',
        level: 'tecnico',
        course: 'Técnico em Redes de Computadores',
        institution: 'SENAI Informática',
        completionYear: 2018,
        status: 'completo',
      },
      {
        id: 'edu_3b',
        level: 'graduacao',
        course: 'Gestão de Tecnologia da Informação',
        institution: 'UNIP',
        completionYear: 2022,
        status: 'completo',
      },
    ],
    experiences: [
      {
        id: 'exp_3a',
        role: 'Analista de Suporte N2 / Infraestrutura',
        company: 'Omni Hospitalar',
        startDate: '2021',
        endDate: 'Atual',
        current: true,
        years: 5,
        description: 'Administração de Windows Server, Active Directory, GPO, Office 365, suporte presencial e remoto a mais de 400 usuários.',
      },
      {
        id: 'exp_3b',
        role: 'Técnico de Suporte N1',
        company: 'SoftCorp Contact Center',
        startDate: '2019',
        endDate: '2021',
        current: false,
        years: 2,
        description: 'Atendimento de chamados Help Desk, configuração de estações Windows, redes TCP/IP, cabeamento e impressoras.',
      },
    ],
    skills: [
      { id: 'sk_30', name: 'Windows Server', level: 'avancado', category: 'tecnica' },
      { id: 'sk_31', name: 'Active Directory', level: 'avancado', category: 'tecnica' },
      { id: 'sk_32', name: 'Redes', level: 'avancado', category: 'tecnica' },
      { id: 'sk_33', name: 'Suporte N2', level: 'especialista', category: 'tecnica' },
      { id: 'sk_34', name: 'Service Desk', level: 'avancado', category: 'ferramenta' },
      { id: 'sk_35', name: 'Linux', level: 'intermediario', category: 'tecnica' },
      { id: 'sk_36', name: 'VMware', level: 'intermediario', category: 'ferramenta' },
      { id: 'sk_37', name: 'ITIL', level: 'intermediario', category: 'tecnica' },
    ],
    certifications: [
      { id: 'cert_3a', name: 'ITIL 4 Foundation', issuer: 'PeopleCert', year: 2022 },
      { id: 'cert_3b', name: 'Cisco CCNA', issuer: 'Cisco', year: 2021 },
    ],
    languages: ['Inglês (Técnico)'],
    totalExperienceYears: 6,
    rawText: `Rodrigo Mendonça Silva
São Paulo - SP | rodrigo.mendonca.infra@outlook.com | (11) 98456-1122
Formação: Técnico em Redes (SENAI) e Graduação em Gestão de TI (UNIP).
Experiência Profissional (6 anos):
- Omni Hospitalar (2021 - Atual): Analista de Suporte N2. Gestão de Windows Server, Active Directory, GPOs, VMware, Redes TCP/IP, DNS, DHCP, Service Desk.
- SoftCorp (2019 - 2021): Suporte N1 e Help Desk, atendimento ao cliente, manutenção preventiva.
Certificações: ITIL 4 Foundation, Cisco CCNA.
Habilidades: Windows Server, Active Directory, Redes, Suporte N2, Service Desk, VMware, Linux, ITIL.
Inglês: Técnico.`,
    createdAt: '2026-08-06T08:30:00.000Z',
    updatedAt: '2026-08-06T08:30:00.000Z',
    status: 'aprovado',
    resumeFileName: 'CV_Rodrigo_Suporte_TI.pdf',
  },
  {
    id: 'cand_4_beatriz',
    name: 'Beatriz Vasconcelos',
    email: 'beatriz.vasconcelos@agile.com.br',
    phone: '(41) 99123-5544',
    city: 'Curitiba',
    state: 'PR',
    education: [
      {
        id: 'edu_4',
        level: 'graduacao',
        course: 'Administração com ênfase em TI',
        institution: 'UFPR - Universidade Federal do Paraná',
        completionYear: 2018,
        status: 'completo',
      },
      {
        id: 'edu_4b',
        level: 'pos_graduacao',
        course: 'MBA em Gestão Estratégica de Projetos',
        institution: 'FGV',
        completionYear: 2021,
        status: 'completo',
      },
    ],
    experiences: [
      {
        id: 'exp_4a',
        role: 'Scrum Master & Agile Coach',
        company: 'Vanguard Hub de Inovação',
        startDate: '2021',
        endDate: 'Atual',
        current: true,
        years: 5,
        description: 'Facilitação de cerimônias Scrum e Kanban para 3 times multidisciplinares, gestão do Jira, métricas de fluxo, OKRs e dinâmicas de melhoria contínua.',
      },
      {
        id: 'exp_4b',
        role: 'Analista de Projetos',
        company: 'Grupo Positivo',
        startDate: '2018',
        endDate: '2021',
        current: false,
        years: 3,
        description: 'Gestão de cronogramas, documentação de escopo, comunicação com stakeholders e suporte a implantações de software.',
      },
    ],
    skills: [
      { id: 'sk_40', name: 'Scrum', level: 'especialista', category: 'tecnica' },
      { id: 'sk_41', name: 'Kanban', level: 'especialista', category: 'tecnica' },
      { id: 'sk_42', name: 'Jira', level: 'especialista', category: 'ferramenta' },
      { id: 'sk_43', name: 'Gestão de Projetos', level: 'especialista', category: 'tecnica' },
      { id: 'sk_44', name: 'Liderança de Equipes', level: 'avancado', category: 'comportamental' },
      { id: 'sk_45', name: 'Power BI', level: 'intermediario', category: 'ferramenta' },
      { id: 'sk_46', name: 'Métricas Ágeis', level: 'avancado', category: 'tecnica' },
    ],
    certifications: [
      { id: 'cert_4a', name: 'Scrum Master PSM I', issuer: 'Scrum.org', year: 2020 },
      { id: 'cert_4b', name: 'PMP - Project Management Professional', issuer: 'PMI', year: 2022 },
    ],
    languages: ['Inglês (Fluente)', 'Espanhol (Intermediário)'],
    totalExperienceYears: 8,
    rawText: `Beatriz Vasconcelos
Curitiba - PR | beatriz.vasconcelos@agile.com.br | (41) 99123-5544
Formação: Graduação em Administração (UFPR, 2018) e MBA em Gestão de Projetos (FGV, 2021).
Experiência: 8 anos na área de gestão e agilidade.
- Vanguard Hub (2021 - Atual): Scrum Master sênior para squads de produto, uso de Scrum, Kanban, Jira, Métricas Ágeis (Throughput, CFD), facilitação de cerimônias e Liderança de Equipes.
- Grupo Positivo (2018 - 2021): Gestão de Projetos e processos PMBOK.
Certificações: Scrum Master (PSM I), PMP - Project Management Professional.
Idiomas: Inglês Fluente, Espanhol Intermediário.`,
    createdAt: '2026-08-11T15:00:00.000Z',
    updatedAt: '2026-08-11T15:00:00.000Z',
    status: 'entrevista',
    resumeFileName: 'Beatriz_Vasconcelos_Scrum_Master.pdf',
  },
  {
    id: 'cand_5_gabriel',
    name: 'Gabriel Fernandes Moura',
    email: 'gabriel.moura.code@gmail.com',
    phone: '(31) 98877-6655',
    city: 'Belo Horizonte',
    state: 'MG',
    education: [
      {
        id: 'edu_5',
        level: 'graduacao',
        course: 'Engenharia de Software',
        institution: 'PUC Minas',
        completionYear: 2021,
        status: 'completo',
      },
    ],
    experiences: [
      {
        id: 'exp_5a',
        role: 'Desenvolvedor Backend Node.js',
        company: 'CloudMine Tech',
        startDate: '2021',
        endDate: 'Atual',
        current: true,
        years: 4,
        description: 'Criação de microserviços em Node.js com TypeScript, banco de dados PostgreSQL e MongoDB, mensageria RabbitMQ e deploy em Docker.',
      },
    ],
    skills: [
      { id: 'sk_50', name: 'Node.js', level: 'avancado', category: 'tecnica' },
      { id: 'sk_51', name: 'TypeScript', level: 'avancado', category: 'tecnica' },
      { id: 'sk_52', name: 'PostgreSQL', level: 'avancado', category: 'tecnica' },
      { id: 'sk_53', name: 'Docker', level: 'avancado', category: 'ferramenta' },
      { id: 'sk_54', name: 'Git', level: 'avancado', category: 'ferramenta' },
      { id: 'sk_55', name: 'AWS', level: 'intermediario', category: 'ferramenta' },
    ],
    certifications: [],
    languages: ['Inglês (Intermediário)'],
    totalExperienceYears: 4,
    rawText: `Gabriel Fernandes Moura
Belo Horizonte - MG | gabriel.moura.code@gmail.com | (31) 98877-6655
Graduação: Engenharia de Software (PUC Minas).
Experiência (4 anos):
- CloudMine Tech (2021 - Atual): Backend Developer focado em Node.js, TypeScript, PostgreSQL, Docker, Git e AWS.
Habilidades: Node.js, TypeScript, PostgreSQL, Docker, Git, AWS, REST API, Microserviços.
Inglês Intermediário.`,
    createdAt: '2026-08-12T09:15:00.000Z',
    updatedAt: '2026-08-12T09:15:00.000Z',
    status: 'triagem',
    resumeFileName: 'Gabriel_Moura_Backend.docx',
  },
  {
    id: 'cand_6_juliana',
    name: 'Juliana Paes de Oliveira',
    email: 'juliana.paes.qa@yahoo.com.br',
    phone: '(19) 99345-6789',
    city: 'Campinas',
    state: 'SP',
    education: [
      {
        id: 'edu_6',
        level: 'graduacao',
        course: 'Análise e Desenvolvimento de Sistemas',
        institution: 'FATEC Campinas',
        completionYear: 2021,
        status: 'completo',
      },
    ],
    experiences: [
      {
        id: 'exp_6a',
        role: 'Analista de QA / Testes Automatizados',
        company: 'QualySoftware',
        startDate: '2021',
        endDate: 'Atual',
        current: true,
        years: 4,
        description: 'Automação de testes E2E com Cypress e Playwright em aplicações React/Node.js, criação de planos de teste e integração em pipelines CI/CD.',
      },
    ],
    skills: [
      { id: 'sk_60', name: 'Cypress', level: 'avancado', category: 'tecnica' },
      { id: 'sk_61', name: 'TypeScript', level: 'intermediario', category: 'tecnica' },
      { id: 'sk_62', name: 'Git', level: 'avancado', category: 'ferramenta' },
      { id: 'sk_63', name: 'Scrum', level: 'intermediario', category: 'tecnica' },
      { id: 'sk_64', name: 'Jira', level: 'avancado', category: 'ferramenta' },
    ],
    certifications: [],
    languages: ['Inglês (Intermediário)'],
    totalExperienceYears: 4,
    rawText: `Juliana Paes de Oliveira
Campinas - SP | juliana.paes.qa@yahoo.com.br | (19) 99345-6789
Formação: FATEC Campinas (Análise e Desenvolvimento de Sistemas).
Experiência: 4 anos em Garantia da Qualidade (QA), automação com Cypress, JavaScript, TypeScript, Jira, Scrum, Git.
Inglês: Intermediário.`,
    createdAt: '2026-08-13T14:30:00.000Z',
    updatedAt: '2026-08-13T14:30:00.000Z',
    status: 'novo',
    resumeFileName: 'Curriculo_Juliana_QA.pdf',
  },
  {
    id: 'cand_7_felipe',
    name: 'Felipe Augusto Barreto',
    email: 'felipe.barreto.ti@empresa.com.br',
    phone: '(11) 97654-3210',
    city: 'São Paulo',
    state: 'SP',
    education: [
      {
        id: 'edu_7',
        level: 'tecnico',
        course: 'Técnico em Informática',
        institution: 'ETEC São Paulo',
        completionYear: 2019,
        status: 'completo',
      },
    ],
    experiences: [
      {
        id: 'exp_7a',
        role: 'Técnico de Suporte N2 / Redes',
        company: 'Varejo Express',
        startDate: '2020',
        endDate: 'Atual',
        current: true,
        years: 4,
        description: 'Suporte presencial e remoto, manutenção de Windows Server, Active Directory, cabeamento estruturado, roteadores e switches.',
      },
    ],
    skills: [
      { id: 'sk_70', name: 'Windows Server', level: 'avancado', category: 'tecnica' },
      { id: 'sk_71', name: 'Active Directory', level: 'avancado', category: 'tecnica' },
      { id: 'sk_72', name: 'Redes', level: 'avancado', category: 'tecnica' },
      { id: 'sk_73', name: 'Suporte N2', level: 'avancado', category: 'tecnica' },
      { id: 'sk_74', name: 'Service Desk', level: 'avancado', category: 'ferramenta' },
    ],
    certifications: [],
    languages: ['Inglês (Básico)'],
    totalExperienceYears: 4,
    rawText: `Felipe Augusto Barreto
São Paulo - SP | felipe.barreto.ti@empresa.com.br | (11) 97654-3210
Escolaridade: Técnico em Informática (ETEC).
Experiência: 4 anos em Suporte N2 e infraestrutura corporativa.
Empresa: Varejo Express (2020 - Atual). Atuação em Windows Server, Active Directory, Redes locais, Service Desk.
Inglês Básico.`,
    createdAt: '2026-08-14T10:00:00.000Z',
    updatedAt: '2026-08-14T10:00:00.000Z',
    status: 'triagem',
    resumeFileName: 'Felipe_Barreto_Suporte.txt',
  },
  {
    id: 'cand_8_camila',
    name: 'Camila Duarte Souza',
    email: 'camila.duarte.pm@gmail.com',
    phone: '(41) 98432-9090',
    city: 'Curitiba',
    state: 'PR',
    education: [
      {
        id: 'edu_8',
        level: 'graduacao',
        course: 'Engenharia de Produção',
        institution: 'PUC-PR',
        completionYear: 2019,
        status: 'completo',
      },
    ],
    experiences: [
      {
        id: 'exp_8a',
        role: 'Agile Project Manager / Scrum Master',
        company: 'Fintech Sultech',
        startDate: '2020',
        endDate: 'Atual',
        current: true,
        years: 5,
        description: 'Gestão de projetos com metodologia Scrum e Kanban, utilização diária de Jira e Confluence, métricas ágeis e facilitação de sprints.',
      },
    ],
    skills: [
      { id: 'sk_80', name: 'Scrum', level: 'avancado', category: 'tecnica' },
      { id: 'sk_81', name: 'Kanban', level: 'avancado', category: 'tecnica' },
      { id: 'sk_82', name: 'Jira', level: 'avancado', category: 'ferramenta' },
      { id: 'sk_83', name: 'Gestão de Projetos', level: 'avancado', category: 'tecnica' },
      { id: 'sk_84', name: 'Liderança de Equipes', level: 'intermediario', category: 'comportamental' },
    ],
    certifications: [
      { id: 'cert_8a', name: 'Scrum Master PSM I', issuer: 'Scrum.org', year: 2021 },
    ],
    languages: ['Inglês (Avançado)'],
    totalExperienceYears: 5,
    rawText: `Camila Duarte Souza
Curitiba - PR | camila.duarte.pm@gmail.com | (41) 98432-9090
Formação: Engenharia de Produção (PUC-PR, 2019).
Experiência: 5 anos em gestão de projetos ágeis.
Atuação na Sultech (2020 - Atual): Scrum Master facilitando times ágeis com Scrum, Kanban, Jira, OKRs e Gestão de Projetos.
Certificações: Scrum Master (PSM I).
Idiomas: Inglês Avançado.`,
    createdAt: '2026-08-15T16:00:00.000Z',
    updatedAt: '2026-08-15T16:00:00.000Z',
    status: 'pre_selecionado',
    resumeFileName: 'CV_Camila_Duarte_Agile.pdf',
  },
  {
    id: 'cand_9_andre',
    name: 'André Vinicius Lima',
    email: 'andre.v.lima.dev@hotmail.com',
    phone: '(21) 99881-2233',
    city: 'Rio de Janeiro',
    state: 'RJ',
    education: [
      {
        id: 'edu_9',
        level: 'graduacao',
        course: 'Ciência da Computação',
        institution: 'UFRJ',
        completionYear: 2022,
        status: 'completo',
      },
    ],
    experiences: [
      {
        id: 'exp_9a',
        role: 'Desenvolvedor Frontend React',
        company: 'Wave Studio',
        startDate: '2021',
        endDate: 'Atual',
        current: true,
        years: 4,
        description: 'Desenvolvimento de interfaces modernas em React, TypeScript, Tailwind CSS e integração com APIs REST e GraphQL.',
      },
    ],
    skills: [
      { id: 'sk_90', name: 'React', level: 'avancado', category: 'tecnica' },
      { id: 'sk_91', name: 'TypeScript', level: 'avancado', category: 'tecnica' },
      { id: 'sk_92', name: 'Tailwind CSS', level: 'especialista', category: 'tecnica' },
      { id: 'sk_93', name: 'Git', level: 'avancado', category: 'ferramenta' },
      { id: 'sk_94', name: 'GraphQL', level: 'intermediario', category: 'tecnica' },
    ],
    certifications: [],
    languages: ['Inglês (Intermediário)'],
    totalExperienceYears: 4,
    rawText: `André Vinicius Lima
Rio de Janeiro - RJ | andre.v.lima.dev@hotmail.com | (21) 99881-2233
Formação: Bacharel em Ciência da Computação pela UFRJ (2022).
Experiência: 4 anos desenvolvendo aplicações web com React, TypeScript, Tailwind CSS, GraphQL, Git.
Inglês Intermediário.`,
    createdAt: '2026-08-16T11:20:00.000Z',
    updatedAt: '2026-08-16T11:20:00.000Z',
    status: 'novo',
    resumeFileName: 'Andre_Vinicius_Frontend.docx',
  },
  {
    id: 'cand_10_patricia',
    name: 'Patrícia Nogueira Ramos',
    email: 'patricia.nogueira.tech@gmail.com',
    phone: '(11) 97711-2244',
    city: 'São Paulo',
    state: 'SP',
    education: [
      {
        id: 'edu_10',
        level: 'graduacao',
        course: 'Engenharia da Computação',
        institution: 'UNICAMP',
        completionYear: 2017,
        status: 'completo',
      },
    ],
    experiences: [
      {
        id: 'exp_10a',
        role: 'Arquiteta de Software / Full Stack Sênior',
        company: 'Global Commerce S/A',
        startDate: '2020',
        endDate: 'Atual',
        current: true,
        years: 6,
        description: 'Arquitetura e desenvolvimento de plataforma e-commerce de alto tráfego com React, Node.js, TypeScript, PostgreSQL, Docker, Kubernetes e AWS.',
      },
      {
        id: 'exp_10b',
        role: 'Desenvolvedora Full Stack',
        company: 'TechBrasil',
        startDate: '2017',
        endDate: '2020',
        current: false,
        years: 3,
        description: 'Desenvolvimento de microsserviços Node.js, React e bancos relacionais SQL.',
      },
    ],
    skills: [
      { id: 'sk_100', name: 'React', level: 'especialista', category: 'tecnica' },
      { id: 'sk_101', name: 'TypeScript', level: 'especialista', category: 'tecnica' },
      { id: 'sk_102', name: 'Node.js', level: 'especialista', category: 'tecnica' },
      { id: 'sk_103', name: 'PostgreSQL', level: 'especialista', category: 'tecnica' },
      { id: 'sk_104', name: 'Docker', level: 'avancado', category: 'ferramenta' },
      { id: 'sk_105', name: 'Kubernetes', level: 'avancado', category: 'ferramenta' },
      { id: 'sk_106', name: 'AWS', level: 'avancado', category: 'ferramenta' },
      { id: 'sk_107', name: 'Git', level: 'especialista', category: 'ferramenta' },
      { id: 'sk_108', name: 'Clean Architecture', level: 'especialista', category: 'tecnica' },
      { id: 'sk_109', name: 'Liderança de Equipes', level: 'avancado', category: 'comportamental' },
    ],
    certifications: [
      { id: 'cert_10a', name: 'AWS Certified Solutions Architect', issuer: 'AWS', year: 2022 },
    ],
    languages: ['Inglês (Fluente)'],
    totalExperienceYears: 9,
    rawText: `Patrícia Nogueira Ramos
São Paulo - SP | patricia.nogueira.tech@gmail.com | (11) 97711-2244
Graduada em Engenharia da Computação pela UNICAMP (2017).
Experiência (9 anos):
- Global Commerce S/A (2020 - Atual): Arquiteta Full Stack. Tecnologias: React, TypeScript, Node.js, PostgreSQL, Docker, Kubernetes, AWS, Git, Clean Architecture, Liderança de Equipes.
- TechBrasil (2017 - 2020): Full Stack Developer.
Certificações: AWS Certified Solutions Architect.
Idiomas: Inglês Fluente.`,
    createdAt: '2026-08-17T14:10:00.000Z',
    updatedAt: '2026-08-17T14:10:00.000Z',
    status: 'contratado',
    resumeFileName: 'Patricia_Nogueira_CV.pdf',
  },
];

export function getSeedApplications(): Application[] {
  const apps: Application[] = [];

  // Match Lucas to Full Stack Sr
  const jobFullstack = SEED_JOBS[0];
  const candLucas = SEED_CANDIDATES[0];
  const rankingLucas = calculateCandidateMatch(candLucas, jobFullstack);
  apps.push({
    id: 'app_1',
    candidateId: candLucas.id,
    jobId: jobFullstack.id,
    stage: 'entrevista',
    appliedAt: '2026-08-03T10:00:00.000Z',
    stageUpdatedAt: '2026-08-15T14:00:00.000Z',
    score: rankingLucas.score,
    rankingResult: rankingLucas,
    notes: 'Excelente perfil técnico para liderança de squad.',
  });

  // Match Mariana to Full Stack Sr
  const candMariana = SEED_CANDIDATES[1];
  const rankingMariana = calculateCandidateMatch(candMariana, jobFullstack);
  apps.push({
    id: 'app_2',
    candidateId: candMariana.id,
    jobId: jobFullstack.id,
    stage: 'pre_selecionado',
    appliedAt: '2026-08-04T11:00:00.000Z',
    stageUpdatedAt: '2026-08-10T16:00:00.000Z',
    score: rankingMariana.score,
    rankingResult: rankingMariana,
    notes: 'Bom domínio de React e Node, agendar alinhamento de arquitetura.',
  });

  // Match Rodrigo to Suporte N2
  const jobSuporte = SEED_JOBS[1];
  const candRodrigo = SEED_CANDIDATES[2];
  const rankingRodrigo = calculateCandidateMatch(candRodrigo, jobSuporte);
  apps.push({
    id: 'app_3',
    candidateId: candRodrigo.id,
    jobId: jobSuporte.id,
    stage: 'aprovado',
    appliedAt: '2026-08-07T09:00:00.000Z',
    stageUpdatedAt: '2026-08-20T10:00:00.000Z',
    score: rankingRodrigo.score,
    rankingResult: rankingRodrigo,
    notes: 'Aprovado na entrevista técnica com a coordenação de infraestrutura.',
  });

  // Match Felipe to Suporte N2
  const candFelipe = SEED_CANDIDATES[6];
  const rankingFelipe = calculateCandidateMatch(candFelipe, jobSuporte);
  apps.push({
    id: 'app_4',
    candidateId: candFelipe.id,
    jobId: jobSuporte.id,
    stage: 'triagem',
    appliedAt: '2026-08-14T11:00:00.000Z',
    stageUpdatedAt: '2026-08-14T11:00:00.000Z',
    score: rankingFelipe.score,
    rankingResult: rankingFelipe,
  });

  // Match Beatriz to Scrum Master
  const jobScrum = SEED_JOBS[2];
  const candBeatriz = SEED_CANDIDATES[3];
  const rankingBeatriz = calculateCandidateMatch(candBeatriz, jobScrum);
  apps.push({
    id: 'app_5',
    candidateId: candBeatriz.id,
    jobId: jobScrum.id,
    stage: 'entrevista',
    appliedAt: '2026-08-12T10:00:00.000Z',
    stageUpdatedAt: '2026-08-18T14:30:00.000Z',
    score: rankingBeatriz.score,
    rankingResult: rankingBeatriz,
    notes: 'Certificações PSM I e PMP válidas. Excelente comunicação.',
  });

  // Match Camila to Scrum Master
  const candCamila = SEED_CANDIDATES[7];
  const rankingCamila = calculateCandidateMatch(candCamila, jobScrum);
  apps.push({
    id: 'app_6',
    candidateId: candCamila.id,
    jobId: jobScrum.id,
    stage: 'pre_selecionado',
    appliedAt: '2026-08-16T17:00:00.000Z',
    stageUpdatedAt: '2026-08-17T09:00:00.000Z',
    score: rankingCamila.score,
    rankingResult: rankingCamila,
  });

  // Match Patricia to Full Stack Sr (Contratada)
  const candPatricia = SEED_CANDIDATES[9];
  const rankingPatricia = calculateCandidateMatch(candPatricia, jobFullstack);
  apps.push({
    id: 'app_7',
    candidateId: candPatricia.id,
    jobId: jobFullstack.id,
    stage: 'contratado',
    appliedAt: '2026-08-01T10:00:00.000Z',
    stageUpdatedAt: '2026-08-22T16:00:00.000Z',
    score: rankingPatricia.score,
    rankingResult: rankingPatricia,
    notes: 'Contratação finalizada! Início previsto no próximo ciclo.',
  });

  return apps;
}

export const SEED_INTERVIEWS: Interview[] = [
  {
    id: 'int_1',
    candidateId: 'cand_1_lucas',
    jobId: 'job_fullstack_sr',
    applicationId: 'app_1',
    scheduledAt: '2026-08-26T14:00:00.000Z',
    interviewer: 'Julio Cesar (Gerente de Engenharia)',
    type: 'online',
    status: 'agendada',
    stage: 'Entrevista Técnica e Fit Cultural',
    createdAt: '2026-08-15T14:30:00.000Z',
  },
  {
    id: 'int_2',
    candidateId: 'cand_4_beatriz',
    jobId: 'job_scrum_master',
    applicationId: 'app_5',
    scheduledAt: '2026-08-27T10:30:00.000Z',
    interviewer: 'Ana Paula (Head de Agilidade)',
    type: 'online',
    status: 'agendada',
    stage: 'Entrevista com Head de Produto',
    createdAt: '2026-08-18T15:00:00.000Z',
  },
  {
    id: 'int_3',
    candidateId: 'cand_3_rodrigo',
    jobId: 'job_suporte_n2',
    applicationId: 'app_3',
    scheduledAt: '2026-08-19T11:00:00.000Z',
    interviewer: 'Marcos Vinicius (Coordenador de TI)',
    type: 'presencial',
    status: 'realizada',
    rating: 5,
    feedback: 'Candidato demonstrou sólido conhecimento prático em redes e Windows Server. Postura muito cordial.',
    stage: 'Entrevista Técnica Presencial',
    createdAt: '2026-08-12T10:00:00.000Z',
  },
];

export const SEED_EVALUATIONS: Evaluation[] = [
  {
    id: 'eval_1',
    candidateId: 'cand_3_rodrigo',
    jobId: 'job_suporte_n2',
    evaluator: 'Marcos Vinicius (Coordenador TI)',
    technicalScore: 5,
    behavioralScore: 5,
    overallScore: 5,
    comments: 'Excelente candidato. Domínio de ferramentas de Service Desk, Active Directory e postura muito proativa.',
    recommendation: 'fortemente_recomendado',
    createdAt: '2026-08-19T12:00:00.000Z',
  },
  {
    id: 'eval_2',
    candidateId: 'cand_10_patricia',
    jobId: 'job_fullstack_sr',
    evaluator: 'Julio Cesar (Engenharia)',
    technicalScore: 5,
    behavioralScore: 5,
    overallScore: 5,
    comments: 'Nota máxima no desafio de arquitetura. Experiência de liderança comprovada e visão estratégica.',
    recommendation: 'fortemente_recomendado',
    createdAt: '2026-08-21T18:00:00.000Z',
  },
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_seed_1',
    action: 'SYSTEM_INIT',
    entityType: 'system',
    description: 'Sistema RecruitAI RH inicializado com repositórios locais e base de demonstração.',
    timestamp: '2026-08-24T10:00:00.000Z',
    user: 'Sistema RecruitAI',
  },
  {
    id: 'log_seed_2',
    action: 'JOB_CREATED',
    entityType: 'job',
    entityId: 'job_fullstack_sr',
    description: 'Vaga "Desenvolvedor(a) Full Stack Sênior" publicada com sucesso.',
    timestamp: '2026-08-01T09:00:00.000Z',
    user: 'Recrutador RH',
  },
  {
    id: 'log_seed_3',
    action: 'CANDIDATE_HIRED',
    entityType: 'candidate',
    entityId: 'cand_10_patricia',
    description: 'Candidata Patrícia Nogueira Ramos movida para o status Contratado.',
    timestamp: '2026-08-22T16:00:00.000Z',
    user: 'Recrutador RH',
  },
];

export async function seedDatabase(force = false): Promise<void> {
  const { storageService } = await import('../services/storage');
  const existingCandidates = await storageService.candidates.getAll();
  
  if (existingCandidates.length === 0 || force) {
    await storageService.candidates.setAll(SEED_CANDIDATES);
    await storageService.jobs.setAll(SEED_JOBS);
    await storageService.applications.setAll(getSeedApplications());
    await storageService.interviews.setAll(SEED_INTERVIEWS);
    await storageService.evaluations.setAll(SEED_EVALUATIONS);
    await storageService.auditLogs.setAll(SEED_AUDIT_LOGS);
    console.log('Banco de dados inicializado com dados de demonstração');
  }
}
