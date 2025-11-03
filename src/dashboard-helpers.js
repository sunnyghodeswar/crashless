/**
 * Dashboard Helper Functions
 * Utility functions for dashboard path parsing and view determination
 */

// Helper to get dashboard view type from URL
export function getDashboardView(path) {
  if (path.includes('/system') || path.endsWith('/system')) return 'system';
  if (path.includes('/crashes') || path.includes('/errors')) return 'crashes';
  if (path.includes('/performance') || path.endsWith('/performance')) return 'performance';
  return 'system'; // Default to system overview
}

// Helper to get base dashboard path (without view suffix)
export function getBaseDashboardPath(path) {
  const parts = path.split('/');
  const dashIdx = parts.findIndex(p => p === 'dashboard' || p === '_crashless' || p.startsWith('_crashless'));
  if (dashIdx >= 0) {
    return '/' + parts.slice(0, dashIdx + 1).filter(Boolean).join('/');
  }
  return path.replace(/\/system$|\/crashes$|\/errors$|\/performance$/, '') || '/_crashless';
}

