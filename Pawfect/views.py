from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib import messages
from Pawfect.models import User  # Changed from django.contrib.auth.models import User
from Pawfect.models import * 
from django.http import JsonResponse
import json
from django.contrib.auth.decorators import login_required
from django.db import transaction


# Create your views here.

from django.http import HttpResponse

def index(request):
    context_dict = {
        'boldmessage' : 'Welcome to PawfectMart, the best place to find all your pet needs!',
        'user': request.user
    }
    return render(request, 'index.html' ,context = context_dict)


def about(request):
    aboutDict = {
        'myname' : 'Kscerato'
    }
    return render(request, 'about.html', context= aboutDict)


def Products(request):
    # Filter products based on category parameter, show all if no category specified
    category_para = request.GET.get('category', 'all')
    products = Product.objects.all() if category_para == 'all' else Product.objects.filter(category__category=category_para)
    return render(request, 'products.html', {'products': products})

def Login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        
        # Support login with both email and username
        try:
            user_obj = User.objects.get(email=username)
            user = authenticate(request, email=username, password=password)
        except User.DoesNotExist:
            try:
                user_obj = User.objects.get(username=username)
                user = authenticate(request, username=username, password=password)
            except User.DoesNotExist:
                user = None
        
        if user is not None:
            login(request, user)
            messages.success(request, 'Login successful!')
            return redirect('index') 
        else:
            messages.error(request, 'Invalid username or password')
            return redirect('login')
    return render(request, 'login.html')

def Logout(request):
    logout(request)
    messages.success(request, 'Logout successful!')
    return redirect('index')

def register(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']
        password1 = request.POST['password1']
        password2 = request.POST['password2']

        # Validation
        if password1 != password2:
            messages.error(request, 'Passwords do not match')
            return redirect('register')
        
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists')
            return redirect('register')
        
        if User.objects.filter(email=email).exists():
            messages.error(request, 'Email already exists')
            return redirect('register')

        # Create user
        try:
            user = User.objects.create_user(username=username, email=email, password=password1)
            user.save()
            # Auto login after registration
            login(request, user)
            messages.success(request, 'Registration successful!')
            return redirect('index')  
        except Exception as e:
            messages.error(request, f'Error creating account: {str(e)}')
            return redirect('register')

    return render(request, 'register.html')

def view_cart(request):
    if not request.user.is_authenticated:
        messages.error(request, 'Please login to view your cart')
        return redirect('login')
        
    cart, created = Cart.objects.get_or_create(buyer=request.user)
    cart_items = cart.cart_items.all()
    return render(request, 'cart.html', {'cart': cart, 'cart_items': cart_items})

def ProductDetails(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    comments = Comment.objects.filter(product=product)
    return render(request, 'product_detail.html', {'product': product, 'comments': comments})

def add_review(request):
    if not request.user.is_authenticated:
        messages.error(request, 'Please login to leave a review')
        return redirect('login')
    
    if request.method == 'POST':
        product_id = request.POST.get('product_id')
        content = request.POST.get('content')
        rating = request.POST.get('rating')
        
        # Validate data
        if not all([product_id, content, rating]):
            messages.error(request, 'Please fill out all required fields')
            return redirect(f'/product_detail/{product_id}/')
        
        try:
            # Get the product
            product = get_object_or_404(Product, id=product_id)
            
            # Create the comment
            comment = Comment.objects.create(
                product=product,
                user=request.user,
                content=content,
                rating=int(rating)
            )
            
            # Handle image uploads (multiple files)
            images = request.FILES.getlist('images')
            
            # Limit to 3 images maximum
            for i, image in enumerate(images[:3]):
                CommentImage.objects.create(
                    comment=comment,
                    image=image
                )
            
            messages.success(request, 'Your review has been submitted')
        except Exception as e:
            messages.error(request, f'Error submitting review: {str(e)}')
            
        return redirect(f'/product_detail/{product_id}/')
    
    # If not a POST request, redirect to homepage
    return redirect('index')

def profile(request):
    if not request.user.is_authenticated:
        messages.error(request, 'Please login to view your profile')
        return redirect('login')
    
    # Get user activity data
    user = request.user
    orders_count = Order.objects.filter(buyer=user).count()
    reviews_count = Comment.objects.filter(user=user).count()
    collection_count = CollectionItem.objects.filter(collection__buyer=user).count()
    
    # Get user's addresses
    addresses = Address.objects.filter(user=user)
    
    # Get user's orders
    orders = Order.objects.filter(buyer=user).order_by('-placement_time')
    
    context = {
        'orders_count': orders_count,
        'reviews_count': reviews_count,
        'collection_count': collection_count,
        'addresses': addresses,
        'orders': orders,  # Add orders to context
    }
    
    return render(request, 'profile.html', context)

def manage_address(request):
    if not request.user.is_authenticated:
        messages.error(request, 'Please login to manage addresses')
        return redirect('login')
    
    if request.method == 'POST':
        user = request.user
        address = Address.objects.create(
            user=user,
            country=request.POST.get('country'),
            first_name=request.POST.get('first_name'),
            last_name=request.POST.get('last_name'),
            address=request.POST.get('address'),
            city=request.POST.get('city'),
            post_code=request.POST.get('post_code'),
            phone_number=request.POST.get('phone_number'),
            email=request.POST.get('email')
        )
        messages.success(request, 'Address added successfully')
        return redirect('profile')

    return redirect('profile')

def edit_profile(request):
    if not request.user.is_authenticated:
        messages.error(request, 'Please login to edit your profile')
        return redirect('login')
    
    if request.method == 'POST':
        user = request.user
        
        # Update username if provided and not taken
        new_username = request.POST.get('username')
        if new_username and new_username != user.username:
            if User.objects.filter(username=new_username).exists():
                messages.error(request, 'Username already taken')
                return redirect('profile')
            user.username = new_username
        
        # Update email if provided and not taken
        new_email = request.POST.get('email')
        if new_email and new_email != user.email:
            if User.objects.filter(email=new_email).exists():
                messages.error(request, 'Email already taken')
                return redirect('profile')
            user.email = new_email
        
        # Update phone number
        user.phone_number = request.POST.get('phone_number', '')
        
        # Handle profile picture upload
        if 'profile_picture' in request.FILES:
            user.profile_picture = request.FILES['profile_picture']
        
        user.save()
        messages.success(request, 'Profile updated successfully')
        return redirect('profile')
    
    return redirect('profile')

def edit_address(request, address_id):
    if not request.user.is_authenticated:
        messages.error(request, 'Please login to edit address')
        return redirect('login')
    
    try:
        address = Address.objects.get(id=address_id, user=request.user)
        
        if request.method == 'POST':
            address.first_name = request.POST.get('first_name')
            address.last_name = request.POST.get('last_name')
            address.address = request.POST.get('address')
            address.city = request.POST.get('city')
            address.post_code = request.POST.get('post_code')
            address.country = request.POST.get('country')
            address.phone_number = request.POST.get('phone_number')
            address.email = request.POST.get('email')
            address.save()
            messages.success(request, 'Address updated successfully')
            return redirect('profile')
        
    except Address.DoesNotExist:
        messages.error(request, 'Address not found')
    
    return redirect('profile')

def delete_address(request, address_id):
    if not request.user.is_authenticated:
        messages.error(request, 'Please login to delete address')
        return redirect('login')
    
    try:
        address = Address.objects.get(id=address_id, user=request.user)
        address.delete()
        messages.success(request, 'Address deleted successfully')
    except Address.DoesNotExist:
        messages.error(request, 'Address not found')
    
    return redirect('profile')

def add_to_cart(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Please login to add items to your cart'}, status=401)
    
    if request.method == 'POST':
        try:
            # Handle both JSON and form data
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                product_id = data.get('product_id')
                quantity = int(data.get('quantity', 1))
            else:
                product_id = request.POST.get('product_id')
                quantity = int(request.POST.get('quantity', 1))
            
            product = Product.objects.get(id=product_id)
            cart, created = Cart.objects.get_or_create(buyer=request.user)
            
            # Check if item is already in cart
            cart_item = CartItem.objects.filter(cart=cart, product=product).first()
            if cart_item:
                cart_item.quantity += quantity
                cart_item.save()
            else:
                cart_item = CartItem.objects.create(cart=cart, product=product, quantity=quantity)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Item added to cart successfully!'
            })
        except Product.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Product not found'}, status=404)
        except ValueError as e:
            return JsonResponse({'status': 'error', 'message': 'Invalid quantity'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

def remove_from_cart(request, item_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    try:
        cart_item = CartItem.objects.get(id=item_id, cart__buyer=request.user)
        cart_item.delete()
        return JsonResponse({'status': 'success'})
    except CartItem.DoesNotExist:
        return JsonResponse({'error': 'Item not found'}, status=404)

def update_cart_quantity(request, item_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    try:
        cart_item = CartItem.objects.get(id=item_id, cart__buyer=request.user)
        quantity = int(request.POST.get('quantity', 1))
        
        if quantity > 0:
            cart_item.quantity = quantity
            cart_item.save()
            total = cart_item.quantity * cart_item.product.price
            return JsonResponse({
                'status': 'success',
                'quantity': cart_item.quantity,
                'total': total
            })
        else:
            cart_item.delete()
            return JsonResponse({'status': 'removed'})
    except CartItem.DoesNotExist:
        return JsonResponse({'error': 'Item not found'}, status=404)
    except ValueError:
        return JsonResponse({'error': 'Invalid quantity'}, status=400)

def toggle_collection(request, product_id):
    if not request.user.is_authenticated:
        messages.error(request, 'Please login to manage your collection')
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    try:
        product = Product.objects.get(id=product_id)
        collection, created = Collection.objects.get_or_create(buyer=request.user)
        
        # Check if product is already in collection
        collection_item = CollectionItem.objects.filter(
            collection=collection, 
            product=product
        ).first()
        
        if collection_item:
            # Remove from collection
            collection_item.delete()
            return JsonResponse({
                'status': 'removed',
                'message': 'Product removed from collection'
            })
        else:
            # Add to collection
            CollectionItem.objects.create(collection=collection, product=product)
            return JsonResponse({
                'status': 'added',
                'message': 'Product added to collection'
            })
            
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_collection_items(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    collection = Collection.objects.filter(buyer=request.user).first()
    if collection:
        items = CollectionItem.objects.filter(collection=collection)
        products = [{
            'id': item.product.id,
            'name': item.product.name,
            'price': item.product.price,
            'image_url': item.product.images.url if item.product.images else '',
        } for item in items]
        return JsonResponse({'products': products})
    return JsonResponse({'products': []})

def checkout(request):
    if not request.user.is_authenticated:
        messages.error(request, 'Please login to checkout')
        return redirect('login')
    
    cart = Cart.objects.get(buyer=request.user)
    cart_items = cart.cart_items.all()
    
    # Get user's saved addresses
    addresses = Address.objects.filter(user=request.user)
    
    # Calculate totals
    subtotal = sum(item.get_total() for item in cart_items)
    tax = subtotal * 0.20  # 20% tax
    shipping = 4.99
    total = subtotal + tax + shipping
    
    context = {
        'cart_items': cart_items,
        'subtotal': subtotal,
        'tax': tax,
        'shipping': shipping,
        'total': total,
        'addresses': addresses,  # Add addresses to context
    }
    
    return render(request, 'checkout.html', context)

def place_order(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                cart = Cart.objects.get(buyer=request.user)
                cart_items = cart.cart_items.all()
                
                if not cart_items.exists():
                    return JsonResponse({'error': 'Cart is empty'}, status=400)
                
                # Handle address selection/creation
                address_choice = request.POST.get('address_choice')
                if address_choice == 'existing':
                    address_id = request.POST.get('selected_address')
                    if not address_id:
                        return JsonResponse({'error': 'Please select an address'}, status=400)
                    address = get_object_or_404(Address, id=address_id, user=request.user)
                else:
                    required_fields = ['first_name', 'last_name', 'address', 'city', 
                                     'post_code', 'country', 'phone_number', 'email']
                    if not all(request.POST.get(field) for field in required_fields):
                        return JsonResponse({'error': 'Please fill in all address fields'}, status=400)
                    
                    address = Address.objects.create(
                        user=request.user,
                        **{field: request.POST.get(field) for field in required_fields}
                    )
                
                # Calculate total
                subtotal = sum(item.get_total() for item in cart_items)
                tax = subtotal * 0.20
                shipping = 4.99
                total = subtotal + tax + shipping
                
                # Create order with only the supported fields
                order = Order.objects.create(
                    buyer=request.user,
                    address=address,
                    price=total,
                    status='Pending'
                )
                
                # Create order items
                for cart_item in cart_items:
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        quantity=cart_item.quantity,
                        price=cart_item.product.price
                    )
                
                # Clear cart
                cart.cart_items.all().delete()
                
                return JsonResponse({
                    'success': True,
                    'order_id': order.id
                })
                
        except Address.DoesNotExist:
            return JsonResponse({'error': 'Selected address not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

def order_confirmation(request, order_id):
    if not request.user.is_authenticated:
        return redirect('login')
    
    order = get_object_or_404(Order, id=order_id, buyer=request.user)
    return render(request, 'order_confirmation.html', {'order': order})

@login_required
def change_password(request):
    if request.method == 'POST':
        current_password = request.POST.get('current_password')
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        
        # Validate password change request
        if not all([current_password, new_password, confirm_password]):
            messages.error(request, 'All fields are required')
            return redirect('profile')
        
        if new_password != confirm_password:
            messages.error(request, 'New passwords do not match')
            return redirect('profile')
        
        user = request.user
        if not user.check_password(current_password):
            messages.error(request, 'Current password is incorrect')
            return redirect('profile')
        
        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)
        
        messages.success(request, 'Password changed successfully')
        return redirect('profile')
    
    return redirect('profile')