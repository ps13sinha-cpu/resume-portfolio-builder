export const samplePortfolios = {
  fullstack: {
    id: "sample-fullstack",
    user_id: "demo-user",
    slug: "piyush-dev",
    is_public: true,
    layout_id: "awwwards", // awwwards, developer, executive, brutalist
    profile: {
      fullName: "Piyush Sharma",
      title: "Senior Full-Stack Engineer & System Architect",
      bio: "Crafting scalable distributed web systems and immersive interactive digital experiences. Passionate about real-time architecture, WebGL graphics, and ultra-fluid user interfaces.",
      location: "San Francisco, CA (Open to Remote)",
      email: "piyush.dev@example.com",
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      twitter: "https://x.com",
      website: "https://piyush-dev.portfolio.app",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      statusPill: "🚀 Open for High-Impact Roles"
    },
    experience: [
      {
        id: "exp-1",
        company: "Apex Tech Labs",
        role: "Lead Frontend Architect",
        start: "2023-01",
        end: "Present",
        isCurrent: true,
        location: "San Francisco, CA",
        bullets: [
          "Architected high-throughput micro-frontend dashboard serving 1.2M daily active users with sub-100ms first input delay (FID).",
          "Engineered custom WebGL interactive visualization engine using Three.js and Canvas APIs, boosting user session time by 42%.",
          "Spearheaded migration from legacy SPA to Server-Side Rendered architecture, increasing organic search SEO traffic by 185%.",
          "Mentored team of 8 engineers and established automated E2E test suite achieving 94% code coverage."
        ],
        order_index: 0
      },
      {
        id: "exp-2",
        company: "Vortex Cloud Systems",
        role: "Senior Full-Stack Developer",
        start: "2021-03",
        end: "2022-12",
        isCurrent: false,
        location: "Austin, TX",
        bullets: [
          "Designed resilient Node.js microservices handling 50k requests/sec with Redis caching layer and PostgreSQL backend.",
          "Implemented OAuth2.0 and RBAC security protocol, eliminating cross-tenant access vulnerability risks across all tenant APIs.",
          "Optimized bundle size by 62% using dynamic route code splitting and tree shaking techniques."
        ],
        order_index: 1
      }
    ],
    education: [
      {
        id: "edu-1",
        institution: "University of California, Berkeley",
        degree: "Bachelor of Science",
        field: "Computer Science & Engineering",
        start: "2017-08",
        end: "2021-05",
        grade: "3.92 / 4.0 (Magna Cum Laude)",
        description: "Focus on Distributed Systems, Computer Graphics, and Algorithms. Dean's Honor Roll all semesters.",
        order_index: 0
      }
    ],
    skills: [
      { id: "sk-1", name: "React & Next.js", category: "Frontend", level: 98, order_index: 0 },
      { id: "sk-2", name: "TypeScript / JavaScript", category: "Languages", level: 95, order_index: 1 },
      { id: "sk-3", name: "Node.js & Express", category: "Backend", level: 92, order_index: 2 },
      { id: "sk-4", name: "PostgreSQL & Redis", category: "Database", level: 88, order_index: 3 },
      { id: "sk-5", name: "Tailwind & CSS Animations", category: "Frontend", level: 96, order_index: 4 },
      { id: "sk-6", name: "Three.js / WebGL", category: "Graphics", level: 85, order_index: 5 },
      { id: "sk-7", name: "Docker & AWS / Vercel", category: "DevOps", level: 84, order_index: 6 },
      { id: "sk-8", name: "System Design & GraphQL", category: "Architecture", level: 90, order_index: 7 }
    ],
    projects: [
      {
        id: "proj-1",
        title: "Aura AI Canvas",
        description: "Generative AI design suite for real-time collaborative moodboards with instant WebGL shaders and GPU-accelerated export.",
        techTags: ["React", "TypeScript", "Three.js", "WebSockets", "Node.js"],
        liveUrl: "https://example.com/aura",
        githubUrl: "https://github.com/example/aura",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        featured: true,
        order_index: 0
      },
      {
        id: "proj-2",
        title: "HyperPulse Analytics Engine",
        description: "Low-latency distributed telemetry platform monitoring microservice traces with custom timeseries graphing.",
        techTags: ["Next.js", "Go", "PostgreSQL", "Redis", "Chart.js"],
        liveUrl: "https://example.com/hyperpulse",
        githubUrl: "https://github.com/example/hyperpulse",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
        featured: true,
        order_index: 1
      },
      {
        id: "proj-3",
        title: "Nexus Design System",
        description: "Accessible, zero-runtime CSS component framework with 40+ production components and fluid layout engines.",
        techTags: ["CSS3", "Storybook", "TypeScript", "Vanilla JS"],
        liveUrl: "https://example.com/nexus",
        githubUrl: "https://github.com/example/nexus",
        imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
        featured: false,
        order_index: 2
      }
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Certified Solutions Architect – Associate",
        issuer: "Amazon Web Services",
        date: "2023-08",
        credentialUrl: "https://aws.amazon.com/verification",
        order_index: 0
      },
      {
        id: "cert-2",
        name: "Meta Certified Front-End Developer",
        issuer: "Meta / Coursera",
        date: "2022-11",
        credentialUrl: "https://coursera.org/verification",
        order_index: 1
      }
    ]
  }
};
