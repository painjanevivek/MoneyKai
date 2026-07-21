import React, { type ReactNode, useState } from 'react';
import { Redirect } from 'expo-router';
import { motion } from 'motion/react';
import {
  Archive,
  BarChart3,
  Check,
  ChevronRight,
  Forward,
  Inbox,
  Menu,
  MoreHorizontal,
  Paperclip,
  Reply,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  WalletCards,
} from 'lucide-react';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { useHydratedViewportWidth } from '@/hooks/useHydratedViewportWidth';
import { useAuthStore } from '@/stores/useAuthStore';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';

const navLinks = ['Features', 'Pricing', 'Security', 'Learn', 'Contact'] as const;

const moneyItems = [
  {
    label: 'Transactions',
    value: '128',
    icon: Inbox,
    active: true,
  },
  {
    label: 'Budgets',
    value: '7',
    icon: Target,
  },
  {
    label: 'Savings',
    value: '4',
    icon: WalletCards,
  },
  {
    label: 'Reports',
    value: '',
    icon: BarChart3,
  },
  {
    label: 'Backups',
    value: '2',
    icon: ShieldCheck,
  },
  {
    label: 'Archive',
    value: '',
    icon: Archive,
  },
] as const;

const activityRows = [
  {
    name: 'Groceries',
    subject: 'Household essentials',
    preview: 'Big Bazaar, vegetables, and pantry refills...',
    time: '9:41 PM',
    unread: true,
    active: true,
  },
  {
    name: 'Rent split',
    subject: 'Shared expense added',
    preview: 'Rahul and Anika are included in this month...',
    time: '8:12 PM',
    unread: true,
  },
  {
    name: 'Budget alert',
    subject: 'Dining reached 82%',
    preview: 'You still have room, but weekend spends are rising.',
    time: 'Yesterday',
  },
  {
    name: 'Savings goal',
    subject: 'Emergency fund progress',
    preview: 'You are 64% of the way to your target.',
    time: 'Yesterday',
  },
  {
    name: 'Backup file',
    subject: 'Encrypted export created',
    preview: 'moneykai-backup-july.json is ready.',
    time: 'Mon',
  },
  {
    name: 'Monthly review',
    subject: 'June spending summary',
    preview: 'Subscriptions went down, travel moved up.',
    time: 'Mon',
  },
] as const;

const triageCards = [
  {
    title: 'Needs review',
    count: 4,
    color: '#ffffff',
    items: ['Dining budget - 82%', 'Rent split - pending'],
  },
  {
    title: 'Follow-up',
    count: 7,
    color: '#e5e5e5',
    items: ['Trip group - settle', 'Savings goal - adjust'],
  },
  {
    title: 'Updates',
    count: 18,
    color: '#a3a3a3',
    items: ['Backup ready', 'Budget renewed'],
  },
  {
    title: 'Archived',
    count: 13,
    color: '#525252',
    items: ['Receipts', 'Old subscriptions', 'Notes'],
  },
] as const;

const logos = ['Students', 'Families', 'Couples', 'Freelancers', 'Roommates', 'Creators', 'Founders', 'Operators'] as const;

const testimonials = [
  {
    quote:
      'MoneyKai made money review feel calm instead of judgmental. I can see what changed without opening five spreadsheets.',
    name: 'Aarav Mehta',
    role: 'Product Designer',
    company: 'BANGALORE',
  },
  {
    quote:
      'The local-first approach matters. I wanted a practical tracker that did not ask for my bank login to be useful.',
    name: 'Nisha Rao',
    role: 'Operations Lead',
    company: 'PUNE',
  },
  {
    quote:
      'Shared expenses, budgets, and encrypted backups in one place changed how our family reviews the month.',
    name: 'Rohan Shah',
    role: 'Engineering Manager',
    company: 'MUMBAI',
  },
] as const;

const plans = [
  {
    tier: 'Free',
    monthly: 'Free',
    yearly: 'Free',
    desc: 'For individuals building a calmer daily money habit.',
    features: [
      'Manual expense and income tracking',
      'Budgets, categories, and notes',
      'Savings and shared spend views',
      'Local-first Android experience',
      'Encrypted backup export',
    ],
  },
  {
    tier: 'Plus',
    monthly: '₹99/m',
    yearly: '₹999/y',
    desc: 'For power users who want deeper review workflows and richer summaries.',
    features: [
      'Unlimited budgets and groups',
      'Advanced monthly review surfaces',
      'Priority backup and restore flows',
      'Expanded report history',
      'Early access to premium tools',
    ],
  },
  {
    tier: 'Pro',
    monthly: '₹199/m',
    yearly: '₹1,999/y',
    desc: 'For families and teams who need shared money clarity without the noise.',
    features: [
      'Family and group workspaces',
      'Deep spending breakdowns',
      'AI-assisted review prompts',
      'Custom categories and reports',
      'Priority support',
    ],
    pro: true,
  },
] as const;

function LogoMark({ className = 'mk-logo-mark' }: { className?: string }) {
  return <img src="/brand/moneykai-mark-96.png" className={className} alt="" aria-hidden="true" />;
}

function AppButton({ label = 'Open MoneyKai', full = false }: { label?: string; full?: boolean }) {
  return (
    <a className={`mk-app-button ${full ? 'mk-app-button-full' : ''}`} href="/signup">
      <span>{label}</span>
      <ChevronRight className="mk-button-chevron" size={16} strokeWidth={2.2} />
    </a>
  );
}

function SectionEyebrow({ label, tag }: { label: string; tag?: string }) {
  return (
    <div className="mk-eyebrow">
      <span className="mk-eyebrow-dot" />
      <span>{label}</span>
      {tag ? <span className="mk-eyebrow-tag">{tag}</span> : null}
    </div>
  );
}

function RootNoiseFilter() {
  return (
    <svg className="mk-noise-svg" aria-hidden="true">
      <filter id="c3-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
        <feComposite in2="SourceGraphic" operator="in" result="noise" />
        <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
      </filter>
    </svg>
  );
}

function Navbar() {
  return (
    <motion.nav
      className="mk-navbar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      aria-label="Primary"
    >
      <a href="/" aria-label="MoneyKai home" className="mk-logo-link">
        <LogoMark />
      </a>
      <div className="mk-nav-links">
        {navLinks.map((item, index) => (
          <motion.a
            key={item}
            href={item === 'Pricing' ? '#pricing' : item === 'Contact' ? '/contact' : `#${item.toLowerCase()}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05, duration: 0.4, ease: 'easeOut' }}
          >
            {item}
          </motion.a>
        ))}
      </div>
      <div className="mk-nav-action">
        <AppButton />
      </div>
      <button className="mk-menu-button" aria-label="Open menu">
        <Menu size={18} />
      </button>
    </motion.nav>
  );
}

function Hero() {
  return (
    <section className="mk-hero" aria-labelledby="hero-title">
      <motion.h1
        id="hero-title"
        className="mk-hero-title"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <span>Your money.</span>
        <span className="mk-shiny-text animate-shiny">Revitalized</span>
      </motion.h1>
      <motion.p
        className="mk-hero-copy"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
      >
        MoneyKai is the calm personal finance platform for the current era. It organizes expenses, budgets, shared
        spending, savings, and encrypted backup files into total clarity.
      </motion.p>
      <motion.div
        className="mk-hero-actions"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
      >
        <AppButton />
        <span>Android release now available</span>
      </motion.div>
    </section>
  );
}

function MenuBar() {
  const items = ['Expenses', 'Budgets', 'Savings', 'Backups'] as const;

  return (
    <motion.div
      className="mk-menu-strip"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.55, ease: 'easeOut' }}
    >
      <div className="mk-menu-inner">
        <div className="mk-menu-left">
          <LogoMark className="mk-menu-logo" />
          <strong>MoneyKai</strong>
          <span className="mk-strip-caption">Private money review, organized locally.</span>
        </div>
        <div className="mk-menu-right">
          {items.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MoneyMockup() {
  return (
    <section className="mk-mockup-section" aria-label="MoneyKai app preview">
      <motion.div
        className="mk-window"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mk-titlebar">
          <div className="mk-traffic">
            <span style={{ background: '#ff5f57' }} />
            <span style={{ background: '#febc2e' }} />
            <span style={{ background: '#28c840' }} />
          </div>
          <span>MoneyKai - Review</span>
        </div>
        <div className="mk-window-body">
          <aside className="mk-sidebar">
            <button className="mk-compose-button">
              <Sparkles size={14} />
              Review with MoneyKai
            </button>
            <nav className="mk-side-nav" aria-label="MoneyKai sections">
              {moneyItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    className={'active' in item && item.active ? 'active' : undefined}
                    href="#features"
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                    {item.value ? <em>{item.value}</em> : null}
                  </a>
                );
              })}
            </nav>
            <div className="mk-labels">
              <span>Labels</span>
              {[
                ['Bills', '#00d2ff'],
                ['Family', '#A4F4FD'],
                ['Travel', '#f59e0b'],
                ['Savings', '#10b981'],
              ].map(([label, color]) => (
                <div key={label}>
                  <i style={{ background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </aside>
          <div className="mk-message-list">
            <div className="mk-search-box">
              <Search size={15} />
              <span>Search money records</span>
            </div>
            {activityRows.map((row) => (
              <article key={row.subject} className={'active' in row && row.active ? 'active' : undefined}>
                <div>
                  <strong>{row.name}</strong>
                  <span>{row.time}</span>
                </div>
                <h3>{row.subject}</h3>
                <p>{row.preview}</p>
                {'unread' in row && row.unread ? <i /> : null}
              </article>
            ))}
          </div>
          <div className="mk-reader">
            <div className="mk-toolbar">
              {[Reply, Forward, Archive, Trash2].map((Icon, index) => (
                <button key={index} aria-label={['Reply', 'Forward', 'Archive', 'Delete'][index]}>
                  <Icon size={15} />
                </button>
              ))}
              <button aria-label="More options" className="mk-toolbar-more">
                <MoreHorizontal size={15} />
              </button>
            </div>
            <div className="mk-reader-content">
              <h2>Monthly money digest</h2>
              <div className="mk-sender-row">
                <span className="mk-avatar">M</span>
                <div>
                  <strong>MoneyKai</strong>
                  <span>to me - 9:41 PM</span>
                </div>
                <em>Review</em>
              </div>
              <div className="mk-summary-card">
                <Sparkles size={16} color="#A4F4FD" />
                <div>
                  <strong>Summary by MoneyKai</strong>
                  <p>
                    You logged 128 transactions, kept 5 budgets on track, and moved 18% more into savings. Dining
                    needs review. No bank connection required.
                  </p>
                </div>
              </div>
              <div className="mk-reader-copy">
                <p>Hi Vivek,</p>
                <p>
                  Here is your monthly digest across expenses, budgets, savings, and shared spending. This was a
                  steadier month with fewer surprise purchases.
                </p>
                <p>
                  Grocery and rent stayed predictable, subscriptions moved down, and weekend dining increased. Your
                  emergency fund continued to climb.
                </p>
                <p>Use this as a review, not advice. MoneyKai organizes the records you provide.</p>
                <p className="muted">- The MoneyKai team</p>
              </div>
              <div className="mk-attachment">
                <Paperclip size={15} />
                moneykai-review-july.pdf
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function FeatureTriage() {
  return (
    <section id="features" className="mk-feature-grid">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <SectionEyebrow label="Review" tag="Local-first" />
        <h2>
          Clear your money picture
          <br />
          in a single pass.
        </h2>
        <p>
          MoneyKai reads the records you create, understands your categories, and routes the noise away from the
          signal. Focus on what moves your month forward. The rest becomes easier to review.
        </p>
        <div className="mk-chip-row">
          {['Auto-categorize', 'Budget guardrails', 'Shared spends', 'Encrypted backup'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </motion.div>
      <motion.div
        className="liquid-glass mk-triage-card"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="mk-triage-head">Today - 42 records reviewed</div>
        {triageCards.map((card) => (
          <div className="liquid-glass mk-triage-row" key={card.title}>
            <div>
              <span style={{ background: card.color }} />
              <strong>
                {card.title} ({card.count})
              </strong>
            </div>
            <p>{card.items.join(' - ')}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

function LogoCloud() {
  return (
    <section className="mk-logo-cloud" aria-label="MoneyKai audiences">
      <p>Trusted by thoughtful money reviewers</p>
      <div>
        {logos.map((logo, index) => (
          <motion.span
            key={logo}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.45, ease: 'easeOut' }}
          >
            {logo}
          </motion.span>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="mk-testimonials">
      {testimonials.map((item) => (
        <figure className="liquid-glass" key={item.name}>
          <blockquote>{item.quote}</blockquote>
          <figcaption>
            <strong>{item.name}</strong>
            <span>{item.role}</span>
            <em>{item.company}</em>
          </figcaption>
        </figure>
      ))}
    </section>
  );
}

function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="c3-pricing-section">
      <svg className="mk-noise-svg" aria-hidden="true">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.075" />
          </feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
        </filter>
      </svg>
      <div className="c3-watermark-container">
        <div className="c3-watermark-main">
          <span className="c3-watermark-line-1">Your money.</span>
          <span className="c3-watermark-line-2">Revitalized</span>
        </div>
      </div>
      <div className="c3-grid">
        {plans.map((plan) => (
          <article className={`c3-card ${'pro' in plan && plan.pro ? 'c3-card-pro' : ''}`} key={plan.tier}>
            <span className="c3-tier-small">{plan.tier}</span>
            <strong className="c3-tier-large">{yearly ? plan.yearly : plan.monthly}</strong>
            <p className="c3-desc">{plan.desc}</p>
            <ul className="c3-list">
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span className="c3-check">
                    <Check size={14} strokeWidth={2.4} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <a className="c3-btn" href="/signup">
              Choose Plan
            </a>
          </article>
        ))}
      </div>
      <div className="c3-toggle-wrap">
        <span>Yearly</span>
        <button
          type="button"
          aria-label="Toggle yearly pricing"
          aria-pressed={yearly}
          className={`c3-toggle ${yearly ? 'active' : ''}`}
          onClick={() => setYearly((value) => !value)}
        >
          <span className="c3-toggle-knob" />
        </button>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mk-final-cta">
      <motion.div
        className="liquid-glass"
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="mk-final-glow" />
        <h2>
          Close the tabs.
          <br />
          Open your month.
        </h2>
        <p>
          Join people who treat money review like a useful habit, not an obligation. MoneyKai keeps the flow private,
          practical, and calm.
        </p>
        <div>
          <AppButton label="Open MoneyKai" />
          <a href="/contact" className="mk-sales-button">
            Talk to sales <ChevronRight size={16} />
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function BackgroundFrame({ children }: { children: ReactNode }) {
  const width = useHydratedViewportWidth();
  const showAmbientVideo = width >= 900;

  return (
    <div className="mk-page-shell">
      <RootNoiseFilter />
      {showAmbientVideo ? (
        <div className="mk-video-bg" aria-hidden="true">
          <video autoPlay loop muted playsInline preload="metadata" className="mk-video" src={VIDEO_URL} />
        </div>
      ) : null}
      <div className="mk-guide mk-guide-left" />
      <div className="mk-guide mk-guide-right" />
      <div className="mk-page-content">{children}</div>
    </div>
  );
}

export default function LandingScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const description =
    'MoneyKai is a premium local-first personal finance app for expense tracking, budgets, shared spending, savings, and encrypted backup files.';
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE.name,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Android',
      url: SITE.url,
      description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
  ];

  if (isAuthenticated) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <>
      <SeoHead
        title={SITE.title}
        description={description}
        path="/"
        keywords={['MoneyKai', 'personal finance app', 'expense tracker', 'budget app', 'money review']}
        structuredData={structuredData}
      />
      <BackgroundFrame>
        <Navbar />
        <main id="main-content">
          <Hero />
          <MenuBar />
          <MoneyMockup />
          <FeatureTriage />
          <LogoCloud />
          <Testimonials />
          <Pricing />
          <FinalCTA />
        </main>
      </BackgroundFrame>
    </>
  );
}
