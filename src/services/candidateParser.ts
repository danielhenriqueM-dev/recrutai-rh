import {
  Candidate,
  CandidateEducation,
  CandidateExperience,
  CandidateSkill,
  CandidateCertification,
  EducationLevel,
} from '../types';

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function generateId(prefix = 'cand'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function computeSimpleHash(text: string): string {
  let hash = 0;
  const clean = text.replace(/\s+/g, '').toLowerCase();
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const COMMON_BRAZILIAN_CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre',
  'Brasília', 'Salvador', 'Fortaleza', 'Recife', 'Goiânia', 'Campinas',
  'São José dos Campos', 'Florianópolis', 'Vitória', 'Ribeirão Preto',
  'Santos', 'Sorocaba', 'Joinville', 'Londrina', 'Maringá', 'Caxias do Sul',
  'Uberlândia', 'Juiz de Fora', 'Niterói', 'São Bernardo do Campo', 'Santo André',
  'Osasco', 'Guarulhos', 'Barueri', 'Manaus', 'Belém', 'Natal', 'Maceió', 'João Pessoa'
];

const TECH_SKILLS_DICTIONARY = [
  'React', 'React Native', 'TypeScript', 'JavaScript', 'Node.js', 'Express', 'NestJS',
  'Vue.js', 'Angular', 'Next.js', 'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap',
  'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'Kotlin',
  'C#', '.NET', '.NET Core', 'ASP.NET', 'PHP', 'Laravel', 'Go', 'Golang', 'Rust',
  'SQL', 'PostgreSQL', 'MySQL', 'Oracle', 'SQL Server', 'MongoDB', 'Redis',
  'Firebase', 'Supabase', 'Elasticsearch', 'DynamoDB',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'GCP', 'Terraform', 'CI/CD',
  'Git', 'GitHub', 'GitLab', 'Linux', 'Ubuntu', 'Windows Server', 'Active Directory',
  'Redes', 'TCP/IP', 'DNS', 'DHCP', 'VMware', 'VirtualBox', 'Firewall', 'VPN',
  'Scrum', 'Kanban', 'Jira', 'Trello', 'Figma', 'UI/UX',
  'Excel Avançado', 'Power BI', 'Tableau', 'Metabase', 'Google Analytics',
  'REST API', 'GraphQL', 'Microserviços', 'Clean Architecture', 'SOLID', 'TDD',
  'Jest', 'Cypress', 'Playwright', 'Selenium', 'QA', 'Testes Automatizados',
  'Atendimento ao Cliente', 'Suporte N1', 'Suporte N2', 'Help Desk', 'Service Desk',
  'ITIL', 'COBIT', 'Gestão de Projetos', 'PMBOK', 'Liderança de Equipes'
];

const CERTIFICATIONS_DICTIONARY = [
  'AWS Certified Solutions Architect', 'AWS Certified Cloud Practitioner', 'AWS Certified Developer',
  'Microsoft Certified: Azure Fundamentals', 'Azure Administrator AZ-104', 'Azure Solutions Architect AZ-305',
  'Google Cloud Professional Cloud Architect', 'Google Cloud Associate Cloud Engineer',
  'Scrum Master', 'PSM I', 'PSM II', 'CSM', 'Product Owner', 'PSPO', 'PMI-ACP',
  'PMP - Project Management Professional', 'CAPM',
  'Cisco CCNA', 'Cisco CCNP', 'CompTIA Security+', 'CompTIA Network+', 'CompTIA A+',
  'ITIL 4 Foundation', 'ITIL v3', 'COBIT 5', 'ISO 27001',
  'Oracle Certified Professional Java', 'HashiCorp Certified Terraform Associate',
  'Kubernetes CKA', 'Kubernetes CKAD', 'CPA-10', 'CPA-20', 'CEA'
];

export function parseCandidateFromText(rawText: string, fileName?: string): Candidate {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  const { city, state } = extractLocation(rawText);
  const name = extractName(lines, fileName, email);
  const education = extractEducation(rawText, lines);
  const experiences = extractExperiences(rawText, lines);
  const skills = extractSkills(rawText);
  const certifications = extractCertifications(rawText);
  const languages = extractLanguages(rawText);
  const totalExperienceYears = calculateTotalExperience(experiences, rawText);
  const contentHash = computeSimpleHash(rawText);

  return {
    id: generateId('cand'),
    name,
    email,
    phone,
    city,
    state,
    education,
    experiences,
    skills,
    certifications,
    languages,
    totalExperienceYears,
    rawText,
    resumeFileName: fileName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'novo',
    contentHash,
  };
}

function extractEmail(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : '';
}

function extractPhone(text: string): string {
  // Brazilian phone formats
  const regexes = [
    /(?:\+?55\s*)?(?:\(?([1-9]{2})\)?\s*)?(?:9\s*)?([0-9]{4,5})[-.\s]?([0-9]{4})/g,
    /\(?\b([1-9]{2})\)?\s*(?:9\s*)?(\d{4,5})[-.\s]?(\d{4})\b/g,
  ];

  for (const regex of regexes) {
    const match = regex.exec(text);
    if (match) {
      const raw = match[0].trim();
      if (raw.replace(/\D/g, '').length >= 10) {
        return raw;
      }
    }
  }
  return '';
}

function extractLocation(text: string): { city: string; state: string } {
  let foundState = '';
  let foundCity = '';

  // Check state abbreviations (e.g., "São Paulo - SP", "Curitiba/PR", "SP")
  for (const st of BRAZILIAN_STATES) {
    const stateRegex = new RegExp(`(?:[-/,\\s]\\s*|\\bEstado:\\s*|\\bUF:\\s*)(${st})\\b`, 'i');
    if (stateRegex.test(text)) {
      foundState = st;
      break;
    }
  }

  // Check common cities
  for (const city of COMMON_BRAZILIAN_CITIES) {
    const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
    if (cityRegex.test(text)) {
      foundCity = city;
      if (!foundState) {
        if (['São Paulo', 'Campinas', 'São José dos Campos', 'Santos', 'Ribeirão Preto', 'Sorocaba', 'Santo André', 'São Bernardo do Campo', 'Osasco', 'Guarulhos', 'Barueri'].includes(city)) foundState = 'SP';
        else if (['Rio de Janeiro', 'Niterói'].includes(city)) foundState = 'RJ';
        else if (['Belo Horizonte', 'Uberlândia', 'Juiz de Fora'].includes(city)) foundState = 'MG';
        else if (['Curitiba', 'Londrina', 'Maringá'].includes(city)) foundState = 'PR';
        else if (['Porto Alegre', 'Caxias do Sul'].includes(city)) foundState = 'RS';
        else if (['Florianópolis', 'Joinville'].includes(city)) foundState = 'SC';
        else if (['Brasília'].includes(city)) foundState = 'DF';
        else if (['Salvador'].includes(city)) foundState = 'BA';
        else if (['Recife'].includes(city)) foundState = 'PE';
        else if (['Fortaleza'].includes(city)) foundState = 'CE';
        else if (['Goiânia'].includes(city)) foundState = 'GO';
        else if (['Vitória'].includes(city)) foundState = 'ES';
        else if (['Manaus'].includes(city)) foundState = 'AM';
        else if (['Belém'].includes(city)) foundState = 'PA';
      }
      break;
    }
  }

  return { city: foundCity || (foundState ? 'Região ' + foundState : ''), state: foundState };
}

function extractName(lines: string[], fileName?: string, email?: string): string {
  const ignoredHeaders = [
    'curriculo', 'curriculum', 'vitae', 'resume', 'resumo', 'cv', 'dados pessoais',
    'perfil', 'contato', 'informacoes', 'experiencia', 'profissional', 'candidato',
    'documento', 'email', 'telefone', 'whatsapp', 'linkedin', 'github', 'endereco'
  ];

  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i].trim();
    const clean = normalizeText(line);

    // Skip lines with email or phone or ignored titles
    if (email && line.toLowerCase().includes(email.toLowerCase())) continue;
    if (line.includes('@') || line.match(/\d{4,}/)) continue;
    if (ignoredHeaders.some((h) => clean === h || clean.startsWith(h + ':'))) continue;

    // Check if line looks like a person's name (2 to 5 words, letters only, no special symbols)
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 6 && /^[a-zA-ZÀ-ÿ\s.'-]+$/.test(line)) {
      if (line.length >= 4 && line.length <= 50) {
        return line.replace(/^Nome:\s*/i, '').trim();
      }
    }
  }

  // Fallback from filename if clean
  if (fileName) {
    const cleanFileName = fileName
      .replace(/\.(pdf|docx|txt|doc|md)$/i, '')
      .replace(/[_-]/g, ' ')
      .replace(/(cv|curriculo|curriculum|vitae|resume)/gi, '')
      .trim();
    if (cleanFileName.length >= 3 && cleanFileName.split(' ').length >= 2) {
      return cleanFileName.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  return lines[0] ? lines[0].substring(0, 40) : 'Candidato sem Nome';
}

function extractEducation(text: string, lines: string[]): CandidateEducation[] {
  const educations: CandidateEducation[] = [];
  const normalized = normalizeText(text);

  const levels: { pattern: RegExp; level: EducationLevel; defaultDegree: string }[] = [
    { pattern: /doutorado|doutor\s+em/i, level: 'doutorado', defaultDegree: 'Doutorado' },
    { pattern: /mestrado|mestre\s+em/i, level: 'mestrado', defaultDegree: 'Mestrado' },
    { pattern: /p[oó]s-?gradua[cç][aã]o|mba|especializa[cç][aã]o/i, level: 'pos_graduacao', defaultDegree: 'Pós-Graduação / MBA' },
    { pattern: /bacharelado|licenciatura|gradua[cç][aã]o|tecn[oó]logo|ci[eê]ncia da computa[cç][aã]o|engenharia|sistemas de informa[cç][aã]o|administra[cç][aã]o|an[aá]lise e desenvolvimento de sistemas/i, level: 'graduacao', defaultDegree: 'Graduação' },
    { pattern: /t[eé]cnico em|ensino t[eé]cnico/i, level: 'tecnico', defaultDegree: 'Curso Técnico' },
    { pattern: /ensino m[eé]dio/i, level: 'ensino_medio', defaultDegree: 'Ensino Médio' },
  ];

  // Search in lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const lvl of levels) {
      if (lvl.pattern.test(line)) {
        // Extract course name
        let course = line;
        let institution = '';
        let year: number | undefined;

        const yearMatch = line.match(/\b(19\d\d|20\d\d)\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[1], 10);
        }

        // Look ahead for institution if not on same line
        if (i + 1 < lines.length && !levels.some((l) => l.pattern.test(lines[i + 1]))) {
          institution = lines[i + 1];
        }

        const isDuplicate = educations.some((e) => e.level === lvl.level && (e.course === course || normalizeText(e.course).includes(normalizeText(course))));
        if (!isDuplicate) {
          educations.push({
            id: generateId('edu'),
            level: lvl.level,
            course: course.length > 60 ? course.substring(0, 60) : course,
            institution: institution || 'Instituição não informada',
            completionYear: year,
            status: year && year > new Date().getFullYear() ? 'em_andamento' : 'completo',
          });
        }
      }
    }
  }

  // Fallback if none found via lines
  if (educations.length === 0) {
    for (const lvl of levels) {
      if (lvl.pattern.test(normalized)) {
        educations.push({
          id: generateId('edu'),
          level: lvl.level,
          course: lvl.defaultDegree,
          institution: 'Não especificada',
          status: 'completo',
        });
        break;
      }
    }
  }

  return educations;
}

function extractExperiences(text: string, lines: string[]): CandidateExperience[] {
  const experiences: CandidateExperience[] = [];
  
  // Look for date patterns like "2020 - 2023", "01/2019 a Atual", "março de 2021 - presente"
  const datePattern = /(\b\d{4}\b|\b(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*[\s/]\d{2,4}\b)\s*(?:-|–|a|até|to)\s*(\b\d{4}\b|\batual\b|\bpresente\b|\bhoje\b|\b(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*[\s/]\d{2,4}\b)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(datePattern);

    if (match) {
      const startStr = match[1];
      const endStr = match[2];
      const isCurrent = /atual|presente|hoje/i.test(endStr);
      
      const startYearMatch = startStr.match(/\b(19\d\d|20\d\d)\b/);
      const endYearMatch = endStr.match(/\b(19\d\d|20\d\d)\b/);

      const startYear = startYearMatch ? parseInt(startYearMatch[1], 10) : 2020;
      const endYear = isCurrent ? new Date().getFullYear() : (endYearMatch ? parseInt(endYearMatch[1], 10) : startYear + 1);
      const years = Math.max(1, endYear - startYear);

      // Previous or next line could be company/role
      const roleOrCompany = (i > 0 ? lines[i - 1] : '') || line.replace(match[0], '').trim() || 'Profissional';
      const company = (i + 1 < lines.length ? lines[i + 1] : '') || 'Empresa';
      const description = (i + 2 < lines.length ? lines[i + 2] : '');

      experiences.push({
        id: generateId('exp'),
        role: roleOrCompany.substring(0, 50),
        company: company.substring(0, 50),
        startDate: startStr,
        endDate: isCurrent ? 'Atual' : endStr,
        current: isCurrent,
        years,
        description: description.substring(0, 200),
      });
    }
  }

  return experiences;
}

function extractSkills(text: string): CandidateSkill[] {
  const skills: CandidateSkill[] = [];
  const normalized = normalizeText(text);

  for (const skillName of TECH_SKILLS_DICTIONARY) {
    const normSkill = normalizeText(skillName);
    // Boundary check
    const regex = new RegExp(`(^|[^a-z0-9+#.])${normSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9+#.]|$)`, 'i');
    if (regex.test(normalized)) {
      skills.push({
        id: generateId('sk'),
        name: skillName,
        level: 'avancado',
        category: 'tecnica',
      });
    }
  }

  return skills;
}

function extractCertifications(text: string): CandidateCertification[] {
  const certs: CandidateCertification[] = [];
  const normalized = normalizeText(text);

  for (const certName of CERTIFICATIONS_DICTIONARY) {
    const normCert = normalizeText(certName);
    if (normalized.includes(normCert)) {
      certs.push({
        id: generateId('cert'),
        name: certName,
        year: new Date().getFullYear() - 1,
      });
    }
  }

  return certs;
}

function extractLanguages(text: string): string[] {
  const languages: string[] = [];
  const normalized = normalizeText(text);

  const langMap: { [key: string]: string } = {
    'ingles fluente': 'Inglês (Fluente)',
    'ingles avancado': 'Inglês (Avançado)',
    'ingles intermediario': 'Inglês (Intermediário)',
    'ingles basico': 'Inglês (Básico)',
    'ingles': 'Inglês',
    'espanhol fluente': 'Espanhol (Fluente)',
    'espanhol avancado': 'Espanhol (Avançado)',
    'espanhol intermediario': 'Espanhol (Intermediário)',
    'espanhol': 'Espanhol',
    'frances': 'Francês',
    'alemao': 'Alemão',
    'italiano': 'Italiano',
  };

  for (const [key, label] of Object.entries(langMap)) {
    if (normalized.includes(key)) {
      if (!languages.some((l) => l.toLowerCase().includes(key.split(' ')[0]))) {
        languages.push(label);
      }
    }
  }

  return languages;
}

function calculateTotalExperience(experiences: CandidateExperience[], text: string): number {
  if (experiences.length > 0) {
    const total = experiences.reduce((acc, exp) => acc + (exp.years || 1), 0);
    return Math.min(30, total);
  }

  // Fallback: search for "X anos de experiência"
  const match = text.match(/(\d+)\s*(?:anos?|years?)\s*(?:de\s*)?experi[eê]ncia/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  return 0;
}
