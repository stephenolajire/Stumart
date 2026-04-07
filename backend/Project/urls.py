"""
URL configuration for Project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
    TokenObtainPairView,
)
from user.views import CustomTokenObtainPairView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Swagger/OpenAPI Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API Routes
    path('api/', include('picker.urls')),
    path('api/', include('user.urls')),
    path('api/', include('stumart.urls')),
    path('api/', include('vendor.urls')),
    path('api/', include('adminn.urls')),
    path('api/', include('other.urls')),
    path('api/', include('chatbot.urls')),
    path('api/', include('chat.urls')),
    path('api/', include('utilities.urls')),
    path('api/', include('home.urls')),
    path('api/', include('company.urls')),
    path('api/', include('order.urls')),
    path('api/', include('payment.urls')),
    path('api/', include('cart.urls')),
    path('api/', include('bookmark.urls')),
    path('api/gift/', include('gift.urls')),
    path('api/referrals/', include('referral.urls')),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    # path('silk/', include('silk.urls', namespace='silk'))
]


urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)