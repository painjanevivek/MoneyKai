import React, { type ReactNode } from 'react';
import { Redirect } from 'expo-router';
import Archive from 'lucide-react/dist/esm/icons/archive.mjs';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3.mjs';
import Check from 'lucide-react/dist/esm/icons/check.mjs';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.mjs';
import Forward from 'lucide-react/dist/esm/icons/forward.mjs';
import Inbox from 'lucide-react/dist/esm/icons/inbox.mjs';
import Menu from 'lucide-react/dist/esm/icons/menu.mjs';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal.mjs';
import Paperclip from 'lucide-react/dist/esm/icons/paperclip.mjs';
import Reply from 'lucide-react/dist/esm/icons/reply.mjs';
import Search from 'lucide-react/dist/esm/icons/search.mjs';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check.mjs';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.mjs';
import Target from 'lucide-react/dist/esm/icons/target.mjs';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs';
import WalletCards from 'lucide-react/dist/esm/icons/wallet-cards.mjs';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { useAuthStore } from '@/stores/useAuthStore';

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

const audiences = ['Students', 'Families', 'Couples', 'Freelancers', 'Roommates'] as const;

const currentReleaseFeatures = [
  'Manual income and expense tracking',
  'Budgets and categories',
  'Savings and shared expense views',
  'Export your records',
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
    <nav
      className="mk-navbar"
      aria-label="Primary"
    >
      <a href="/" aria-label="MoneyKai home" className="mk-logo-link">
        <LogoMark />
      </a>
      <div className="mk-nav-links">
        {navLinks.map((item, index) => (
          <a
            key={item}
            href={item === 'Pricing' ? '#pricing' : item === 'Contact' ? '/contact' : `#${item.toLowerCase()}`}
            style={{ animationDelay: `${100 + index * 50}ms` }}
          >
            {item}
          </a>
        ))}
      </div>
      <div className="mk-nav-action">
        <AppButton />
      </div>
      <button className="mk-menu-button" aria-label="Open menu">
        <Menu size={18} />
      </button>
    </nav>
  );
}

function Hero() {
  return (
    <section className="mk-hero" aria-labelledby="hero-title">
      <h1
        id="hero-title"
        className="mk-hero-title"
      >
        <span>Review expenses, budgets,</span>
        <span className="mk-shiny-text animate-shiny">and shared bills before the month ends.</span>
      </h1>
      <p
        className="mk-hero-copy"
      >
        Add your income and expenses, check each budget, keep shared costs organized, and export a copy of your
        records when you need one.
      </p>
      <div
        className="mk-hero-actions"
      >
        <AppButton />
        <span>Available on Android</span>
      </div>
    </section>
  );
}

function MenuBar() {
  const items = ['Expenses', 'Budgets', 'Savings', 'Backups'] as const;

  return (
    <div
      className="mk-menu-strip"
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
    </div>
  );
}

function MoneyMockup() {
  return (
    <section className="mk-mockup-section" aria-label="MoneyKai app preview">
      <div className="mk-window">
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
                <p className="mk-message-subject">{row.subject}</p>
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
              <h2>July review</h2>
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
                  <strong>This month</strong>
                  <p>
                    128 transactions recorded. Five budgets checked. Dining is at 82% of its budget.
                  </p>
                </div>
              </div>
              <div className="mk-reader-copy">
                <p>
                  Groceries and rent stayed within their usual range. Subscription spending fell. Weekend dining
                  increased.
                </p>
                <p>This review is based on the records you add. It is not financial advice.</p>
                <p className="muted">MoneyKai</p>
              </div>
              <div className="mk-attachment">
                <Paperclip size={15} />
                moneykai-review-july.pdf
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureTriage() {
  return (
    <section id="features" className="mk-feature-grid">
      <div>
        <SectionEyebrow label="Monthly review" tag="Local-first" />
        <h2>
          See what needs attention
          <br />
          this month.
        </h2>
        <p>
          Review the records you added, compare each category with its budget, and keep shared costs organized.
        </p>
        <div className="mk-chip-row">
          {['Manual records', 'Budget status', 'Shared expenses', 'Export records'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <div className="liquid-glass mk-triage-card">
        <div className="mk-triage-head">Today: 42 records reviewed</div>
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
      </div>
    </section>
  );
}

function AudienceStrip() {
  return (
    <section className="mk-logo-cloud" aria-label="MoneyKai use cases">
      <p>For personal budgets and shared bills</p>
      <div>
        {audiences.map((audience) => (
          <span key={audience}>{audience}</span>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
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
        <h2 className="c3-watermark-main">
          <span className="c3-watermark-line-1">Current Android</span>
          <span className="c3-watermark-line-2">release</span>
        </h2>
      </div>
      <div className="c3-grid c3-grid-single">
        <article className="c3-card">
          <span className="c3-tier-small">Current Android release</span>
          <strong className="c3-tier-large">Free</strong>
          <p className="c3-desc">
            Record transactions, review budgets, check savings progress, and export your records. This release has no
            paid Android plan.
          </p>
          <ul className="c3-list">
            {currentReleaseFeatures.map((feature) => (
              <li key={feature}>
                <span className="c3-check">
                  <Check size={14} strokeWidth={2.4} />
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <a className="c3-btn" href="/signup">
            Create an account
          </a>
        </article>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mk-final-cta">
      <div className="liquid-glass">
        <div className="mk-final-glow" />
        <h2>
          Start with this month&apos;s
          <br />
          spending.
        </h2>
        <p>
          Add the records you need, then check your budgets, shared costs, and savings progress in the same review.
        </p>
        <div>
          <AppButton label="Create an account" />
          <a href="/contact" className="mk-sales-button">
            Contact MoneyKai <ChevronRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

function BackgroundFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mk-page-shell">
      <RootNoiseFilter />
      <div className="mk-ambient-bg" aria-hidden="true" />
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
          <AudienceStrip />
          <Pricing />
          <FinalCTA />
        </main>
      </BackgroundFrame>
    </>
  );
}
