from django.contrib import admin
from .models import User, ProductCategory, Brand, Product, Comment, Address, Order, OrderItem, Cart, CartItem, Collection, CollectionItem

# Register your models here.
admin.site.register(User)
admin.site.register(ProductCategory)
admin.site.register(Brand)
admin.site.register(Product)
admin.site.register(Comment)
admin.site.register(Address)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(Collection)
admin.site.register(CollectionItem)
