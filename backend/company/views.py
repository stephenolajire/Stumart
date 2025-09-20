from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from User.models import Company
from .serializers import *
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
#from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Prefetch
from .models import Rider, CoverageArea, RiderDocument
from .serializers import *
from rest_framework.exceptions import ValidationError
from django.db import models
import logging
from django.db.models import Avg, Count, Sum
from django.utils import timezone


logger = logging.getLogger(__name__)


class CompanyAreasAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.user_type not in ['company', 'student']:
            return Response({"error": "Only companies and students can access delivery areas"},
                            status=status.HTTP_403_FORBIDDEN)

        if request.user.user_type == 'company':
            # For companies, return their own delivery areas
            try:
                company = request.user.company_profile
                serializer = CompanyAreaSerializer(company)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Company.DoesNotExist:
                return Response({"error": "Company profile not found"},
                               status=status.HTTP_404_NOT_FOUND)
        
        elif request.user.user_type == 'student':
            # For students, check if there are companies in the same institution
            student_institution = request.user.institution
            
            # Find companies that serve the same institution as the student
            companies_in_same_institution = Company.objects.filter(
                user__institution=student_institution
            )
            
            if not companies_in_same_institution.exists():
                return Response(
                    {"error": "No delivery companies available in your institution"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get all unique delivery areas from companies in the same institution
            all_delivery_areas = Area.objects.filter(
                companies__user__institution=student_institution
            ).distinct()
        
            
            if not all_delivery_areas.exists():
                return Response(
                    {"error": "No delivery areas found for companies in your institution"},
                    status=status.HTTP_404_NOT_FOUND
                )
            # Serialize and return the delivery areas
            serializer = AreaSerializer(all_delivery_areas, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid user type"}, status=status.HTTP_400_BAD_REQUEST)
    
    
class CompanyRiderCreateView(generics.CreateAPIView):
    serializer_class = CompanyRiderCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # Get the company associated with the authenticated user
        try:
            company = self.request.user.company_profile
        except Company.DoesNotExist:
            raise serializers.ValidationError("User is not associated with any company.")
        
        # Save the rider with the company and join_date
        serializer.save(
            company=company,
            join_date=timezone.now().date()
        )
    
    def create(self, request, *args, **kwargs):
        try:
            # Validate that user has a company profile
            if not hasattr(request.user, 'company_profile'):
                return Response(
                    {"error": "User is not associated with any company."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            return Response(
                {
                    "message": "Rider added successfully!",
                    "rider": serializer.data
                }, 
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
class CompanyRiderListView(generics.ListAPIView):
    serializer_class = CompanyRiderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only riders belonging to the authenticated user's company"""
        try:
            company = self.request.user.company_profile
            return CompanyRider.objects.filter(company=company).order_by('-join_date')
        except Company.DoesNotExist:
            return CompanyRider.objects.none()

    def list(self, request, *args, **kwargs):
        """Override list to include summary statistics"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Calculate summary stats
        stats = {
            'total_riders': queryset.count(),
            'active_riders': queryset.filter(status='active').count(),
            'average_rating': queryset.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0,
            'total_deliveries': queryset.aggregate(total=Sum('completed_deliveries'))['total'] or 0,
        }
        
        return Response({
            'results': serializer.data,
            'stats': stats
        })

        
class CompanyRiderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CompanyRiderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Return only riders belonging to the authenticated user's company
        try:
            company = self.request.user.company_profile
            return CompanyRider.objects.filter(company=company)
        except Company.DoesNotExist:
            return CompanyRider.objects.none()
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Rider deleted successfully!"}, 
            status=status.HTTP_200_OK
        )
