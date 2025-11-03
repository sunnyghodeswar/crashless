/**
 * Dashboard HTML Template - Redesigned Architecture
 * Three dashboards in one unified view with header bar controls
 */

export function getDashboardTemplate(view, systemUrl, crashesUrl, performanceUrl, appName) {
  const defaultView = view || 'system';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Crashless ⚡ | ${appName || 'Observability Hub'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class'
    }
  </script>
  <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
  <style>
    [x-cloak] { display: none !important; }
    .chart-container { width: 100%; height: 320px; min-height: 320px; }
    .chart-container-md { width: 100%; height: 280px; min-height: 280px; }
    .chart-container-sm { width: 100%; height: 240px; min-height: 240px; }
    .transition-all { transition: all 0.3s ease; }
    .waterfall-span { 
      padding: 8px 12px; 
      margin: 2px 0; 
      border-left: 3px solid; 
      font-family: 'Monaco', 'Menlo', monospace; 
      font-size: 12px;
    }
  </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 transition-colors duration-300" x-data="dashboard('${defaultView}')" x-init="init()" x-cloak>
  
  <!-- 🔹 HEADER BAR -->
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <!-- Title Row -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Crashless ⚡</span>
            <span class="text-lg font-normal text-gray-500 dark:text-gray-400">| ${appName || 'Observability Hub'}</span>
          </h1>
        </div>
        
        <!-- Controls Row -->
        <div class="flex items-center gap-3">
          <!-- Theme Toggle -->
          <button 
            @click="toggleTheme()" 
            class="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm"
            title="Toggle theme"
          >
            <span x-show="!darkMode">☀️ Light</span>
            <span x-show="darkMode">🌙 Dark</span>
          </button>
          
          <!-- Auto Refresh Toggle -->
          <button 
            @click="toggleAutoRefresh()" 
            class="px-3 py-2 rounded-lg transition-all text-sm"
            :class="autoRefresh ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
            title="Toggle auto-refresh"
          >
            <span x-show="autoRefresh">🔄 Auto Refresh</span>
            <span x-show="!autoRefresh">⏸ Paused</span>
          </button>
          
          <!-- Refresh Interval Selector -->
          <select 
            x-model="refreshInterval" 
            @change="updateRefreshInterval()"
            class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            :disabled="!autoRefresh"
          >
            <option value="5">Every 5s</option>
            <option value="10" selected>Every 10s</option>
            <option value="30">Every 30s</option>
            <option value="60">Every 60s</option>
          </select>
          
          <!-- Manual Refresh -->
          <button 
            @click="refresh()" 
            class="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm flex items-center gap-2"
            title="Refresh now"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>
      
      <!-- Dashboard Switcher Buttons -->
      <div class="flex gap-2">
        <button 
          @click="switchDashboard('system')"
          class="px-4 py-2 rounded-lg font-medium transition-all text-sm"
          :class="currentView === 'system' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >
          🧊 System
        </button>
        <button 
          @click="switchDashboard('errors')"
          class="px-4 py-2 rounded-lg font-medium transition-all text-sm"
          :class="currentView === 'errors' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >
          💥 Errors
        </button>
        <button 
          @click="switchDashboard('traces')"
          class="px-4 py-2 rounded-lg font-medium transition-all text-sm"
          :class="currentView === 'traces' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >
          🔍 Traces
        </button>
      </div>
    </div>
  </div>

  <!-- ▼ ▼ ▼ Dynamic View Area ▼ ▼ ▼ -->
  <div class="max-w-7xl mx-auto px-6 py-6">
    
    <!-- 🧊 SYSTEM DASHBOARD -->
    <div x-show="currentView === 'system'" class="space-y-6">
      <!-- High-level Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Requests</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white" x-text="stats.totalRequests.toLocaleString()"></div>
          <div class="text-xs mt-1" :class="deltas.requests >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            <span x-text="(deltas.requests >= 0 ? '↑ ' : '↓ ') + Math.abs(deltas.requests)"></span>/min
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Errors</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white" x-text="stats.totalErrors.toLocaleString()"></div>
          <div class="text-xs mt-1" :class="deltas.errors > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-500'">
            Rate: <span x-text="stats.errorRate"></span>%
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Latency</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white" x-text="stats.avgLatency + ' ms'"></div>
          <div class="text-xs mt-1" :class="insights.latencyTrend === 'up' ? 'text-red-600 dark:text-red-400' : insights.latencyTrend === 'down' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-500'">
            <span x-show="insights.latencyTrend === 'up'">↑</span>
            <span x-show="insights.latencyTrend === 'down'">↓</span>
            <span x-show="insights.latencyTrend === 'stable'">→</span>
            <span x-text="Math.abs(insights.latencyChange) + '%'"></span>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Uptime</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white" x-text="stats.uptime"></div>
          <div class="text-xs text-gray-500 dark:text-gray-500 mt-1" x-text="'Last updated: ' + lastUpdated"></div>
        </div>
      </div>

      <!-- Performance Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Throughput</h2>
          <div id="trendChart" class="chart-container"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Error Rate Timeline</h2>
          <div id="errorRateChart" class="chart-container"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latency Over Time</h2>
          <div id="latencyTimeChart" class="chart-container"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latency Percentiles by Route</h2>
          <div id="latencyPerRouteChart" class="chart-container"></div>
        </div>
      </div>

      <!-- Route Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Route Performance</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">p50/p95/p99 Latencies, Status Codes, Requests</p>
            </div>
            <div class="flex items-center gap-3">
              <select x-model="routeStatusFilter" class="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="all">All Status</option>
                <option value="2xx">2xx Only</option>
                <option value="4xx">4xx Only</option>
                <option value="5xx">5xx Only</option>
              </select>
              <input 
                x-model="routeSearch" 
                type="search" 
                placeholder="Search routes..." 
                class="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Route</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Requests</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">p50</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">p95</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">p99</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status Codes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <template x-for="route in filteredRoutes.slice(0, 50)" :key="route.key">
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white" x-text="route.key"></td>
                  <td class="px-6 py-4 text-sm text-gray-900 dark:text-white" x-text="route.total.toLocaleString()"></td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" x-text="(route.p50 || 0) + ' ms'"></td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" x-text="route.p95 || '—'"></td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" x-text="(route.p99 || 0) + ' ms'"></td>
                  <td class="px-6 py-4 text-sm">
                    <div class="flex flex-wrap gap-1">
                      <template x-for="[status, count] in Object.entries(route.statusCounts || {})" :key="status">
                        <span 
                          class="px-2 py-1 rounded text-xs"
                          :class="parseInt(status) < 400 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : parseInt(status) < 500 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'"
                          x-text="status + ': ' + count"
                        ></span>
                      </template>
                    </div>
                  </td>
                </tr>
              </template>
              <tr x-show="filteredRoutes.length === 0">
                <td colspan="6" class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No routes found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- System & Process Stats -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">System & Process Stats</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">CPU Usage</div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white">—</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Heap Used</div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white">—</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Event Loop Lag</div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white">—</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Open Handles</div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white">—</div>
          </div>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-4">System metrics coming soon</p>
      </div>
    </div>

    <!-- 💥 ERRORS & CRASHES DASHBOARD -->
    <div x-show="currentView === 'errors'" class="space-y-6">
      <!-- Error Summary -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Errors</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white" x-text="stats.totalErrors.toLocaleString()"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">4xx Errors</div>
          <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400" x-text="errorStats.clientErrors"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">5xx Errors</div>
          <div class="text-2xl font-bold text-red-600 dark:text-red-400" x-text="errorStats.serverErrors"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Error Rate</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white" x-text="stats.errorRate + '%'"></div>
        </div>
      </div>

      <!-- Timeline & Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Error Frequency Timeline</h2>
          <div id="errorTimelineChart" class="chart-container"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Error Breakdown</h2>
          <div id="errorFrequencyChart" class="chart-container"></div>
        </div>
      </div>

      <!-- Top Failing Routes -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Failing Routes</h2>
        <div id="failingRoutesChart" class="chart-container-md"></div>
      </div>

      <!-- Live Stream: Stack traces & recent exceptions -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Live Error Stream</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Stack traces & recent exceptions</p>
            </div>
            <div class="flex items-center gap-3">
              <select x-model="errorFilter" class="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="all">All Errors</option>
                <option value="5xx">5xx Only</option>
                <option value="4xx">4xx Only</option>
              </select>
              <select x-model="errorTypeFilter" class="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="all">All Types</option>
                <template x-for="code in uniqueErrorCodes" :key="code">
                  <option :value="code" x-text="code"></option>
                </template>
              </select>
              <input 
                x-model="errorSearch" 
                type="search" 
                placeholder="Search errors..." 
                class="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
        <div class="p-6 max-h-96 overflow-y-auto">
          <div class="space-y-3">
            <template x-for="(error, idx) in filteredErrors.slice(0, 20)" :key="error.id">
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer" @click="toggleErrorDetail(idx)">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span 
                        class="px-2 py-1 rounded text-xs font-semibold"
                        :class="error.status >= 500 ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'"
                        x-text="error.status"
                      ></span>
                      <span class="text-xs text-gray-500 dark:text-gray-400" x-text="error.method + ' ' + error.path"></span>
                      <span class="text-xs text-gray-400 dark:text-gray-500" x-text="error.time"></span>
                    </div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white" x-text="error.code || 'UNKNOWN'"></div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-1" x-text="error.message"></div>
                  </div>
                </div>
                <div x-show="isErrorExpanded(idx)" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div class="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all" x-text="error.stack || 'No stack trace available'"></div>
                </div>
              </div>
            </template>
            <div x-show="filteredErrors.length === 0" class="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
              No errors found
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔍 TRACES DASHBOARD -->
    <div x-show="currentView === 'traces'" class="space-y-6">
      <!-- Trace List -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Traces</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Trace IDs, routes, and durations</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Trace ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Route</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Duration</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Spans</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <template x-for="(trace, idx) in traces" :key="trace.traceId">
                <tr 
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all"
                  @click="selectTrace(idx)"
                  :class="selectedTraceIdx === idx ? 'bg-blue-50 dark:bg-blue-900' : ''"
                >
                  <td class="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white" x-text="trace.traceId.substring(0, 16) + '...'"></td>
                  <td class="px-6 py-4 text-sm text-gray-900 dark:text-white" x-text="getTraceRoute(trace)"></td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" x-text="trace.duration + ' ms'"></td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" x-text="trace.spans.length"></td>
                  <td class="px-6 py-4 text-sm">
                    <span 
                      class="px-2 py-1 rounded text-xs"
                      :class="hasTraceError(trace) ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'"
                      x-text="hasTraceError(trace) ? 'Error' : 'OK'"
                    ></span>
                  </td>
                </tr>
              </template>
              <tr x-show="traces.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No traces available. Make some requests to see traces.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Waterfall View -->
      <div x-show="selectedTrace" class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Waterfall View</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Hierarchical span breakdown: Spans, DB calls, fetches, errors</p>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400" x-text="'Total Duration: ' + (selectedTrace?.duration || 0) + ' ms'"></div>
          </div>
        </div>
        <div class="p-6">
          <div class="space-y-1">
            <template x-if="selectedTrace && selectedTrace.spans && selectedTrace.spans.length > 0">
              <template x-for="span in buildSpanTree(selectedTrace.spans)" :key="span.spanId">
                <div 
                  class="waterfall-span bg-gray-50 dark:bg-gray-700 rounded mb-1" 
                  :style="'margin-left: ' + (span.depth * 24) + 'px; border-left-color: ' + (span.status === 'error' ? '#EF4444' : span.kind === 'client' ? '#3B82F6' : span.kind === 'internal' ? '#10B981' : '#6B7280') + '; border-left-width: 3px'"
                  @click="selectSpan(span)">
                  <div class="flex items-center justify-between py-2 px-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-gray-900 dark:text-white text-sm" x-text="span.name"></span>
                        <span 
                          class="px-2 py-0.5 rounded text-xs"
                          :class="span.kind === 'client' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : span.kind === 'internal' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'"
                          x-text="span.kind"
                        ></span>
                        <span 
                          x-show="span.status === 'error'"
                          class="px-2 py-0.5 rounded text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                        >
                          ERROR
                        </span>
                      </div>
                      <div class="text-xs text-gray-600 dark:text-gray-400 mt-1" x-show="span.attributes">
                        <template x-for="[key, value] in Object.entries(span.attributes).slice(0, 3)" :key="key">
                          <span class="mr-3">
                            <span class="text-gray-500 dark:text-gray-500" x-text="key + ':'"></span>
                            <span class="ml-1" x-text="String(value).substring(0, 30)"></span>
                          </span>
                        </template>
                      </div>
                      <!-- Show events as sub-items -->
                      <div x-show="span.events && span.events.length > 0" class="mt-2 space-y-0.5 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                        <template x-for="event in (span.events || [])" :key="event.name">
                          <div class="text-xs text-gray-500 dark:text-gray-400 py-0.5" x-text="'→ ' + event.name + (event.attributes && event.attributes.length > 0 ? ' (' + event.attributes.find(a => a.key === 'duration_ms')?.value?.doubleValue + ' ms)' : '')"></div>
                        </template>
                      </div>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 ml-4 font-mono" x-text="span.duration + ' ms'"></div>
                  </div>
                </div>
              </template>
            </template>
            <div x-show="!selectedTrace || !selectedTrace.spans || selectedTrace.spans.length === 0" class="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
              Select a trace to view waterfall
            </div>
          </div>
        </div>
      </div>

      <!-- Attribute Inspector -->
      <div x-show="selectedSpan" class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Attribute Inspector</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Metadata, HTTP details</p>
        </div>
        <div class="p-6">
          <div class="space-y-3">
            <template x-for="[key, value] in Object.entries(selectedSpan?.attributes || {})" :key="key">
              <div class="flex items-start gap-3">
                <span class="text-xs font-semibold text-gray-600 dark:text-gray-400 w-32" x-text="key + ':'"></span>
                <span class="text-xs text-gray-900 dark:text-white break-all" x-text="typeof value === 'object' ? JSON.stringify(value) : value"></span>
              </div>
            </template>
            <div x-show="!selectedSpan || !selectedSpan.attributes || Object.keys(selectedSpan.attributes).length === 0" class="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
              Select a span to view attributes
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <script>
    // Dashboard component will be inserted here
  </script>
</body>
</html>`;

}
