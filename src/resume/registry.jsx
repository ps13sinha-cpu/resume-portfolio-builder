import React from 'react';
import { ResumeTheme } from '../templates/ResumeTheme';
import {
  ClassicResume, SidebarResume, ExecutiveResume, TechnicalResume, TimelineResume, AccentResume
} from './templates';

// Resume designs offered on the "Your resume" screen. `ats` is how safely
// applicant-tracking systems read the PDF: single-column layouts parse best.
export const RESUME_TEMPLATES = [
  { id: 'onepager', name: 'One-Pager', description: 'Clean single column with a bold header.', ats: 'Best', usesAccent: false, Component: ({ portfolio }) => <ResumeTheme portfolio={portfolio} /> },
  { id: 'classic', name: 'Classic', description: 'Traditional serif layout recruiters know well.', ats: 'Best', usesAccent: false, Component: ClassicResume },
  { id: 'technical', name: 'Technical', description: 'Dense, skills-first layout for engineers.', ats: 'Best', usesAccent: true, Component: TechnicalResume },
  { id: 'executive', name: 'Executive', description: 'Strong header and summary for senior roles.', ats: 'Good', usesAccent: true, Component: ExecutiveResume },
  { id: 'timeline', name: 'Timeline', description: 'Airy layout with dates down the left side.', ats: 'Good', usesAccent: true, Component: TimelineResume },
  { id: 'sidebar', name: 'Sidebar', description: 'Two columns: details on the left, experience on the right.', ats: 'Fair', usesAccent: true, Component: SidebarResume },
  { id: 'accent', name: 'Accent', description: 'Colourful, modern look for creative roles.', ats: 'Fair', usesAccent: true, Component: AccentResume }
];

export const RESUME_ACCENTS = [
  { id: 'navy', name: 'Navy', hex: '#1E3A8A' },
  { id: 'teal', name: 'Teal', hex: '#0F766E' },
  { id: 'burgundy', name: 'Burgundy', hex: '#9F1239' },
  { id: 'forest', name: 'Forest', hex: '#166534' },
  { id: 'violet', name: 'Violet', hex: '#6D28D9' },
  { id: 'charcoal', name: 'Charcoal', hex: '#27272A' }
];

export const getResumeTemplate = (id) => RESUME_TEMPLATES.find((t) => t.id === id) || RESUME_TEMPLATES[0];
export const getResumeAccent = (id) => (RESUME_ACCENTS.find((a) => a.id === id) || RESUME_ACCENTS[0]).hex;

export const renderResume = (templateId, portfolio, accentId) => {
  const { Component } = getResumeTemplate(templateId);
  return <Component portfolio={portfolio} accent={getResumeAccent(accentId)} />;
};
