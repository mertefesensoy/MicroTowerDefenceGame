#!/bin/bash
set -euo pipefail

# Generate Xcode project from project.yml using XcodeGen

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

echo "🏗️  Generating Xcode project from project.yml..."

# Find XcodeGen binary
XCODEGEN_BIN=""
if command -v xcodegen &>/dev/null; then
    XCODEGEN_BIN="xcodegen"
elif [ -f "./bin/xcodegen-final" ]; then
    XCODEGEN_BIN="./bin/xcodegen-final"
else
    echo "❌ XcodeGen not found. Run ./scripts/install_xcodegen.sh first"
    exit 1
fi

# Generate project
"${XCODEGEN_BIN}" generate --spec project.yml

# Verify
if [ ! -d "MicroTowerDefenceGame.xcodeproj" ]; then
    echo "❌ Failed to generate MicroTowerDefenceGame.xcodeproj"
    exit 1
fi

echo "✅ Project generated successfully"
echo ""
echo "Verify with:"
echo "  xcodebuild -list -project MicroTowerDefenceGame.xcodeproj"
echo ""
echo "Open in Xcode:"
echo "  open MicroTowerDefenceGame.xcodeproj"
