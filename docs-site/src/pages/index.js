import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useColorMode} from '@docusaurus/theme-common';
import clsx from 'clsx';
import styles from './index.module.css';

const pillars = [
  {
    icon: '🛡️',
    title: 'Crash guard for every handler',
    description:
      'Automatically wraps Express routes so unhandled sync or async errors resolve to consistent JSON responses instead of crashing the process.',
  },
  {
    icon: '📈',
    title: 'Dashboards without agents',
    description:
      'Ship the built-in Crashless UI at `/_crashless` for live throughput, percentile latency, and error analytics—no vendor lock-in or sidecars.',
  },
  {
    icon: '🧭',
    title: 'Trace-first instrumentation',
    description:
      'AsyncLocalStorage-powered tracing, fetch/fs auto-patching, and OTLP exports come ready to toggle on when you want deep visibility.',
  },
  {
    icon: '🔐',
    title: 'Production-safe by default',
    description:
      'Mask sensitive payloads, gate dashboards with token or IP checks, and stream metrics securely with zero runtime npm dependencies.',
  },
];

const highlights = [
  {value: '1', label: 'line to enable crash prevention'},
  {value: '+2.3%', label: 'overhead in minimal guard mode'},
  {value: '60s', label: 'to first dashboard at /_crashless'},
  {value: '0', label: 'runtime npm dependencies'},
];

const playbook = [
  {
    title: 'Drop the middleware in',
    description:
      'Add crashless() to your Express app and keep every existing handler—async patching and error normalization happen automatically.',
  },
  {
    title: 'Open the live console',
    description:
      'Visit the built-in dashboard for request metrics, latency percentiles, and crash analytics powered by the in-memory registry.',
  },
  {
    title: 'Tune telemetry intentionally',
    description:
      'Follow the docs to flip between minimal guards, built-in metrics, or trace sampling depending on the environment you’re deploying.',
  },
  {
    title: 'Export when you need to share',
    description:
      'Expose Prometheus and OTLP endpoints out-of-the-box so Grafana, Datadog, or OpenTelemetry collectors can ingest your data.',
  },
];

const docsSpotlight = [
  {
    title: 'Getting Started',
    description: 'Install in one minute, protect routes instantly, and access the dashboard locally.',
    to: '/docs/getting-started',
    badge: 'Start here',
  },
  {
    title: 'Configuration',
    description: 'Dial in telemetry engines, security, sampling, and dashboard access for every stage.',
    to: '/docs/configuration',
    badge: 'Tweak settings',
  },
  {
    title: 'Architecture',
    description: 'Learn how zero-dependency middleware, AsyncLocalStorage, and the metrics registry work together.',
    to: '/docs/architecture',
    badge: 'Under the hood',
  },
  {
    title: 'Examples',
    description: 'Copy production-ready patterns for exporters, dashboards, tracing, and rollout strategies.',
    to: '/docs/examples',
    badge: 'Copy & paste',
  },
];

const codeExample = `import express from 'express';
import crashless from 'crashless';

const app = express();

app.use(
  crashless({
    appName: 'Checkout API',
    telemetry: {
      engine: 'builtin',
      dashboard: true,
      traces: { enabled: true, samplingRate: 0.2 },
    },
    enableDashboard: true,
    dashboardAuth: req => req.ip === '127.0.0.1',
  }),
);

app.get('/checkout', async (req, res) => {
  const order = await placeOrder(req.body);

  if (!order.ok) {
    throw crashless.createError('Payment declined', 402, 'ERR_PAYMENT');
  }

  res.json(order.data);
});

app.listen(3000);`;

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

function DocCard({title, description, to, badge}) {
  return (
    <Link to={to} className={styles.docsCard}>
      <span className={styles.docsBadge}>{badge}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className={styles.docsArrow}>Read the guide →</span>
    </Link>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  const heroImageUrl = useBaseUrl('img/banner.png');
  const {colorMode} = useColorMode();
  const stackblitzTheme = colorMode === 'dark' ? 'dark' : 'light';
  const stackblitzUrl =
    'https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-one-liner.js&embed=1&hideExplorer=1&hideNavigation=1&view=preview';
  const stackblitzSrc = `${stackblitzUrl}&theme=${stackblitzTheme}`;

  return (
    <Layout
      title={siteConfig.title}
      description="Crashless delivers crash prevention, distributed tracing, and live dashboards for Node.js APIs without adding dependencies.">
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Zero-dependency observability</span>
            <h1 className={styles.heroTitle}>Crashless keeps your Node.js APIs online</h1>
            <p className={styles.heroSubtitle}>Stop production crashes from stray async errors and unlock dashboards in seconds.</p>
            <p className={styles.heroDescription}>
              Wrap Express once to enforce consistent error handling, stream rich telemetry, and export traces—all while staying in
              control of overhead.
            </p>
            <div className={styles.heroActions}>
              <Link className={clsx('button button--primary button--lg', styles.primaryButton)} to="/docs/getting-started">
                Install in one minute
              </Link>
              <Link className="button button--outline button--lg" to="/docs/architecture">
                Explore the architecture
              </Link>
            </div>
            <div className={styles.heroFootnote}>MIT licensed • Works with Express 4 & 5 • Node.js 18+</div>
          </div>
          <div className={styles.heroMedia}>
            <img src={heroImageUrl} alt="Crashless dashboard preview" className={styles.heroImage} loading="lazy" />
            <div className={styles.heroCallout}>
              <span className={styles.heroCalloutLabel}>Telemetry included</span>
              <p>Percentile latency, crash analytics, Prometheus exports, and AsyncLocalStorage traces with zero extra services.</p>
            </div>
          </div>
        </section>

        <section className={styles.trustStrip}>
          <p className={styles.trustLabel}>Everything teams need in one guardrail-first package</p>
          <div className={styles.trustTags}>
            <span>Async error shields</span>
            <span>Built-in dashboards</span>
            <span>Prometheus & OTLP</span>
            <span>Token/IP gating</span>
          </div>
        </section>

        <section className={styles.featureSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Why Crashless</span>
            <h2>All-in-one resilience for Node.js APIs</h2>
            <p>Crashless merges crash prevention, observability, and secure operations into a single install so you can focus on shipping product.</p>
          </div>
          <div className={styles.featureGrid}>
            {pillars.map(feature => (
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
            <h2>Go from install to insight without rewrites</h2>
            <p>Follow the adoption path outlined in the docs: start with guards, then layer in dashboards, metrics, and traces as you need them.</p>
          </div>
          <div className={styles.rolloutGrid}>
            {playbook.map(step => (
              <RolloutStep key={step.title} {...step} />
            ))}
          </div>
        </section>

        <section className={styles.docsSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Docs that go deep</span>
            <h2>Everything documented, from hello world to internals</h2>
            <p>Dive into the guides to configure telemetry, understand the architecture, and copy production-ready patterns straight into your app.</p>
          </div>
          <div className={styles.docsGrid}>
            {docsSpotlight.map(doc => (
              <DocCard key={doc.title} {...doc} />
            ))}
          </div>
        </section>

        <section className={styles.playgroundSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Try it live</span>
            <h2>Experiment with Crashless in your browser</h2>
            <p>Spin up the StackBlitz demo to explore middleware guards, dashboards, and tracing without leaving the docs.</p>
          </div>
          <div className={styles.playgroundFrameWrapper}>
            <iframe
              src={stackblitzSrc}
              title="Crashless StackBlitz Demo"
              loading="lazy"
              allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
              allowFullScreen
            />
          </div>
          <div className={styles.playgroundFooter}>
            <span>Prefer a full tab?</span>
            <Link to={stackblitzUrl} className="button button--link">
              Open StackBlitz demo →
            </Link>
          </div>
        </section>

        <section className={styles.codeSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>See how it works</span>
            <h2>Protect handlers and surface telemetry with one import</h2>
            <p>Crashless instruments Express while letting you choose how much observability to enable for each environment.</p>
          </div>
          <div className={styles.codeBlock}>
            <pre>
              <code>{codeExample}</code>
            </pre>
          </div>
          <div className={styles.codeActions}>
            <Link className="button button--link" to="/docs/configuration">
              Review configuration options →
            </Link>
            <Link className="button button--link" to="/docs/examples">
              Browse production-ready examples →
            </Link>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <h2>Ship resilient Node.js services without the overhead</h2>
            <p>Deploy Crashless to stay crash-free, watch live metrics, and export telemetry to your existing observability stack whenever you need it.</p>
            <div className={styles.heroActions}>
              <Link className={clsx('button button--primary button--lg', styles.primaryButton)} to="/docs/getting-started">
                Start in 60 seconds
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

