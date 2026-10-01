// ============================================================================
// CANONICAL SCHEMA — the one fixed contract of the Universal Compatibility
// Layer. Resume extraction lands here; every adapter/fit stage below consumes
// ONLY this shape. Also normalizes the app's live portfolio object into it
// (the app uses slightly different field names, e.g. techTags/liveUrl).
// ============================================================================
import { z } from 'zod';

const dateStr = z.string().max(40).nullable().optional();

export const CanonicalSchema = z.object({
  profile: z.object({
    fullName: z.string().max(200),
    title: z.string().max(300),
    email: z.string().max(200),
    phone: z.string().max(60).optional(),
    location: z.string().max(200).optional(),
    githubUrl: z.string().max(500).optional(),
    linkedinUrl: z.string().max(500).optional(),
    websiteUrl: z.string().max(500).optional(),
    bio: z.string().max(4000)
  }),
  education: z.array(z.object({
    institution: z.string().max(200),
    degree: z.string().max(200),
    field: z.string().max(200).optional(),
    startDate: dateStr,
    endDate: dateStr,
    grade: z.string().max(100).optional()
  })),
  experience: z.array(z.object({
    company: z.string().max(200),
    role: z.string().max(200),
    startDate: dateStr,
    endDate: dateStr,
    isCurrent: z.boolean(),
    bullets: z.array(z.string().max(600))
  })),
  skills: z.array(z.object({
    name: z.string().max(100),
    category: z.string().max(100).optional()
  })),
  projects: z.array(z.object({
    title: z.string().max(200),
    description: z.string().max(2000),
    techStack: z.array(z.string().max(60)),
    links: z.object({
      live: z.string().max(500).optional(),
      github: z.string().max(500).optional()
    }).optional()
  })),
  certifications: z.array(z.object({
    name: z.string().max(200),
    issuer: z.string().max(200),
    date: dateStr,
    credentialUrl: z.string().max(500).optional()
  }))
});

const s = (v) => (v == null ? undefined : String(v));
const arr = (v) => (Array.isArray(v) ? v : []);

// Bridge the app's portfolio object (server/data/samplePortfolio.js shape,
// which is also what resume extraction produces) → canonical form.
export const toCanonical = (pf) => {
  const p = pf?.profile || {};
  return {
    profile: {
      fullName: s(p.fullName) || 'Your Name',
      title: s(p.title) || 'Professional',
      email: s(p.email) || '',
      phone: s(p.phone),
      location: s(p.location),
      githubUrl: s(p.github),
      linkedinUrl: s(p.linkedin),
      websiteUrl: s(p.website),
      bio: s(p.bio) || ''
    },
    education: arr(pf.education).map((e) => ({
      institution: s(e.institution) || '',
      degree: s(e.degree) || '',
      field: s(e.field),
      startDate: s(e.start),
      endDate: s(e.end),
      grade: s(e.grade)
    })),
    experience: arr(pf.experience).map((e) => ({
      company: s(e.company) || '',
      role: s(e.role) || '',
      startDate: s(e.start),
      endDate: e.isCurrent || e.end === 'Present' ? undefined : s(e.end),
      isCurrent: !!(e.isCurrent || e.end === 'Present'),
      bullets: arr(e.bullets).map(String)
    })),
    skills: arr(pf.skills).map((k) => ({ name: s(k.name) || '', category: s(k.category) })),
    projects: arr(pf.projects).map((pr) => ({
      title: s(pr.title) || '',
      description: s(pr.description) || '',
      techStack: arr(pr.techTags).map(String),
      links: {
        live: s(pr.liveUrl),
        github: s(pr.githubUrl)
      }
    })),
    certifications: arr(pf.certifications).map((c) => ({
      name: s(c.name) || '',
      issuer: s(c.issuer) || '',
      date: s(c.date),
      credentialUrl: s(c.credentialUrl)
    }))
  };
};

// Throws with a readable message when data breaks the contract — adapters and
// the fitting engine refuse to run on invalid canonical data.
export const validateCanonical = (data) => {
  const r = CanonicalSchema.safeParse(data);
  if (!r.success) {
    const first = r.error.issues[0];
    const err = new Error(`Canonical schema violation at ${first.path.join('.')}: ${first.message}`);
    err.code = 'CANONICAL_INVALID';
    throw err;
  }
  return r.data;
};

// Seeded portfolios for the human review gate (Stage 4 of the spec):
// "rich" stresses overflow behavior, "sparse" stresses empty states.
export const RICH_SEED = {
  profile: {
    fullName: 'Alexandra Rivera-Whitfield',
    title: 'Principal Systems Architect & Engineering Leader',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 014-2288',
    location: 'Seattle, WA',
    githubUrl: 'https://github.com/example',
    linkedinUrl: 'https://linkedin.com/in/example',
    bio: 'Fifteen years designing resilient distributed platforms for regulated industries. I lead platform teams through hyperscale growth, mentor engineers into architects, and write about the unglamorous parts of running production systems that cannot fail.'
  },
  education: [
    { institution: 'Massachusetts Institute of Technology', degree: 'M.Eng', field: 'Electrical Engineering & Computer Science', startDate: '2010-09', endDate: '2012-05', grade: '4.8 / 5.0' },
    { institution: 'University of Washington', degree: 'B.S', field: 'Computer Science', startDate: '2006-09', endDate: '2010-06' }
  ],
  experience: [
    { company: 'Northwind Systems', role: 'Principal Architect', startDate: '2019-03', endDate: undefined, isCurrent: true, bullets: [
      'Own the reference architecture for a multi-region payments platform processing $4B annually at 99.99% availability.',
      'Cut cloud spend 31% by consolidating 14 services onto a shared streaming backbone without SLO regressions.',
      'Established the architecture review board; 40+ design docs reviewed per quarter with a 48-hour turnaround SLA.',
      'Led the zero-downtime migration off a 12-year-old monolith across 60 engineers in 5 product groups.',
      'Authored the incident-response playbook adopted company-wide after a 3-hour outage post-mortem.',
      'Hired and developed 9 senior engineers; 4 were promoted into staff or architect roles.' ] },
    { company: 'Helios Logistics', role: 'Staff Engineer, Platform', startDate: '2015-06', endDate: '2019-02', isCurrent: false, bullets: [
      'Built the real-time fleet telemetry pipeline ingesting 90k events/sec across 12k vehicles.',
      'Reduced p99 route-recalculation latency from 4.1s to 380ms via incremental graph algorithms.' ] },
    { company: 'Cobalt Health', role: 'Senior Software Engineer', startDate: '2012-07', endDate: '2015-05', isCurrent: false, bullets: [
      'Implemented HIPAA-compliant audit logging covering 100% of PHI access paths.' ] }
  ],
  skills: [
    { name: 'Distributed Systems', category: 'Architecture' }, { name: 'Go', category: 'Languages' },
    { name: 'TypeScript', category: 'Languages' }, { name: 'Kubernetes', category: 'Infrastructure' },
    { name: 'PostgreSQL', category: 'Data' }, { name: 'Kafka', category: 'Data' },
    { name: 'Terraform', category: 'Infrastructure' }, { name: 'Observability', category: 'Operations' },
    { name: 'Rust', category: 'Languages' }, { name: 'gRPC', category: 'Architecture' },
    { name: 'React', category: 'Product' }, { name: 'Redis', category: 'Data' }
  ],
  projects: [
    { title: 'OpenLedger Audit Trail', description: 'Open-source append-only audit library with cryptographic chain verification, used by 3 fintechs in production.', techStack: ['Go', 'PostgreSQL', 'CLI'], links: { github: 'https://github.com/example' } },
    { title: 'Latency Atlas', description: 'Interactive visualization of inter-region network latency with historical drift replay.', techStack: ['TypeScript', 'D3', 'ClickHouse'] },
    { title: 'K8s Cost Lens', description: 'Per-namespace cost attribution tooling adopted by two platform teams.', techStack: ['Go', 'Prometheus'] },
    { title: 'Gradual Deployer', description: 'Progressive-delivery controller with automatic rollback on SLO burn.', techStack: ['Rust', 'Kubernetes'] }
  ],
  certifications: [
    { name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services', date: '2024-02', credentialUrl: 'https://example.com/verify' },
    { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', date: '2023-06' },
    { name: 'Google Professional Cloud Architect', issuer: 'Google Cloud', date: '2022-11' }
  ]
};

export const SPARSE_SEED = {
  profile: { fullName: 'Sam Lee', title: 'Developer', email: 'sam.lee@example.com', bio: 'Building things for the web.' },
  education: [],
  experience: [],
  skills: [{ name: 'JavaScript', category: 'Languages' }],
  projects: [],
  certifications: []
};
