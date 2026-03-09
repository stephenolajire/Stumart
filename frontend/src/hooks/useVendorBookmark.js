// hooks/useVendorBookmark.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorBookmarkService } from "../services/vendorBookmarkService";

const VENDOR_BOOKMARKS_KEY = "vendor_bookmarks";

// ─────────────────────────────────────────────────────────────────────────────
// Hook: full vendor bookmark list  (used on the Bookmarks page)
// ─────────────────────────────────────────────────────────────────────────────
export const useVendorBookmarks = () => {
  const queryClient = useQueryClient();

  const bookmarksQuery = useQuery({
    queryKey: [VENDOR_BOOKMARKS_KEY],
    queryFn: () => vendorBookmarkService.getVendorBookmarks(),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 2,
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: (bookmarkId) =>
      vendorBookmarkService.removeVendorBookmark(bookmarkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENDOR_BOOKMARKS_KEY] });
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
// Hook: single-vendor bookmark toggle  (used on VendorCard / VendorDetail)
// ─────────────────────────────────────────────────────────────────────────────
export const useVendorBookmarkToggle = (vendorId) => {
  const queryClient = useQueryClient();

  const isLoggedIn = !!localStorage.getItem("access");

  const statusQuery = useQuery({
    queryKey: [VENDOR_BOOKMARKS_KEY, "status", vendorId],
    queryFn: () => vendorBookmarkService.getVendorBookmarkStatus(vendorId),
    enabled: isLoggedIn && !!vendorId,
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5,
  });

  const toggleMutation = useMutation({
    mutationFn: () => vendorBookmarkService.toggleVendorBookmark(vendorId),

    // Optimistic update — heart flips instantly
    onMutate: async () => {
      const key = [VENDOR_BOOKMARKS_KEY, "status", vendorId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old) =>
        old ? { ...old, bookmarked: !old.bookmarked } : old,
      );
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(
        [VENDOR_BOOKMARKS_KEY, "status", vendorId],
        ctx.previous,
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [VENDOR_BOOKMARKS_KEY, "status", vendorId],
      });
      queryClient.invalidateQueries({ queryKey: [VENDOR_BOOKMARKS_KEY] });
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
