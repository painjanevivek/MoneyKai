import React, { type CSSProperties, type ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { useAuthStore } from '@/stores/useAuthStore';

const palette = {
  page: '#06110E',
  pageSoft: '#0A1814',
  surface: '#10231D',
  surfaceHigh: '#173228',
  surfaceWarm: '#F5F0E5',
  border: 'rgba(190, 222, 212, 0.22)',
  borderStrong: 'rgba(190, 222, 212, 0.38)',
  text: '#F5FBF8',
  muted: '#C7DAD2',
  faint: '#92AAA0',
  ink: '#15231E',
  green: '#7DD3C7',
  greenDeep: '#0F766E',
  greenSoft: 'rgba(125, 211, 199, 0.14)',
  gold: '#DAB35D',
  goldSoft: 'rgba(218, 179, 93, 0.14)',
  redSoft: 'rgba(251, 113, 133, 0.14)',
};

const navLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#privacy', label: 'Privacy' },
  { href: '/pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
] as const;

const trustItems = ['India-first money habits', 'No advice overclaims', 'Reviewable drafts', 'Built for private records'] as const;

const problemCards = [
  {
    title: 'Your money records live everywhere',
    body: 'Expenses, budgets, shared spends, notes, statements, and portfolio context rarely sit in one calm place.',
  },
  {
    title: 'Reports should not feel like homework',
    body: 'MoneyKai turns reviewed records into plain-language summaries that are easier to scan and revisit.',
  },
  {
    title: 'AI should wait for your review',
    body: 'Imported records remain visible as reviewable drafts before they shape a private report.',
  },
] as const;

const flowSteps = [
  {
    eyebrow: '01',
    title: 'Bring in the records',
    body: 'Add transactions, statement details, notes, budgets, shared expenses, and portfolio context as your own reviewed inputs.',
  },
  {
    eyebrow: '02',
    title: 'Review the drafts',
    body: 'Keep imported records legible before they affect reports, budgets, or month-end understanding.',
  },
  {
    eyebrow: '03',
    title: 'Read the pattern',
    body: 'See where money moved, what changed, and what deserves attention without turning the app into a spreadsheet.',
  },
] as const;

const featureCards = [
  {
    title: 'Expense clarity',
    body: 'Track daily spending, categories, notes, and recurring patterns without losing the original context.',
    metric: 'Daily',
  },
  {
    title: 'Budget rhythm',
    body: 'Keep budgets useful as monthly guardrails instead of rigid accounting rules.',
    metric: 'Monthly',
  },
  {
    title: 'Shared spends',
    body: 'Make group expenses easier to review for roommates, couples, families, and trips.',
    metric: 'Together',
  },
  {
    title: 'Portfolio context',
    body: 'Keep investment context beside spending and savings without presenting it as financial advice.',
    metric: 'Context',
  },
] as const;

const comparisonRows = [
  ['Spreadsheets', 'Flexible but manual, fragile, and hard to revisit on mobile.', 'Guided records, report views, and calmer review loops.'],
  ['Generic trackers', 'Often optimized for quick entry, not thoughtful month-end review.', 'Built around private summaries and user-reviewed inputs.'],
  ['One-off notes', 'Great for memory, weak for patterns and shared visibility.', 'Notes sit beside budgets, expenses, and report context.'],
] as const;

const faqs = [
  {
    question: 'Is MoneyKai giving financial advice?',
    answer: 'No. MoneyKai helps organize and summarize user-provided records. It does not provide investment, tax, legal, or financial advice.',
  },
  {
    question: 'Does every imported record become final automatically?',
    answer: 'No. The product direction is review-first: records should stay visible as drafts before they influence reports or decisions.',
  },
  {
    question: 'Who is MoneyKai for?',
    answer: 'Students, young professionals, couples, families, and privacy-conscious users who want a calmer way to understand daily money habits.',
  },
  {
    question: 'Can I use it without treating money like accounting homework?',
    answer: 'Yes. The landing experience and product language are built around simple review, plain reports, and practical money clarity.',
  },
] as const;

const headlineStyle = (isCompact: boolean): CSSProperties => ({
  margin: 0,
  color: palette.text,
  fontFamily: 'Poppins_600SemiBold, Inter, system-ui, sans-serif',
  fontSize: isCompact ? 42 : 70,
  lineHeight: isCompact ? '48px' : '76px',
  letterSpacing: 0,
  maxWidth: 780,
});

const sectionTitleStyle = (isCompact: boolean): CSSProperties => ({
  margin: 0,
  color: palette.text,
  fontFamily: 'Poppins_600SemiBold, Inter, system-ui, sans-serif',
  fontSize: isCompact ? 30 : 46,
  lineHeight: isCompact ? '38px' : '54px',
  letterSpacing: 0,
});

const paragraphStyle: CSSProperties = {
  margin: 0,
  color: palette.muted,
  fontSize: 16,
  lineHeight: '26px',
};

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: `1px solid ${palette.border}`,
  borderRadius: 999,
  background: 'rgba(14, 34, 28, 0.92)',
  color: palette.muted,
  fontSize: 13,
  fontWeight: 700,
  lineHeight: '18px',
  padding: '9px 13px',
};

const cardStyle: CSSProperties = {
  border: `1px solid ${palette.border}`,
  borderRadius: 8,
  background: 'linear-gradient(180deg, rgba(23, 50, 40, 0.96), rgba(9, 24, 19, 0.98))',
  boxShadow: '0 24px 70px rgba(0,0,0,0.34)',
};

function cxGrid(isWide: boolean, min = '260px'): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: isWide ? `repeat(3, minmax(${min}, 1fr))` : '1fr',
    gap: 16,
  };
}

function Section({
  id,
  children,
  compact,
  labelledBy,
}: {
  id?: string;
  children: ReactNode;
  compact: boolean;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      style={{
        background: 'linear-gradient(180deg, #091A15 0%, #07130F 100%)',
        padding: compact ? '52px 18px' : '84px 24px',
        borderTop: `1px solid ${palette.border}`,
      }}
    >
      <div style={{ margin: '0 auto', maxWidth: 1180 }}>{children}</div>
    </section>
  );
}

function LinkButton({
  href,
  children,
  primary = false,
  fullWidth = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        alignItems: 'center',
        background: primary ? palette.green : 'rgba(245, 251, 248, 0.06)',
        border: `1px solid ${primary ? palette.green : palette.borderStrong}`,
        borderRadius: 8,
        boxSizing: 'border-box',
        color: primary ? '#06211B' : palette.text,
        display: 'inline-flex',
        fontSize: 15,
        fontWeight: 800,
        justifyContent: 'center',
        lineHeight: '20px',
        minHeight: 52,
        padding: '0 20px',
        textDecoration: 'none',
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {children}
    </a>
  );
}

function LandingHeader({ compact }: { compact: boolean }) {
  const [open, setOpen] = React.useState(false);
  const visibleNav = !compact || open;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backdropFilter: 'blur(18px)',
        background: 'rgba(7, 17, 15, 0.82)',
        borderBottom: `1px solid ${palette.border}`,
      }}
    >
      <div
        style={{
          alignItems: compact ? 'stretch' : 'center',
          display: 'flex',
          flexDirection: compact ? 'column' : 'row',
          gap: compact ? 12 : 18,
          justifyContent: 'space-between',
          margin: '0 auto',
          maxWidth: 1180,
          padding: compact ? '12px 18px' : '14px 24px',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 14 }}>
          <a
            href="/"
            aria-label="MoneyKai home"
            style={{ alignItems: 'center', color: palette.text, display: 'inline-flex', gap: 12, textDecoration: 'none' }}
          >
            <span
              aria-hidden="true"
              style={{
                alignItems: 'center',
                background: '#FFFFFF',
                borderRadius: 8,
                display: 'inline-flex',
                height: 40,
                justifyContent: 'center',
                overflow: 'hidden',
                width: 40,
              }}
            >
              <img
                alt=""
                src="/brand/moneykai-mark.jpeg"
                style={{ display: 'block', height: 32, objectFit: 'contain', width: 32 }}
              />
            </span>
            <span style={{ display: 'grid', gap: 1 }}>
              <strong style={{ color: palette.text, fontSize: 17, lineHeight: '20px' }}>{SITE.name}</strong>
              <span style={{ color: palette.faint, fontSize: 12, lineHeight: '16px' }}>Private finance reports</span>
            </span>
          </a>

          {compact ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls="site-navigation"
              onClick={() => setOpen((value) => !value)}
              style={{
                background: 'rgba(245, 251, 248, 0.07)',
                border: `1px solid ${palette.borderStrong}`,
                borderRadius: 8,
                color: palette.text,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 800,
                minHeight: 40,
                padding: '0 14px',
              }}
            >
              {open ? 'Close' : 'Menu'}
            </button>
          ) : null}
        </div>

        {visibleNav ? (
          <nav
            id="site-navigation"
            aria-label="Primary"
            style={{
              alignItems: compact ? 'stretch' : 'center',
              display: 'flex',
              flexDirection: compact ? 'column' : 'row',
              gap: compact ? 6 : 4,
            }}
          >
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  borderRadius: 8,
                  color: palette.muted,
                  fontSize: 14,
                  fontWeight: 700,
                  padding: compact ? '12px 10px' : '10px 12px',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}

        {visibleNav ? (
          <div style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', gap: 10 }}>
            <LinkButton href="/login" fullWidth={compact}>
              Sign in
            </LinkButton>
            <LinkButton href="/signup" primary fullWidth={compact}>
              Create account
            </LinkButton>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function ProductPreview({ compact }: { compact: boolean }) {
  return (
    <aside
      aria-label="MoneyKai private report preview"
      style={{
        ...cardStyle,
        background: `linear-gradient(180deg, ${palette.surfaceWarm}, #E9DFCC)`,
        color: palette.ink,
        minHeight: compact ? 380 : 500,
        overflow: 'hidden',
        padding: compact ? 18 : 24,
        position: 'relative',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={{ color: '#64736A', fontSize: 12, fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Monthly review</p>
          <h2 style={{ color: palette.ink, fontSize: compact ? 26 : 34, lineHeight: compact ? '32px' : '40px', margin: '6px 0 0' }}>
            June money report
          </h2>
        </div>
        <div
          style={{
            alignItems: 'center',
            background: '#14362E',
            borderRadius: 8,
            color: palette.green,
            display: 'flex',
            fontWeight: 900,
            height: 52,
            justifyContent: 'center',
            width: 52,
          }}
        >
          84
        </div>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(21, 35, 30, 0.1)',
          borderRadius: 8,
          boxShadow: '0 20px 50px rgba(21,35,30,0.14)',
          display: 'grid',
          gap: 18,
          marginTop: 24,
          padding: 18,
        }}
      >
        {[
          ['Reviewed income', 'Rs. 82,400', 78],
          ['Tracked spending', 'Rs. 46,120', 54],
          ['Shared expenses', 'Rs. 8,940', 33],
        ].map(([label, value, width]) => (
          <div key={label as string}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: '#52665D', fontSize: 13, fontWeight: 700 }}>{label}</span>
              <strong style={{ color: palette.ink, fontSize: 16 }}>{value}</strong>
            </div>
            <div style={{ background: '#E7EFEA', borderRadius: 999, height: 8, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ background: label === 'Tracked spending' ? palette.gold : palette.greenDeep, borderRadius: 999, height: '100%', width: `${width}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
        {[
          ['Drafts waiting', '12 records need review before reporting.'],
          ['Budget signal', 'Dining is 18% above your usual month.'],
          ['Calm next step', 'Review transfers before updating savings.'],
        ].map(([title, body]) => (
          <article
            key={title}
            style={{
              background: 'rgba(255,255,255,0.62)',
              border: '1px solid rgba(21, 35, 30, 0.1)',
              borderRadius: 8,
              padding: 14,
            }}
          >
            <h3 style={{ color: palette.ink, fontSize: 15, lineHeight: '20px', margin: 0 }}>{title}</h3>
            <p style={{ color: '#5B6D65', fontSize: 13, lineHeight: '20px', margin: '5px 0 0' }}>{body}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}

export default function LandingScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isWide = width >= 980;
  const description =
    'MoneyKai is a calm personal finance workspace for India-first expense tracking, budgets, shared spending, reviewable drafts, and private money reports.';
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE.name,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web, iOS, Android',
      url: SITE.url,
      description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/brand/moneykai-mark.jpeg`,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SITE.supportEmail,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ];

  if (isAuthenticated) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <>
      <SeoHead
        title="MoneyKai | Calm private finance reports"
        description={description}
        path="/"
        keywords={['personal finance India', 'expense tracker', 'budget app', 'private finance reports', 'shared expenses']}
        structuredData={structuredData}
      />
      <div
        style={{
          background:
            'linear-gradient(180deg, #06110E 0%, #091A15 42%, #07130F 100%)',
          color: palette.text,
          colorScheme: 'dark',
          fontFamily: 'Inter, Poppins_400Regular, system-ui, sans-serif',
          minHeight: '100vh',
        }}
      >
        <LandingHeader compact={isCompact} />

        <main
          id="main-content"
          style={{
            background: 'linear-gradient(180deg, #06110E 0%, #091A15 42%, #07130F 100%)',
          }}
        >
          <section
            aria-labelledby="hero-title"
            style={{
              background:
                'radial-gradient(circle at 20% 10%, rgba(125,211,199,0.17), transparent 30%), radial-gradient(circle at 88% 18%, rgba(218,179,93,0.14), transparent 28%), #06110E',
              padding: isCompact ? '48px 18px 52px' : '82px 24px 88px',
            }}
          >
            <div
              style={{
                alignItems: 'center',
                display: 'grid',
                gap: isCompact ? 32 : 56,
                gridTemplateColumns: isWide ? '1.05fr 0.95fr' : '1fr',
                margin: '0 auto',
                maxWidth: 1180,
              }}
            >
              <div>
                <span style={badgeStyle}>Private finance reports for money you actually review</span>
                <h1 id="hero-title" style={{ ...headlineStyle(isCompact), marginTop: 22 }}>
                  Calm money clarity from records you control.
                </h1>
                <p style={{ ...paragraphStyle, fontSize: isCompact ? 17 : 19, lineHeight: isCompact ? '29px' : '32px', marginTop: 22, maxWidth: 650 }}>
                  MoneyKai helps you review expenses, budgets, shared spending, notes, and portfolio context before turning them into plain private reports.
                </p>
                <div style={{ display: 'flex', flexDirection: isCompact ? 'column' : 'row', gap: 12, marginTop: 30, maxWidth: isCompact ? '100%' : 430 }}>
                  <LinkButton href="/signup" primary fullWidth={isCompact}>
                    Create secure account
                  </LinkButton>
                  <LinkButton href="#how-it-works" fullWidth={isCompact}>
                    See how it works
                  </LinkButton>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 26 }}>
                  {trustItems.map((item) => (
                    <span key={item} style={{ ...badgeStyle, background: 'rgba(14, 34, 28, 0.78)', fontSize: 12, padding: '8px 11px' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <ProductPreview compact={isCompact} />
            </div>
          </section>

          <>
            <Section compact={isCompact} labelledBy="problem-title">
              <div style={{ display: 'grid', gap: 28 }}>
                <div style={{ display: 'grid', gap: 14, maxWidth: 760 }}>
                  <span style={badgeStyle}>The problem</span>
                  <h2 id="problem-title" style={sectionTitleStyle(isCompact)}>
                    Money tools are loud. Money review should be quiet.
                  </h2>
                  <p style={paragraphStyle}>
                    The page needs to prove MoneyKai is practical, private, and ready for real everyday finance habits without sounding like investment advice or an AI toy.
                  </p>
                </div>
                <div style={cxGrid(isWide)}>
                  {problemCards.map((item) => (
                    <article key={item.title} style={{ ...cardStyle, padding: 22 }}>
                      <h3 style={{ color: palette.text, fontSize: 21, lineHeight: '28px', margin: 0 }}>{item.title}</h3>
                      <p style={{ ...paragraphStyle, marginTop: 10 }}>{item.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </Section>

            <Section id="how-it-works" compact={isCompact} labelledBy="flow-title">
              <div style={{ display: 'grid', gap: 28 }}>
                <div style={{ display: 'grid', gap: 14, maxWidth: 760 }}>
                  <span style={badgeStyle}>How it works</span>
                  <h2 id="flow-title" style={sectionTitleStyle(isCompact)}>
                    A review-first flow for everyday money.
                  </h2>
                </div>
                <div style={cxGrid(isWide)}>
                  {flowSteps.map((step) => (
                    <article key={step.title} style={{ ...cardStyle, padding: 22 }}>
                      <span style={{ color: palette.green, fontSize: 13, fontWeight: 900 }}>{step.eyebrow}</span>
                      <h3 style={{ color: palette.text, fontSize: 22, lineHeight: '28px', margin: '12px 0 0' }}>{step.title}</h3>
                      <p style={{ ...paragraphStyle, marginTop: 10 }}>{step.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </Section>

            <Section id="features" compact={isCompact} labelledBy="feature-title">
              <div style={{ display: 'grid', gap: 28 }}>
                <div style={{ alignItems: isWide ? 'end' : 'start', display: 'grid', gap: 18, gridTemplateColumns: isWide ? '1fr 0.6fr' : '1fr' }}>
                  <div style={{ display: 'grid', gap: 14 }}>
                    <span style={badgeStyle}>Product surface</span>
                    <h2 id="feature-title" style={sectionTitleStyle(isCompact)}>
                      Built for budgets, spends, families, and month-end review.
                    </h2>
                  </div>
                  <p style={paragraphStyle}>
                    Every section is modular so the Expo/Vercel site can ship quickly while keeping the story, visuals, and interaction model consistent.
                  </p>
                </div>
                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: isWide ? 'repeat(4, minmax(0, 1fr))' : isCompact ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
                  {featureCards.map((item) => (
                    <article key={item.title} style={{ ...cardStyle, minHeight: isCompact ? 'auto' : 196, padding: 20 }}>
                      <span style={{ color: palette.gold, fontSize: 12, fontWeight: 900 }}>{item.metric}</span>
                      <h3 style={{ color: palette.text, fontSize: 21, lineHeight: '27px', margin: '28px 0 0' }}>{item.title}</h3>
                      <p style={{ ...paragraphStyle, fontSize: 14, lineHeight: '23px', marginTop: 10 }}>{item.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </Section>

            <Section id="privacy" compact={isCompact} labelledBy="privacy-title">
              <div
                style={{
                  ...cardStyle,
                  background: `linear-gradient(135deg, ${palette.greenSoft}, ${palette.goldSoft}), ${palette.surface}`,
                  display: 'grid',
                  gap: isCompact ? 24 : 36,
                  gridTemplateColumns: isWide ? '0.9fr 1.1fr' : '1fr',
                  padding: isCompact ? 22 : 34,
                }}
              >
                <div style={{ display: 'grid', gap: 14 }}>
                  <span style={badgeStyle}>Trust boundary</span>
                  <h2 id="privacy-title" style={sectionTitleStyle(isCompact)}>
                    Clear privacy language without security theatre.
                  </h2>
                  <p style={paragraphStyle}>
                    The site should say what MoneyKai does plainly: it organizes user-provided records into private reports. It should not imply unsupported bank access, SMS production capture, or professional financial advice.
                  </p>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {['Reviewable drafts before report updates', 'Plain summaries instead of advice claims', 'Support and legal pages linked from every public page', 'Reduced motion and accessible contrast by default'].map((item) => (
                    <div key={item} style={{ alignItems: 'center', background: 'rgba(8, 24, 19, 0.66)', border: `1px solid ${palette.border}`, borderRadius: 8, display: 'flex', gap: 12, padding: 14 }}>
                      <span aria-hidden="true" style={{ background: palette.green, borderRadius: 999, height: 9, width: 9 }} />
                      <span style={{ color: palette.text, fontSize: 15, fontWeight: 700 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section compact={isCompact} labelledBy="compare-title">
              <div style={{ display: 'grid', gap: 24 }}>
                <div style={{ display: 'grid', gap: 14, maxWidth: 760 }}>
                  <span style={badgeStyle}>Comparison</span>
                  <h2 id="compare-title" style={sectionTitleStyle(isCompact)}>
                    Better than scattered tracking.
                  </h2>
                </div>
                <div style={{ ...cardStyle, overflow: 'hidden' }}>
                  {comparisonRows.map(([tool, before, after], index) => (
                    <div
                      key={tool}
                      style={{
                        borderTop: index === 0 ? 0 : `1px solid ${palette.border}`,
                        display: 'grid',
                        gap: 14,
                        gridTemplateColumns: isWide ? '0.5fr 1fr 1fr' : '1fr',
                        padding: 18,
                      }}
                    >
                      <strong style={{ color: palette.text, fontSize: 16 }}>{tool}</strong>
                      <p style={{ ...paragraphStyle, fontSize: 14, lineHeight: '23px' }}>{before}</p>
                      <p style={{ ...paragraphStyle, color: palette.text, fontSize: 14, lineHeight: '23px' }}>{after}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section id="pricing" compact={isCompact} labelledBy="pricing-title">
              <div style={{ display: 'grid', gap: 24, gridTemplateColumns: isWide ? '0.9fr 1.1fr' : '1fr' }}>
                <div style={{ display: 'grid', gap: 14 }}>
                  <span style={badgeStyle}>Pricing</span>
                  <h2 id="pricing-title" style={sectionTitleStyle(isCompact)}>
                    Start simple. Upgrade when review becomes routine.
                  </h2>
                  <p style={paragraphStyle}>
                    The landing page keeps pricing visible without forcing a hard sell. The detailed pricing page can carry plan limits and checkout details.
                  </p>
                </div>
                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
                  {[
                    ['Starter', 'For personal tracking and light monthly review.', 'Create account'],
                    ['Kai Plus', 'For deeper reports, shared spends, and advanced review habits.', 'View pricing'],
                  ].map(([plan, body, cta], index) => (
                    <article key={plan} style={{ ...cardStyle, background: index === 1 ? `linear-gradient(180deg, rgba(125, 211, 199, 0.18), rgba(9, 24, 19, 0.98))` : cardStyle.background, padding: 22 }}>
                      <h3 style={{ color: palette.text, fontSize: 24, lineHeight: '30px', margin: 0 }}>{plan}</h3>
                      <p style={{ ...paragraphStyle, marginTop: 10 }}>{body}</p>
                      <div style={{ marginTop: 22 }}>
                        <LinkButton href={index === 0 ? '/signup' : '/pricing'} primary={index === 0}>
                          {cta}
                        </LinkButton>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </Section>

            <Section id="faq" compact={isCompact} labelledBy="faq-title">
              <div style={{ display: 'grid', gap: 24 }}>
                <div style={{ display: 'grid', gap: 14, maxWidth: 760 }}>
                  <span style={badgeStyle}>FAQ</span>
                  <h2 id="faq-title" style={sectionTitleStyle(isCompact)}>
                    Honest answers for a finance landing page.
                  </h2>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {faqs.map((item) => (
                    <details key={item.question} style={{ ...cardStyle, padding: 18 }}>
                      <summary style={{ color: palette.text, cursor: 'pointer', fontSize: 17, fontWeight: 800, lineHeight: '24px' }}>{item.question}</summary>
                      <p style={{ ...paragraphStyle, marginTop: 12 }}>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </Section>

            <section
              aria-labelledby="final-cta-title"
              style={{
                background: '#07130F',
                padding: isCompact ? '54px 18px 72px' : '84px 24px 104px',
              }}
            >
              <div
                style={{
                  margin: '0 auto',
                  maxWidth: 1180,
                }}
              >
                <div
                  style={{
                    ...cardStyle,
                    alignItems: 'center',
                    background: `linear-gradient(135deg, ${palette.greenSoft}, ${palette.redSoft}), ${palette.surfaceHigh}`,
                    display: 'grid',
                    gap: 22,
                    justifyItems: 'center',
                    padding: isCompact ? 24 : 42,
                    textAlign: 'center',
                  }}
                >
                  <h2 id="final-cta-title" style={{ ...sectionTitleStyle(isCompact), maxWidth: 820 }}>
                    Build a calmer money review habit today.
                  </h2>
                  <p style={{ ...paragraphStyle, maxWidth: 700 }}>
                    Create a MoneyKai account, review your own records, and turn everyday money activity into reports you can actually understand.
                  </p>
                  <LinkButton href="/signup" primary>
                    Create secure account
                  </LinkButton>
                </div>
              </div>
            </section>
          </>
        </main>

        <footer style={{ background: '#06110E', borderTop: `1px solid ${palette.border}`, padding: isCompact ? '28px 18px' : '32px 24px' }}>
          <div
            style={{
              alignItems: isWide ? 'center' : 'start',
              display: 'grid',
              gap: 18,
              gridTemplateColumns: isWide ? '1fr auto' : '1fr',
              margin: '0 auto',
              maxWidth: 1180,
            }}
          >
            <p style={{ ...paragraphStyle, fontSize: 14 }}>
              MoneyKai organizes user-provided records into private finance reports. It does not provide investment, tax, legal, or financial advice.
            </p>
            <nav aria-label="Footer" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {[
                ['/privacy-policy', 'Privacy'],
                ['/security', 'Security'],
                ['/terms', 'Terms'],
                ['/contact', 'Contact'],
              ].map(([href, label]) => (
                <a key={href} href={href} style={{ color: palette.muted, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
