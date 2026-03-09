from django.urls import path
from .views import (
    AddToCartView,
    CartItemsView,
    ClearCartView,
    RemoveCartItemView,
    UpdateCartItemView,
)

app_name = "cart"

urlpatterns = [
    # GET  cart/?cart_code=<code>
    path("cart/", CartItemsView.as_view(), name="cart-items"),

    # POST cart/add/
    path("cart/add/", AddToCartView.as_view(), name="add-to-cart"),

    # PUT cart/item/<item_id>/update/
    path("cart/item/<int:item_id>/update/", UpdateCartItemView.as_view(), name="update-cart-item"),

    # DELETE cart/item/<item_id>/remove/
    path("cart/item/<int:item_id>/remove/", RemoveCartItemView.as_view(), name="remove-cart-item"),

    # DELETE cart/clear/
    path("cart/clear/", ClearCartView.as_view(), name="clear-cart"),

]