import api from "../constant/api";

export const bookmarkService = {
  getBookmarks: () => api.get("/bookmarks/"),

  toggleBookmark: (productId) =>
    api.post("/bookmarks/toggle/", { product_id: productId }),

  getBookmarkStatus: (productId) =>
    api.get("/bookmarks/status/", { params: { product_id: productId } }),

  removeBookmark: (bookmarkId) =>
    api.delete(`/bookmarks/${bookmarkId}/remove/`),
};
