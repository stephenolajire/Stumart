// hooks/useBookmark.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookmarkService } from "../services/bookmarkService";

const BOOKMARKS_KEY = "bookmarks";

// ─────────────────────────────────────────────────────────────────────────────
// Hook: full bookmark list  (used on the Bookmarks page)
// ─────────────────────────────────────────────────────────────────────────────
export const useBookmarks = () => {
  const queryClient = useQueryClient();

  const bookmarksQuery = useQuery({
    queryKey: [BOOKMARKS_KEY],
    queryFn: () => bookmarkService.getBookmarks(),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 2,
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: (bookmarkId) => bookmarkService.removeBookmark(bookmarkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKMARKS_KEY] });
    },
  });

  return {
    bookmarks: bookmarksQuery.data?.bookmarks ?? [],
    count: bookmarksQuery.data?.count ?? 0,
    isLoading: bookmarksQuery.isLoading,
    isError: bookmarksQuery.isError,
    error: bookmarksQuery.error,

    removeBookmark: (bookmarkId) => removeBookmarkMutation.mutate(bookmarkId),
    isRemoving: removeBookmarkMutation.isPending,
    removeBookmarkError: removeBookmarkMutation.error,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook: single-product bookmark toggle  (used on Card / ProductDetail)
// ─────────────────────────────────────────────────────────────────────────────
export const useBookmarkToggle = (productId) => {
  const queryClient = useQueryClient();

  // Read token directly — same source of truth as ProtectedRoute
  const isLoggedIn = !!localStorage.getItem("access");

  const statusQuery = useQuery({
    queryKey: [BOOKMARKS_KEY, "status", productId],
    queryFn: () => bookmarkService.getBookmarkStatus(productId),
    enabled: isLoggedIn && !!productId,
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5,
  });

  const toggleMutation = useMutation({
    mutationFn: () => bookmarkService.toggleBookmark(productId),

    // Optimistic update — heart flips instantly
    onMutate: async () => {
      const key = [BOOKMARKS_KEY, "status", productId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old) =>
        old ? { ...old, bookmarked: !old.bookmarked } : old,
      );
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      // Roll back on failure
      queryClient.setQueryData(
        [BOOKMARKS_KEY, "status", productId],
        ctx.previous,
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [BOOKMARKS_KEY, "status", productId],
      });
      queryClient.invalidateQueries({ queryKey: [BOOKMARKS_KEY] });
    },
  });

  return {
    isBookmarked: statusQuery.data?.bookmarked ?? false,
    bookmarkId: statusQuery.data?.bookmark_id ?? null,
    isLoggedIn,
    isLoading: statusQuery.isLoading,

    toggle: () => toggleMutation.mutate(),
    isToggling: toggleMutation.isPending,
    toggleError: toggleMutation.error,
  };
};
