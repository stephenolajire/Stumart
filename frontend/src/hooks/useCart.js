// hooks/useCart.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartService } from "../services/cartService";

export const CART_KEY = ["cart"];

/**
 * Normalise the raw Axios response into the cart object regardless of whether
 * Django wraps it in a { data: {...} } envelope or returns the cart directly.
 *
 * Possible shapes from the backend:
 *   A) { items, count, sub_total, ... }          ← direct
 *   B) { data: { items, count, sub_total, ... } } ← wrapped
 *   C) axios wraps everything: res.data = shape A or B
 */
const selectCart = (res) => {
  const body = res?.data ?? res; // unwrap axios
  const cart = body?.data ?? body; // unwrap optional Django envelope
  return cart;
};

export const useCart = () => {
  const queryClient = useQueryClient();
  const isLoggedIn = !!localStorage.getItem("access");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const cartQuery = useQuery({
    queryKey: CART_KEY,
    queryFn: cartService.getCart,
    enabled: isLoggedIn,
    select: selectCart,
    staleTime: 1000 * 60 * 5,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: CART_KEY });

  /**
   * patchCache — update specific fields in the already-selected cart object.
   *
   * IMPORTANT: after `select` runs, React Query stores the *selected* value
   * in the cache. So `getQueryData` returns the cart object directly (not the
   * raw axios response). We patch that object and write it back the same way.
   */
  const patchCache = (updater) => {
    queryClient.setQueryData(CART_KEY, (old) => {
      if (!old) return old;
      const updated = updater(old);
      return { ...old, ...updated };
    });
  };

  // ── Add to cart ────────────────────────────────────────────────────────────
  const addToCartMutation = useMutation({
    mutationFn: (payload) => cartService.addToCart(payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData(CART_KEY);

      patchCache((old) => ({
        count: (old.count || 0) + (payload.quantity || 1),
      }));

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined)
        queryClient.setQueryData(CART_KEY, ctx.previous);
    },

    onSettled: invalidate,
  });

  // ── Update cart item quantity ──────────────────────────────────────────────
  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, payload }) =>
      cartService.updateCartItem(itemId, payload),

    onMutate: async ({ itemId, payload }) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData(CART_KEY);

      patchCache((old) => {
        const items = old.items || [];
        const existing = items.find((i) => i.id === itemId);
        const diff = existing ? payload.quantity - existing.quantity : 0;
        return {
          count: Math.max(0, (old.count || 0) + diff),
          items: items.map((i) =>
            i.id === itemId ? { ...i, quantity: payload.quantity } : i,
          ),
        };
      });

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined)
        queryClient.setQueryData(CART_KEY, ctx.previous);
    },

    onSettled: invalidate,
  });

  // ── Remove item ────────────────────────────────────────────────────────────
  const removeCartItemMutation = useMutation({
    mutationFn: (itemId) => cartService.removeCartItem(itemId),

    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData(CART_KEY);

      patchCache((old) => {
        const items = old.items || [];
        const removed = items.find((i) => i.id === itemId);
        const removedQty = removed?.quantity || 1;
        return {
          count: Math.max(0, (old.count || 0) - removedQty),
          items: items.filter((i) => i.id !== itemId),
        };
      });

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined)
        queryClient.setQueryData(CART_KEY, ctx.previous);
    },

    onSettled: invalidate,
  });

  // ── Clear cart ─────────────────────────────────────────────────────────────
  const clearCartMutation = useMutation({
    mutationFn: cartService.clearCart,

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData(CART_KEY);
      patchCache(() => ({ count: 0, items: [] }));
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined)
        queryClient.setQueryData(CART_KEY, ctx.previous);
    },

    onSettled: invalidate,
  });

  // ── Public actions (return false if guest) ─────────────────────────────────
  const addToCart = (productId, quantity = 1, size = null, color = null) => {
    if (!isLoggedIn) return false;
    addToCartMutation.mutate({ product_id: productId, quantity, size, color });
    return true;
  };

  const updateCartItem = (itemId, quantity) => {
    if (!isLoggedIn) return false;
    updateCartItemMutation.mutate({ itemId, payload: { quantity } });
    return true;
  };

  const removeCartItem = (itemId) => {
    if (!isLoggedIn) return false;
    removeCartItemMutation.mutate(itemId);
    return true;
  };

  const clearCart = () => {
    if (!isLoggedIn) return false;
    clearCartMutation.mutate();
    return true;
  };

  return {
    cart: cartQuery.data, // already selected — plain cart object
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    error: cartQuery.error,
    isLoggedIn,

    addToCart,
    isAddingToCart: addToCartMutation.isPending,
    addToCartError: addToCartMutation.error,

    updateCartItem,
    isUpdatingItem: updateCartItemMutation.isPending,
    updateItemError: updateCartItemMutation.error,

    removeCartItem,
    isRemovingItem: removeCartItemMutation.isPending,
    removeItemError: removeCartItemMutation.error,

    clearCart,
    isClearingCart: clearCartMutation.isPending,
    clearCartError: clearCartMutation.error,
  };
};
