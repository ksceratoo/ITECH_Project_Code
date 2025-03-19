from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator

# User Manager for handling user creation
class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None):
        if not email:
            raise ValueError("Users must have an email address")
        user = self.model(email=self.normalize_email(email), username=username)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, username, password):
        user = self.create_user(email, username, password)
        user.is_admin = True
        user.save()
        return user

# User Model
class User(AbstractBaseUser):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=20, 
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', "Enter a valid phone number.")],
        null=True,  # Make these fields optional since they weren't in your original User creation
        blank=True
    )
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    username = models.CharField(max_length=100, unique=True)
    
    # User authentication fields
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    
    # Add these fields for Django's permission system
    is_staff = models.BooleanField(default=False)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username
    
    # These methods are required for Django's admin interface
    def has_perm(self, perm, obj=None):
        return self.is_admin
    
    def has_module_perms(self, app_label):
        return self.is_admin
    
    @property
    def is_staff(self):
        return self.is_admin

# Product Categories Model
class ProductCategory(models.Model):
    category = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.category

# Brand Model
class Brand(models.Model):
    brand_name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.brand_name

# Products Model
class Product(models.Model):
    name = models.CharField(max_length=255)
    size = models.CharField(max_length=50, blank=True, null=True)
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True
    )
    price = models.PositiveIntegerField()
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(ProductCategory, on_delete=models.CASCADE)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)
    images = models.ImageField(upload_to='product_images/', null=True, blank=True)

    def __str__(self):
        return self.name

# Comments Model
class Comment(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    def __str__(self):
        return f"Comment by {self.user.username} on {self.product.name}"

# Comment Images Model - for multiple images per comment
class CommentImage(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to='comment_images/')
    
    def __str__(self):
        return f"Image for comment {self.comment.id}"

# Addresses Model (for Orders)
class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    country = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    address = models.TextField()
    city = models.CharField(max_length=100)
    post_code = models.CharField(max_length=20)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()

    def __str__(self):
        return f"{self.first_name} {self.last_name}, {self.address}"

# Orders Model
class Order(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    ]

    courier_id = models.CharField(max_length=30, blank=True, null=True)
    buyer = models.ForeignKey(User, on_delete=models.CASCADE)
    address = models.ForeignKey(Address, on_delete=models.CASCADE)
    price = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    delivered = models.BooleanField(default=False)
    placement_time = models.DateTimeField(auto_now_add=True)
    finish_time = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Order {self.id} by {self.buyer.username}"

# Order Items Model (Multiple products per order)
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="order_items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in Order {self.order.id}"

# Cart Model (Each user has one cart)
class Cart(models.Model):
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="carts")

    def __str__(self):
        return f"Cart for {self.buyer.username}"

# Cart Items Model (Multiple products per cart)
class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="cart_items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in {self.cart.buyer.username}'s cart"
    
    def get_total(self):
        return self.quantity * self.product.price

# Collection (Wishlist) Model
class Collection(models.Model):
    buyer = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"Collection for {self.buyer.username}"

# Collection Items Model (Multiple products in wishlist)
class CollectionItem(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name="collection_items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.product.name} in {self.collection.buyer.username}'s collection"
