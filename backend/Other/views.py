# views.py for your service application dashboard

from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Count
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from User.models import User, Vendor
from Stumart.models import ServiceApplication
import calendar

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get statistics for service applications dashboard.
    Returns counts of applications by status and monthly application data.
    """
    # Check if the user is a vendor with the "others" category
    try:
        vendor = Vendor.objects.get(user=request.user)
        if vendor.business_category != 'others':
            return Response(
                {"error": "This endpoint is only available for service vendors"}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Vendor.DoesNotExist:
        return Response(
            {"error": "Vendor profile not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get all applications for this vendor
    applications = ServiceApplication.objects.filter(service=vendor)
    
    # Calculate statistics for all application statuses
    total_applications = applications.count()
    pending_count = applications.filter(status='pending').count()
    accepted_count = applications.filter(status='accepted').count()
    declined_count = applications.filter(status='declined').count()
    completed_count = applications.filter(status='completed').count()
    cancelled_count = applications.filter(status='cancelled').count()
    
    # Prepare statistics data
    statistics = {
        "totalApplications": total_applications,
        "pending": pending_count,
        "accepted": accepted_count,
        "completed": completed_count,
        "cancelled": cancelled_count,
        "declined": declined_count,
    }
    
    # Get monthly data for the current year
    current_year = timezone.now().year
    monthly_data = []
    
    for month in range(1, 13):
        month_name = calendar.month_abbr[month]
        count = applications.filter(
            created_at__year=current_year,
            created_at__month=month
        ).count()
        
        monthly_data.append({
            "month": month_name,
            "applications": count
        })
    
    return Response({
        "statistics": statistics,
        "monthlyData": monthly_data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_applications(request):
    """
    Get recent service applications for the vendor.
    Returns the 5 most recent applications.
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        if vendor.business_category != 'others':
            return Response(
                {"error": "This endpoint is only available for service vendors"}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Vendor.DoesNotExist:
        return Response(
            {"error": "Vendor profile not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get the 5 most recent applications
    recent = ServiceApplication.objects.filter(
        service=vendor
    ).order_by('-created_at')[:5]
    
    recent_data = []
    for app in recent:
        recent_data.append({
            "id": app.id,
            "name": app.name,
            "email": app.email,
            "phone": app.phone,
            "status": app.status,
            "preferred_date": app.preferred_date.isoformat() if app.preferred_date else None,
            "created_at": app.created_at.isoformat(),
            "description": app.description[:100] + "..." if len(app.description) > 100 else app.description
        })
    
    return Response(recent_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_applications(request):
    """
    Get all service applications for the vendor with pagination.
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        if vendor.business_category != 'others':
            return Response(
                {"error": "This endpoint is only available for service vendors"}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Vendor.DoesNotExist:
        return Response(
            {"error": "Vendor profile not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get pagination parameters
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))
    status_filter = request.GET.get('status', None)
    
    # Calculate offset
    offset = (page - 1) * limit
    
    # Apply filters if provided
    applications = ServiceApplication.objects.filter(service=vendor)
    if status_filter:
        applications = applications.filter(status=status_filter)
    
    # Get total count
    total_count = applications.count()
    
    # Apply pagination
    applications = applications.order_by('-created_at')[offset:offset+limit]
    
    applications_data = []
    for app in applications:
        applications_data.append({
            "id": app.id,
            "name": app.name,
            "email": app.email,
            "phone": app.phone,
            "status": app.status,
            "preferred_date": app.preferred_date.isoformat() if app.preferred_date else None,
            "created_at": app.created_at.isoformat(),
            "description": app.description,
            "additional_details": app.additional_details,
            "vendor_response": app.vendor_response,
            "response_date": app.response_date.isoformat() if app.response_date else None,
            "completion_date": app.completion_date.isoformat() if app.completion_date else None
        })
    
    return Response({
        "results": applications_data,
        "count": total_count,
        "pages": (total_count + limit - 1) // limit,
        "current_page": page
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def application_detail(request, application_id):
    """
    Get detailed information about a specific service application.
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        if vendor.business_category != 'others':
            return Response(
                {"error": "This endpoint is only available for service vendors"}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Vendor.DoesNotExist:
        return Response(
            {"error": "Vendor profile not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        application = ServiceApplication.objects.get(id=application_id, service=vendor)
    except ServiceApplication.DoesNotExist:
        return Response(
            {"error": "Application not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Build response data
    response_data = {
        "id": application.id,
        "name": application.name,
        "email": application.email,
        "phone": application.phone,
        "status": application.status,
        "preferred_date": application.preferred_date.isoformat() if application.preferred_date else None,
        "created_at": application.created_at.isoformat(),
        "updated_at": application.updated_at.isoformat(),
        "description": application.description,
        "additional_details": application.additional_details,
        "vendor_response": application.vendor_response,
        "response_date": application.response_date.isoformat() if application.response_date else None,
        "completion_date": application.completion_date.isoformat() if application.completion_date else None,
        "user": {
            "id": application.user.id,
            "email": application.user.email,
            "full_name": f"{application.user.first_name} {application.user.last_name}",
            "phone": application.user.phone_number
        } if application.user else None
    }
    
    return Response(response_data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_application_status(request, application_id):
    """
    Update the status of a service application.
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        if vendor.business_category != 'others':
            return Response(
                {"error": "This endpoint is only available for service vendors"}, 
                status=status.HTTP_403_FORBIDDEN
            )
    except Vendor.DoesNotExist:
        return Response(
            {"error": "Vendor profile not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        application = ServiceApplication.objects.get(id=application_id, service=vendor)
    except ServiceApplication.DoesNotExist:
        return Response(
            {"error": "Application not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get new status from request
    new_status = request.data.get('status')
    vendor_response = request.data.get('vendor_response', '')
    
    # Validate status
    valid_statuses = ['pending', 'accepted', 'declined', 'completed', 'cancelled']
    if new_status not in valid_statuses:
        return Response(
            {"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update application
    application.status = new_status
    
    # Set additional fields based on status
    if new_status in ['accepted', 'declined']:
        application.vendor_response = vendor_response
        application.response_date = timezone.now()
    
    if new_status == 'completed':
        application.completion_date = timezone.now()
    
    application.save()
    
    return Response({
        "message": f"Application status updated to {new_status}",
        "status": new_status,
        "application_id": application.id
    })