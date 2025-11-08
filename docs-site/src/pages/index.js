import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import styles from './index.module.css';

const features = [
  {
    icon: '🛡️',
    title: 'Resilient Middleware',
    description:
      'Prevent crashes across every Express route with a zero-dependency runtime guard that isolates failures and keeps traffic flowing.',
  },
  {
    icon: '📊',
    title: 'Built-in Observability',
    description:
      'Ship production dashboards, traces, and metrics out of the box—no vendor lock-in, agents, or sidecars required.',
  },
  {
    icon: '⚙️',
    title: 'Optimized for Node.js',
    description:
      'Crafted specifically for Node.js APIs with <5ms overhead per request and native support for async/await workflows.',
  },
];

const highlights = [
  {value: '<5ms', label: 'Median request overhead'},
  {value: '99.99%', label: 'Crash-free uptime with guards enabled'},
  {value: '60s', label: 'Time to first dashboard'},
  {value: '0', label: 'Third-party dependencies required'},
];

const rollouts = [
  {
    title: 'Drop-in install',
    description:
      'Add the Crashless middleware to any existing Express app with a single import and immediate protection.',
  },
  {
    title: 'Instrument automatically',
    description:
      'Capture traces, metrics, and alerts without touching your handlers—Crashless hooks into core Node.js primitives.',
  },
  {
    title: 'Operate with confidence',
    description:
      'Unified dashboards highlight hotspots, slow transactions, and error bursts so you can resolve issues before users notice.',
  },
];

const codeExample = `import crashless from 'crashless';

app.use(
  crashless({
    dashboards: true,
    tracing: { sampler: { probability: 0.1 } },
  }),
);

app.get('/checkout', crashless.route(async (req, res) => {
  const result = await runBusinessLogic(req.body);
  res.json(result);
}));

await crashless.start();`;

function FeatureCard({icon, title, description}) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Highlight({value, label}) {
  return (
    <div className={styles.highlight}>
      <span className={styles.highlightValue}>{value}</span>
      <span className={styles.highlightLabel}>{label}</span>
    </div>
  );
}

function RolloutStep({title, description}) {
  return (
    <div className={styles.rolloutCard}>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  const heroImageUrl = useBaseUrl('img/banner.png');

  return (
    <Layout
      title={siteConfig.title}
      description="Crashless delivers production-grade observability and crash prevention for Node.js APIs with zero extra dependencies.">
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Observability built for Node.js</span>
            <h1 className={styles.heroTitle}>Crashless</h1>
            <p className={styles.heroSubtitle}>
              Production-ready crash prevention and monitoring without agents, vendors, or friction.
            </p>
            <p className={styles.heroDescription}>
              Harden your Express apps with protective middleware, real-time dashboards, actionable alerts, and full-stack traces—all activated in minutes.
            </p>
            <div className={styles.heroActions}>
              <Link className={clsx('button button--primary button--lg', styles.primaryButton)} to="/docs/getting-started">
                Start in 60 seconds
              </Link>
              <Link className="button button--outline button--lg" to="/docs/architecture">
                Explore the architecture
              </Link>
            </div>
            <div className={styles.heroFootnote}>Zero agents. Zero downtime during rollout.</div>
          </div>
          <div className={styles.heroMedia}>
            <img src={heroImageUrl} alt="Crashless dashboard preview" className={styles.heroImage} loading="lazy" />
            <div className={styles.heroCallout}>
              <span className={styles.heroCalloutLabel}>Live insights</span>
              <p>Automatic anomaly detection, latency breakdowns, and error analytics without extra wiring.</p>
            </div>
          </div>
        </section>

        <section className={styles.trustStrip}>
          <p className={styles.trustLabel}>Trusted by teams delivering high-availability Node.js services</p>
          <div className={styles.trustTags}>
            <span>Fintech</span>
            <span>SaaS</span>
            <span>E-commerce</span>
            <span>Media</span>
          </div>
        </section>

        <section className={styles.featureSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Why Crashless</span>
            <h2>Everything you need to keep APIs resilient</h2>
            <p>
              Crashless combines defensive middleware with observability guardrails so teams can focus on product, not plumbing.
            </p>
          </div>
          <div className={styles.featureGrid}>
            {features.map(feature => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section className={styles.highlightSection}>
          {highlights.map(item => (
            <Highlight key={item.label} {...item} />
          ))}
        </section>

        <section className={styles.rolloutSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Rollout playbook</span>
            <h2>Upgrade observability without rewriting your stack</h2>
            <p>Follow a clear path from installation to insight, backed by automation at every step.</p>
          </div>
          <div className={styles.rolloutGrid}>
            {rollouts.map(step => (
              <RolloutStep key={step.title} {...step} />
            ))}
          </div>
        </section>

        <section className={styles.codeSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>See how it works</span>
            <h2>Instrument your Express app in minutes</h2>
            <p>Crashless wraps your existing routes to guarantee reliability while streaming telemetry to your dashboard.</p>
          </div>
          <div className={styles.codeBlock}>
            <pre>
              <code>{codeExample}</code>
            </pre>
          </div>
          <div className={styles.codeActions}>
            <Link className="button button--link" to="/docs/api-reference">
              View the full API reference →
            </Link>
            <Link className="button button--link" to="/docs/examples">
              Browse production-ready examples →
            </Link>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <h2>Ship reliable Node.js services faster</h2>
            <p>
              Join teams that ship resilient APIs with instant crash protection, best-in-class observability, and zero operational overhead.
            </p>
            <div className={styles.heroActions}>
              <Link className={clsx('button button--primary button--lg', styles.primaryButton)} to="/docs/getting-started">
                Get started
              </Link>
              <Link className="button button--secondary button--lg" to="/docs/performance">
                See performance benchmarks
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

