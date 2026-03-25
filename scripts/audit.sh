#!/bin/bash
# Zero-bug prevention audit script
# Checks for common bug patterns that have caused production issues.
# Exit 1 if any violation found.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/apps/legacy/src"
VIOLATIONS=0

echo "=== Mahfuz Code Audit ==="
echo ""

# 1. Check for hardcoded Turkish characters in JSX (excluding locale files, data files)
# Excludes: comments, imports, regex/normalize patterns, language names,
# SEO meta tags, credits data, __root.tsx, share routes, callback route
echo "--- [1] Hardcoded Turkish strings in .tsx JSX ---"
TURKISH_HITS=$(grep -rn '[ğüşöçıİĞÜŞÖÇ]' "$SRC" --include='*.tsx' --exclude-dir=locales --exclude-dir=data | grep -v '/\*' | grep -v '^\s*//' | grep -v 'import ' | grep -v 'normalize(' | grep -v '\.replace(' | grep -v '// ' | grep -v 'RegExp' | grep -v 'match(' | grep -v '"Türkçe"' | grep -v 'Türkçe' | grep -v '__root\.tsx' | grep -v 'credits/index' | grep -v 'share/' | grep -v 'callback\.tsx' | grep -v 'meta:' | grep -v 'title:' | grep -v 'content:' | grep -v 'DAY_LABELS' | grep -v 'pendingComponent' | grep -v 'Loading text=' | grep -v 'aria-label' || true)

if [ -n "$TURKISH_HITS" ]; then
  echo "$TURKISH_HITS"
  COUNT=$(echo "$TURKISH_HITS" | wc -l | tr -d ' ')
  echo "  -> $COUNT warning(s) — review for i18n migration"
else
  echo "  OK"
fi
echo ""

# 2. Check for raw getQueryData/setQueryData calls not using QUERY_KEYS
echo "--- [2] Raw cache key usage (should use QUERY_KEYS) ---"
RAW_CACHE=$(grep -rn 'getQueryData\|setQueryData\|invalidateQueries' "$SRC" --include='*.ts' --include='*.tsx' | grep -v 'query-keys.ts' | grep -v 'QUERY_KEYS' || true)

if [ -n "$RAW_CACHE" ]; then
  echo "$RAW_CACHE"
  COUNT=$(echo "$RAW_CACHE" | wc -l | tr -d ' ')
  echo "  -> $COUNT violation(s)"
  VIOLATIONS=$((VIOLATIONS + COUNT))
else
  echo "  OK"
fi
echo ""

# 3. Check for inline queryKey arrays in queryOptions (should use QUERY_KEYS)
echo "--- [3] Inline queryKey arrays (should use QUERY_KEYS) ---"
INLINE_KEYS=$(grep -rn 'queryKey: \[' "$SRC" --include='*.ts' --include='*.tsx' | grep -v 'query-keys.ts' | grep -v 'node_modules' || true)

if [ -n "$INLINE_KEYS" ]; then
  echo "$INLINE_KEYS"
  COUNT=$(echo "$INLINE_KEYS" | wc -l | tr -d ' ')
  echo "  -> $COUNT violation(s)"
  VIOLATIONS=$((VIOLATIONS + COUNT))
else
  echo "  OK"
fi
echo ""

# Summary
echo "=== Summary ==="
if [ "$VIOLATIONS" -gt 0 ]; then
  echo "FAIL: $VIOLATIONS violation(s) found"
  exit 1
else
  echo "PASS: 0 violations"
  exit 0
fi
