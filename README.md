<div align="center">

<br>

<img src="apps/web/public/images/mahfuz-logo.svg" width="320" alt="Mahfuz — محفوظ">

<br>

A minimal, distraction-free Quran reading experience on the web.

**[mahfuz.ilg.az](https://mahfuz.ilg.az)**

<br>

</div>

---

## About

Mahfuz is a Quran companion designed around simplicity. No clutter, no ads — just the text and the tools you need to read, listen, and learn.

- **Three reading modes** — Line-by-line for focused reading, word-by-word with inline translation and transliteration, and a traditional Mushaf page with Karahisari-style illuminated borders in CSS and SVG.
- **Audio playback** — Verse or surah-level playback with real-time word highlighting, gapless preloading, reciter selection, adjustable speed, and lock screen controls via MediaSession.
- **Offline first** — Three-layer caching strategy: in-memory, IndexedDB, and Service Worker.
- **Memorization** — SM-2 spaced repetition, progress tracking per surah and ayah, daily goals and review sessions.

## Roadmap

| Status | Feature |
|:------:|---------|
| ✅ | Reading — Three view modes with offline support |
| ✅ | Audio — Verse-level playback with word sync |
| ✅ | Memorization — Spaced repetition with SM-2 |
| 🔜 | Sync — Cross-device progress sync |
| 🔜 | Gamification — Achievements, streaks, challenges |
| 🔜 | Share & SEO — Social sharing, public surah pages |
| 🔜 | Mobile — Native Android and iOS apps |

## Getting Started

```bash
git clone https://github.com/theilgaz/mahfuz.git
cd mahfuz
npx pnpm@9 install
cp apps/web/.env.example apps/web/.env
npx pnpm@9 dev
```

Dev server runs at `http://localhost:3000`.

## Tech Stack

React 19 · TanStack Start · TanStack Router · Vite 7 · Tailwind v4 · Zustand · Better Auth · Drizzle ORM · LibSQL · Turborepo · pnpm · Netlify

## Project Structure

```
apps/web              Main web application
packages/api          Quran.com API client
packages/audio-engine Playback engine with word-level sync
packages/db           IndexedDB cache layer (Dexie)
packages/memorization SM-2 spaced repetition engine
packages/shared       Types and constants
tooling/              Shared ESLint, TypeScript, Tailwind configs
```

## Credits

### Translations

| Translation | Author | Source |
|-------------|--------|--------|
| Diyanet İşleri Başkanlığı Meali | Diyanet İşleri Başkanlığı | [quran.com](https://quran.com) API |
| Ömer Çelik Meali | Prof. Dr. Ömer Çelik | [kuranvemeali.com](https://www.kuranvemeali.com) |
| Ömer Nasuhi Bilmen Meali | Ömer Nasuhi Bilmen | [kuranayetleri.net](https://kuranayetleri.net) |
| Ali Fikri Yavuz Meali | Ali Fikri Yavuz | [kuranayetleri.net](https://kuranayetleri.net) |

### Data Sources

- **[Quran.com API](https://quran.com)** — Verse text, word-by-word data, transliteration, and Diyanet translation
- **[Kuran Meali Ebook Oluşturucu](https://github.com/alialparslan/Kuran-Meali-Ebook-Olusturucu)** by alialparslan — Ali Fikri Yavuz and Ömer Nasuhi Bilmen translations in JSON format

### Fonts

- **[KFGQPC Uthmani Hafs](https://fonts.qurancomplex.gov.sa)** — King Fahd Glorious Quran Printing Complex
- **[Google Fonts](https://fonts.google.com)** — Scheherazade New, Amiri, Noto Naskh Arabic, Rubik, Zain, Reem Kufi, Playpen Sans Arabic

## Contributing

We'd love to have talented developers join the journey. Whether you're into React, mobile development, or just passionate about building tools for the Quran — there's a place for you here.

Start by opening an issue to discuss your idea, then send a PR.

## License

MIT
