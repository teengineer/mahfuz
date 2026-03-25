import { memorizationRepository } from "@mahfuz/db";
import { db } from "@mahfuz/db";
import type { ConfidenceLevel, QualityGrade, VerseKey } from "@mahfuz/shared/types";
import { pushChanges, pullChanges } from "./sync-server-fns";
import { getSyncTimestamp, setSyncTimestamp } from "./sync-metadata";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { useReadingList } from "~/stores/useReadingList";
import type { ReadingListItem } from "~/stores/useReadingList";
import { useReadingHistory } from "~/stores/useReadingHistory";
import { useReadingPrefs } from "~/stores/useReadingPrefs";
import { useDisplayPrefs } from "~/stores/useDisplayPrefs";
import { useAudioPrefs } from "~/stores/useAudioPrefs";
import { useI18nStore } from "~/stores/useI18nStore";
import { useFocusStore } from "~/stores/useFocusStore";
import { useVerseBookmarks } from "~/stores/useVerseBookmarks";
import type { VerseBookmark } from "~/stores/useVerseBookmarks";
import { useReadingStats } from "~/stores/useReadingStats";

type SyncStatus = "idle" | "syncing" | "error";

/** Extract non-function data from a store state */
function extractData(state: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state)) {
    if (typeof value !== "function") {
      data[key] = value;
    }
  }
  return data;
}

/** Keys to exclude from compat shim sync (device-specific) */
const PREFS_EXCLUDE_KEYS = new Set([
  "sidebarCollapsed",
  "hasSeenOnboarding",
]);

function getPrefsData(): Record<string, unknown> {
  // Compat shim data (backward compat with old clients)
  const compatState = usePreferencesStore.getState();
  const compatData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(compatState)) {
    if (!PREFS_EXCLUDE_KEYS.has(key) && typeof value !== "function") {
      compatData[key] = value;
    }
  }

  // v2 split store data
  const readingState = extractData(useReadingPrefs.getState() as unknown as Record<string, unknown>);
  const displayState = extractData(useDisplayPrefs.getState() as unknown as Record<string, unknown>);
  const audioState = extractData(useAudioPrefs.getState() as unknown as Record<string, unknown>);
  const focusRaw = useFocusStore.getState();
  const focusState = {
    focusViewMode: focusRaw.focusViewMode,
    focusFontSize: focusRaw.focusFontSize,
    lastFocusPage: focusRaw.lastFocusPage,
    showAnnotations: focusRaw.showAnnotations,
  };
  const i18nState = { locale: useI18nStore.getState().locale };

  // Bookmarks
  const bookmarks = useVerseBookmarks.getState().bookmarks;

  // Reading stats
  const statsRaw = useReadingStats.getState();
  const statsState = {
    completedPages: statsRaw.completedPages,
    dailyLogs: statsRaw.dailyLogs,
    currentStreak: statsRaw.currentStreak,
    longestStreak: statsRaw.longestStreak,
    khatamCount: statsRaw.khatamCount,
  };

  return {
    ...compatData,
    _v2: {
      reading: readingState,
      display: displayState,
      audio: audioState,
      i18n: i18nState,
      focus: focusState,
    },
    _bookmarks: bookmarks,
    _stats: statsState,
  };
}

export class SyncEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private userId: string;
  private lastSyncAt: number;
  private onStatusChange: (status: SyncStatus, error?: string) => void;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(
    userId: string,
    lastSyncAt: number,
    onStatusChange: (status: SyncStatus, error?: string) => void,
  ) {
    this.userId = userId;
    this.lastSyncAt = lastSyncAt;
    this.onStatusChange = onStatusChange;
  }

  start() {
    // Sync every 5 minutes
    this.intervalId = setInterval(() => this.sync(), 5 * 60 * 1000);

    // Sync on visibility change (tab becomes visible)
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibility);
    }

    // Initial sync
    this.sync();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibility);
    }
  }

  private handleVisibility = () => {
    if (document.visibilityState === "visible") {
      this.sync();
    }
  };

  async sync(): Promise<void> {
    // Skip sync when offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.onStatusChange("idle");
      return;
    }

    this.onStatusChange("syncing");

    try {
      // ── Push phase ──
      const pending = await memorizationRepository.getPendingSyncRecords();

      // Build push payload from sync queue
      const cards: any[] = [];
      const reviews: any[] = [];
      let goals: any = undefined;
      const lessonProgressItems: any[] = [];
      const learnConcepts: any[] = [];
      const questProgressItems: any[] = [];

      for (const record of pending) {
        const data = JSON.parse(record.data);
        switch (record.table) {
          case "memorization_cards":
            cards.push(data);
            break;
          case "review_entries":
            reviews.push(data);
            break;
          case "memorization_goals":
            goals = data;
            break;
          case "lesson_progress":
            lessonProgressItems.push(data);
            break;
          case "learn_concepts":
            learnConcepts.push(data);
            break;
          case "quest_progress":
            questProgressItems.push(data);
            break;
        }
      }

      // Read sync timestamps from centralized metadata
      const prefsSyncTs = getSyncTimestamp("preferences");
      const readingListSyncTs = getSyncTimestamp("readingList");
      const readingHistorySyncTs = getSyncTimestamp("readingHistory");

      // Read Zustand store state for non-queue data
      const readingListState = useReadingList.getState();
      const readingHistoryState = useReadingHistory.getState();

      // Build preferences payload
      const prefsData = getPrefsData();
      const preferencesPayload =
        prefsSyncTs > 0
          ? { data: JSON.stringify(prefsData), updatedAt: prefsSyncTs }
          : undefined;

      // Build reading list payload
      const readingListPayload =
        readingListSyncTs > 0
          ? readingListState.items.map((item) => ({
              id: `${this.userId}-${item.type}-${item.id}`,
              type: item.type,
              itemId: item.id,
              addedAt: item.addedAt,
              lastReadAt: item.lastReadAt,
              deleted: false,
              updatedAt: readingListSyncTs,
            }))
          : undefined;

      // Build reading history payload
      const readingHistoryPayload =
        readingHistorySyncTs > 0
          ? {
              lastSurahId: readingHistoryState.lastSurahId,
              lastSurahName: readingHistoryState.lastSurahName,
              lastPageNumber: readingHistoryState.lastPageNumber,
              lastJuzNumber: readingHistoryState.lastJuzNumber,
              lastVerseKey: readingHistoryState.lastVerseKey,
              lastVerseNum: readingHistoryState.lastVerseNum,
              updatedAt: readingHistorySyncTs,
            }
          : undefined;

      // Push everything
      const hasPendingQueue = pending.length > 0;
      const hasStoreData =
        preferencesPayload || readingListPayload || readingHistoryPayload;

      if (hasPendingQueue || hasStoreData) {
        await pushChanges({
          data: {
            cards,
            reviews,
            goals,
            lessonProgressItems:
              lessonProgressItems.length > 0 ? lessonProgressItems : undefined,
            learnConcepts:
              learnConcepts.length > 0 ? learnConcepts : undefined,
            questProgressItems:
              questProgressItems.length > 0 ? questProgressItems : undefined,
            preferences: preferencesPayload,
            readingListItems: readingListPayload,
            readingHistoryData: readingHistoryPayload,
          },
        });
      }

      // Mark sync queue records as synced
      if (pending.length > 0) {
        await memorizationRepository.markSynced(pending.map((r) => r.id));
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        await memorizationRepository.clearSyncedRecords(sevenDaysAgo);
      }

      // ── Pull phase ──
      const pulled = await pullChanges({ data: { since: this.lastSyncAt } });

      // Merge memorization cards (LWW)
      for (const serverCard of pulled.cards) {
        const localCard = await db.memorization_cards
          .where("[userId+verseKey]")
          .equals([this.userId, serverCard.verseKey])
          .first();

        if (!localCard || serverCard.updatedAt > localCard.updatedAt) {
          await db.memorization_cards.put({
            id: serverCard.id,
            userId: this.userId,
            verseKey: serverCard.verseKey as VerseKey,
            easeFactor: serverCard.easeFactor,
            repetition: serverCard.repetition,
            interval: serverCard.interval,
            nextReviewDate: serverCard.nextReviewDate,
            confidence: serverCard.confidence as ConfidenceLevel,
            totalReviews: serverCard.totalReviews,
            correctReviews: serverCard.correctReviews,
            createdAt: serverCard.createdAt,
            updatedAt: serverCard.updatedAt,
          });
        }
      }

      // Merge reviews (append-only)
      for (const serverReview of pulled.reviews) {
        const exists = await db.review_entries.get(serverReview.id);
        if (!exists) {
          await db.review_entries.add({
            id: serverReview.id,
            userId: this.userId,
            cardId: serverReview.cardId,
            verseKey: serverReview.verseKey as VerseKey,
            grade: serverReview.grade as QualityGrade,
            previousEaseFactor: serverReview.previousEaseFactor,
            newEaseFactor: serverReview.newEaseFactor,
            previousInterval: serverReview.previousInterval,
            newInterval: serverReview.newInterval,
            reviewedAt: serverReview.reviewedAt,
          });
        }
      }

      // Merge badges (append-only)
      for (const badge of pulled.badges) {
        await memorizationRepository.addBadge(this.userId, badge.badgeId);
      }

      // Merge lesson progress (LWW)
      for (const serverLP of pulled.lessonProgressItems) {
        const localLP = await db.lesson_progress
          .where("id")
          .equals(serverLP.id)
          .first();

        if (!localLP || serverLP.updatedAt > (localLP.updatedAt || 0)) {
          await db.lesson_progress.put({
            id: serverLP.id,
            userId: this.userId,
            stageId: serverLP.stageId,
            lessonId: serverLP.lessonId,
            status: serverLP.status as "not_started" | "in_progress" | "completed",
            score: serverLP.score,
            sevapPointEarned: serverLP.sevapPointEarned,
            completedAt: serverLP.completedAt,
            updatedAt: serverLP.updatedAt,
          });
        }
      }

      // Merge learn concepts (LWW)
      for (const serverLC of pulled.learnConcepts) {
        const localLC = await db.learn_concepts
          .where("id")
          .equals(serverLC.id)
          .first();

        if (!localLC || serverLC.updatedAt > (localLC.updatedAt || 0)) {
          await db.learn_concepts.put({
            id: serverLC.id,
            userId: this.userId,
            conceptId: serverLC.conceptId,
            correctCount: serverLC.correctCount,
            incorrectCount: serverLC.incorrectCount,
            masteryLevel: serverLC.masteryLevel as 0 | 1 | 2 | 3,
            nextReviewAt: serverLC.nextReviewAt,
            updatedAt: serverLC.updatedAt,
          });
        }
      }

      // Merge quest progress (LWW + wordsCorrect union)
      for (const serverQP of pulled.questProgressItems) {
        const localQP = await db.quest_progress
          .where("id")
          .equals(serverQP.id)
          .first();

        const serverWords: string[] =
          typeof serverQP.wordsCorrect === "string"
            ? JSON.parse(serverQP.wordsCorrect)
            : serverQP.wordsCorrect;

        if (!localQP || serverQP.updatedAt > (localQP.updatedAt || 0)) {
          // Union wordsCorrect
          const mergedWords = localQP
            ? Array.from(new Set([...localQP.wordsCorrect, ...serverWords]))
            : serverWords;

          await db.quest_progress.put({
            id: serverQP.id,
            userId: this.userId,
            questId: serverQP.questId,
            wordsCorrect: mergedWords,
            totalAttempts: serverQP.totalAttempts,
            totalCorrect: serverQP.totalCorrect,
            sessionsCompleted: serverQP.sessionsCompleted,
            bestSessionScore: serverQP.bestSessionScore,
            lastPlayedAt: serverQP.lastPlayedAt,
            updatedAt: serverQP.updatedAt,
          });
        }
      }

      // Merge preferences (LWW)
      if (pulled.preferences) {
        const localUpdatedAt = getSyncTimestamp("preferences");
        if (pulled.preferences.updatedAt > localUpdatedAt) {
          const serverPrefs = JSON.parse(pulled.preferences.data);
          setSyncTimestamp("preferences", pulled.preferences.updatedAt);

          // Apply to compat shim (backward compat)
          const { _v2, _bookmarks, _stats, ...compatPrefs } = serverPrefs;
          usePreferencesStore.setState(compatPrefs);

          // Apply to v2 split stores
          if (_v2) {
            if (_v2.reading) {
              const { reading } = _v2;
              // Only set data fields, not setters
              const readingData: Record<string, unknown> = {};
              for (const [k, v] of Object.entries(reading)) {
                if (typeof v !== "function") readingData[k] = v;
              }
              useReadingPrefs.setState(readingData);
            }
            if (_v2.display) {
              const displayData: Record<string, unknown> = {};
              for (const [k, v] of Object.entries(_v2.display)) {
                if (typeof v !== "function") displayData[k] = v;
              }
              useDisplayPrefs.setState(displayData);
            }
            if (_v2.audio) {
              const audioData: Record<string, unknown> = {};
              for (const [k, v] of Object.entries(_v2.audio)) {
                if (typeof v !== "function") audioData[k] = v;
              }
              useAudioPrefs.setState(audioData);
            }
            if (_v2.i18n?.locale) {
              useI18nStore.getState().setLocale(_v2.i18n.locale);
            }
            if (_v2.focus) {
              useFocusStore.setState({
                focusViewMode: _v2.focus.focusViewMode,
                focusFontSize: _v2.focus.focusFontSize,
                lastFocusPage: _v2.focus.lastFocusPage,
                showAnnotations: _v2.focus.showAnnotations,
              });
            }
          }

          // Merge bookmarks (union by verseKey, newer addedAt wins)
          if (_bookmarks && Array.isArray(_bookmarks)) {
            const localBookmarks = useVerseBookmarks.getState().bookmarks;
            const bookmarkMap = new Map<string, VerseBookmark>();
            for (const b of localBookmarks) {
              bookmarkMap.set(b.verseKey, b);
            }
            for (const b of _bookmarks as VerseBookmark[]) {
              const existing = bookmarkMap.get(b.verseKey);
              if (!existing || b.addedAt > existing.addedAt) {
                bookmarkMap.set(b.verseKey, b);
              }
            }
            useVerseBookmarks.getState()._setBookmarks(Array.from(bookmarkMap.values()));
          }

          // Merge reading stats
          if (_stats) {
            useReadingStats.getState()._setAll(_stats);
          }
        }
      }

      // Merge reading list (LWW per item + soft delete)
      if (pulled.readingListItems.length > 0) {
        const currentItems = useReadingList.getState().items;
        const itemMap = new Map<string, ReadingListItem>();
        for (const item of currentItems) {
          itemMap.set(`${item.type}-${item.id}`, item);
        }

        let changed = false;
        for (const serverItem of pulled.readingListItems) {
          const key = `${serverItem.type}-${serverItem.itemId}`;
          const local = itemMap.get(key);

          if (serverItem.deleted === 1) {
            if (local) {
              itemMap.delete(key);
              changed = true;
            }
          } else if (!local || serverItem.updatedAt > (local.lastReadAt ?? local.addedAt)) {
            itemMap.set(key, {
              type: serverItem.type as ReadingListItem["type"],
              id: serverItem.itemId,
              addedAt: serverItem.addedAt,
              lastReadAt: serverItem.lastReadAt,
            });
            changed = true;
          }
        }

        if (changed) {
          const maxUpdatedAt = Math.max(
            ...pulled.readingListItems.map((i) => i.updatedAt),
          );
          setSyncTimestamp("readingList", maxUpdatedAt);
          useReadingList.getState()._setItems(
            Array.from(itemMap.values()),
            maxUpdatedAt,
          );
        }
      }

      // Merge reading history (LWW)
      if (pulled.readingHistoryData) {
        const localUpdatedAt = getSyncTimestamp("readingHistory");
        if (pulled.readingHistoryData.updatedAt > localUpdatedAt) {
          setSyncTimestamp("readingHistory", pulled.readingHistoryData.updatedAt);
          useReadingHistory.getState()._setAll(
            {
              lastSurahId: pulled.readingHistoryData.lastSurahId,
              lastSurahName: pulled.readingHistoryData.lastSurahName,
              lastPageNumber: pulled.readingHistoryData.lastPageNumber,
              lastJuzNumber: pulled.readingHistoryData.lastJuzNumber,
              lastVerseKey: pulled.readingHistoryData.lastVerseKey ?? null,
              lastVerseNum: pulled.readingHistoryData.lastVerseNum ?? null,
            },
            pulled.readingHistoryData.updatedAt,
          );
        }
      }

      this.lastSyncAt = Date.now();
      this.retryCount = 0;
      this.onStatusChange("idle");
    } catch (err) {
      this.retryCount++;
      const message =
        err instanceof Error ? err.message : "Sync failed";
      console.error("[SyncEngine]", message);

      if (this.retryCount >= this.maxRetries) {
        this.onStatusChange("error", "sync_failed");
      } else {
        // Will retry on next interval
        this.onStatusChange("idle");
      }
    }
  }

  getLastSyncAt(): number {
    return this.lastSyncAt;
  }
}
