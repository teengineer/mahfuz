import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { SPECIAL_THANKS } from "~/lib/constants";

interface GitHubContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export const Route = createFileRoute("/_app/credits/")({
  component: CreditsPage,
});

const TRANSLATION_CREDITS = [
  {
    name: "Diyanet İşleri Başkanlığı Meali",
    author: "Diyanet İşleri Başkanlığı",
    descKey: "diyanet" as const,
    source: "quran.com API",
    url: "https://quran.com",
  },
  {
    name: "Ömer Çelik Meali",
    author: "Prof. Dr. Ömer Çelik",
    descKey: "pirveysal" as const,
    source: "kuranvemeali.com",
    url: "https://www.kuranvemeali.com",
  },
  {
    name: "Ömer Nasuhi Bilmen Meali",
    author: "Ömer Nasuhi Bilmen",
    descKey: "bilmen" as const,
    source: "kuranayetleri.net",
    url: "https://kuranayetleri.net",
  },
  {
    name: "Ali Fikri Yavuz Meali",
    author: "Ali Fikri Yavuz",
    descKey: "yavuz" as const,
    source: "kuranayetleri.net",
    url: "https://kuranayetleri.net",
  },
  {
    name: "Sahih International",
    author: "Sahih International",
    descKey: "sahihInternational" as const,
    source: "quran.com API",
    url: "https://quran.com",
  },
] as const;

const DATA_CREDITS = [
  {
    name: "Tanzil.net",
    descKey: "tanzil" as const,
    url: "https://tanzil.net",
  },
  {
    name: "Quran.com API",
    descKey: "quranApi" as const,
    url: "https://quran.com",
  },
  {
    name: "Kuran Meali Ebook Oluşturucu",
    descKey: "quranJsonRepo" as const,
    url: "https://github.com/alialparslan/Kuran-Meali-Ebook-Olusturucu",
    author: "alialparslan",
  },
] as const;

const FONT_CREDITS = [
  {
    name: "KFGQPC Uthmani Hafs",
    descKey: "kfgqpc" as const,
    url: "https://fonts.qurancomplex.gov.sa",
  },
  {
    name: "Google Fonts",
    descKey: "googleFonts" as const,
    url: "https://fonts.google.com",
  },
] as const;

const ISSUE_LINK_DEFS = [
  { key: "featureRequest" as const, templateTr: "feature-request.yml", templateEn: "feature-request-en.yml", iconBg: "bg-blue-500", iconPath: '<path d="M12 5v14M5 12h14" />' },
  { key: "bugReport" as const, templateTr: "bug-report.yml", templateEn: "bug-report-en.yml", iconBg: "bg-red-500", iconPath: '<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />' },
  { key: "copyright" as const, templateTr: "copyright.yml", templateEn: "copyright-en.yml", iconBg: "bg-amber-500", iconPath: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />' },
  { key: "message" as const, templateTr: "message.yml", templateEn: "message-en.yml", iconBg: "bg-teal-500", iconPath: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />' },
  { key: "contribute" as const, templateTr: "contribute.yml", templateEn: "contribute-en.yml", iconBg: "bg-purple-500", iconPath: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />' },
] as const;

function CreditsPage() {
  const { t, locale } = useTranslation();

  const { data: contributors } = useQuery<GitHubContributor[]>({
    queryKey: ["github", "contributors"],
    queryFn: async () => {
      const res = await fetch(
        "https://api.github.com/repos/theilgaz/mahfuz/contributors?per_page=50"
      );
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-[var(--theme-text)]">
        {t.credits.title}
      </h1>
      <p className="mb-10 text-sm text-[var(--theme-text-tertiary)]">
        {t.credits.subtitle}
      </p>

      {/* Dev Team */}
      {contributors && contributors.length > 0 && (
        <CreditsSection title={t.credits.devTeam}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {contributors.map((c) => (
              <div key={c.login} className="flex items-center gap-3">
                <img
                  src={c.avatar_url}
                  alt={c.login}
                  className="h-10 w-10 rounded-full ring-2 ring-[var(--theme-border)]"
                />
                <div className="min-w-0 flex-1">
                  <a
                    href={c.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-semibold text-[var(--theme-text)] hover:text-primary-600 transition-colors"
                  >
                    @{c.login}
                  </a>
                  <p className="text-[12px] text-[var(--theme-text-tertiary)]">
                    {c.contributions} {t.credits.commits}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CreditsSection>
      )}

      {/* Translations */}
      <CreditsSection title={t.credits.translations}>
        <div className="space-y-4">
          {TRANSLATION_CREDITS.map((item) => (
            <CreditCard
              key={item.name}
              name={item.name}
              author={item.author}
              description={t.credits.translationCredits[item.descKey]}
              source={item.source}
              url={item.url}
            />
          ))}
        </div>
      </CreditsSection>

      {/* Data sources */}
      <CreditsSection title={t.credits.dataSources}>
        <div className="space-y-4">
          {DATA_CREDITS.map((item) => (
            <CreditCard
              key={item.name}
              name={item.name}
              author={"author" in item ? item.author : undefined}
              description={t.credits.dataCredits[item.descKey]}
              url={item.url}
            />
          ))}
        </div>
      </CreditsSection>

      {/* Fonts */}
      <CreditsSection title={t.credits.fontsSection}>
        <div className="space-y-4">
          {FONT_CREDITS.map((item) => (
            <CreditCard
              key={item.name}
              name={item.name}
              description={t.credits.fontCredits[item.descKey]}
              url={item.url}
            />
          ))}
        </div>
      </CreditsSection>

      {/* Disclaimer */}
      <div className="mb-10 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-5">
        <p className="text-[13px] leading-relaxed text-[var(--theme-text-tertiary)]">
          {t.credits.disclaimer}
        </p>
      </div>

      {/* Special Thanks */}
      <CreditsSection title={t.credits.specialThanks}>
        <p className="mb-4 text-[13px] text-[var(--theme-text-tertiary)]">
          {t.credits.specialThanksDesc}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SPECIAL_THANKS.map((person) => (
            <div key={person.github} className="flex items-center gap-3">
              <img
                src={`https://github.com/${person.github}.png`}
                alt={person.name}
                className="h-10 w-10 rounded-full ring-2 ring-[var(--theme-border)]"
              />
              <div>
                <a
                  href={`https://github.com/${person.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-semibold text-[var(--theme-text)] hover:text-primary-600 transition-colors"
                >
                  {person.name}
                </a>
                <p className="text-[12px] text-[var(--theme-text-tertiary)]">@{person.github}</p>
              </div>
            </div>
          ))}
        </div>
      </CreditsSection>

      {/* Contact & Contribute */}
      <CreditsSection title={t.credits.contactUs}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ISSUE_LINK_DEFS.map((link) => {
            const template = locale === "tr" ? link.templateTr : link.templateEn;
            return (
              <a
                key={link.key}
                href={`https://github.com/theilgaz/mahfuz/issues/new?template=${template}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-[var(--theme-border)] px-3.5 py-3 transition-colors hover:bg-[var(--theme-hover-bg)]"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white ${link.iconBg}`}>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: link.iconPath }} />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-[var(--theme-text)]">{t.credits.issueLinks[link.key]}</span>
                </div>
              </a>
            );
          })}
        </div>
      </CreditsSection>
    </div>
  );
}

function CreditsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--theme-text-tertiary)]">
        {title}
      </h2>
      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-5">
        {children}
      </div>
    </section>
  );
}

function CreditCard({ name, author, description, source, url }: {
  name: string;
  author?: string;
  description: string;
  source?: string;
  url: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600/10 text-primary-700">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[var(--theme-text)]">{name}</span>
          {source && (
            <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
              {source}
            </span>
          )}
        </div>
        {author && (
          <span className="text-[12px] text-[var(--theme-text-secondary)]">{author}</span>
        )}
        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--theme-text-tertiary)]">
          {description}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:text-primary-700"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          {new URL(url).hostname}
        </a>
      </div>
    </div>
  );
}
