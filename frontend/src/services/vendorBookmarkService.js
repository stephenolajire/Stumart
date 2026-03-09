// services/vendorBookmarkService.js
import api from "../constant/api";

export const vendorBookmarkService = {
  getVendorBookmarks: () => api.get("/bookmarks/vendors/"),

  toggleVendorBookmark: (vendorId) =>
    api.post("/bookmarks/vendors/toggle/", { vendor_id: vendorId }),

  getVendorBookmarkStatus: (vendorId) =>
    api.get("/bookmarks/vendors/status/", { params: { vendor_id: vendorId } }),

  removeVendorBookmark: (bookmarkId) =>
    api.delete(`/bookmarks/vendors/${bookmarkId}/remove/`),
};
