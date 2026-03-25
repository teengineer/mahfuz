import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      await router.invalidate();
      router.navigate({ to: "/browse" });
    };
    redirect();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--theme-bg)]">
      {/* Spinner */}
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--theme-divider)] border-t-primary-600" />
      <p className="text-[15px] font-medium text-[var(--theme-text-secondary)]">
        Yönlendiriliyor...
      </p>
    </div>
  );
}
