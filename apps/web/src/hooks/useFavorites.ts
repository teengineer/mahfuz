import { useCallback } from "react";
import { useReadingPrefs } from "~/stores/useReadingPrefs";

export function useFavorites() {
  const favoriteSurahs = useReadingPrefs((s) => s.favoriteSurahs);
  const setFavoriteSurahs = useReadingPrefs((s) => s.setFavoriteSurahs);

  const isFavorite = useCallback(
    (surahId: number) => favoriteSurahs.includes(surahId),
    [favoriteSurahs],
  );

  const toggleFavorite = useCallback(
    (surahId: number) => {
      if (favoriteSurahs.includes(surahId)) {
        setFavoriteSurahs(favoriteSurahs.filter((id) => id !== surahId));
      } else {
        setFavoriteSurahs([...favoriteSurahs, surahId]);
      }
    },
    [favoriteSurahs, setFavoriteSurahs],
  );

  return { favoriteSurahs, isFavorite, toggleFavorite };
}
