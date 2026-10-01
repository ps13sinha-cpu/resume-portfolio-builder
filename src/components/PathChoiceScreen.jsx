import React from 'react';
import { FileText, Globe, PenLine, Wand2 } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { ChoiceScreen } from './ChoiceScreen';

const PATHS = [
  {
    id: 'tailored',
    icon: FileText,
    title: 'Resume builder',
    body: "Create a new resume, or optimize the one you have for a job description. Download it as a PDF.",
    cta: 'Build my resume'
  },
  {
    id: 'gallery_first',
    icon: Globe,
    title: 'Portfolio website',
    body: 'Choose from 229 website designs, add your resume, and we generate your personal portfolio site.',
    cta: 'Generate my website'
  }
];

/**
 * PathChoiceScreen — the fork right after login:
 *   1. Resume builder     — then: create a new resume, or optimize an existing one
 *   2. Portfolio website  — design first → resume → generated website
 */
export const PathChoiceScreen = ({ onChoose, onBack }) => {
  const { chooseEntryPath, user } = usePortfolio();
  const firstName = (user?.name || '').split(' ')[0];
  return (
    <ChoiceScreen
      title={firstName ? `How do you want to start, ${firstName}?` : 'How do you want to start?'}
      subtitle="Build a job-ready resume, or generate a portfolio website. You can do the other one later with the same details."
      options={PATHS}
      backLabel="Back to Login"
      onBack={onBack}
      onChoose={(id) => { chooseEntryPath(id); onChoose(id); }}
    />
  );
};

const RESUME_MODES = [
  {
    id: 'tailored',
    icon: PenLine,
    title: 'Create a new resume',
    body: 'Fill in your details step by step, add the job description, and we tailor a fresh resume to the role.',
    cta: 'Start from scratch'
  },
  {
    id: 'optimize',
    icon: Wand2,
    title: 'Optimize my existing resume',
    body: 'Upload or paste your resume and the job description. We find the keywords recruiters and ATS scan for, show your match score, and work them into your resume.',
    cta: 'Optimize my resume'
  }
];

/** ResumeModeScreen — after "Build my resume": create new or optimize existing. */
export const ResumeModeScreen = ({ onChoose, onBack }) => {
  const { chooseEntryPath } = usePortfolio();
  return (
    <ChoiceScreen
      title="Create a new resume, or improve the one you have?"
      subtitle="Either way you finish on the same resume page, with seven designs and a PDF download."
      options={RESUME_MODES}
      backLabel="Back"
      onBack={onBack}
      onChoose={(id) => { chooseEntryPath(id); onChoose(id); }}
    />
  );
};
