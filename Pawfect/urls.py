from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('about/', views.about, name='about'),
    path('products/', views.Products, name='products'),
    path('login/', views.Login, name='login'),
    path('register/', views.register, name='register'),
    path('logout/', views.Logout, name='logout'),
    path('cart/', views.view_cart, name='cart'),
    path('cart/remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('cart/update/<int:item_id>/', views.update_cart_quantity, name='update_cart_quantity'),
    path('product_detail/<int:product_id>/', views.ProductDetails, name='product_detail'),
    path('add_review/', views.add_review, name='add_review'),  # New URL for review submissions
    path('profile/', views.profile, name='profile'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('profile/address/', views.manage_address, name='manage_address'),
    path('profile/address/<int:address_id>/edit/', views.edit_address, name='edit_address'),
    path('profile/address/<int:address_id>/delete/', views.delete_address, name='delete_address'),
    path('profile/change_password/', views.change_password, name='change_password'),
    path('add_to_cart/', views.add_to_cart, name='add_to_cart'),
    path('collection/toggle/<int:product_id>/', views.toggle_collection, name='toggle_collection'),
    path('collection/items/', views.get_collection_items, name='get_collection_items'),
    path('place_order/', views.place_order, name='place_order'),
    path('order_confirmation/<int:order_id>/', views.order_confirmation, name='order_confirmation'),
]
