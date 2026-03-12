# models.py for stumart app - OPTIMIZED
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
User = get_user_model()
from cloudinary.models import CloudinaryField
from user.models import Vendor
from django.utils.translation import gettext_lazy as _

class Product(models.Model):
    """Base product model with optimized indexes"""
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
    keyword = models.CharField(max_length=100, default=" ")
    
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01), MaxValueValidator(99999.99)]
    )
    
    in_stock = models.PositiveIntegerField(default=0)
    image = CloudinaryField('product_images/', null=True, blank=True)
    
    gender = models.CharField(
        max_length=10, 
        choices=GENDER_CHOICES, 
        null=True, 
        blank=True, 
        default="unisex"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    promotion_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01), MaxValueValidator(99999.99)],
        default=0.00,
        null=True,
        blank=True
    )

    delivery_day = models.CharField(
        max_length=50, 
        default=" ",
        help_text="Estimated delivery time for the product",
        null=True,
        blank=True
    )

        # In stumart/models.py — add to Product model
    institution = models.CharField(
        max_length=100, 
        db_index=True,
        default='',
        help_text="Denormalized from vendor.institution for fast filtering"
    )
    state = models.CharField(
        max_length=50,
        db_index=True, 
        default='',
        help_text="Denormalized from vendor.state for fast filtering"
    )
    kyc_approved = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Denormalized from vendor KYC status — updated on KYC approval"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            # CRITICAL: Most frequently used query patterns from CategoryLastFiveView & ProductCategoryView
            
            # 1. Vendor + Created (for vendor's product listings sorted by date)
            models.Index(fields=['vendor', '-created_at'], name='prod_vendor_date'),
            
            # 2. Created descending (for latest products - CategoryLastFiveView uses this)
            models.Index(fields=['-created_at'], name='prod_date_desc'),
            
            # 3. Price sorting (low to high)
            models.Index(fields=['price', '-created_at'], name='prod_price_asc'),
            
            # 4. Price sorting (high to low)
            models.Index(fields=['-price', '-created_at'], name='prod_price_desc'),
            
            # 5. Gender filtering with date (for fashion category filters)
            models.Index(fields=['gender', '-created_at'], name='prod_gender_date'),
            
            # 6. Stock + Created (for popular sorting by availability)
            models.Index(fields=['-in_stock', '-created_at'], name='prod_stock_date'),
            
            # 7. Vendor + Price (for vendor price filtering)
            models.Index(fields=['vendor', 'price'], name='prod_vendor_price'),
            
            # 8. Search optimization (name, keyword fields)
            # Note: For better search, consider PostgreSQL full-text search or Elasticsearch
            models.Index(fields=['name'], name='prod_name_search'),
            
            # 9. Promotion filtering
            models.Index(fields=['promotion_price'], name='prod_promo'),
        ]
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
    
    def __str__(self):
        return self.name
    
    @property
    def is_on_promotion(self):
        """Check if product has active promotion"""
        return self.promotion_price and self.promotion_price > 0
    
    @property
    def effective_price(self):
        """Get the effective price (promotion price if available, else regular price)"""
        return self.promotion_price if self.is_on_promotion else self.price
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage if on promotion"""
        if self.is_on_promotion and self.price > 0:
            discount = ((self.price - self.promotion_price) / self.price) * 100
            return round(discount, 2)
        return 0
    
    @property
    def is_available(self):
        """Check if product is available in stock"""
        return self.in_stock > 0
    def save(self, *args, **kwargs):
        # Denormalize vendor location onto product for fast filtering
        if not self.institution and self.vendor_id:
            self.institution = self.vendor.institution or ''
            self.state = self.vendor.state or ''
            self.kyc_approved = getattr(
                getattr(self.vendor, 'kyc', None), 
                'verification_status', ''
            ) == 'approved'
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    """Model for additional product images"""
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name="additional_images"
    )
    image = CloudinaryField('product_images/')
    
    class Meta:
        indexes = [
            models.Index(fields=['product'], name='prod_img_product'),
        ]
    
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
    
    class Meta:
        unique_together = ('product', 'size')
        indexes = [
            models.Index(fields=['product', 'quantity'], name='prod_size_qty'),
        ]
    
    def __str__(self):
        return f"{self.product.name} - {self.size}"


class ProductColor(models.Model):
    """Model for product colors (for fashion products)"""
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name="colors"
    )
    color = models.CharField(max_length=50, default="red")
    quantity = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ('product', 'color')
        indexes = [
            models.Index(fields=['product', 'quantity'], name='prod_color_qty'),
        ]
    
    def __str__(self):
        return f"{self.product.name} - {self.color}"


class Cart(models.Model):
    """One cart per authenticated user"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="cart",
        help_text="Each user has exactly one persistent cart",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["user"], name="cart_user_idx"),
        ]

    def __str__(self):
        return f"Cart({self.user.email})"


class CartItem(models.Model):
    """Model for items in the cart"""
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField(default=1)
    size  = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True,     null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["cart", "product"], name="cart_item_lookup"),
            models.Index(fields=["cart"],             name="cart_items_idx"),
        ]

    def __str__(self):
        return f"{self.product.name}"

class Order(models.Model):
    order_number = models.CharField(max_length=20, unique=True, db_index=True)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    address = models.TextField()
    room_number = models.CharField(max_length=100, blank=True, null=True)

    # Financial fields
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2)
    takeaway = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    # Order status and tracking
    order_status = models.CharField(max_length=20, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    # Picker and company information
    picker = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name="picker")
    confirm = models.BooleanField(default=False, blank=True, null=True)
    packed = models.BooleanField(default=False, blank=True, null=True)
    reviewed = models.BooleanField(default=False)
    company_picker = models.BooleanField(default=False, blank=True, null=True)
    company_picker_email = models.EmailField(blank=True, null=True)

    # Referral code
    referral_code = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        db_index=True,
        help_text="Referral code used for this order",
    )

    # Proximity flag — customer confirms vendor is near their location,
    # enabling the backend to match a nearby student picker
    vendor_is_nearby = models.BooleanField(
        default=False,
        help_text="Customer indicated the vendor is near their location",
    )

    class Meta:
        indexes = [
            models.Index(fields=['order_number'], name='order_num_idx'),
            models.Index(fields=['user', '-created_at'], name='order_user_date'),
            models.Index(fields=['-created_at'], name='order_date_idx'),
            models.Index(fields=['order_status', '-created_at'], name='order_status_date'),
            models.Index(fields=['picker'], name='order_picker_idx'),
            models.Index(fields=['referral_code', '-created_at'], name='order_referral_idx'),
            models.Index(fields=['vendor_is_nearby', '-created_at'], name='order_nearby_idx'),
        ]

    def __str__(self):
        return self.order_number


## OrderItem Model (unchanged, included for completeness)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='order_items', on_delete=models.CASCADE)
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    size = models.CharField(max_length=50, null=True, blank=True)
    color = models.CharField(max_length=50, null=True, blank=True)
    is_packed = models.BooleanField(default=False)
    packed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['order', 'vendor'], name='order_item_vendor'),
            models.Index(fields=['vendor', 'is_packed'], name='order_item_packed'),
            models.Index(fields=['order'], name='order_items_idx'),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.quantity}"

    def save(self, *args, **kwargs):
        if self.is_packed and not self.packed_at:
            from django.utils import timezone
            self.packed_at = timezone.now()
        super().save(*args, **kwargs)


class Transaction(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    transaction_id = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='PENDING')
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transaction {self.transaction_id} - {self.status}"


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