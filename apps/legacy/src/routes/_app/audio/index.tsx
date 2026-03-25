import { createFileRoute } from "@tanstack/react-router";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { AudioPage } from "~/components/audio/AudioPage";

export const Route = createFileRoute("/_app/audio/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(chaptersQueryOptions()),
  head: () => ({
    meta: [{ title: "Dinleme | Mahfuz" }],
  }),
  component: AudioPage,
});
