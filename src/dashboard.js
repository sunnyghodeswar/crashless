/**
 * Crashless Dashboard - Intelligent Observability Panel
 * Clean, data-rich design with smart insights
 */

import { getDashboardView, getBaseDashboardPath } from './dashboard-helpers.js';
import { getDashboardTemplate } from './dashboard-template.js';
import { getDashboardComponent } from './dashboard-component.js';

// Optimized: Cache compiled HTML per view/path combination
const dashboardCache = new Map();

function getCacheKey(dashboardPath, maskMessages, appName, view) {
  return `${dashboardPath}:${maskMessages}:${appName || ''}:${view}`;
}

export function getDashboardHTML(dashboardPath = '/_crashless', maskMessages = false, appName = null) {
  const view = getDashboardView(dashboardPath);
  const cacheKey = getCacheKey(dashboardPath, maskMessages, appName, view);
  
  // Check cache first
  if (dashboardCache.has(cacheKey)) {
    return dashboardCache.get(cacheKey);
  }
  
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
  
  // Cache the compiled HTML (limit cache size to prevent memory leaks)
  if (dashboardCache.size > 50) {
    // Remove oldest entry (simple FIFO)
    const firstKey = dashboardCache.keys().next().value;
    dashboardCache.delete(firstKey);
  }
  dashboardCache.set(cacheKey, html);
  
  return html;
}
