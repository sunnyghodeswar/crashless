#!/bin/bash
# Crashless Benchmark Runner
# Simple script to run the benchmark suite

set -e

echo "🚀 Crashless Benchmark Suite"
echo "============================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    if [ -f ~/.nvm/nvm.sh ]; then
        source ~/.nvm/nvm.sh
    else
        echo "❌ Node.js not found. Please install Node.js 18+"
        exit 1
    fi
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node --version)"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Check if express-async-errors is installed (optional)
if npm list express-async-errors &> /dev/null; then
    echo "✓ express-async-errors found"
else
    echo "⚠️  express-async-errors not found (optional, will use fallback)"
    echo "  Install with: npm install express-async-errors --save-dev"
fi
echo ""

# Run benchmark
echo "Starting benchmark..."
echo ""
node benchmark/benchmark.js

echo ""
echo "✅ Benchmark complete!"
echo "📄 Results saved to: benchmark/results.json"
echo ""
echo "💡 Tip: Check docs/contributing/BENCHMARKS.md for interpretation guide"

