#!/bin/bash
set -euo pipefail

# Pre-flight validation before running fastlane bootstrap or beta
# Catches common configuration errors early

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

echo "🔍 Pre-Flight Validation for Fastlane"
echo ""

ERRORS=0

# Gate 1: .env.match exists
echo "✓ Checking .env.match exists..."
if [ ! -f ".env.match" ]; then
    echo "  ❌ .env.match not found!"
    echo "     Run: cp .env.match.template .env.match"
    echo "     Then fill in real credentials"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ .env.match exists"
fi

# Gate 2: Load environment and check required vars
echo ""
echo "✓ Checking required environment variables..."
if [ -f ".env.match" ]; then
    set +u  # Allow unset vars temporarily
    source .env.match
    set -u
    
    REQUIRED_VARS=(
        "MATCH_GIT_URL"
        "MATCH_GIT_BASIC_AUTHORIZATION"
        "MATCH_PASSWORD"
        "DEVELOPER_PORTAL_TEAM_ID"
        "ASC_KEY_ID"
        "ASC_ISSUER_ID"
        "ASC_KEY_P8_B64"
    )
    
    for VAR in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!VAR:-}" ]; then
            echo "  ❌ Missing: $VAR"
            ERRORS=$((ERRORS + 1))
        else
            # Mask secrets in output
            if [[ "$VAR" == *"PASSWORD"* ]] || [[ "$VAR" == *"AUTHORIZATION"* ]] || [[ "$VAR" == *"P8_B64"* ]]; then
                echo "  ✅ $VAR: [SET]"
            else
                echo "  ✅ $VAR: ${!VAR}"
            fi
        fi
    done
fi

# Gate 3: Validate MATCH_GIT_BASIC_AUTHORIZATION format
echo ""
echo "✓ Validating MATCH_GIT_BASIC_AUTHORIZATION format..."
if [ -n "${MATCH_GIT_BASIC_AUTHORIZATION:-}" ]; then
    # Check for whitespace/newlines
    if echo "$MATCH_GIT_BASIC_AUTHORIZATION" | grep -q $'[[:space:]]'; then
        echo "  ❌ MATCH_GIT_BASIC_AUTHORIZATION contains whitespace/newlines!"
        echo "     Regenerate with: printf 'username:token' | base64 | tr -d '\n'"
        ERRORS=$((ERRORS + 1))
    else
        # Decode and check format
        DECODED=$(echo "$MATCH_GIT_BASIC_AUTHORIZATION" | base64 -d 2>/dev/null || echo "INVALID")
        if [[ "$DECODED" == *":"* ]]; then
            USERNAME=$(echo "$DECODED" | cut -d: -f1)
            echo "  ✅ Decodes to: ${USERNAME}:[TOKEN]"
        else
            echo "  ❌ Decoded value doesn't match 'username:token' format"
            echo "     Got: $DECODED"
            ERRORS=$((ERRORS + 1))
        fi
    fi
fi

# Gate 4: Test match repo access
echo ""
echo "✓ Testing match repository access..."
if [ -n "${MATCH_GIT_URL:-}" ] && [ -n "${MATCH_GIT_BASIC_AUTHORIZATION:-}" ]; then
    if git -c http.extraHeader="AUTHORIZATION: basic $MATCH_GIT_BASIC_AUTHORIZATION" \
          ls-remote --heads "$MATCH_GIT_URL" &>/dev/null; then
        echo "  ✅ Match repo accessible"
        
        # Check branch
        BRANCHES=$(git -c http.extraHeader="AUTHORIZATION: basic $MATCH_GIT_BASIC_AUTHORIZATION" \
                  ls-remote --heads "$MATCH_GIT_URL" 2>/dev/null || echo "")
        
        if echo "$BRANCHES" | grep -q "refs/heads/main"; then
            echo "  ✅ Repo uses 'main' branch (Matchfile configured correctly)"
        elif echo "$BRANCHES" | grep -q "refs/heads/master"; then
            echo "  ⚠️  Repo uses 'master' branch"
            echo "     Update Matchfile: git_branch(\"master\") instead of git_branch(\"main\")"
        elif [ -z "$BRANCHES" ]; then
            echo "  ⚠️  Empty repo (will create 'main' branch on first push)"
        else
            echo "  ⚠️  Unexpected branch structure:"
            echo "$BRANCHES"
        fi
    else
        echo "  ❌ Cannot access match repository!"
        echo "     Check:"
        echo "       - Repository exists and is private"
        echo "       - PAT has 'repo' scope"
        echo "       - MATCH_GIT_URL is correct"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Gate 5: Check XcodeGen and project
echo ""
echo "✓ Checking Xcode project generation..."
if command -v xcodegen &>/dev/null || [ -f "./bin/xcodegen-final" ]; then
    echo "  ✅ XcodeGen available"
    
    if [ -d "MicroTowerDefenceGame.xcodeproj" ]; then
        echo "  ✅ Project already generated"
    else
        echo "  ⚠️  Project not generated yet"
        echo "     Run: ./scripts/generate_project.sh"
    fi
else
    echo "  ❌ XcodeGen not found!"
    echo "     Run: ./scripts/install_xcodegen.sh"
    ERRORS=$((ERRORS + 1))
fi

# Gate 6: Check bundle
echo ""
echo "✓ Checking Ruby dependencies..."
if ! bundle check &>/dev/null; then
    echo "  ⚠️  Bundle dependencies not installed"
    echo "     Run: bundle install --path vendor/bundle"
else
    echo "  ✅ Bundle dependencies installed"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All pre-flight checks passed!"
    echo ""
    echo "Ready to run:"
    echo "  bundle exec fastlane bootstrap_signing  # First time"
    echo "  bundle exec fastlane beta               # Subsequent deploys"
    exit 0
else
    echo "❌ Found $ERRORS error(s). Fix them before running fastlane."
    exit 1
fi
