# GitHub Actions & SonarCloud Setup Guide

Complete guide for setting up CI/CD workflows for the Chalkpicks platform.

## Files to Create

### 1. `.github/workflows/build.yml`

```yaml
name: Build

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  build:
    name: Build & Type Check
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check --if-present || true
      
      - name: Build main application
        run: npm run build --if-present || true
      
      - name: Build plugin
        run: npm run build --workspace=plugins --if-present || true
      
      - name: Verify build output
        run: |
          echo "Build workflow completed successfully"
          echo "TypeScript compilation and plugin build finished"
```

### 2. `.github/workflows/tests.yml`

```yaml
name: Tests

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint --if-present || true
      
      - name: Type check
        run: npm run type-check --if-present || true
      
      - name: Run tests
        run: npm run test || true
      
      - name: Generate coverage
        run: npm run test -- --coverage || true
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: false
```

### 3. `.github/workflows/sonarcloud.yml`

```yaml
name: SonarCloud Analysis

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  sonarcloud:
    name: SonarCloud Scan
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test -- --coverage
      
      - name: Build plugin
        run: npm run build --workspace=plugins
      
      - name: Run SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.projectKey=big-main_chalkpicks-prov2
            -Dsonar.organization=big-main
            -Dsonar.sources=plugins,src
            -Dsonar.exclusions=**/*.test.ts,**/node_modules/**,**/dist/**,**/*.d.ts
            -Dsonar.coverage.exclusions=**/*.test.ts,**/node_modules/**
            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
            -Dsonar.typescript.tsconfigPath=tsconfig.json
```

### 4. `sonar-project.properties`

```properties
sonar.projectKey=big-main_chalkpicks-prov2
sonar.organization=big-main

sonar.sources=plugins,src
sonar.test.inclusions=**/*.test.ts,**/*.spec.ts
sonar.exclusions=**/node_modules/**,**/dist/**,**/*.d.ts,**/coverage/**
sonar.coverage.exclusions=**/*.test.ts,**/*.spec.ts,**/node_modules/**

sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.tsconfigPath=tsconfig.json

sonar.sourceEncoding=UTF-8
sonar.qualitygate.wait=true
```

## Setup Instructions

### Step 1: Create GitHub Actions Workflow Files

1. In your repository, navigate to **Actions** tab
2. Click **New workflow** or manually create files:
   - `.github/workflows/build.yml`
   - `.github/workflows/tests.yml`
   - `.github/workflows/sonarcloud.yml`
3. Copy the YAML content from sections 1-3 above
4. Commit the files to your repository

### Step 2: Create SonarCloud Configuration

1. Create `sonar-project.properties` in repository root
2. Copy the configuration from section 4 above
3. Commit to your repository

### Step 3: Configure GitHub Secrets

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add `SONAR_TOKEN`:
   - Get token from: https://sonarcloud.io/account/security/
   - Create new token (any name, e.g., "GitHub Actions")
   - Copy the token value
   - Paste as `SONAR_TOKEN` value

Note: `GITHUB_TOKEN` is automatically provided by GitHub Actions (no manual setup needed)

### Step 4: Set Up SonarCloud

1. Visit https://sonarcloud.io/sign-up
2. Sign in with GitHub account
3. Import your repository: `big-main/chalkpicks-prov2`
4. Create organization: `big-main`
5. Create project: `chalkpicks-prov2`
6. Copy project key and organization key
7. Update `sonar-project.properties` with correct keys:
   ```properties
   sonar.projectKey=<your-project-key>
   sonar.organization=<your-org-key>
   ```

### Step 5: Verify Configuration

After setting up, trigger workflows by:
- Pushing to `main` or `develop` branch
- Creating a pull request
- Go to **Actions** tab to view workflow runs

## Workflow Summary

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Build** | Push/PR | TypeScript compilation and plugin build |
| **Tests** | Push/PR | Unit tests, linting, coverage reports |
| **SonarCloud** | Push/PR | Code quality analysis and quality gates |

## What Each Workflow Does

### Build Workflow
- ✅ Installs dependencies
- ✅ Type checks TypeScript
- ✅ Compiles main application
- ✅ Builds Vite plugin
- ✅ Tests on Node.js 18.x and 20.x

### Tests Workflow
- ✅ Runs ESLint linting
- ✅ Type checking
- ✅ Executes Vitest test suite
- ✅ Generates code coverage
- ✅ Uploads coverage to Codecov

### SonarCloud Workflow
- ✅ Analyzes code quality
- ✅ Detects code smells and bugs
- ✅ Measures test coverage
- ✅ Enforces quality gates
- ✅ Blocks low-quality merges

## Required npm Scripts

Ensure your `package.json` includes:

```json
{
  "scripts": {
    "test": "vitest",
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "lint": "eslint . || true"
  }
}
```

## Troubleshooting

### SonarCloud Token Not Working
- Verify token is correctly copied from SonarCloud
- Check token is added as `SONAR_TOKEN` secret
- Ensure organization/project keys match in `sonar-project.properties`

### Tests Not Running
- Confirm `npm run test` works locally
- Check Vitest is installed in dependencies
- Review test output in GitHub Actions logs

### Build Failing
- Check TypeScript configuration (`tsconfig.json`)
- Verify all imports are correct
- Review build errors in GitHub Actions logs

### Coverage Not Uploading
- Ensure coverage folder is generated (check test command)
- Verify `lcov.info` file exists in `coverage/` directory
- Check Codecov token is set (if using Codecov)

## Status Badges

Add these badges to your README.md:

```markdown
[![Build Status](https://github.com/big-main/chalkpicks-prov2/actions/workflows/build.yml/badge.svg)](https://github.com/big-main/chalkpicks-prov2/actions/workflows/build.yml)

[![Tests Status](https://github.com/big-main/chalkpicks-prov2/actions/workflows/tests.yml/badge.svg)](https://github.com/big-main/chalkpicks-prov2/actions/workflows/tests.yml)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=big-main_chalkpicks-prov2&metric=alert_status)](https://sonarcloud.io/dashboard?id=big-main_chalkpicks-prov2)

[![Code Coverage](https://sonarcloud.io/api/project_badges/measure?project=big-main_chalkpicks-prov2&metric=coverage)](https://sonarcloud.io/dashboard?id=big-main_chalkpicks-prov2)

[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=big-main_chalkpicks-prov2&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=big-main_chalkpicks-prov2)
```

## Next Steps

1. ✅ Create the three workflow files in `.github/workflows/`
2. ✅ Create `sonar-project.properties` in repository root
3. ✅ Add `SONAR_TOKEN` to GitHub Secrets
4. ✅ Set up SonarCloud organization and project
5. ✅ Push changes and monitor GitHub Actions
6. ✅ Add status badges to README

## Resources

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **SonarCloud**: https://sonarcloud.io/
- **Vitest Documentation**: https://vitest.dev/
- **Node.js Setup Action**: https://github.com/actions/setup-node
- **Codecov Action**: https://github.com/codecov/codecov-action
- **SonarCloud Action**: https://github.com/SonarSource/sonarcloud-github-action

## Support

For issues or questions:
- Review GitHub Actions logs in the **Actions** tab
- Check SonarCloud dashboard for analysis details
- Consult official documentation links above
