As a seasoned systems architect, I'll guide you through a robust branching strategy that's battle-tested in production environments. This approach will give you complete isolation between v1 and v2 while maintaining flexibility for hotfixes and feature development.

## Production-Ready Git Branching Strategy

### Branch Structure

```bash
# Your repository structure should look like this:
main (production v1)
├── develop-v1 (v1 ongoing development)
├── develop-v2 (v2 main development branch)
├── hotfix/* (critical v1 fixes)
├── feature-v2/* (v2 features)
└── release/* (controlled releases)
```

### Initial Setup Commands

```bash
# 1. Ensure you're on main (production v1)
git checkout main
git pull origin main

# 2. Create v1 development branch if it doesn't exist
git checkout -b develop-v1
git push -u origin develop-v1

# 3. Create v2 development branch
git checkout -b develop-v2
git push -u origin develop-v2

# 4. Create your first v2 feature branch
git checkout -b feature-v2/initial-architecture
```

### Daily Workflow

**Working on v2 Features:**
```bash
# Start a new v2 feature
git checkout develop-v2
git pull origin develop-v2
git checkout -b feature-v2/your-feature-name

# Work on your feature, commit changes
git add .
git commit -m "feat(v2): implement your feature"

# Push feature branch
git push -u origin feature-v2/your-feature-name

# When feature is complete, merge to develop-v2
git checkout develop-v2
git pull origin develop-v2
git merge feature-v2/your-feature-name
git push origin develop-v2

# Clean up feature branch
git branch -d feature-v2/your-feature-name
git push origin --delete feature-v2/your-feature-name
```

**Emergency v1 Hotfixes:**
```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Fix the issue, commit
git add .
git commit -m "fix: resolve critical bug in v1"

# Merge to main
git checkout main
git merge hotfix/critical-bug-fix
git tag v1.x.y  # version tag
git push origin main --tags

# Also merge to develop-v1 to keep it updated
git checkout develop-v1
git merge hotfix/critical-bug-fix
git push origin develop-v1

# Clean up
git branch -d hotfix/critical-bug-fix
git push origin --delete hotfix/critical-bug-fix

# Return to v2 work
git checkout develop-v2
```

**v1 Regular Updates:**
```bash
# For planned v1 updates
git checkout develop-v1
git pull origin develop-v1

# Work on v1 improvements
git add .
git commit -m "feat(v1): add improvement"

# When ready to release v1 updates
git checkout main
git merge develop-v1
git tag v1.x.y
git push origin main --tags
```

### Environment Configuration

Create environment-specific configurations:

**.env.v1**
```bash
REACT_APP_VERSION=v1
REACT_APP_API_BASE_URL=https://api-v1.yourproject.com
REACT_APP_FEATURE_FLAGS=v1_features
```

**.env.v2**
```bash
REACT_APP_VERSION=v2
REACT_APP_API_BASE_URL=https://api-v2.yourproject.com
REACT_APP_FEATURE_FLAGS=v2_features,new_ui,advanced_features
```

**package.json scripts:**
```json
{
  "scripts": {
    "start:v1": "cp .env.v1 .env && react-scripts start",
    "start:v2": "cp .env.v2 .env && react-scripts start",
    "build:v1": "cp .env.v1 .env && react-scripts build",
    "build:v2": "cp .env.v2 .env && react-scripts build",
    "test:v1": "cp .env.v1 .env && react-scripts test",
    "test:v2": "cp .env.v2 .env && react-scripts test"
  }
}
```

### Release Strategy

**Testing v2 Features:**
```bash
# Create release branch from develop-v2
git checkout develop-v2
git checkout -b release/v2.1.0

# Test, fix any issues in release branch
git commit -m "fix: pre-release bug fixes"

# When ready to announce
git checkout develop-v2
git merge release/v2.1.0
git push origin develop-v2
```

**Feature Announcements & Merging:**
```bash
# When v2 is ready for production
git checkout main
git merge develop-v2
git tag v2.0.0
git push origin main --tags

# Update develop-v1 with any shared fixes
git checkout develop-v1
git merge main  # or cherry-pick specific commits
git push origin develop-v1
```

### CI/CD Configuration

**GitHub Actions / GitLab CI:**
```yaml
name: Deployment Pipeline

on:
  push:
    branches: [ main, develop-v1, develop-v2 ]
  pull_request:
    branches: [ main, develop-v1, develop-v2 ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        version: [v1, v2]
    steps:
      - uses: actions/checkout@v3
      - name: Test ${{ matrix.version }}
        run: npm run test:${{ matrix.version }}

  deploy-staging:
    if: github.ref == 'refs/heads/develop-v2'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy v2 to staging
        run: npm run deploy:staging:v2

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: npm run deploy:production
```

### Best Practices Summary

1. **Never work directly on main or develop branches** - always use feature branches
2. **Keep commits atomic and well-documented** - use conventional commit messages
3. **Test thoroughly before merging** - run both v1 and v2 test suites
4. **Use tags for releases** - makes rollbacks easier
5. **Document breaking changes** - especially when merging v2 to main
6. **Regular syncing** - pull latest changes frequently to avoid conflicts

### Quick Reference Commands

```bash
# Switch contexts quickly
alias v1="git checkout develop-v1 && cp .env.v1 .env"
alias v2="git checkout develop-v2 && cp .env.v2 .env"
alias prod="git checkout main && cp .env.v1 .env"

# Emergency hotfix
alias hotfix="git checkout main && git pull && git checkout -b hotfix/"

# Feature development
alias feature="git checkout develop-v2 && git pull && git checkout -b feature-v2/"
```

This strategy gives you complete isolation between versions while maintaining the flexibility to work on both. The key is discipline in following the branching model and never taking shortcuts that could compromise either version.