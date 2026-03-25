import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import { useTranslation } from "~/hooks/useTranslation";

export function OfflineIndicator() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="glass-dark px-4 py-2 text-center text-[13px] font-medium text-white">
      {t.offline.message}
    </div>
  );
}
