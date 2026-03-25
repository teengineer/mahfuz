import { createFileRoute, redirect } from "@tanstack/react-router";

// Backward compat redirect: /memorize/mode/:surahId → /memorize/mode/surah/:surahId
export const Route = createFileRoute("/_app/_protected/memorize/mode/$surahId")({
  beforeLoad: ({ params, search }) => {
    throw redirect({ to: "/memorize/mode/$sourceType/$sourceId", params: { sourceType: "surah", sourceId: params.surahId }, search });
  },
  component: () => null,
});
