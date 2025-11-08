import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/crashless/docs',
    component: ComponentCreator('/crashless/docs', '1c6'),
    routes: [
      {
        path: '/crashless/docs',
        component: ComponentCreator('/crashless/docs', '0e1'),
        routes: [
          {
            path: '/crashless/docs',
            component: ComponentCreator('/crashless/docs', 'cd2'),
            routes: [
              {
                path: '/crashless/docs/',
                component: ComponentCreator('/crashless/docs/', 'c56'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/crashless/docs/api-reference',
                component: ComponentCreator('/crashless/docs/api-reference', 'ad6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/crashless/docs/architecture',
                component: ComponentCreator('/crashless/docs/architecture', '91f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/crashless/docs/configuration',
                component: ComponentCreator('/crashless/docs/configuration', '353'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/crashless/docs/examples',
                component: ComponentCreator('/crashless/docs/examples', 'ba9'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/crashless/docs/getting-started',
                component: ComponentCreator('/crashless/docs/getting-started', 'e8d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/crashless/docs/limitations',
                component: ComponentCreator('/crashless/docs/limitations', 'b77'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/crashless/docs/performance',
                component: ComponentCreator('/crashless/docs/performance', '20c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/crashless/docs/security',
                component: ComponentCreator('/crashless/docs/security', '515'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/crashless/',
    component: ComponentCreator('/crashless/', 'fb9'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
