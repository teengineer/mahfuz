import { useEffect } from "react";
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getSession } from "~/lib/auth-session";
import type { Session } from "~/lib/auth";
import { migrateV1ToV2 } from "~/lib/store-migration";
import { useI18nStore } from "~/stores/useI18nStore";
import { getLocaleConfig } from "~/locales/registry";
import appCss from "~/styles/app.css?url";

/** Inline critical CSS — splash overlay covers FOUC until Tailwind loads */
const SPLASH_CSS = [
  ".mahfuz-splash{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#f5f5f7}",
  ".mahfuz-splash svg{animation:sp 1.8s ease-in-out infinite}",
  "@keyframes sp{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}",
].join("");

interface RouterContext {
  queryClient: QueryClient;
  session: Session | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const session = await getSession();
    return { session };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mahfuz v2 | Kuran-ı Kerim" },
      { name: "theme-color", content: "#1c3f44" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&display=swap" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "preload",
        href: "/fonts/KFGQPCUthmanicScriptHAFS.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/icons/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/icons/favicon-16.png" },
    ],
  }),
  component: ({ children }: { children: ReactNode }) => (
    <RootLayout>{children}</RootLayout>
  ),
});

function RootLayout({ children }: { children: ReactNode }) {
  const locale = useI18nStore((s) => s.locale);
  const { dir, bcp47 } = getLocaleConfig(locale);

  useEffect(() => {
    const run = () => migrateV1ToV2();
    if ("requestIdleCallback" in window) {
      requestIdleCallback(run);
    } else {
      setTimeout(run, 0);
    }
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const register = () => navigator.serviceWorker.register("/sw.js");
      if ("requestIdleCallback" in window) {
        requestIdleCallback(register);
      } else {
        setTimeout(register, 2000);
      }
    }
  }, []);

  return (
    <html lang={bcp47} dir={dir}>
      <head suppressHydrationWarning>
        {/* Inline critical CSS: splash overlay covers unstyled content until Tailwind loads */}
        <style dangerouslySetInnerHTML={{ __html: SPLASH_CSS }} />
        <HeadContent />
      </head>
      <body>
        {/* Splash screen — visible before CSS loads, hidden by app.css */}
        <div className="mahfuz-splash" aria-hidden="true">
          <svg viewBox="118 152 93 138" width="43" height="64">
            <defs>
              <linearGradient id="sg" x1="0.15" y1="0" x2="0.85" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="35%" stopColor="#10b981" />
                <stop offset="70%" stopColor="#059669" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
            <path fill="url(#sg)" d="M177,156.577c-8.706,1.423-15.241,6.257-17.357,8.65-2.167,2.441-6.147,6.7-7.332,16.905a22.5,22.5,0,0,0-6.146,1.177C141.051,185,133.3,188.382,128.5,196.9c-6.245,10.51-6.639,18.538-4.918,29.366a107.479,107.479,0,0,0,6.079,21.233,170.644,170.644,0,0,0,11.662,23.951c9,15.2,15.162,11.33,15.162,11.33s3.214-1.5,2.608-7.314c-.787-7.318-4.208-15.237-7.753-25.458-3.676-10.615-9.41-28.628-9.161-43.646a15.176,15.176,0,0,1,6.914.213c2.977.638,13.827,6.267,18.231,8.775,4.389,2.485,9.157,5.248,10.66,6s9.584,5.142,17.985,1.4c8.5-3.8,11.39-16.2,10.992-21.94-.426-5.931-9.2-26.056-12.387-31.049-2.946-4.645-7.724-13.344-15.709-13.344a10.621,10.621,0,0,0-1.863.158m-3,33.554c-2.086-1.209-5.535-3.129-5.535-3.129a39.562,39.562,0,0,1,2.981-18.02c.822.526,9.23,8.512,14.269,28.126-2.914-1.713-9.637-5.758-11.715-6.977" />
          </svg>
        </div>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
