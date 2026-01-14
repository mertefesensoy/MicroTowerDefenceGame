#!/bin/bash
set -euo pipefail

# Install XcodeGen for project generation
# This script supports both Homebrew and manual binary installation

XCODEGEN_VERSION="2.42.0"
BIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/bin"

echo "🔧 Installing XcodeGen ${XCODEGEN_VERSION}..."

# Check if XcodeGen is already available
if command -v xcodegen &>/dev/null; then
    INSTALLED_VERSION=$(xcodegen --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    echo "✅ XcodeGen ${INSTALLED_VERSION} already installed system-wide"
    exit 0
fi

# Check if project-local binary exists
if [ -f "${BIN_DIR}/xcodegen-final" ]; then
    INSTALLED_VERSION=$("${BIN_DIR}/xcodegen-final" --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    echo "✅ XcodeGen ${INSTALLED_VERSION} already installed at ./bin/xcodegen-final"
    exit 0
fi

# Try Homebrew first (preferred on macOS)
if command -v brew &>/dev/null; then
    echo "📦 Installing via Homebrew..."
    brew install xcodegen
    echo "✅ XcodeGen installed system-wide via Homebrew"
    exit 0
fi

# Fallback: Manual binary download
echo "⬇️  Downloading XcodeGen ${XCODEGEN_VERSION} binary..."
mkdir -p "${BIN_DIR}"

DOWNLOAD_URL="https://github.com/yonaskolb/XcodeGen/releases/download/${XCODEGEN_VERSION}/xcodegen.zip"
TMP_ZIP="/tmp/xcodegen.zip"
TMP_DIR="/tmp/xcodegen_unzip"

# Download with retry
curl -L --retry 3 --retry-delay 2 "${DOWNLOAD_URL}" -o "${TMP_ZIP}"

# Extract
rm -rf "${TMP_DIR}"
mkdir -p "${TMP_DIR}"
unzip -o "${TMP_ZIP}" -d "${TMP_DIR}"

# Find and install binary
XCODEGEN_BIN=$(find "${TMP_DIR}" -type f -name xcodegen -maxdepth 3 | head -n 1)
if [ -z "${XCODEGEN_BIN}" ]; then
    echo "❌ Failed to find xcodegen binary in downloaded archive"
    exit 1
fi

mv "${XCODEGEN_BIN}" "${BIN_DIR}/xcodegen-final"
chmod +x "${BIN_DIR}/xcodegen-final"

# Remove macOS Gatekeeper quarantine
xattr -dr com.apple.quarantine "${BIN_DIR}/xcodegen-final" 2>/dev/null || true

# Verify
INSTALLED_VERSION=$("${BIN_DIR}/xcodegen-final" --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
echo "✅ XcodeGen ${INSTALLED_VERSION} installed to ./bin/xcodegen-final"

# Cleanup
rm -rf "${TMP_ZIP}" "${TMP_DIR}"
