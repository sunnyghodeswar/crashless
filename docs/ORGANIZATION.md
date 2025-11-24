# Documentation Organization

This document describes how documentation is organized in the Crashless project.

## Structure

```
docs/
├── README.md                    # Main documentation index
├── API_CHANGES.md               # API version history
├── ARCHITECTURE.md              # System architecture
├── LIMITATIONS.md               # Known limitations
├── PERFORMANCE.md               # Performance guide
├── SECURITY.md                  # Security documentation
│
├── development/                 # Development & release docs
│   ├── CI_CD.md                 # CI/CD workflow setup
│   ├── RELEASE_CONFIG.md        # Semantic-release configuration
│   └── RELEASE_CHECKLIST.md     # Pre-release checklist
│
└── contributing/                # Contributing guides
    ├── BENCHMARKS.md            # Benchmarking guide
    ├── DASHBOARD_SECURITY.md    # Dashboard security examples
    ├── EXAMPLES.md              # Example usage guide
    └── TESTING.md               # Testing guide
```

## Documentation Types

### Core Documentation
Located in `docs/` root:
- **API_CHANGES.md** - API versioning and migration guides
- **ARCHITECTURE.md** - System design and architecture decisions
- **LIMITATIONS.md** - Known limitations and workarounds
- **PERFORMANCE.md** - Performance characteristics and optimization
- **SECURITY.md** - Security features and best practices

### Development Documentation
Located in `docs/development/`:
- **CI_CD.md** - GitHub Actions workflow, npm publishing setup
- **RELEASE_CONFIG.md** - Semantic-release configuration guide
- **RELEASE_CHECKLIST.md** - Pre-release verification checklist

### Contributing Documentation
Located in `docs/contributing/`:
- **BENCHMARKS.md** - How to run and interpret benchmarks
- **DASHBOARD_SECURITY.md** - Dashboard security examples and best practices
- **EXAMPLES.md** - Example usage and configurations
- **TESTING.md** - How to run and write tests

## Migration Notes

All documentation has been moved from various locations to the `docs/` folder:

- `.github/README.md` → `docs/development/CI_CD.md`
- `.releaserc-README.md` → `docs/development/RELEASE_CONFIG.md`
- `test/README.md` → `docs/contributing/TESTING.md`
- `benchmark/README.md` → `docs/contributing/BENCHMARKS.md`
- `examples/README.md` → `docs/contributing/EXAMPLES.md`
- `examples/DASHBOARD_SECURITY.md` → `docs/contributing/DASHBOARD_SECURITY.md`

## Accessing Documentation

- **Main Index**: [docs/README.md](README.md)
- **External Docs**: [Documentation Site](https://sunnyghodeswar.github.io/crashless/)
- **Root README**: [../README.md](../README.md) - Quick start and overview

## NPM Package

Documentation files are excluded from the npm package via `.npmignore`. Only source code (`src/`), type definitions (`index.d.ts`), and license (`LICENSE`) are published.

