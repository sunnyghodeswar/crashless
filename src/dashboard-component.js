/**
 * Dashboard Alpine.js Component
 * Contains the JavaScript logic for the dashboard functionality
 */

export function getDashboardComponent(maskMessages) {
  return `
    function dashboard(viewType = 'system') {
      return {
        currentView: viewType,
        darkMode: false,
        autoRefresh: true,
        refreshInterval: 10,
        stats: { totalRequests: 0, totalErrors: 0, avgLatency: 0, errorRate: 0, uptime: '0s', requestsPerSecond: 0 },
        deltas: { requests: 0, errors: 0 },
        latencyPercentiles: { p50: 0, p95: 0, p99: 0 },
        timeSeries: { labels: [], requests: [], errors: [], latencies: [], errorCodes: {} },
        errorCodes: [],
        routes: [],
        recentErrors: [],
        errorStats: { serverErrors: 0, clientErrors: 0, topCode: '', topCodeCount: 0 },
        routeSearch: '',
        routeStatusFilter: 'all',
        errorSearch: '',
        errorFilter: 'all',
        errorTypeFilter: 'all',
        expandedErrors: new Set(),
        lastUpdated: 'never',
        charts: {},
        poller: null,
        shouldMaskStacktrace: ${maskMessages} || false,
        previousStats: null,
        insights: {
          latencyTrend: 'stable',
          latencyChange: 0,
          messages: []
        },
        // Traces dashboard state
        traces: [],
        selectedTraceIdx: null,
        selectedTrace: null,
        selectedSpan: null,

        async init() {
          this.loadTheme();
          this.loadAutoRefreshSettings();
          await this.waitForECharts();
          await this.$nextTick();
          setTimeout(() => {
            this.setupCharts();
            this.fetchMetrics();
            this.fetchTraces();
            this.startAutoRefresh();
          }, 100);
        },

        loadAutoRefreshSettings() {
          const savedAutoRefresh = localStorage.getItem('crashlessAutoRefresh');
          const savedInterval = localStorage.getItem('crashlessRefreshInterval');
          if (savedAutoRefresh !== null) {
            this.autoRefresh = savedAutoRefresh === 'true';
          }
          if (savedInterval !== null) {
            this.refreshInterval = parseInt(savedInterval, 10) || 10;
          }
        },

        startAutoRefresh() {
          if (this.poller) {
            clearInterval(this.poller);
          }
          if (this.autoRefresh) {
            const intervalMs = this.refreshInterval * 1000;
            this.poller = setInterval(() => {
              this.fetchMetrics();
              if (this.currentView === 'traces') {
                this.fetchTraces();
              }
            }, intervalMs);
          }
        },

        toggleAutoRefresh() {
          this.autoRefresh = !this.autoRefresh;
          localStorage.setItem('crashlessAutoRefresh', this.autoRefresh.toString());
          this.startAutoRefresh();
        },

        updateRefreshInterval() {
          localStorage.setItem('crashlessRefreshInterval', this.refreshInterval.toString());
          this.startAutoRefresh();
        },

        switchDashboard(view) {
          this.currentView = view;
          // Fetch traces when switching to traces view
          if (view === 'traces') {
            this.fetchTraces();
          }
        },

        waitForECharts() {
          return new Promise((resolve) => {
            if (typeof echarts !== 'undefined') {
              resolve();
            } else {
              const checkInterval = setInterval(() => {
                if (typeof echarts !== 'undefined') {
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 50);
            }
          });
        },

        loadTheme() {
          const saved = localStorage.getItem('crashlessTheme');
          this.darkMode = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
          this.applyTheme();
        },

        toggleTheme() {
          this.darkMode = !this.darkMode;
          this.applyTheme();
          localStorage.setItem('crashlessTheme', this.darkMode ? 'dark' : 'light');
          // Rebuild all charts with new theme
          setTimeout(() => {
            this.updateCharts();
          }, 100);
        },

        applyTheme() {
          if (this.darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        },

        async fetchMetrics() {
          try {
            const res = await fetch('/metrics.json');
            if (!res.ok) throw new Error('Request failed: ' + res.status);
            const data = await res.json();
            this.hydrate(data);
          } catch (err) {
            console.error('[Dashboard] Fetch error:', err);
            // Show error in UI
            this.lastUpdated = 'Error: ' + (err.message || 'Failed to fetch metrics');
          }
        },

        hydrate(payload) {
          try {
            const ext = payload._extended || {};
            
            // Store previous stats for insights
            if (this.stats.totalRequests > 0) {
              this.previousStats = { ...this.stats };
            }
            
            this.stats.totalRequests = payload.requestsTotal || 0;
            this.stats.totalErrors = payload.errorsTotal || 0;
            this.stats.avgLatency = Math.round(payload.avgLatencyMs || 0);
            this.stats.uptime = ext.uptime?.humanReadable || this.formatUptime((payload.uptimeSec || 0) * 1000);
            this.stats.errorRate = this.stats.totalRequests ? Number(((this.stats.totalErrors / this.stats.totalRequests) * 100).toFixed(2)) : 0;

            if (!this.lastTotals) this.lastTotals = { requests: 0, errors: 0 };
            this.deltas.requests = this.stats.totalRequests - this.lastTotals.requests;
            this.deltas.errors = this.stats.totalErrors - this.lastTotals.errors;
            this.lastTotals = { requests: this.stats.totalRequests, errors: this.stats.totalErrors };

            // Build time series - always add data point (even if time is same, use timestamp for uniqueness)
            const now = new Date();
            const timeLabel = now.toLocaleTimeString();
            const uniqueId = now.getTime(); // Use timestamp for uniqueness
            
            // Only check last few labels to allow same-second updates
            const shouldAdd = this.timeSeries.labels.length === 0 || 
                            !this.timeSeries.labels.slice(-5).includes(timeLabel);
            
            if (shouldAdd) {
              if (this.timeSeries.labels.length >= 30) {
                this.timeSeries.labels.shift();
                this.timeSeries.requests.shift();
                this.timeSeries.errors.shift();
                this.timeSeries.latencies.shift();
              }
              this.timeSeries.labels.push(timeLabel);
              this.timeSeries.requests.push(this.deltas.requests > 0 ? this.deltas.requests : 0);
              this.timeSeries.errors.push(this.deltas.errors > 0 ? this.deltas.errors : 0);
              this.timeSeries.latencies.push(this.stats.avgLatency);
            }
            
            // Track error codes over time
            (ext.errors?.recent || []).slice(0, 10).forEach(e => {
              const code = e.code || 'UNKNOWN';
              if (!this.timeSeries.errorCodes[code]) this.timeSeries.errorCodes[code] = [];
              if (this.timeSeries.errorCodes[code].length >= 30) this.timeSeries.errorCodes[code].shift();
              this.timeSeries.errorCodes[code].push(1);
            });

            const byRoute = ext.requests?.byRoute || {};
            this.routes = Object.entries(byRoute).map(([key, info]) => {
              const lat = ext.latencies?.[key]?.current || {};
              return {
                key,
                total: info.total || 0,
                errors: Object.entries(info.statusCounts || {}).filter(([s]) => parseInt(s) >= 400).reduce((sum, [, count]) => sum + (count || 0), 0),
                p95: lat.p95 ? Math.round(lat.p95) + ' ms' : '—',
                p95Raw: lat.p95 || 0,
                p50: lat.p50 || 0,
                p99: lat.p99 || 0,
                statusCounts: info.statusCounts || {},
              };
            }).sort((a, b) => b.total - a.total);

            this.errorCodes = Object.entries(ext.errors?.byCode || {}).map(([code, info]) => ({
              code,
              count: info.count || 0,
              firstSeen: info.firstSeen,
              lastSeen: info.lastSeen,
              sample: info.sample,
            })).sort((a, b) => b.count - a.count);

            // Calculate error stats for Crashes dashboard
            const errors = ext.errors?.recent || [];
            this.errorStats.serverErrors = errors.filter(e => (e.status || 500) >= 500).length;
            this.errorStats.clientErrors = errors.filter(e => (e.status || 400) >= 400 && (e.status || 400) < 500).length;
            this.errorStats.topCode = this.errorCodes.length > 0 ? this.errorCodes[0].code : '';
            this.errorStats.topCodeCount = this.errorCodes.length > 0 ? this.errorCodes[0].count : 0;
            this.recentErrors = errors.slice(0, 50).map(item => {
              try {
                return {
                  id: (item.timestamp || Date.now()) + ':' + (item.code || 'unknown'),
                  status: item.status || 500,
                  method: item.method || 'UNKNOWN',
                  path: item.path || item.route || 'unknown',
                  time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Unknown',
                  timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown',
                  message: item.message || item.code || 'Unhandled error',
                  code: item.code || 'UNKNOWN',
                  stack: item.stack || '',
                  latencyMs: item.latencyMs || null,
                };
              } catch (e) {
                return {
                  id: Date.now() + ':' + (item.code || 'unknown'),
                  status: 500,
                  method: 'UNKNOWN',
                  path: 'unknown',
                  time: 'Unknown',
                  timestamp: 'Unknown',
                  message: 'Error parsing error data',
                  code: 'PARSE_ERROR',
                  stack: '',
                  latencyMs: null,
                };
              }
            });

            const latencies = ext.latencies || {};
            const latencyValues = Object.values(latencies).map(l => l.current?.p95 || 0).filter(v => v > 0);
            if (latencyValues.length) {
              this.latencyPercentiles = {
                p50: Math.round(latencyValues.sort((a, b) => a - b)[Math.floor(latencyValues.length * 0.5)] || 0),
                p95: Math.round(latencyValues.sort((a, b) => a - b)[Math.floor(latencyValues.length * 0.95)] || 0),
                p99: Math.round(latencyValues.sort((a, b) => a - b)[Math.floor(latencyValues.length * 0.99)] || 0),
              };
            } else {
              // Initialize with zeros if no data
              this.latencyPercentiles = { p50: 0, p95: 0, p99: 0 };
            }

            this.calculateInsights();
            this.lastUpdated = new Date().toLocaleTimeString();
            
            // Update charts with error handling
            try {
              this.updateCharts();
            } catch (err) {
              console.error('[Dashboard] Chart update error:', err);
            }
          } catch (err) {
            console.error('[Dashboard] Hydrate error:', err);
          }
        },

        calculateInsights() {
          this.insights.messages = [];
          
          // Latency trend
          if (this.previousStats && this.previousStats.avgLatency > 0) {
            const change = ((this.stats.avgLatency - this.previousStats.avgLatency) / this.previousStats.avgLatency * 100);
            this.insights.latencyChange = Math.round(Math.abs(change));
            if (Math.abs(change) < 5) {
              this.insights.latencyTrend = 'stable';
            } else if (change > 0) {
              this.insights.latencyTrend = 'up';
              if (Math.abs(change) > 20) {
                this.insights.messages.push({
                  icon: '⚠️',
                  title: 'Latency Spike Detected',
                  message: 'Average latency increased by ' + this.insights.latencyChange + '% since last refresh',
                  color: '#F59E0B'
                });
              }
            } else {
              this.insights.latencyTrend = 'down';
            }
          }

          // Top slow routes
          const slowRoutes = this.routes.filter(r => r.p95Raw > 500).sort((a, b) => b.p95Raw - a.p95Raw).slice(0, 3);
          if (slowRoutes.length > 0) {
            this.insights.messages.push({
              icon: '🐌',
              title: 'Slow Routes',
              message: slowRoutes.map(r => r.key + ' (' + r.p95 + ')').join(', '),
              color: '#EF4444'
            });
          }

          // Frequent errors
          const topErrors = this.errorCodes.slice(0, 3);
          if (topErrors.length > 0 && topErrors[0].count > 5) {
            this.insights.messages.push({
              icon: '🔥',
              title: 'Frequent Errors',
              message: topErrors.map(e => e.code + ' (' + e.count + ')').join(', '),
              color: '#DC2626'
            });
          }

          // Traffic spike
          if (this.deltas.requests > 0 && this.previousStats && this.deltas.requests > this.previousStats.totalRequests * 0.5) {
            this.insights.messages.push({
              icon: '📈',
              title: 'Traffic Spike',
              message: 'Request volume increased significantly: +' + this.deltas.requests + ' requests/min',
              color: '#3B82F6'
            });
          }

          // High error rate
          if (this.stats.errorRate > 10) {
            this.insights.messages.push({
              icon: '❌',
              title: 'High Error Rate',
              message: this.stats.errorRate + '% of requests are failing',
              color: '#EF4444'
            });
          }
        },

        get filteredRoutes() {
          const query = this.routeSearch.toLowerCase();
          return this.routes.filter(r => {
            const matchesSearch = r.key.toLowerCase().includes(query);
            if (!matchesSearch) return false;
            
            if (this.routeStatusFilter === 'all') return true;
            
            const statusCodes = Object.keys(r.statusCounts || {});
            if (this.routeStatusFilter === '2xx') return statusCodes.some(s => s.startsWith('2'));
            if (this.routeStatusFilter === '4xx') return statusCodes.some(s => s.startsWith('4'));
            if (this.routeStatusFilter === '5xx') return statusCodes.some(s => s.startsWith('5'));
            
            return true;
          });
        },

        get filteredErrors() {
          let filtered = this.recentErrors;
          
          if (this.errorFilter === '5xx') filtered = filtered.filter(e => e.status >= 500);
          if (this.errorFilter === '4xx') filtered = filtered.filter(e => e.status >= 400 && e.status < 500);
          
          if (this.errorTypeFilter !== 'all') {
            filtered = filtered.filter(e => e.code === this.errorTypeFilter);
          }
          
          if (this.errorSearch) {
            const query = this.errorSearch.toLowerCase();
            filtered = filtered.filter(e => 
              e.message.toLowerCase().includes(query) ||
              e.code.toLowerCase().includes(query) ||
              e.path.toLowerCase().includes(query)
            );
          }
          
          return filtered;
        },

        get uniqueErrorCodes() {
          return [...new Set(this.recentErrors.map(e => e.code))];
        },

        get slowRoutes() {
          return this.routes
            .filter(r => r.p95Raw > 0)
            .sort((a, b) => b.p95Raw - a.p95Raw)
            .slice(0, 20);
        },

        toggleErrorDetail(idx) {
          const error = this.filteredErrors[idx];
          if (this.expandedErrors.has(error.id)) {
            this.expandedErrors.delete(error.id);
          } else {
            this.expandedErrors.add(error.id);
          }
        },

        isErrorExpanded(idx) {
          const error = this.filteredErrors[idx];
          return error && this.expandedErrors.has(error.id);
        },

        setupCharts() {
          if (typeof echarts === 'undefined') {
            return;
          }
          
          const allChartIds = [
            'trendChart', 'errorRateChart', 'latencyTimeChart', 'errorTimelineChart',
            'errorBreakdownChart', 'statusPieChart', 'trafficHeatmapChart', 'latencyPerRouteChart',
            'errorFrequencyChart', 'errorStatusPieChart', 'failingRoutesChart',
            'latencyDistributionChart', 'latencyHeatmapChart', 'throughputChart'
          ];
          
          const ids = allChartIds.filter(id => {
            const el = document.getElementById(id);
            return el !== null;
          });
          
          ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
              this.charts[id.replace('Chart', '')] = echarts.init(el, null, { renderer: 'canvas' });
            }
          });

          window.addEventListener('resize', () => {
            Object.values(this.charts).forEach(chart => chart && chart.resize());
          });
        },

        getChartTheme() {
          return {
            text: this.darkMode ? '#E5E7EB' : '#111827',
            subText: this.darkMode ? '#9CA3AF' : '#6B7280',
            grid: this.darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.4)',
            background: 'transparent',
          };
        },

        updateChartThemes() {
          Object.values(this.charts).forEach(chart => {
            if (chart) {
              const opt = chart.getOption();
              if (opt && opt.length) {
                const theme = this.getChartTheme();
                opt[0].textStyle = { color: theme.text };
                opt[0].backgroundColor = theme.background;
                if (opt[0].xAxis && opt[0].xAxis.length) {
                  opt[0].xAxis.forEach(ax => {
                    ax.axisLabel = { ...ax.axisLabel, color: theme.text };
                    ax.axisLine = { ...ax.axisLine, lineStyle: { color: theme.subText } };
                  });
                }
                if (opt[0].yAxis && opt[0].yAxis.length) {
                  opt[0].yAxis.forEach(ax => {
                    ax.axisLabel = { ...ax.axisLabel, color: theme.text };
                    ax.splitLine = { ...ax.splitLine, lineStyle: { color: theme.grid } };
                  });
                }
                chart.setOption(opt, true);
              }
            }
          });
        },

        updateCharts() {
          // Don't early return - different views have different charts
          if (Object.keys(this.charts).length === 0) return;

          const theme = this.getChartTheme();

          // 1. Throughput & Errors
          if (this.charts.trend) {
            this.charts.trend.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: { 
                trigger: 'axis',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text },
                formatter: (params) => {
                  let result = params[0].axisValue + '<br>';
                  params.forEach(p => {
                    result += p.marker + ' ' + p.seriesName + ': ' + p.value + '<br>';
                  });
                  return result;
                }
              },
              legend: { data: ['Requests/min', 'Errors/min'], textStyle: { color: theme.text }, top: 10 },
              grid: { left: '10%', right: '8%', bottom: '12%', top: '18%', containLabel: true },
              xAxis: {
                type: 'category',
                data: this.timeSeries.labels.length ? this.timeSeries.labels : ['Loading...'],
                axisLabel: { color: theme.text },
                axisLine: { lineStyle: { color: theme.subText } },
              },
              yAxis: {
                type: 'value',
                axisLabel: { color: theme.text },
                splitLine: { lineStyle: { color: theme.grid } },
              },
              series: [
                { name: 'Requests/min', type: 'line', smooth: true, data: this.timeSeries.requests.length ? this.timeSeries.requests : [0], lineStyle: { width: 2 }, showSymbol: false, itemStyle: { color: '#3B82F6' } },
                { name: 'Errors/min', type: 'line', smooth: true, data: this.timeSeries.errors.length ? this.timeSeries.errors : [0], lineStyle: { width: 2 }, showSymbol: false, itemStyle: { color: '#EF4444' } },
              ],
            }, true);
          }

          // 2. Error Rate Trend
          if (this.charts.errorRate) {
            const errorRates = this.timeSeries.labels.length > 0 
              ? this.timeSeries.labels.map((_, i) => {
                  const req = this.timeSeries.requests[i] || 0;
                  const err = this.timeSeries.errors[i] || 0;
                  return req > 0 ? Number(((err / req) * 100).toFixed(2)) : 0;
                })
              : [0];
            
            this.charts.errorRate.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: { 
                trigger: 'axis',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text },
                formatter: '{b}<br>Error Rate: {c}%'
              },
              grid: { left: '10%', right: '8%', bottom: '12%', top: '15%', containLabel: true },
              xAxis: {
                type: 'category',
                data: this.timeSeries.labels.length ? this.timeSeries.labels : ['Loading...'],
                axisLabel: { color: theme.text, rotate: 0 },
                axisLine: { lineStyle: { color: theme.subText } },
              },
              yAxis: {
                type: 'value',
                min: 0,
                max: 100,
                axisLabel: { color: theme.text, formatter: '{value}%' },
                splitLine: { lineStyle: { color: theme.grid } },
              },
              series: [{
                name: 'Error Rate',
                type: 'line',
                smooth: true,
                areaStyle: { opacity: 0.3, color: '#EF4444' },
                data: errorRates.length ? errorRates : [0],
                lineStyle: { width: 2, color: '#EF4444' },
                showSymbol: false,
                itemStyle: { color: '#EF4444' },
              }],
            }, true);
          }

          // 3. Latency Over Time
          if (this.charts.latencyTime) {
            this.charts.latencyTime.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: { 
                trigger: 'axis',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text },
                formatter: '{b}<br>Avg Latency: {c} ms'
              },
              grid: { left: '10%', right: '8%', bottom: '12%', top: '15%', containLabel: true },
              xAxis: {
                type: 'category',
                data: this.timeSeries.labels.length ? this.timeSeries.labels : ['Loading...'],
                axisLabel: { color: theme.text, rotate: 0 },
                axisLine: { lineStyle: { color: theme.subText } },
              },
              yAxis: {
                type: 'value',
                axisLabel: { color: theme.text, formatter: '{value} ms' },
                splitLine: { lineStyle: { color: theme.grid } },
              },
              series: [{
                name: 'Avg Latency',
                type: 'line',
                smooth: true,
                data: this.timeSeries.latencies.length ? this.timeSeries.latencies : [0],
                lineStyle: { width: 2, color: '#10B981' },
                areaStyle: { opacity: 0.2, color: '#10B981' },
                showSymbol: false,
                itemStyle: { color: '#10B981' },
              }],
            }, true);
          }

          // 4. Error Frequency Timeline
          if (this.charts.errorTimeline) {
            const errorCodeSeries = Object.entries(this.timeSeries.errorCodes).slice(0, 5).map(([code, data]) => ({
              name: code,
              type: 'line',
              smooth: true,
              data: data.length ? data : [0],
              lineStyle: { width: 2 },
              showSymbol: false,
            }));
            this.charts.errorTimeline.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: { 
                trigger: 'axis',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text },
                formatter: (params) => {
                  let result = params[0].axisValue + '<br>';
                  params.forEach(p => {
                    result += p.marker + ' ' + p.seriesName + ': ' + p.value + '<br>';
                  });
                  return result;
                }
              },
              legend: { data: Object.keys(this.timeSeries.errorCodes).slice(0, 5), textStyle: { color: theme.text }, top: 10 },
              grid: { left: '10%', right: '8%', bottom: '12%', top: '18%', containLabel: true },
              xAxis: {
                type: 'category',
                data: this.timeSeries.labels.length ? this.timeSeries.labels.slice(-Math.max(...Object.values(this.timeSeries.errorCodes).map(d => d.length))) : ['No data'],
                axisLabel: { color: theme.text },
                axisLine: { lineStyle: { color: theme.subText } },
              },
              yAxis: {
                type: 'value',
                axisLabel: { color: theme.text },
                splitLine: { lineStyle: { color: theme.grid } },
              },
              series: errorCodeSeries.length ? errorCodeSeries : [{ name: 'No errors', type: 'line', data: [0] }],
            }, true);
          }

          // 5. Error Breakdown (merged errors by code + status distribution)
          if (this.charts.errorBreakdown) {
            const errorData = this.errorCodes.slice(0, 8).map(e => ({ value: e.count, name: e.code }));
            const statusData = [];
            this.routes.forEach(r => {
              Object.entries(r.statusCounts || {}).forEach(([status, count]) => {
                const existing = statusData.find(s => s.name === status);
                if (existing) {
                  existing.value += count;
                } else {
                  statusData.push({ value: count, name: status });
                }
              });
            });
            const combinedData = [
              ...errorData.map(d => ({ ...d, category: 'Error Code' })),
              ...statusData.slice(0, 5).map(d => ({ ...d, category: 'Status' }))
            ];
            this.charts.errorBreakdown.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: { 
                trigger: 'axis',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text },
                formatter: (params) => {
                  const p = params[0];
                  return p.axisValue + '<br>' + p.marker + ' Count: ' + p.value;
                }
              },
              grid: { left: '10%', right: '8%', bottom: '18%', top: '15%', containLabel: true },
              xAxis: {
                type: 'category',
                data: combinedData.length ? combinedData.map(d => d.name) : ['No data'],
                axisLabel: { color: theme.text, rotate: 45 },
                axisLine: { lineStyle: { color: theme.subText } },
              },
              yAxis: {
                type: 'value',
                axisLabel: { color: theme.text },
                splitLine: { lineStyle: { color: theme.grid } },
              },
              series: [{
                name: 'Count',
                type: 'bar',
                data: combinedData.length ? combinedData.map(d => d.value) : [0],
                itemStyle: { 
                  borderRadius: [4, 4, 0, 0],
                  color: (params) => {
                    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
                    return colors[params.dataIndex % colors.length];
                  }
                },
                barMaxWidth: 40,
              }],
            }, true);
          }

          // 6. Response Code Pie Chart
          if (this.charts.statusPie) {
            const pieData = [];
            this.routes.forEach(r => {
              Object.entries(r.statusCounts || {}).forEach(([status, count]) => {
                const existing = pieData.find(s => s.name === status);
                if (existing) {
                  existing.value += count;
                } else {
                  pieData.push({ value: count, name: status });
                }
              });
            });
            this.charts.statusPie.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: { 
                trigger: 'item',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text },
                formatter: '{b}: {c} requests ({d}%)'
              },
              legend: { orient: 'vertical', right: '10%', top: 'center', textStyle: { color: theme.text } },
              series: [{
                name: 'Status Codes',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['35%', '50%'],
                data: pieData.length ? pieData : [{ value: 0, name: 'No data' }],
                itemStyle: {
                  color: (params) => {
                    const status = parseInt(params.name);
                    if (status < 400) return '#10B981';
                    if (status < 500) return '#F59E0B';
                    return '#EF4444';
                  }
                },
                label: { color: theme.text },
                emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
              }]
            }, true);
          }

          // 7. Traffic Heatmap
          if (this.charts.trafficHeatmap) {
            const heatmapData = [];
            const heatmapRoutes = this.routes.slice(0, 8).map(r => r.key.substring(0, 30));
            const heatmapTimes = this.timeSeries.labels.slice(-10);
            heatmapTimes.forEach((time, timeIdx) => {
              heatmapRoutes.forEach((route, routeIdx) => {
                const routeData = this.routes.find(r => r.key.substring(0, 30) === route);
                const value = routeData ? Math.floor(routeData.total / heatmapTimes.length) : 0;
                heatmapData.push([timeIdx, routeIdx, value]);
              });
            });
            this.charts.trafficHeatmap.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: {
                position: 'top',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text },
                formatter: (params) => '' + heatmapRoutes[params.value[1]] + '<br>' + heatmapTimes[params.value[0]] + ': ' + params.value[2] + ' req'
              },
              grid: { left: '15%', right: '5%', bottom: '15%', top: '5%', containLabel: false },
              xAxis: {
                type: 'category',
                data: heatmapTimes.length ? heatmapTimes : ['No data'],
                axisLabel: { color: theme.text, rotate: 45 },
                axisLine: { lineStyle: { color: theme.subText } },
                splitArea: { show: true }
              },
              yAxis: {
                type: 'category',
                data: heatmapRoutes.length ? heatmapRoutes : ['No routes'],
                axisLabel: { color: theme.text },
                axisLine: { lineStyle: { color: theme.subText } },
                splitArea: { show: true }
              },
              visualMap: {
                min: 0,
                max: Math.max(...heatmapData.map(d => d[2]), 1),
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '0%',
                textStyle: { color: theme.text },
                inRange: { color: ['#DBEAFE', '#3B82F6', '#1E40AF'] }
              },
              series: [{
                name: 'Traffic',
                type: 'heatmap',
                data: heatmapData.length ? heatmapData : [[0, 0, 0]],
                label: { show: false },
                emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
              }]
            }, true);
          }

          // 8. Latency Per Route (Interactive)
          if (this.charts.latencyPerRoute) {
            const latencyRoutes = this.routes.filter(r => r.p95Raw > 0).slice(0, 10);
            if (latencyRoutes.length === 0) {
              // Show placeholder when no data
              this.charts.latencyPerRoute.setOption({
                backgroundColor: theme.background,
                textStyle: { color: theme.text },
                title: {
                  text: 'No latency data available',
                  left: 'center',
                  top: 'center',
                  textStyle: { color: theme.subText, fontSize: 14 }
                },
                xAxis: { show: false },
                yAxis: { show: false },
                series: []
              }, true);
            } else {
              this.charts.latencyPerRoute.setOption({
            backgroundColor: theme.background,
            textStyle: { color: theme.text },
            tooltip: { 
              trigger: 'axis',
              backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: this.darkMode ? '#374151' : '#E5E7EB',
              textStyle: { color: theme.text },
              axisPointer: { type: 'shadow' },
              formatter: (params) => {
                let result = params[0].axisValue + '<br>';
                params.forEach(p => {
                  result += p.marker + ' ' + p.seriesName + ': ' + p.value + ' ms<br>';
                });
                return result;
              }
            },
            legend: { data: ['p50', 'p95', 'p99'], textStyle: { color: theme.text }, top: 10 },
            grid: { left: '12%', right: '8%', bottom: '20%', top: '18%', containLabel: true },
            xAxis: {
              type: 'category',
              data: latencyRoutes.length ? latencyRoutes.map(r => r.key.substring(0, 30)) : ['No routes'],
              axisLabel: { color: theme.text, rotate: 45 },
              axisLine: { lineStyle: { color: theme.subText } },
            },
            yAxis: {
              type: 'value',
              axisLabel: { color: theme.text, formatter: '{value} ms' },
              splitLine: { lineStyle: { color: theme.grid } },
            },
            series: [
              { name: 'p50', type: 'bar', data: latencyRoutes.map(r => r.p50), itemStyle: { color: '#10B981' } },
              { name: 'p95', type: 'bar', data: latencyRoutes.map(r => r.p95Raw), itemStyle: { color: '#F59E0B' } },
              { name: 'p99', type: 'bar', data: latencyRoutes.map(r => r.p99), itemStyle: { color: '#EF4444' } },
              ],
            }, true);
            }
          }

          // Crashes & Errors Dashboard Charts
          if (this.charts.errorFrequency) {
            const errorFreqData = this.errorCodes.slice(0, 10).map(e => ({ value: e.count, name: e.code }));
            this.charts.errorFrequency.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: { 
                trigger: 'axis',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text }
              },
              grid: { left: '10%', right: '8%', bottom: '18%', top: '15%', containLabel: true },
              xAxis: {
                type: 'category',
                data: errorFreqData.map(d => d.name),
                axisLabel: { color: theme.text, rotate: 45 },
                axisLine: { lineStyle: { color: theme.subText } },
              },
              yAxis: {
                type: 'value',
                axisLabel: { color: theme.text },
                splitLine: { lineStyle: { color: theme.grid } },
              },
              series: [{
                name: 'Errors',
                type: 'bar',
                data: errorFreqData.map(d => d.value),
                itemStyle: { color: '#EF4444', borderRadius: [4, 4, 0, 0] },
              }],
            }, true);
          }

          if (this.charts.errorStatusPie) {
            const status4xx = this.errorStats.clientErrors;
            const status5xx = this.errorStats.serverErrors;
            this.charts.errorStatusPie.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: { 
                trigger: 'item',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text },
                formatter: '{b}: {c} errors ({d}%)'
              },
              legend: { orient: 'vertical', right: '10%', top: 'center', textStyle: { color: theme.text } },
              series: [{
                name: 'Error Types',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['35%', '50%'],
                data: [
                  { value: status4xx, name: '4xx Client Errors', itemStyle: { color: '#F59E0B' } },
                  { value: status5xx, name: '5xx Server Errors', itemStyle: { color: '#EF4444' } },
                ],
                label: { color: theme.text },
              }]
            }, true);
          }

          if (this.charts.failingRoutes) {
            const failingRoutes = this.routes.filter(r => r.errors > 0).sort((a, b) => b.errors - a.errors).slice(0, 10);
            this.charts.failingRoutes.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: { 
                trigger: 'axis',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text }
              },
              grid: { left: '10%', right: '8%', bottom: '22%', top: '15%', containLabel: true },
              xAxis: {
                type: 'category',
                data: failingRoutes.map(r => r.key.substring(0, 25)),
                axisLabel: { color: theme.text, rotate: 45 },
                axisLine: { lineStyle: { color: theme.subText } },
              },
              yAxis: {
                type: 'value',
                axisLabel: { color: theme.text },
                splitLine: { lineStyle: { color: theme.grid } },
              },
              series: [{
                name: 'Errors',
                type: 'bar',
                data: failingRoutes.map(r => r.errors),
                itemStyle: { color: '#EF4444', borderRadius: [4, 4, 0, 0] },
              }],
            }, true);
          }

          // Performance Dashboard Charts
          if (this.charts.latencyDistribution) {
            const latencyBins = Array(20).fill(0);
            this.routes.forEach(r => {
              if (r.p95Raw > 0) {
                const bin = Math.min(Math.floor(r.p95Raw / 50), 19);
                latencyBins[bin]++;
              }
            });
            this.charts.latencyDistribution.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: { 
                trigger: 'axis',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text }
              },
              grid: { left: '10%', right: '8%', bottom: '12%', top: '15%', containLabel: true },
              xAxis: {
                type: 'category',
                data: latencyBins.map((_, i) => (i * 50) + '-' + ((i + 1) * 50) + 'ms'),
                axisLabel: { color: theme.text, rotate: 45 },
                axisLine: { lineStyle: { color: theme.subText } },
              },
              yAxis: {
                type: 'value',
                axisLabel: { color: theme.text },
                splitLine: { lineStyle: { color: theme.grid } },
              },
              series: [{
                name: 'Routes',
                type: 'bar',
                data: latencyBins,
                itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] },
              }],
            }, true);
          }

          if (this.charts.latencyHeatmap) {
            const latencyRoutes = this.routes.filter(r => r.p95Raw > 0).slice(0, 10);
            const latencyTimes = this.timeSeries.labels.slice(-15);
            const heatmapData = [];
            latencyTimes.forEach((time, timeIdx) => {
              latencyRoutes.forEach((route, routeIdx) => {
                const routeData = this.routes.find(r => r.key === route.key);
                const value = routeData ? routeData.p95Raw : 0;
                heatmapData.push([timeIdx, routeIdx, value]);
              });
            });
            this.charts.latencyHeatmap.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: {
                position: 'top',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text },
                formatter: (params) => latencyRoutes[params.value[1]]?.key + '<br>' + latencyTimes[params.value[0]] + ': ' + params.value[2] + ' ms'
              },
              grid: { left: '15%', right: '5%', bottom: '15%', top: '5%', containLabel: false },
              xAxis: {
                type: 'category',
                data: latencyTimes,
                axisLabel: { color: theme.text, rotate: 45 },
                axisLine: { lineStyle: { color: theme.subText } },
                splitArea: { show: true }
              },
              yAxis: {
                type: 'category',
                data: latencyRoutes.map(r => r.key.substring(0, 25)),
                axisLabel: { color: theme.text },
                axisLine: { lineStyle: { color: theme.subText } },
                splitArea: { show: true }
              },
              visualMap: {
                min: 0,
                max: Math.max(...heatmapData.map(d => d[2]), 1),
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '0%',
                textStyle: { color: theme.text },
                inRange: { color: ['#DBEAFE', '#3B82F6', '#EF4444'] }
              },
              series: [{
                name: 'Latency',
                type: 'heatmap',
                data: heatmapData.length ? heatmapData : [[0, 0, 0]],
                label: { show: false },
              }],
            }, true);
          }

          if (this.charts.throughput) {
            this.charts.throughput.setOption({
              backgroundColor: theme.background,
              textStyle: { color: theme.text },
              tooltip: { 
                trigger: 'axis',
                backgroundColor: this.darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: this.darkMode ? '#374151' : '#E5E7EB',
                textStyle: { color: theme.text }
              },
              legend: { data: ['Requests/min', 'Avg Latency'], textStyle: { color: theme.text }, top: 10 },
              grid: { left: '10%', right: '8%', bottom: '12%', top: '18%', containLabel: true },
              xAxis: {
                type: 'category',
                data: this.timeSeries.labels.length ? this.timeSeries.labels : ['Loading...'],
                axisLabel: { color: theme.text },
                axisLine: { lineStyle: { color: theme.subText } },
              },
              yAxis: [
                {
                  type: 'value',
                  name: 'Requests',
                  axisLabel: { color: theme.text },
                  splitLine: { lineStyle: { color: theme.grid } },
                },
                {
                  type: 'value',
                  name: 'Latency (ms)',
                  axisLabel: { color: theme.text, formatter: '{value} ms' },
                  splitLine: { show: false },
                }
              ],
              series: [
                { name: 'Requests/min', type: 'bar', data: this.timeSeries.requests.length ? this.timeSeries.requests : [0], itemStyle: { color: '#3B82F6' } },
                { name: 'Avg Latency', type: 'line', yAxisIndex: 1, data: this.timeSeries.latencies.length ? this.timeSeries.latencies : [0], lineStyle: { width: 2, color: '#EF4444' }, itemStyle: { color: '#EF4444' } },
              ],
            }, true);
          }
        },

        refresh() {
          this.fetchMetrics();
          if (this.currentView === 'traces') {
            this.fetchTraces();
          }
        },

        async fetchTraces() {
          try {
            const res = await fetch('/traces.json?limit=100');
            if (!res.ok) throw new Error('Request failed: ' + res.status);
            const data = await res.json();
            // Filter out internal observability endpoints
            let traces = (data.traces || []).filter(trace => {
              const route = this.getTraceRoute(trace);
              return !this.isInternalEndpoint(route);
            });
            this.traces = traces;
            // If we had a selected trace, try to find it again
            if (this.selectedTraceIdx !== null && this.traces[this.selectedTraceIdx]) {
              this.selectedTrace = this.traces[this.selectedTraceIdx];
            } else if (this.selectedTraceIdx !== null) {
              this.selectedTrace = null;
              this.selectedTraceIdx = null;
              this.selectedSpan = null;
            }
          } catch (err) {
            console.error('[Dashboard] Fetch traces error:', err);
          }
        },

        isInternalEndpoint(route) {
          if (!route) return true;
          const internalPatterns = [
            '/metrics.json',
            '/traces.json',
            '/metrics',
            '/metrics/otel',
            '/_crashless',
            '/health',
            '/favicon.ico',
          ];
          return internalPatterns.some(pattern => route.includes(pattern) || route === pattern);
        },

        selectTrace(idx) {
          this.selectedTraceIdx = idx;
          this.selectedTrace = this.traces[idx] || null;
          this.selectedSpan = null; // Reset span selection
        },

        selectSpan(span) {
          this.selectedSpan = span;
        },

        getTraceRoute(trace) {
          if (!trace || !trace.spans || trace.spans.length === 0) return 'Unknown';
          // Find root span (no parent or null/empty parentSpanId)
          const rootSpan = trace.spans.find(s => !s.parentSpanId || s.parentSpanId === null || s.parentSpanId === '') || trace.spans[0];
          if (!rootSpan) return 'Unknown';
          // Prefer http.route or http.path from attributes, fallback to name
          return rootSpan.attributes?.['http.route'] || 
                 rootSpan.attributes?.['http.path'] || 
                 rootSpan.attributes?.['http.target'] ||
                 rootSpan.name || 
                 'Unknown';
        },

        hasTraceError(trace) {
          if (!trace || !trace.spans) return false;
          return trace.spans.some(s => s.status === 'error' || s.error);
        },

        buildSpanTree(spans) {
          if (!spans || spans.length === 0) return [];
          
          // Create a map of spans by spanId for quick lookup
          const spanMap = new Map();
          spans.forEach(span => {
            spanMap.set(span.spanId, { ...span, depth: 0, children: [] });
          });

          // Build tree structure
          const rootSpans = [];
          spanMap.forEach((span, spanId) => {
            if (!span.parentSpanId) {
              // Root span
              span.depth = 0;
              rootSpans.push(span);
            } else {
              // Child span - find parent and add as child
              const parent = spanMap.get(span.parentSpanId);
              if (parent) {
                span.depth = (parent.depth || 0) + 1;
                if (!parent.children) parent.children = [];
                parent.children.push(span);
              } else {
                // Orphan span (parent not found) - treat as root with depth 0
                span.depth = 0;
                rootSpans.push(span);
              }
            }
          });

          // Flatten tree in depth-first order for display
          const flatten = (span, depth = 0) => {
            const result = [{ ...span, depth }];
            if (span.children && span.children.length > 0) {
              span.children.forEach(child => {
                result.push(...flatten(child, depth + 1));
              });
            }
            return result;
          };

          const result = [];
          rootSpans.forEach(root => {
            result.push(...flatten(root));
          });

          // Sort by start time within same depth to maintain chronological order
          return result.sort((a, b) => {
            if (a.depth !== b.depth) return a.depth - b.depth;
            return (a.startTime || 0) - (b.startTime || 0);
          });
        },

        formatUptime(ms) {
          const sec = Math.floor(ms / 1000);
          const min = Math.floor(sec / 60);
          const hrs = Math.floor(min / 60);
          const days = Math.floor(hrs / 24);
          if (days) return days + 'd ' + (hrs % 24) + 'h ' + (min % 60) + 'm';
          if (hrs) return hrs + 'h ' + (min % 60) + 'm ' + (sec % 60) + 's';
          if (min) return min + 'm ' + (sec % 60) + 's';
          return sec + 's';
        }
      };
    }
  `;
}
