import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { signIn } from "~/lib/auth-client";
import { useTranslation } from "~/hooks/useTranslation";

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "",
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || t.auth.loginFailed);
      } else {
        await router.invalidate();
        router.navigate({ to: redirect || "/browse" });
      }
    } catch {
      setError(t.auth.loginError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: redirect || "/browse",
      });
      if (result?.error) {
        setError(result.error.message || t.auth.googleLoginFailed);
      }
    } catch {
      setError(t.auth.googleLoginError);
    }
  };

  const handleAppleSignIn = async () => {
    setError("");
    try {
      const result = await signIn.social({
        provider: "apple",
        callbackURL: redirect || "/browse",
      });
      if (result?.error) {
        setError(result.error.message || t.auth.appleLoginFailed);
      }
    } catch {
      setError(t.auth.appleLoginError);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--theme-bg)] px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link to="/" className="inline-block">
            <span className="arabic-text text-4xl leading-none text-primary-600">
              محفوظ
            </span>
          </Link>
          <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-[var(--theme-text)]">
            {t.auth.login}
          </h1>
          <p className="mt-1 text-[15px] text-[var(--theme-text-secondary)]">
            {t.auth.loginSubtitle}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-8 shadow-[var(--shadow-card)]">
          {/* Error banner */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
              {error}
            </div>
          )}

          {/* OAuth buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-4 py-3 text-[15px] font-medium text-[var(--theme-text)] transition-all hover:bg-[var(--theme-bg)] active:scale-[0.98]"
            >
              <GoogleIcon />
              {t.auth.continueWithGoogle}
            </button>
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl bg-[#1d1d1f]/40 px-4 py-3 text-[15px] font-medium text-white/50"
            >
              <AppleIcon />
              {t.auth.continueWithApple}
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--theme-divider)]" />
            <span className="text-xs font-medium text-[var(--theme-text-tertiary)]">{t.common.or}</span>
            <div className="h-px flex-1 bg-[var(--theme-divider)]" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13px] font-medium text-[var(--theme-text-secondary)]"
              >
                {t.auth.email}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-3 text-[15px] text-[var(--theme-text)] outline-none transition-all placeholder:text-[var(--theme-text-quaternary)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                placeholder={t.auth.emailPlaceholder}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[13px] font-medium text-[var(--theme-text-secondary)]"
              >
                {t.auth.password}
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-3 text-[15px] text-[var(--theme-text)] outline-none transition-all placeholder:text-[var(--theme-text-quaternary)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                placeholder={t.auth.passwordPlaceholder}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary-600 py-3 text-[15px] font-semibold text-white transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? t.auth.loggingIn : t.auth.login}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13px] text-[var(--theme-text-tertiary)]">
          {t.auth.noAccount}{" "}
          <Link
            to="/auth/register"
            search={{ redirect }}
            className="font-medium text-primary-600 hover:underline"
          >
            {t.auth.register}
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
