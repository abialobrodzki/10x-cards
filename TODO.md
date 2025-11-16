# TODO - Po aktualizacji dependencies

## ⚠️ Wymagane działania

### 1. Dodaj package-lock.json (KRYTYCZNE!)

Po sprawdzeniu że CI przechodzi, **musisz** dodać package-lock.json do repo:

```bash
# Sklonuj repo lokalnie (jeśli jeszcze nie masz)
git clone https://github.com/abialobrodzki/10x-cards.git
cd 10x-cards

# Przełącz się na branch
git checkout claude/analyze-repository-01Vc8TxEdJbue8jfeYZXhuQg

# Wygeneruj package-lock.json
npm install

# Zacommituj
git add package-lock.json
git commit -m "chore: add updated package-lock.json"
git push

# Opcjonalnie - zmień workflow z powrotem na npm ci
# (można później, ale npm ci jest szybsze niż npm install)
```

**Dlaczego to ważne:**
- package-lock.json zapewnia deterministyczne buildy
- Bez niego każdy `npm install` może zainstalować różne wersje dependencies
- CI obecnie używa fallbacku `npm ci || npm install` - będzie wolniejsze bez lock file

---

## 📋 Kolejne batche aktualizacji

### Batch 2: Astro & Framework packages (Medium Risk)
```json
"astro": "5.5.5" → "5.13+"
"@astrojs/react": "4.2.2" → latest
"@astrojs/sitemap": "3.3.0" → latest
"@astrojs/cloudflare": "12.5.2" → latest
"@astrojs/node": "9.2.1" → latest
```

### Batch 3: Supabase (Medium Risk - wymaga Node.js 20+!)
```json
"@supabase/supabase-js": "2.49.4" → "2.81.1"
"@supabase/ssr": "0.6.1" → latest
```

**⚠️ UWAGA:** Supabase 2.79.0+ wymaga Node.js 20+. Node.js 18 EOL: 30 kwietnia 2025.

### Batch 4: React 19 (HIGH RISK - osobny PR!)
```json
"react": "18.3.1" → "19.2.0"
"react-dom": "18.3.1" → "19.2.0"
"@types/react": "18.3.5" → "19.x"
"@types/react-dom": "18.3.0" → "19.x"
```

**Breaking changes expected!** Przeczytaj migration guide: https://react.dev/blog/2025/10/01/react-19-2

### Batch 5: Vitest 4 (HIGH RISK - osobny PR!)
```json
"vitest": "3.1.2" → "4.0.0"
"@vitest/ui": "3.1.2" → "4.0.0"
"@vitest/coverage-v8": "3.1.2" → "4.0.0"
```

**Breaking changes expected!** Przeczytaj migration guide: https://vitest.dev/guide/migration.html

---

## ✅ Ukończone w Batch 1

- ✅ Playwright 1.52.0 → 1.56.1
- ✅ ESLint 9.23.0 → 9.39.1
- ✅ typescript-eslint 8.28.0 → 8.46.4
- ✅ Radix UI dialogs 1.1.7 → 1.1.15
- ✅ CI workflow z fallbackiem npm ci/install

---

## 🚀 Kiedy to zrobić

1. **Natychmiast:** Dodaj package-lock.json (po verificacji CI)
2. **W tym tygodniu:** Batche 2-3 (Astro, Supabase)
3. **Osobne PR:** React 19, Vitest 4 (wymaga testów i code review)

---

## 📝 Notatki

- Wszystkie zmiany z Batch 1 są backward compatible
- CI obecnie używa fallbacku - zadziała ale będzie wolniejsze
- Node.js 20+ jest już wymagany przez niektóre pakiety
