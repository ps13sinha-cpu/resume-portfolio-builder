import React from 'react';
import { createRoot } from 'react-dom/client';

// Fixture template: consumes data.json via the adapter's canonicalToTemplateProps.
// At preview time the host injects real data through window.__TEMPLATE_DATA__.
import demoData from './data.json';
const data = (typeof window !== 'undefined' && window.__TEMPLATE_DATA__) || demoData;

const Profile = ({ p }) => (
  <header className="hero">
    <h1>{p.name}</h1>
    <p className="role">{p.role}</p>
    <p className="bio">{p.bio}</p>
    <p className="meta">{p.location} · {p.email}</p>
  </header>
);

const Experience = ({ items }) => (
  <section className="section">
    <h2>Experience</h2>
    <div className="grid-2">
      {items.map((x, i) => (
        <article key={i} className="card">
          <h3>{x.title} <span className="muted">· {x.company}</span></h3>
          <p className="period">{x.period}</p>
          <p>{x.summary}</p>
        </article>
      ))}
    </div>
  </section>
);

const Projects = ({ items }) => (
  <section className="section">
    <h2>Projects</h2>
    <div className="grid-3">
      {items.map((x, i) => (
        <article key={i} className="card">
          <h3>{x.name}</h3>
          <p>{x.description}</p>
          <p className="tags">{(x.tech || []).join(' · ')}</p>
        </article>
      ))}
    </div>
  </section>
);

const Education = ({ items }) => (
  <section className="section">
    <h2>Education</h2>
    {items.map((x, i) => (
      <p key={i}><strong>{x.degree}{x.field ? `, ${x.field}` : ''}</strong> — {x.school} <span className="muted">({x.period})</span></p>
    ))}
  </section>
);

const Certifications = ({ items }) => (
  <section className="section">
    <h2>Certifications</h2>
    {items.map((x, i) => (
      <p key={i}>{x.title} — {x.issuer} <span className="muted">({x.date})</span></p>
    ))}
  </section>
);

const Skills = ({ items }) => (
  <section className="section">
    <h2>Skills</h2>
    <p className="tags">{items.map((s) => s.name).join(' · ')}</p>
  </section>
);

const App = ({ data: d }) => (
  <div className="wrap">
    <Profile p={d.profile} />
    <Skills items={d.skills} />
    <Experience items={d.experience} />
    <Projects items={d.projects} />
    <Education items={d.education} />
    <Certifications items={d.certifications} />
  </div>
);

createRoot(document.getElementById('root')).render(<App data={data} />);
