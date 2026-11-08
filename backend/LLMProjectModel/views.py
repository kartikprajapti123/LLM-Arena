import json

from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q

from LLMProjectModel.models import LLMProjectModelModel
from LLMProjectModel.serializer import LLMProjectModelSerializer

from utils.myPagination import MyPagination


class LLMProjectModelViewSet(ModelViewSet):
    queryset = LLMProjectModelModel.objects.all().order_by("-id")
    serializer_class = LLMProjectModelSerializer

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    pagination_class = MyPagination

    search_fields = [
        "project__name",
        "llm_model__name",
        "llm_model__model_identifier",
        "llm_model__provider__name",
    ]

    ordering_fields = [
        "id",
        "is_active",
        "created_at",
        "updated_at",
    ]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        queryset = queryset.filter(
        Q(project__workspace__owner=request.user)
        | Q(project__workspace__members__user=request.user)
    ).distinct()
        # Filter by active status
        status_filter = request.query_params.get("statusFilter")
        if status_filter:
            queryset = queryset.filter(is_active=status_filter.lower() == "true")

        # Filter by project ID
        project_id = request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        # Filter by LLM model ID
        llm_model_id = request.query_params.get("llm_model")
        if llm_model_id:
            queryset = queryset.filter(llm_model_id=llm_model_id)

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.serializer_class(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.serializer_class(queryset, many=True)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        raw_data = request.data.get("project_llm_data")
        if raw_data:
            project_llm_data = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
        else:
            project_llm_data = request.data

        serializer = self.serializer_class(data=project_llm_data, partial=True)

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Project LLM Model Association Created Successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        first_field, first_error_list = next(iter(serializer.errors.items()))

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

    def update(self, request, *args, **kwargs):
        project_llm_instance = self.get_object()

        raw_data = request.data.get("project_llm_data")
        if raw_data:
            project_llm_data = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
        else:
            project_llm_data = request.data

        serializer = self.serializer_class(
            project_llm_instance, data=project_llm_data, partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Project LLM Model Association Updated Successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        first_field, first_error_list = next(iter(serializer.errors.items()))

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

    def retrieve(self, request, *args, **kwargs):
        project_llm_instance = self.get_object()

        serializer = self.serializer_class(project_llm_instance)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        project_llm_instance = self.get_object()
        project_llm_instance.delete()

        return Response(
            {
                "success": True,
                "message": "Project LLM Model Association Deleted Successfully",
            },
            status=status.HTTP_200_OK,
        )