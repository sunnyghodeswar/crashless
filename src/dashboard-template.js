/**
 * Dashboard HTML Template
 * Contains the HTML structure and markup for the dashboard
 */

export function getDashboardTemplate(view, systemUrl, crashesUrl, performanceUrl, appName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Crashless Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    // Configure Tailwind to use class-based dark mode
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
    .insight-card { border-left: 3px solid; }
  </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 transition-colors duration-300" x-data="dashboard('${view}')" x-init="init()" x-cloak>
  <div class="min-h-screen p-6">
    <!-- Header with Navigation -->
    <div class="mb-6">
      <div class="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          ${appName ? `<div class="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-1">${appName}</div>` : ''}
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            <span x-show="currentView === 'system'">🧊 System Overview</span>
            <span x-show="currentView === 'crashes'">💥 Crashes & Errors</span>
            <span x-show="currentView === 'performance'">⚙️ Performance</span>
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time intelligent observability</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="toggleTheme()" class="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
            <span x-show="!darkMode">🌙 Dark</span>
            <span x-show="darkMode">☀️ Light</span>
          </button>
          <button @click="refresh()" class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all">
            🔄 Refresh
          </button>
        </div>
      </div>
      
      <!-- Dashboard Navigation Buttons -->
      <div class="flex gap-2 mb-4">
        <a href="${systemUrl}" target="_blank" class="px-4 py-2 rounded-lg font-medium transition-all ${view === 'system' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}">
          🧊 System Overview
        </a>
        <a href="${crashesUrl}" target="_blank" class="px-4 py-2 rounded-lg font-medium transition-all ${view === 'crashes' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}">
          💥 Crashes & Errors
        </a>
        <a href="${performanceUrl}" target="_blank" class="px-4 py-2 rounded-lg font-medium transition-all ${view === 'performance' ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}">
          ⚙️ Performance
        </a>
      </div>
    </div>

    <!-- System Overview Dashboard -->
    <div x-show="currentView === 'system'">
      <!-- Hero Metrics for System -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
        <div class="text-xs text-gray-500 dark:text-gray-500 mt-1" x-text="lastUpdated"></div>
      </div>
    </div>

    <!-- Smart Insights -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6" x-show="insights.messages.length > 0">
      <template x-for="insight in insights.messages" :key="insight.message">
        <div class="insight-card bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700" :style="'border-left-color: ' + insight.color">
          <div class="flex items-start gap-3">
            <span class="text-2xl" x-text="insight.icon"></span>
            <div class="flex-1">
              <div class="font-semibold text-sm text-gray-900 dark:text-white" x-text="insight.title"></div>
              <div class="text-xs text-gray-600 dark:text-gray-400 mt-1" x-text="insight.message"></div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Main Charts Row 1 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Throughput & Errors</h2>
        <div id="trendChart" class="chart-container"></div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Error Rate Trend</h2>
        <div id="errorRateChart" class="chart-container"></div>
      </div>
    </div>

    <!-- Main Charts Row 2 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latency Over Time</h2>
        <div id="latencyTimeChart" class="chart-container"></div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Error Frequency Timeline</h2>
        <div id="errorTimelineChart" class="chart-container"></div>
      </div>
    </div>

    <!-- Charts Row 3 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Error Breakdown</h2>
        <div id="errorBreakdownChart" class="chart-container-md"></div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Response Code Distribution</h2>
        <div id="statusPieChart" class="chart-container-md"></div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Traffic Heatmap</h2>
        <div id="trafficHeatmapChart" class="chart-container-md"></div>
      </div>
    </div>

    <!-- Interactive Latency Per Route -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 border border-gray-200 dark:border-gray-700">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Latency Distribution by Route</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Interactive view showing p50, p95, p99 latencies per endpoint</p>
      </div>
      <div class="p-6">
        <div id="latencyPerRouteChart" class="chart-container"></div>
      </div>
    </div>

    <!-- Routes Performance -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 border border-gray-200 dark:border-gray-700">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Route Performance</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Key metrics per endpoint</p>
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Errors</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">p95 Latency</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <template x-for="route in filteredRoutes" :key="route.key">
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td class="px-6 py-4 text-sm font-mono text-gray-900 dark:text-gray-100" x-text="route.key"></td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" x-text="route.total"></td>
                <td class="px-6 py-4 text-sm font-semibold" :class="route.errors > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'" x-text="route.errors"></td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" x-text="route.p95"></td>
                <td class="px-6 py-4 text-sm">
                  <div class="flex flex-wrap gap-1">
                    <template x-for="[status, count] in Object.entries(route.statusCounts || {})" :key="status">
                      <span 
                        class="px-2 py-1 rounded text-xs font-medium"
                        :class="{
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': parseInt(status) < 400,
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': parseInt(status) >= 400 && parseInt(status) < 500,
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': parseInt(status) >= 500
                        }"
                        x-text="status + ': ' + count"
                      ></span>
                    </template>
                  </div>
                </td>
              </tr>
            </template>
            <template x-if="filteredRoutes.length === 0">
              <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No routes found</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent Errors -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Errors</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Live error stream with filtering</p>
          </div>
          <div class="flex items-center gap-3">
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
        <div class="flex gap-2 text-xs">
          <button 
            @click="errorFilter = 'all'" 
            class="px-3 py-1 rounded transition-all" 
            :class="errorFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
          >
            All
          </button>
          <button 
            @click="errorFilter = '5xx'" 
            class="px-3 py-1 rounded transition-all"
            :class="errorFilter === '5xx' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
          >
            5xx
          </button>
          <button 
            @click="errorFilter = '4xx'" 
            class="px-3 py-1 rounded transition-all"
            :class="errorFilter === '4xx' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
          >
            4xx
          </button>
        </div>
      </div>
      <div class="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        <template x-if="filteredErrors.length === 0">
          <div class="p-8 text-center text-gray-500 dark:text-gray-400">No errors found</div>
        </template>
        <template x-for="(error, idx) in filteredErrors.slice(0, 20)" :key="error.id">
          <div class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span 
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="{
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': error.status >= 500,
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': error.status >= 400 && error.status < 500
                    }"
                    x-text="error.status"
                  ></span>
                  <span class="text-sm font-mono text-gray-700 dark:text-gray-300" x-text="error.method"></span>
                  <span class="text-sm font-mono text-gray-900 dark:text-gray-100" x-text="error.path"></span>
                  <span class="text-xs text-gray-500 dark:text-gray-400" x-text="error.time"></span>
                </div>
                <div class="text-sm text-gray-900 dark:text-gray-100 mb-2" x-text="error.message"></div>
                <div class="text-xs text-gray-500 dark:text-gray-400" x-text="error.code"></div>
              </div>
              <button 
                @click="toggleErrorDetail(idx)"
                class="px-3 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <span x-text="isErrorExpanded(idx) ? 'Hide' : 'Show'"></span>
              </button>
            </div>
            <div x-show="isErrorExpanded(idx)" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Request Details</div>
              <div class="bg-gray-50 dark:bg-gray-900 rounded p-3 mb-3">
                <div class="text-xs font-mono space-y-1">
                  <div><span class="text-gray-500 dark:text-gray-400">Method:</span> <span class="text-gray-900 dark:text-gray-100" x-text="error.method"></span></div>
                  <div><span class="text-gray-500 dark:text-gray-400">Path:</span> <span class="text-gray-900 dark:text-gray-100" x-text="error.path"></span></div>
                  <div><span class="text-gray-500 dark:text-gray-400">Timestamp:</span> <span class="text-gray-900 dark:text-gray-100" x-text="error.timestamp"></span></div>
                  <div x-show="error.latencyMs"><span class="text-gray-500 dark:text-gray-400">Latency:</span> <span class="text-gray-900 dark:text-gray-100" x-text="error.latencyMs + ' ms'"></span></div>
                </div>
              </div>
              <div x-show="error.stack && !shouldMaskStacktrace" class="mt-3">
                <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Stack Trace</div>
                <pre class="bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-x-auto text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap" x-text="error.stack"></pre>
              </div>
              <div x-show="error.stack && shouldMaskStacktrace" class="mt-3">
                <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Stack Trace</div>
                <div class="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs text-gray-500 dark:text-gray-400 italic">
                  Stack trace hidden in production mode
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    </div>
    <!-- End System Overview -->

    <!-- Crashes & Errors Dashboard -->
    <div x-show="currentView === 'crashes'">
      <!-- Error Metrics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Errors</div>
          <div class="text-2xl font-bold text-red-600 dark:text-red-400" x-text="stats.totalErrors.toLocaleString()"></div>
          <div class="text-xs mt-1 text-gray-500 dark:text-gray-500">Error Rate: <span x-text="stats.errorRate"></span>%</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">5xx Errors</div>
          <div class="text-2xl font-bold text-red-600 dark:text-red-400" x-text="errorStats.serverErrors"></div>
          <div class="text-xs mt-1 text-gray-500 dark:text-gray-500">Server errors</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">4xx Errors</div>
          <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400" x-text="errorStats.clientErrors"></div>
          <div class="text-xs mt-1 text-gray-500 dark:text-gray-500">Client errors</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Top Error Code</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white" x-text="errorStats.topCode || 'N/A'"></div>
          <div class="text-xs mt-1 text-gray-500 dark:text-gray-500" x-text="errorStats.topCodeCount ? errorStats.topCodeCount + ' occurrences' : 'No errors'"></div>
        </div>
      </div>

      <!-- Error Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Error Rate Timeline</h2>
          <div id="errorRateChart" class="chart-container"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Error Frequency by Code</h2>
          <div id="errorFrequencyChart" class="chart-container"></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">4xx vs 5xx Distribution</h2>
          <div id="errorStatusPieChart" class="chart-container-md"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Failing Routes</h2>
          <div id="failingRoutesChart" class="chart-container-md"></div>
        </div>
      </div>

      <!-- Recent Errors Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Exception Details</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Live error stream with stack traces</p>
            </div>
            <div class="flex items-center gap-3">
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
        <div class="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
          <template x-if="filteredErrors.length === 0">
            <div class="p-8 text-center text-gray-500 dark:text-gray-400">No errors found</div>
          </template>
          <template x-for="(error, idx) in filteredErrors.slice(0, 50)" :key="error.id">
            <div class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span 
                      class="px-2 py-1 rounded text-xs font-medium"
                      :class="{
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': error.status >= 500,
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': error.status >= 400 && error.status < 500
                      }"
                      x-text="error.status"
                    ></span>
                    <span class="text-sm font-mono text-gray-700 dark:text-gray-300" x-text="error.method"></span>
                    <span class="text-sm font-mono text-gray-900 dark:text-gray-100" x-text="error.path"></span>
                    <span class="text-xs text-gray-500 dark:text-gray-400" x-text="error.time"></span>
                    <span class="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" x-text="error.code"></span>
                  </div>
                  <div class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" x-text="error.message"></div>
                </div>
                <button 
                  @click="toggleErrorDetail(idx)"
                  class="px-3 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <span x-text="isErrorExpanded(idx) ? 'Hide' : 'Show Details'"></span>
                </button>
              </div>
              <div x-show="isErrorExpanded(idx)" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Request Details</div>
                <div class="bg-gray-50 dark:bg-gray-900 rounded p-3 mb-3">
                  <div class="text-xs font-mono space-y-1">
                    <div><span class="text-gray-500 dark:text-gray-400">Method:</span> <span class="text-gray-900 dark:text-gray-100" x-text="error.method"></span></div>
                    <div><span class="text-gray-500 dark:text-gray-400">Path:</span> <span class="text-gray-900 dark:text-gray-100" x-text="error.path"></span></div>
                    <div><span class="text-gray-500 dark:text-gray-400">Timestamp:</span> <span class="text-gray-900 dark:text-gray-100" x-text="error.timestamp"></span></div>
                    <div><span class="text-gray-500 dark:text-gray-400">Error Code:</span> <span class="text-gray-900 dark:text-gray-100" x-text="error.code"></span></div>
                  </div>
                </div>
                <div x-show="error.stack && !shouldMaskStacktrace" class="mt-3">
                  <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Stack Trace</div>
                  <pre class="bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-x-auto text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-64 overflow-y-auto" x-text="error.stack"></pre>
                </div>
                <div x-show="error.stack && shouldMaskStacktrace" class="mt-3">
                  <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Stack Trace</div>
                  <div class="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs text-gray-500 dark:text-gray-400 italic">
                    Stack trace hidden in production mode
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Top Error Codes Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Error Codes Summary</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Frequency breakdown by error code</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Error Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Count</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">First Seen</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Last Seen</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sample</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <template x-for="errCode in errorCodes.slice(0, 20)" :key="errCode.code">
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td class="px-6 py-4 text-sm font-mono font-semibold text-gray-900 dark:text-gray-100" x-text="errCode.code"></td>
                  <td class="px-6 py-4 text-sm text-red-600 dark:text-red-400 font-semibold" x-text="errCode.count"></td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" x-text="new Date(errCode.firstSeen || Date.now()).toLocaleString()"></td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" x-text="new Date(errCode.lastSeen || Date.now()).toLocaleString()"></td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" x-text="(errCode.sample?.message || 'N/A').substring(0, 50)"></td>
                </tr>
              </template>
              <template x-if="errorCodes.length === 0">
                <tr>
                  <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No errors recorded</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <!-- End Crashes & Errors -->

    <!-- Performance Dashboard -->
    <div x-show="currentView === 'performance'">
      <!-- Performance Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Latency (P50)</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white" x-text="latencyPercentiles.p50 + ' ms'"></div>
          <div class="text-xs mt-1 text-gray-500 dark:text-gray-500">Median response time</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">P95 Latency</div>
          <div class="text-2xl font-bold text-orange-600 dark:text-orange-400" x-text="latencyPercentiles.p95 + ' ms'"></div>
          <div class="text-xs mt-1 text-gray-500 dark:text-gray-500">95th percentile</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">P99 Latency</div>
          <div class="text-2xl font-bold text-red-600 dark:text-red-400" x-text="latencyPercentiles.p99 + ' ms'"></div>
          <div class="text-xs mt-1 text-gray-500 dark:text-gray-500">99th percentile</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Latency</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white" x-text="stats.avgLatency + ' ms'"></div>
          <div class="text-xs mt-1" :class="insights.latencyTrend === 'up' ? 'text-red-600 dark:text-red-400' : insights.latencyTrend === 'down' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-500'">
            <span x-text="insights.latencyTrend === 'up' ? '↑ Increasing' : insights.latencyTrend === 'down' ? '↓ Decreasing' : '→ Stable'"></span>
          </div>
        </div>
      </div>

      <!-- Performance Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latency Over Time</h2>
          <div id="latencyTimeChart" class="chart-container"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latency Distribution</h2>
          <div id="latencyDistributionChart" class="chart-container"></div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latency Heatmap by Route</h2>
          <div id="latencyHeatmapChart" class="chart-container"></div>
        </div>
      </div>

      <!-- Slowest Endpoints -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Slowest Endpoints</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ranked by P95 latency</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Route</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">P50</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">P95</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">P99</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Requests</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <template x-for="route in slowRoutes" :key="route.key">
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td class="px-6 py-4 text-sm font-mono text-gray-900 dark:text-gray-100" x-text="route.key"></td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" x-text="route.p50 + ' ms'"></td>
                  <td class="px-6 py-4 text-sm font-semibold text-orange-600 dark:text-orange-400" x-text="route.p95Raw + ' ms'"></td>
                  <td class="px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-400" x-text="route.p99 + ' ms'"></td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" x-text="route.total"></td>
                </tr>
              </template>
              <template x-if="slowRoutes.length === 0">
                <tr>
                  <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No route data available</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Latency Distribution by Route -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 border border-gray-200 dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Latency Percentiles by Route</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Interactive view showing p50, p95, p99 latencies per endpoint</p>
        </div>
        <div class="p-6">
          <div id="latencyPerRouteChart" class="chart-container"></div>
        </div>
      </div>

      <!-- Throughput Trends -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Throughput Trends</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Request rate and latency correlation</p>
        </div>
        <div class="p-6">
          <div id="throughputChart" class="chart-container"></div>
        </div>
      </div>
    </div>
    <!-- End Performance -->
  </div>

  <script>
    // Dashboard component will be inserted here
  </script>
</body>
</html>
`;
}
