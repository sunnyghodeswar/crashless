// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Crashless',
  tagline: 'Production-ready observability for Node.js',
  favicon: 'img/favicon.svg',

  // Set the production url of your site here
  url: 'https://sunnyghodeswar.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages, it's often '/<projectName>/'
  baseUrl: '/crashless/',

  // GitHub pages deployment config.
  organizationName: 'sunnyghodeswar',
  projectName: 'crashless',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/sunnyghodeswar/crashless/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/crashless-social-card.jpg',
      navbar: {
        title: 'Crashless',
        logo: {
          alt: 'Crashless Logo',
          src: 'img/logo.png',
          srcDark: 'img/logo-dark.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://github.com/sunnyghodeswar/crashless',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://www.npmjs.com/package/crashless',
            label: 'npm',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/getting-started',
              },
              {
                label: 'API Reference',
                to: '/docs/api-reference',
              },
              {
                label: 'Configuration',
                to: '/docs/configuration',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/sunnyghodeswar/crashless',
              },
              {
                label: 'npm',
                href: 'https://www.npmjs.com/package/crashless',
              },
              {
                label: 'Issues',
                href: 'https://github.com/sunnyghodeswar/crashless/issues',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Examples',
                to: '/docs/examples',
              },
              {
                label: 'Performance',
                to: '/docs/performance',
              },
              {
                label: 'Blog',
                href: 'https://github.com/sunnyghodeswar/crashless',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Crashless. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;

