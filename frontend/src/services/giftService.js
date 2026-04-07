// services/giftService.ts
import api from "../constant/api";

export const giftService = {
  getWheelItems: () => api.get("/gift/wheel-items/"),
  spin: () => api.post("/gift/spin/"),
  canSpin: () => api.get("/gift/can-spin/"),
  mySpins: () => api.get("/gift/my-spins/"),
};
