from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from django.contrib.auth.hashers import check_password
import json
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from workspace.models import WorkspaceModel
from workspace.serailizer import WorkspaceSerializer
from decouple import config
from django.core.files.base import ContentFile
import uuid
from workspace.models import WorkspaceMemberModel
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from django.core.cache import cache
from project.models import ProjectModel
# Create your views here.
from django.contrib.auth.models import Group
from calendar import month_abbr
import requests
from user.models import UserModel
from user.serializer import UserSerialzier
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated, AllowAny,IsAdminUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from utils.myPagination import MyPagination
from utils.generate_token import generate_tokens_for_user
from utils.send_email import send_template_email
from utils.generate_otp import generate_otp
from utils.generate_verification_token import decode_jwt, encode_jwt
import threading
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from rest_framework.decorators import action
# from order.views import OrderModel
# from product.views import ProductModel
from django.db.models import Sum
# from order.views import OrderItemModel


class UserViewSet(ModelViewSet):
    queryset = UserModel.objects.all().order_by("-id")
    serializer_class = UserSerialzier
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    pagination_class = MyPagination

    search_fields = ["username", "email"]
    ordering_fields = [
        "id",
        "email",
        "username",
    ]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset=queryset)
        if page is not None:
            serializer = self.serializer_class(page, many=True)
            return self.get_paginated_response(serializer.data)

        else:
            serializer = self.serializer_class(queryset, many=True)
            if serializer.is_valid():
                return Response(
                    {"success": True, "data": serializer.data},
                    status=status.HTTP_200_OK,
                )

    def create(self, request, *args, **kwargs):
        user_data = json.loads(request.data.get("user_data", "{}"))
        profile_image = request.FILES.get("profile_image")
        user_data["profile_image"] = profile_image
        serializer = self.serializer_class(data=user_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "Data Created Successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        else:
            first_field, first_error_list = next(iter(serializer.errors.items()))
            first_error = (
                first_error_list[0]
                if isinstance(first_error_list, list)
                else first_error_list
            )
            return Response(
                {"success": "False", "error": first_error},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, *args, **kwargs):
        user_instance = self.get_object()
        user_data = json.loads(request.data.get("user_data", "{}"))
        profile_image = request.FILES.get("profile_image")
        if profile_image:
            user_data["profile_image"] = profile_image
        serializer = self.serializer_class(user_instance, data=user_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "Data Updated Successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        else:
            print(serializer.errors)
            first_field, first_error_list = next(iter(serializer.errors.items()))
            first_error = (
                first_error_list[0]
                if isinstance(first_error_list, list)
                else first_error_list
            )
            return Response(
                {"success": "False", "error": first_error},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def retrieve(self, request, *args, **kwargs):
        user_instance = self.get_object()
        serializer = self.serializer_class(user_instance)
        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    @action(
    detail=False,
    methods=["POST"],
    url_path="get-single-user",
    permission_classes=[IsAuthenticated],
    )
    def get_single_user(self, request, *args, **kwargs):
        user = request.user

        serializer = self.serializer_class(user)
        data = serializer.data

        # System-wide role
        user_role = (
            "admin"
            if user.is_superuser or user.is_staff
            else "user"
        )

        # Workspace-specific role
        workspace = WorkspaceModel.objects.filter(
            owner=user
        ).first()

        workspace_role = None

        if workspace:
            workspace_role = "owner"
        else:
            membership = (
                WorkspaceMemberModel.objects
                .filter(
                    user=user,
                    is_active=True,
                )
                .select_related("workspace")
                .first()
            )

            if membership:
                workspace = membership.workspace
                workspace_role = "member"

        data["user_role"] = user_role
        data["workspace"] = workspace.id if workspace else None
        data["workspace_role"] = workspace_role
        data["workspace_name"] = workspace.name if workspace else None

        return Response(
            {
                "success": True,
                "data": data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["POST"],
        url_path="admin-dashboard",
        permission_classes=[IsAdminUser],
    )
    def admin_dashboard(self, request, *args, **kwargs):

        now = timezone.now()
        today = timezone.localdate()
        last_7_days = now - timedelta(days=7)
        last_30_days = now - timedelta(days=30)
        start_date = today - timedelta(days=29)

        # ==========================================
        # 1. USERS
        # ==========================================

        users = UserModel.objects.all()

        total_users = users.count()

        active_users = users.filter(
            is_active=True
        ).count()

        inactive_users = users.filter(
            is_active=False
        ).count()

        verified_users = users.filter(
            is_email_verified=True
        ).count()

        unverified_users = users.filter(
            is_email_verified=False
        ).count()

        new_users_today = users.filter(
            created_at__date=today
        ).count()

        new_users_last_7_days = users.filter(
            created_at__gte=last_7_days
        ).count()

        new_users_last_30_days = users.filter(
            created_at__gte=last_30_days
        ).count()

        # ==========================================
        # 2. WORKSPACES
        # ==========================================

        workspaces = WorkspaceModel.objects.all()

        total_workspaces = workspaces.count()

        # ==========================================
        # 3. PROJECTS
        # ==========================================

        projects = ProjectModel.objects.all()

        total_projects = projects.count()

        # ==========================================
        # 4. USER REGISTRATION ANALYTICS
        # ==========================================

        registration_queryset = (
            users.filter(
                created_at__date__gte=start_date
            )
            .values("created_at__date")
            .annotate(total=Count("id"))
            .order_by("created_at__date")
        )

        registration_map = {
            str(item["created_at__date"]): item["total"]
            for item in registration_queryset
        }

        user_registrations = []

        for day_offset in range(30):
            day = start_date + timedelta(days=day_offset)

            user_registrations.append({
                "date": str(day),
                "total": registration_map.get(str(day), 0),
            })

        # ==========================================
        # 5. RECENT USERS
        # ==========================================

        recent_users = users.order_by("-created_at")[:10]

        recent_user_data = [
            {
                "id": user.id,
                "email": user.email,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat(),
            }
            for user in recent_users
        ]

        # ==========================================
        # 6. LLM PROVIDERS
        # ==========================================

        # Connect your actual provider model here.
        providers_data = {
            "total": 0,
            "active": 0,
            "inactive": 0,
        }

        # ==========================================
        # 7. LLM MODELS
        # ==========================================

        # Connect your actual LLM model here.
        models_data = {
            "total": 0,
            "active": 0,
            "inactive": 0,
        }

        # ==========================================
        # 8. COMPARISONS
        # ==========================================

        # Connect your actual comparison model and
        # status choices here.
        comparisons_data = {
            "total": 0,
            "completed": 0,
            "pending": 0,
            "running": 0,
            "failed": 0,
        }

        # ==========================================
        # 9. EVALUATIONS
        # ==========================================

        # Connect your actual evaluation model here.
        evaluations_data = {
            "total": 0,
            "completed": 0,
            "with_winner": 0,
        }

        # ==========================================
        # 10. FINAL RESPONSE
        # ==========================================

        return Response({
            "success": True,
            "generated_at": now.isoformat(),

            "overview": {
                "total_users": total_users,
                "active_users": active_users,
                "inactive_users": inactive_users,
                "total_workspaces": total_workspaces,
                "total_projects": total_projects,
                "total_providers": providers_data["total"],
                "total_models": models_data["total"],
                "total_comparisons": comparisons_data["total"],
                "total_evaluations": evaluations_data["total"],
            },

            "users": {
                "total": total_users,
                "active": active_users,
                "inactive": inactive_users,
                "verified": verified_users,
                "unverified": unverified_users,
                "new_today": new_users_today,
                "new_last_7_days": new_users_last_7_days,
                "new_last_30_days": new_users_last_30_days,
                "verification_rate": round(
                    verified_users / total_users * 100, 2
                ) if total_users else 0,
            },

            "workspaces": {
                "total": total_workspaces,
            },

            "projects": {
                "total": total_projects,
            },

            "providers": providers_data,

            "models": models_data,

            "comparisons": comparisons_data,

            "evaluations": evaluations_data,

            "analytics": {
                "user_registrations": user_registrations,
            },

            "recent_activity": {
                "users": recent_user_data,
            },
        })
        
    @action(
        detail=False,
        methods=["POST"],
        url_path="owner-dashboard",
        permission_classes=[IsAuthenticated],
    )
    def owner_dashboard(self, request, *args, **kwargs):

        user = request.user

        now = timezone.now()
        today = timezone.localdate()
        last_7_days = now - timedelta(days=7)
        last_30_days = now - timedelta(days=30)
        start_date = today - timedelta(days=29)

        # ==========================================
        # 1. OWNER WORKSPACES
        # ==========================================

        # Only workspaces owned by the authenticated user.
        workspaces = WorkspaceModel.objects.filter(
            owner=user
        )

        total_workspaces = workspaces.count()

        # ==========================================
        # 2. OWNER PROJECTS
        # ==========================================

        # Assumes ProjectModel has a workspace FK.
        projects = ProjectModel.objects.filter(
            workspace__owner=user
        )

        total_projects = projects.count()

        # ==========================================
        # 3. PROJECT ANALYTICS
        # ==========================================

        # Assumes ProjectModel has a created_at field.
        project_queryset = (
            projects.filter(created_at__date__gte=start_date)
            .values("created_at__date")
            .annotate(total=Count("id"))
            .order_by("created_at__date")
        )

        project_map = {
            str(item["created_at__date"]): item["total"]
            for item in project_queryset
        }

        daily_projects = []

        for day_offset in range(30):
            day = start_date + timedelta(days=day_offset)

            daily_projects.append({
                "date": str(day),
                "total": project_map.get(str(day), 0),
            })

        # ==========================================
        # 4. RECENT PROJECTS
        # ==========================================

        recent_projects = projects.order_by("-created_at")[:10]

        recent_project_data = [
            {
                "id": project.id,
                "name": project.name,
                "workspace_id": project.workspace_id,
                "created_at": project.created_at.isoformat(),
            }
            for project in recent_projects
        ]

        # ==========================================
        # 5. COMPARISONS
        # ==========================================

        # Replace ComparisonModel with your actual model.
        # Assumes comparison.project.workspace.owner
        # identifies the workspace owner.

        comparisons_data = {
            "total": 0,
            "completed": 0,
            "pending": 0,
            "running": 0,
            "failed": 0,
        }

        # ==========================================
        # 6. EVALUATIONS
        # ==========================================

        evaluations_data = {
            "total": 0,
            "with_winner": 0,
        }

        # ==========================================
        # 7. LLM PROVIDERS AND MODELS
        # ==========================================

        # Connect these to your actual models.
        providers_data = {
            "total": 0,
        }

        models_data = {
            "total": 0,
        }

        # ==========================================
        # 8. FINAL RESPONSE
        # ==========================================

        return Response({
            "success": True,
            "generated_at": now.isoformat(),

            "owner": {
                "id": user.id,
                "email": user.email,
            },

            "overview": {
                "total_workspaces": total_workspaces,
                "total_projects": total_projects,
                "total_comparisons": comparisons_data["total"],
                "completed_comparisons": comparisons_data["completed"],
                "running_comparisons": comparisons_data["running"],
                "failed_comparisons": comparisons_data["failed"],
                "total_evaluations": evaluations_data["total"],
            },

            "workspaces": {
                "total": total_workspaces,
            },

            "projects": {
                "total": total_projects,
                "created_last_7_days": projects.filter(
                    created_at__gte=last_7_days
                ).count(),
                "created_last_30_days": projects.filter(
                    created_at__gte=last_30_days
                ).count(),
            },

            "comparisons": comparisons_data,

            "evaluations": evaluations_data,

            "providers": providers_data,

            "models": models_data,

            "analytics": {
                "daily_projects": daily_projects,
            },

            "recent_activity": {
                "projects": recent_project_data,
            },
        })
    @action(
        detail=False,
        methods=["POST"],
        url_path="member-dashboard",
        permission_classes=[IsAuthenticated],
    )
    def member_dashboard(self, request, *args, **kwargs):

        user = request.user

        now = timezone.now()
        today = timezone.localdate()
        last_7_days = now - timedelta(days=7)
        last_30_days = now - timedelta(days=30)
        start_date = today - timedelta(days=29)

        # ==========================================
        # 1. MEMBER WORKSPACES
        # ==========================================

        # Only active memberships.
        memberships = WorkspaceMemberModel.objects.filter(
            user=user,
            is_active=True,
        )

        # Exclude workspaces the user owns from the
        # member-specific list.
        workspaces = WorkspaceModel.objects.filter(
            members__user=user,
            members__is_active=True,
        ).exclude(
            owner=user,
        ).distinct()

        total_workspaces = workspaces.count()

        # ==========================================
        # 2. ACCESSIBLE PROJECTS
        # ==========================================

        projects = ProjectModel.objects.filter(
            workspace__members__user=user,
            workspace__members__is_active=True,
        ).exclude(
            workspace__owner=user,
        ).distinct()

        total_projects = projects.count()

        # ==========================================
        # 3. PROJECT ANALYTICS
        # ==========================================

        project_queryset = (
            projects.filter(
                created_at__date__gte=start_date,
            )
            .values("created_at__date")
            .annotate(total=Count("id"))
            .order_by("created_at__date")
        )

        project_map = {
            str(item["created_at__date"]): item["total"]
            for item in project_queryset
        }

        daily_projects = []

        for day_offset in range(30):
            day = start_date + timedelta(days=day_offset)

            daily_projects.append({
                "date": str(day),
                "total": project_map.get(str(day), 0),
            })

        # ==========================================
        # 4. RECENT PROJECTS
        # ==========================================

        recent_projects = projects.order_by(
            "-created_at"
        )[:10]

        recent_project_data = [
            {
                "id": project.id,
                "name": project.name,
                "workspace_id": project.workspace_id,
                "created_at": project.created_at.isoformat(),
            }
            for project in recent_projects
        ]

        # ==========================================
        # 5. WORKSPACE MEMBERSHIPS
        # ==========================================

        total_memberships = memberships.count()

        # ==========================================
        # 6. COMPARISONS
        # ==========================================

        # Connect your actual ComparisonModel here.
        # Restrict comparisons through the member's
        # accessible projects.

        comparisons_data = {
            "total": 0,
            "completed": 0,
            "pending": 0,
            "running": 0,
            "failed": 0,
        }

        # ==========================================
        # 7. EVALUATIONS
        # ==========================================

        # Connect your actual EvaluationModel here.

        evaluations_data = {
            "total": 0,
            "with_winner": 0,
        }

        # ==========================================
        # 8. FINAL RESPONSE
        # ==========================================

        return Response({
            "success": True,
            "generated_at": now.isoformat(),

            "member": {
                "id": user.id,
                "email": user.email,
            },

            "overview": {
                "total_workspaces": total_workspaces,
                "total_projects": total_projects,
                "total_memberships": total_memberships,
                "total_comparisons": comparisons_data["total"],
                "completed_comparisons": comparisons_data["completed"],
                "running_comparisons": comparisons_data["running"],
                "failed_comparisons": comparisons_data["failed"],
                "total_evaluations": evaluations_data["total"],
            },

            "workspaces": {
                "total": total_workspaces,
            },

            "projects": {
                "total": total_projects,

                "created_last_7_days": projects.filter(
                    created_at__gte=last_7_days,
                ).count(),

                "created_last_30_days": projects.filter(
                    created_at__gte=last_30_days,
                ).count(),
            },

            "comparisons": comparisons_data,

            "evaluations": evaluations_data,

            "analytics": {
                "daily_projects": daily_projects,
            },

            "recent_activity": {
                "projects": recent_project_data,
            },
        })
class LoginViewset(ModelViewSet):
    queryset = UserModel.objects.all()
    serializer_class = UserSerialzier

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data
        email = data.get("email")
        password = data.get("password")

        if not email:
            return Response(
                {"success": False, "error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not password:
            return Response(
                {"success": False, "error": "Password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user_instance = UserModel.objects.get(email=email)

        except UserModel.DoesNotExist:
            return Response(
                {"success": False, "error": "Email Invalid"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not check_password(password, user_instance.password):
            return Response(
                {"success": False, "error": "Invalid Password"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        print(user_instance.is_email_verified)
        if not user_instance.is_email_verified:
            return Response(
                {
                    "success": False,
                    "error": "User account is not verified, So register and verify Account",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        token = generate_tokens_for_user(user=user_instance)

        user_instance.is_active = True
        user_instance.save()

        return Response(
            {"success": True, "message": "Login Successfully done", "token": token},
            status=status.HTTP_200_OK,
        )


class RegisterViewset(ModelViewSet):
    queryset = UserModel.objects.all()
    serializer_class = UserSerialzier

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        email = request.data.get("email")

        user_instance = UserModel.objects.filter(
            email=email,
            is_email_verified=False
        ).first()

        # User already exists but has not verified email
        if user_instance:
            otp = generate_otp()

            user_instance.otp = otp
            user_instance.save()

            verification_token = encode_jwt(
                email=user_instance.email
            )

            context = {
                "email": user_instance.email,
                "username": user_instance.username,
                "otp": otp,
            }

            send_email = threading.Thread(
                target=send_template_email,
                kwargs={
                    "subject": "OTP Verification",
                    "template_name": "OtpVerifyEmail.html",
                    "context": context,
                    "recipient_list": [user_instance.email],
                },
            )

            send_email.start()

            return Response(
                {
                    "success": True,
                    "message": f"A new OTP has been sent to {user_instance.email}",
                    "verification_token": verification_token,
                },
                status=status.HTTP_200_OK,
            )

        # New user registration
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            otp = generate_otp()

            serializer.validated_data["otp"] = otp

            user_instance = serializer.save()

            verification_token = encode_jwt(
                email=user_instance.email
            )

            context = {
                "email": user_instance.email,
                "username": user_instance.username,
                "otp": otp,
            }

            send_email = threading.Thread(
                target=send_template_email,
                kwargs={
                    "subject": "OTP Verification",
                    "template_name": "OtpVerifyEmail.html",
                    "context": context,
                    "recipient_list": [user_instance.email],
                },
            )

            send_email.start()

            return Response(
                {
                    "success": True,
                    "message": f"OTP successfully sent to {user_instance.email}",
                    "verification_token": verification_token,
                },
                status=status.HTTP_200_OK,
            )

        first_field, first_error_list = next(
            iter(serializer.errors.items())
        )

        first_error = (
            first_error_list[0]
            if isinstance(first_error_list, list)
            else first_error_list
        )

        return Response(
            {
                "success": False,
                "error": first_error,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class OtpVerifyViewSet(ModelViewSet):
    queryset = UserModel.objects.all()
    serializer_class = UserSerialzier

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        otp = request.data.get("otp")
        token = request.data.get("token")
        print(otp, token)

        if not otp:
            return Response(
                {"success": False, "error": "Otp is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not token:
            return Response(
                {"success": False, "error": "Verification Token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = decode_jwt(token=token)
        except:
            return Response(
                {"success": False, "error": "Token is expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not payload.get("email"):
            return Response(
                {"success": False, "error": "Invalid token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_instance = UserModel.objects.filter(
            email=payload.get("email"), otp=otp
        ).first()
        if not user_instance:
            return Response(
                {"success": False, "error": "Invalid Otp"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token = generate_tokens_for_user(user_instance)
        user_instance.is_email_verified = True
        user_instance.is_active = True
        user_instance.save()

        return Response(
            {
                "success": True,
                "message": "Otp Verification Successfully Verified",
                "token": token,
            },
            status=status.HTTP_200_OK,
        )
        
class ResendOtpViewset(ModelViewSet):
    def create(self, request, *args, **kwargs):
        token=request.data.get("token")
        
        if not token:
            return Response({"success":False,"error":"token is required"},status=status.HTTP_400_BAD_REQUEST)
        
        payload=decode_jwt(token=token)
        if payload.get("email"):
            try:
                user_instance=UserModel.objects.get(email=payload.get("email"))
            except UserModel.DoesNotExist:
                return Response({"success":False,"error":"user doesnot exists"},status=status.HTTP_400_BAD_REQUEST)
            
            print(user_instance.email)
            print(user_instance.username)
            print(user_instance.otp)
            
            
            context = {
                            "email": user_instance.email,
                            "username": user_instance.username,
                            "otp": user_instance.otp,
                        }
            
            send_email = threading.Thread(
                target=send_template_email,
                kwargs={
                    "subject": "OTP Verification",
                    "template_name": "OtpVerifyEmail.html",
                    "context": context,
                    "recipient_list": [user_instance.email],
                },
            )
            
            send_email.start()
        
            return Response({"success":True,"message":f"Otp Resend to {user_instance.email}"},status=status.HTTP_200_OK)
        else:
            return Response({"success":False,"error":"Invalid token"},status=status.HTTP_400_BAD_REQUEST)
        


class ForgotPasswordViewset(ModelViewSet):
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            return Response(
                {"success": False, "error": "email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_instance = UserModel.objects.get(email=email, is_email_verified=True)
        except UserModel.DoesNotExist:
            return Response(
                {"success": False, "error": "User with this email does not exists "},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification_token = encode_jwt(user_instance.email)
        context = {
            "email": user_instance.email,
            "username": user_instance.username,
            "token": verification_token,
        }

        send_email = threading.Thread(
            target=send_template_email,
            kwargs={
                "subject": "Forgot Password",
                "template_name": "ForgotPasswordEmail.html",
                "context": context,
                "recipient_list": [user_instance.email],
            },
        )
        send_email.start()

        return Response(
            {
                "success": True,
                "message": f"Change Password Link has been send on {user_instance.email}",
                "token": verification_token,
            },
            status=status.HTTP_200_OK,
        )


class ChangePasswordViewset(ModelViewSet):
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        print(request.data)
        token = request.data.get("token")
        password = request.data.get("password")
        password2 = request.data.get("password2")

        if not token:
            print(token)
            return Response(
                {"success": False, "error": "token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not password:
            return Response(
                {"success": False, "error": "password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 8 or len(password) > 14:
            return Response(
                {
                    "success": False,
                    "error": "password length should be between 8 to 14 ",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not password2:
            return Response(
                {"success": False, "error": "password2 is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not password == password2:
            return Response(
                {"success": False, "error": "password and password2 is not macthing "},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = decode_jwt(token=token)
        except:
            return Response(
                {"success": False, "error": "Token is expired "},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not payload.get("email"):
            return Response(
                {"success": False, "error": "Invalid token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_instance = UserModel.objects.get(
                email=payload.get("email"), is_email_verified=True
            )
        except UserModel.DoesNotExist:
            return Response(
                {"success": False, "error": "No User found with the email"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token = generate_tokens_for_user(user_instance)
        user_instance.set_password(password)
        user_instance.is_active = True
        user_instance.save()

        return Response(
            {
                "success": True,
                "message": "New Password Change Successfully Created",
                "token": token,
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordViewset(ModelViewSet):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    @transaction.atomic()
    def create(self, request, *args, **kwargs):
        user_instance = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not old_password:
            return Response(
                {"success": False, "error": "old password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_instance = UserModel.objects.get(
                id=user_instance.id, is_email_verified=True
            )
        except UserModel.DoesNotExist:
            return Response(
                {"success": False, "error": "No User found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user_instance.check_password(old_password):
            return Response(
                {
                    "success": False,
                    "error": "Invalid old password",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not new_password:
            return Response(
                {"success": False, "error": "new password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8 or len(new_password) > 14:
            return Response(
                {
                    "success": False,
                    "error": "new password length should be between 8 to 14 ",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password == old_password:
            return Response(
                {
                    "success": False,
                    "error": "new password should not similiar to old password",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not confirm_password:
            return Response(
                {"success": False, "error": "confirm_password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not new_password == confirm_password:
            return Response(
                {
                    "success": False,
                    "error": "new_password and confirm_password is not macthing ",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_instance.password
        user_instance.set_password(new_password)
        user_instance.is_active = True
        user_instance.save()
        context = {
            "email": user_instance.email,
            "username": user_instance.username,
        }

        # send_email = threading.Thread(
        #     target=send_template_email,
        #     args=[
        #         {
        #             "subject": "Reset Password",
        #             "template_name": "ResetPasswordEmail.html",
        #             "context": context,
        #             "recipient_list": [user_instance.email],
        #         }
        #     ],
        # )
        # send_email.start()

        return Response(
            {"success": True, "message": "Password Reset Successfully Done"},
            status=status.HTTP_200_OK,
        )


class LogoutViewSet(ModelViewSet):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def create(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {
                    "success": False,
                    "error": "Refresh token is required",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {
                    "success": True,
                    "message": "Logout successful",
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            print(e)

            return Response(
                {
                    "success": False,
                    "error": str(e),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
class GoogleSocialAuthView(ModelViewSet):

    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):

        code = request.data.get("code")
        is_new_user = False
        if not code:
            return Response(
                {
                    "success": False,
                    "message": "Google authorization code is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": config("GOOGLE_CLIENT_ID"),
                "client_secret": config("GOOGLE_CLIENT_SECRET"),
                "redirect_uri": "postmessage",
                "grant_type": "authorization_code",
            },
        )

        token_data = token_response.json()

        if "error" in token_data:
            return Response(
                {
                    "success": False,
                    "message": "Google verification failed.",
                    "details": token_data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        access_token = token_data.get("access_token")

        profile = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={
                "Authorization": f"Bearer {access_token}"
            },
        ).json()

        email = profile.get("email")
        first_name = profile.get("given_name", "")
        last_name = profile.get("family_name", "")
        picture = profile.get("picture", "")

        if not email:
            return Response(
                {
                    "success": False,
                    "message": "Unable to retrieve Google email.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = UserModel.objects.filter(email=email).first()

        if not user:

            username = (
                first_name
                or email.split("@")[0]
            )

            user = UserModel.objects.create(
                email=email,
                username=username,
                # Add other required fields here if needed
            )
            is_new_user = True
            

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "success": True,

                "token": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },

                "user": {
                    "email": user.email,
                    "username": user.username,
                    "picture": picture,
                    "is_new_user":is_new_user
                },

                "message": "Google Authentication successfully Done",
            },
            status=status.HTTP_200_OK,
        )