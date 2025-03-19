from django.test import TestCase, Client
from django.urls import reverse
from Pawfect.models import *
from django.core.files.uploadedfile import SimpleUploadedFile
import json

class UserModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )

    def test_user_creation(self):
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertEqual(self.user.username, 'testuser')
        self.assertTrue(self.user.check_password('testpass123'))

    def test_user_str_representation(self):
        self.assertEqual(str(self.user), 'testuser')

class ProductModelTests(TestCase):
    def setUp(self):
        self.category = ProductCategory.objects.create(category='Dog Food')
        self.brand = Brand.objects.create(brand_name='Test Brand')
        self.product = Product.objects.create(
            name='Test Product',
            price=1000,
            category=self.category,
            brand=self.brand
        )

    def test_product_creation(self):
        self.assertEqual(self.product.name, 'Test Product')
        self.assertEqual(self.product.price, 1000)
        self.assertEqual(self.product.category.category, 'Dog Food')
        self.assertEqual(self.product.brand.brand_name, 'Test Brand')

class CartTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email='cart@test.com',
            username='cartuser',
            password='cartpass123'
        )
        self.category = ProductCategory.objects.create(category='Test Category')
        self.brand = Brand.objects.create(brand_name='Test Brand')
        self.product = Product.objects.create(
            name='Cart Test Product',
            price=1000,
            category=self.category,
            brand=self.brand
        )

    def test_add_to_cart(self):
        # Login the user
        self.client.login(email='cart@test.com', password='cartpass123')
        
        # Set content type for the request
        response = self.client.post(
            reverse('add_to_cart'),
            data=json.dumps({
                'product_id': self.product.id,
                'quantity': 1
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        cart = Cart.objects.get(buyer=self.user)
        self.assertEqual(cart.cart_items.count(), 1)

class OrderTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email='order@test.com',
            username='orderuser',
            password='orderpass123'
        )
        self.address = Address.objects.create(
            user=self.user,
            country='Test Country',
            first_name='Test',
            last_name='User',
            address='Test Address',
            city='Test City',
            post_code='12345',
            phone_number='1234567890',
            email='order@test.com'
        )

    def test_order_creation(self):
        order = Order.objects.create(
            buyer=self.user,
            address=self.address,
            price=1000,
            status='Pending'
        )
        self.assertEqual(order.status, 'Pending')
        self.assertEqual(order.price, 1000)

class ViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email='view@test.com',
            username='viewuser',
            password='viewpass123'
        )

    def test_index_view(self):
        response = self.client.get(reverse('index'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'index.html')

    def test_login_view(self):
        response = self.client.post(reverse('login'), {
            'username': 'view@test.com',
            'password': 'viewpass123'
        })
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('index'))

    def test_profile_view_authentication(self):
        # Test unauthorized access
        response = self.client.get(reverse('profile'))
        self.assertEqual(response.status_code, 302)  # Should redirect to login
        
        # Test authorized access
        login_successful = self.client.login(email='view@test.com', password='viewpass123')
        self.assertTrue(login_successful)  # Verify login was successful
        
        response = self.client.get(reverse('profile'))
        self.assertEqual(response.status_code, 200)

class CommentTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='comment@test.com',
            username='commentuser',
            password='commentpass123'
        )
        self.category = ProductCategory.objects.create(category='Test Category')
        self.brand = Brand.objects.create(brand_name='Test Brand')
        self.product = Product.objects.create(
            name='Comment Test Product',
            price=1000,
            category=self.category,
            brand=self.brand
        )

    def test_comment_creation(self):
        comment = Comment.objects.create(
            product=self.product,
            user=self.user,
            content='Test comment',
            rating=5
        )
        self.assertEqual(comment.content, 'Test comment')
        self.assertEqual(comment.rating, 5)
        self.assertEqual(str(comment), f"Comment by {self.user.username} on {self.product.name}")

class CollectionTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email='collection@test.com',
            username='collectionuser',
            password='collectionpass123'
        )
        self.category = ProductCategory.objects.create(category='Test Category')
        self.brand = Brand.objects.create(brand_name='Test Brand')
        self.product = Product.objects.create(
            name='Collection Test Product',
            price=1000,
            category=self.category,
            brand=self.brand
        )

    def test_toggle_collection(self):
        # Login the user
        login_successful = self.client.login(email='collection@test.com', password='collectionpass123')
        self.assertTrue(login_successful)  # Verify login was successful
        
        response = self.client.post(
            reverse('toggle_collection', args=[self.product.id]),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        collection = Collection.objects.get(buyer=self.user)
        self.assertEqual(collection.collection_items.count(), 1)
