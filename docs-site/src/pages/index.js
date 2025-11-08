import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Production-ready observability for Node.js. Zero npm-dependency middleware that prevents Express servers from crashing and provides built-in monitoring.">
      <main>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>⚡ Crashless</h1>
          <p className={styles.heroSubtitle}>Production-ready observability for Node.js</p>
          <p className={styles.heroDescription}>
            Zero npm-dependency middleware that prevents Express servers from crashing 
            and provides built-in monitoring — all from a single line of code.
          </p>
          <div className={styles.buttons}>
            <Link
              className="button button--primary button--lg"
              to="/docs/getting-started">
              Get Started
            </Link>
            <Link
              className="button button--secondary button--lg"
              to="/docs">
              Documentation
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}

