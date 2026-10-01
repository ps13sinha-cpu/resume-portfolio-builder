import { AwwwardsTheme } from './AwwwardsTheme';
import { DeveloperTheme } from './DeveloperTheme';
import { ExecutiveTheme } from './ExecutiveTheme';
import { BrutalistTheme } from './BrutalistTheme';
import { NoirTheme } from './NoirTheme';
import { SwissTheme } from './SwissTheme';
import { AuroraTheme } from './AuroraTheme';
import { BentoTheme } from './BentoTheme';
import { MagazineTheme } from './MagazineTheme';
import { ResumeTheme } from './ResumeTheme';
import { ChiangTheme } from './ChiangTheme';
import { SnellenbergTheme } from './SnellenbergTheme';
import { LeeroTheme } from './LeeroTheme';

import { Sparkles, Terminal, BookOpen, Zap, Moon, Grid3x3, Waves, LayoutGrid, Newspaper, FileText, Code2, Briefcase, PenLine, Globe } from 'lucide-react';
import { HtmlTemplateViewer } from '../components/HtmlTemplateViewer';

/**
 * Single source of truth for portfolio themes.
 * Every registration point (public viewer, live preview, template picker,
 * navbar quick switcher, layout picker) reads from here.
 */
export const THEMES = [
  {
    id: 'awwwards',
    name: 'Awwwards Creative',
    subtitle: 'Oversized Display Typography & Kinetic Motion',
    description: 'Massive Syne display headings, floating ambient glow nodes, magnetic custom cursor, marquee ticker, and asymmetric project grid.',
    badge: 'Awwwards Winner',
    icon: Sparkles,
    Component: AwwwardsTheme
  },
  {
    id: 'developer',
    name: 'Modern Developer',
    subtitle: 'Dark IDE Terminal Shell & Code Syntax Highlights',
    description: 'Command prompt headers ($ whoami), Fira Code syntax highlights, git branch career timeline, and tech pill badges.',
    badge: 'Dark IDE',
    icon: Terminal,
    Component: DeveloperTheme
  },
  {
    id: 'executive',
    name: 'Executive Minimal',
    subtitle: 'Editorial Luxury & Serif Elegance',
    description: 'Playfair Display serif headings, generous negative space, high-contrast two-column structure, ideal for leaders & consultants.',
    badge: 'Luxury Editorial',
    icon: BookOpen,
    Component: ExecutiveTheme
  },
  {
    id: 'brutalist',
    name: 'Neo-Brutalist Cyber',
    subtitle: 'High Energy Neo-Brutalist Cards & Neon Accents',
    description: 'Bold black outlines, offset box shadows, high contrast neon accent pills (amber, cyan, pink), and playful card states.',
    badge: 'Neo Brutalist',
    icon: Zap,
    Component: BrutalistTheme
  },
  {
    id: 'noir',
    name: 'Noir Spotlight',
    subtitle: 'Cinematic Stage, Glass & Single Blue Accent',
    description: 'The login screen\'s stage environment as a portfolio — spotlight cone, frosted glass panels, monochrome palette, one spot-blue accent.',
    badge: 'Cinematic',
    icon: Moon,
    Component: NoirTheme
  },
  {
    id: 'swiss',
    name: 'Swiss Grid',
    subtitle: 'International Typographic Style & Hard Rules',
    description: 'White ground, 12-column ruled grid, oversized uppercase grotesk type, numeric section indices, and one red accent.',
    badge: 'Editorial',
    icon: Grid3x3,
    Component: SwissTheme
  },
  {
    id: 'aurora',
    name: 'Aurora Glass',
    subtitle: 'Light Glassmorphism & Soft Color Fields',
    description: 'Frosted white panels over a drifting aurora gradient, pill geometry, violet-to-cyan accents — friendly and airy.',
    badge: 'Light',
    icon: Waves,
    Component: AuroraTheme
  },
  {
    id: 'bento',
    name: 'Bento Grid',
    subtitle: 'Apple-Style Tile Mosaic & Compact Cards',
    description: 'The 2026 bento trend — skills, stats, projects and links as scannable tiles in a dense mosaic with one spanned hero card.',
    badge: 'Trending',
    icon: LayoutGrid,
    Component: BentoTheme
  },
  {
    id: 'magazine',
    name: 'Magazine Editorial',
    subtitle: 'Print Spread, Drop Caps & Pull Quotes',
    description: 'Art-directed editorial layout — masthead rules, Playfair display serif, drop cap lede, pull quote, numbered folios, cream paper.',
    badge: 'Art-Directed',
    icon: Newspaper,
    Component: MagazineTheme
  },
  {
    id: 'resume',
    name: 'Resume One-Pager',
    subtitle: 'CV as a Website, ATS-Safe & Print-Ready',
    description: 'Your résumé as a clean shareable link — recruiter-first single column, strict hierarchy, zero decoration, skims in seconds.',
    badge: 'ATS-Safe',
    icon: FileText,
    Component: ResumeTheme
  },
  {
    id: 'chiang',
    name: 'Navy Developer',
    subtitle: 'The Classic Dev Portfolio — Navy, Mint & Numbered Sections',
    description: 'Inspired by the most-forked developer portfolio on GitHub — deep navy cards, mint mono accents, sideways email rail, interactive job tabs and featured project cards. Credit: brittanychiang.com.',
    badge: 'Community Icon',
    icon: Code2,
    Component: ChiangTheme
  },
  {
    id: 'snellenberg',
    name: 'Studio Freelance',
    subtitle: 'Award-Winning Cream Canvas, Index Rows & Giant Footer',
    description: 'Inspired by an Awwwards Site-of-the-Day — warm cream canvas, huge uppercase type, numbered work rows with rotating arrows, live local-time footer with availability pulse. Credit: dennissnellenberg.com.',
    badge: 'Awwwards DNA',
    icon: Briefcase,
    Component: SnellenbergTheme
  },
  {
    id: 'leero',
    name: 'Minimal Engineer',
    subtitle: 'Typography-Only, Prose Bio & Link-List Archive',
    description: 'Inspired by leerob.com — pure typography on near-black, prose-style now section, arrow link-lists, zero decoration. For engineers who let the work speak.',
    badge: 'Minimalist',
    icon: PenLine,
    Component: LeeroTheme
  }
];

export const getTheme = (id) => {
  const found = THEMES.find(t => t.id === id);
  if (found) return found;

  // Format clean human name from template ID
  const cleanName = (id || '')
    .replace(/^html:/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return {
    id: id || 'awwwards',
    name: cleanName || 'Portfolio Website',
    subtitle: 'HTML Multi-Page Showcase Website',
    description: 'Full multi-page HTML site template injected with your extracted resume data.',
    badge: 'HTML Multi-Page',
    icon: Globe,
    isHtml: true,
    Component: ({ portfolio }) => <HtmlTemplateViewer templateId={id.replace(/^html:/i, '')} portfolio={portfolio} />
  };
};

export const renderTheme = (id, portfolio) => {
  const theme = getTheme(id);
  const { Component } = theme;
  return <Component portfolio={portfolio} />;
};
