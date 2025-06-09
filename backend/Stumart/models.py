# models.py for stumart app
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
User = get_user_model()
from cloudinary.models import CloudinaryField
from User.models import Vendor
from django.utils.translation import gettext_lazy as _

class Product(models.Model):
    """Base product model"""
    GENDER_CHOICES = (
        ('men', 'Men'),
        ('women', 'Women'),
        ('unisex', 'Unisex'),
        ('kids', 'Kids'),
    )
    
    vendor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="products"
    )
    name = models.CharField(max_length=100)
    description = models.TextField()
    keyword = models.CharField(
        max_length=100,
        default=" ",
    )
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[
            MinValueValidator(0.01),
            MaxValueValidator(99999.99)
        ]
    )
    in_stock = models.PositiveIntegerField(default=0)
    image = CloudinaryField('product_images/', null=True, blank=True)
    
    # Fashion-specific fields
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True, default="unisex")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    promotion_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[
            MinValueValidator(0.01),
            MaxValueValidator(99999.99)
        ],

        default=0.00
    )

    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class ProductImage(models.Model):
    """Model for additional product images"""
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name="additional_images"
    )
    image = CloudinaryField('product_images/')
    
    def __str__(self):
        return f"Image for {self.product.name}"


class ProductSize(models.Model):
    """Model for product sizes (for fashion products)"""
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name="sizes"
    )
    size = models.CharField(max_length=20, default="M")
    quantity = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"{self.product.name} - {self.size}"
    
    class Meta:
        unique_together = ('product', 'size')


class ProductColor(models.Model):
    """Model for product colors (for fashion products)"""
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name="colors"
    )
    color = models.CharField(max_length=50, default="red")
    quantity = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"{self.product.name} - {self.color}"
    
    class Meta:
        unique_together = ('product', 'color')


class Cart(models.Model):
    """Model for user cart"""
    cart_code = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    def __str__(self):
        return f"{self.cart_code}"
    

class CartItem(models.Model):
    """Model for items in the cart"""
    cart = models.ForeignKey(
        Cart, 
        on_delete=models.CASCADE, 
        related_name="items"
    )
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name="cart_items"
    )
    quantity = models.PositiveIntegerField(default=1)
    size = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    def __str__(self):
        return f"{self.product.name}"
    

class Order(models.Model):
    order_number = models.CharField(max_length=20, unique=True)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    address = models.TextField()
    room_number = models.CharField(max_length=100, blank=True, null=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    order_status = models.CharField(max_length=20, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    picker = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name="picker")
    confirm = models.BooleanField(default=False, blank=True, null=True)
    packed = models.BooleanField(default=False, blank=True, null=True)
    reviewed = models.BooleanField(default=False)
    

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='order_items', on_delete=models.CASCADE)
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    size = models.CharField(max_length=50, null=True, blank=True)  # New
    color = models.CharField(max_length=50, null=True, blank=True)
 # New

    def __str__(self):
        return f"{self.product.name} - {self.quantity}"


class Transaction(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    transaction_id = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='PENDING')
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transaction {self.transaction_id} - {self.status}"


class Wallet(models.Model):
    vendor = models.OneToOneField(Vendor, on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    # def __str__(self):
    #     return self.id


# New model for service applications to add to your models.py file

class ServiceApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Service that the user is applying for
    service = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='service_applications')
    
    # User applying for the service (can be null for non-registered users)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='service_applications')
    
    # Information for the application
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    description = models.TextField()
    preferred_date = models.DateTimeField()
    additional_details = models.TextField(blank=True, null=True)
    
    # Status tracking
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Vendor response
    vendor_response = models.TextField(blank=True, null=True)
    response_date = models.DateTimeField(blank=True, null=True)
    
    # Service completion
    completion_date = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Application for {self.service.business_name} by {self.name}"
    

# Add these models to your stumart/models.py file

class VendorReview(models.Model):
    """Model for vendor reviews"""
    order = models.ForeignKey(
        Order, 
        on_delete=models.CASCADE, 
        related_name='vendor_reviews'
    )
    vendor = models.ForeignKey(
        Vendor, 
        on_delete=models.CASCADE, 
        related_name='reviews'
    )
    reviewer = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='vendor_reviews_given'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('order', 'vendor')  # One review per vendor per order
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Review for {self.vendor.business_name} - {self.rating} stars"


class PickerReview(models.Model):
    """Model for picker reviews"""
    order = models.ForeignKey(
        Order, 
        on_delete=models.CASCADE, 
        related_name='picker_reviews'
    )
    picker = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='picker_reviews_received'
    )
    reviewer = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='picker_reviews_given'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('order', 'picker')  # One review per picker per order
        ordering = ['-created_at']
    
    def __str__(self):
        picker_name = f"{self.picker.first_name} {self.picker.last_name}"
        return f"Review for picker {picker_name} - {self.rating} stars"


# Add this to your stumart/models.py file

class ProductReview(models.Model):
    """Model for product reviews"""
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='reviews'
    )
    reviewer = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='product_reviews_given'
    )
    order = models.ForeignKey(
        Order, 
        on_delete=models.CASCADE, 
        related_name='product_reviews',
        help_text="The order through which this product was purchased"
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    comment = models.TextField(
        blank=True, 
        null=True,
        help_text="Optional review comment"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('product', 'reviewer', 'order')  # One review per product per order per user
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', '-created_at']),
            models.Index(fields=['reviewer']),
            models.Index(fields=['rating']),
        ]
    
    def __str__(self):
        reviewer_name = f"{self.reviewer.first_name} {self.reviewer.last_name}" if self.reviewer else "Anonymous"
        return f"Review for {self.product.name} by {reviewer_name} - {self.rating} stars"
    
    @property
    def reviewer_name(self):
        """Return the reviewer's display name"""
        if self.reviewer:
            return f"{self.reviewer.first_name} {self.reviewer.last_name}".strip()
        return "Anonymous"
    
    def save(self, *args, **kwargs):
        # Ensure the reviewer actually bought this product in the specified order
        if self.order and self.reviewer:
            order_item_exists = OrderItem.objects.filter(
                order=self.order,
                product=self.product,
                order__user=self.reviewer
            ).exists()
            
            if not order_item_exists:
                raise ValueError("Cannot review a product that wasn't purchased in this order")
        
        super().save(*args, **kwargs)


from django.core.exceptions import ValidationError

def validate_video_file(value):
    """Validate that the uploaded file is a video"""
    valid_extensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
    if not any(value.name.lower().endswith(ext) for ext in valid_extensions):
        raise ValidationError('Only video files are allowed.')

class RegisterVideo(models.Model):
    file = CloudinaryField(
        'video',
        resource_type='video',
        help_text='Upload video files only (mp4, avi, mov, wmv, flv, webm)'
    )
    name = models.CharField(max_length=200)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    @property
    def video_url(self):
        """Get the video URL from Cloudinary"""
        if self.file:
            return self.file.url
        return None
    
    @property
    def video_secure_url(self):
        """Get the secure video URL from Cloudinary"""
        if self.file:
            return self.file.url.replace('http://', 'https://')
        return None

class AddProductVideo(models.Model):
    file = CloudinaryField(
        'video',
        resource_type='video',
        help_text='Upload video files only (mp4, avi, mov, wmv, flv, webm)'
    )
    name = models.CharField(max_length=200)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    @property
    def video_url(self):
        """Get the video URL from Cloudinary"""
        if self.file:
            return self.file.url
        return None
    
    @property
    def video_secure_url(self):
        """Get the secure video URL from Cloudinary"""
        if self.file:
            return self.file.url.replace('http://', 'https://')
        return None

