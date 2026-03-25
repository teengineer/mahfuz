import type { Messages } from "../types";
import { core } from "./core";
import { themeMessages } from "./theme";
import { pages } from "./pages";
import { browseMessages } from "./browse";
import { readingMessages } from "./reading";
import { learnMessages } from "./learn";
import { memorizeMessages } from "./memorize";
import { media } from "./media";
import { settingsMessages } from "./settings";
import { discoverMessages } from "./discover";
import { kidsMessages } from "./kids";

export const en = {
  ...core,
  ...themeMessages,
  ...pages,
  ...browseMessages,
  ...readingMessages,
  ...learnMessages,
  ...memorizeMessages,
  ...media,
  ...settingsMessages,
  ...discoverMessages,
  ...kidsMessages,
} as const satisfies Messages;
