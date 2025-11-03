/**
 * Crashless Dashboard - Intelligent Observability Panel
 * Clean, data-rich design with smart insights
 */

import { getDashboardView, getBaseDashboardPath } from './dashboard-helpers.js';
import { getDashboardTemplate } from './dashboard-template.js';
import { getDashboardComponent } from './dashboard-component.js';

export function getDashboardHTML(dashboardPath = '/_crashless', maskMessages = false, appName = null) {
  const view = getDashboardView(dashboardPath);
  const basePath = getBaseDashboardPath(dashboardPath);
  
  // Build dashboard URLs for navigation
  const systemUrl = basePath === '/_crashless' ? `${basePath}/system` : basePath.replace(/\/$/, '') + '/system';
  const crashesUrl = basePath === '/_crashless' ? `${basePath}/crashes` : basePath.replace(/\/$/, '') + '/crashes';
  const performanceUrl = basePath === '/_crashless' ? `${basePath}/performance` : basePath.replace(/\/$/, '') + '/performance';
  
  // Get template and component code
  const template = getDashboardTemplate(view, systemUrl, crashesUrl, performanceUrl, appName);
  const component = getDashboardComponent(maskMessages);
  
  // Combine template and component
  // Template has a placeholder script tag, so we replace it with the actual component code
  const html = template.replace(/  <script>\n    \/\/ Dashboard component will be inserted here\n  <\/script>\n/, `  <script>\n${component}\n  </script>\n`);
  
  return html;
}
