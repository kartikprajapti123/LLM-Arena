from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import SearchFilter, OrderingFilter

from response.models import ResponseModel
from response.serializer import ResponseSerializer

from utils.myPagination import MyPagination


class ResponseViewSet(ModelViewSet):

    queryset = ResponseModel.objects.all().order_by("-id")
    serializer_class = ResponseSerializer

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    pagination_class = MyPagination

    search_fields = [
        "content",
        "error_message",
        "comparison__title",
        "llm_project_model__llm_model__name",
    ]

    ordering_fields = [
        "id",
        "status",
        "response_time",
        "input_tokens",
        "output_tokens",
        "created_at",
        "updated_at",
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        status_filter = self.request.query_params.get("statusFilter")

        if status_filter:
            queryset = queryset.filter(
                status=status_filter
            )

        comparison_id = self.request.query_params.get("comparison")

        if comparison_id:
            queryset = queryset.filter(
                comparison_id=comparison_id
            )

        llm_project_model_id = self.request.query_params.get(
            "llm_project_model"
        )

        if llm_project_model_id:
            queryset = queryset.filter(
                llm_project_model_id=llm_project_model_id
            )

        return queryset

    def list(self, request, *args, **kwargs):

        queryset = self.filter_queryset(
            self.get_queryset()
        )

        page = self.paginate_queryset(queryset)

        if page is not None:

            serializer = self.serializer_class(
                page,
                many=True
            )

            return self.get_paginated_response(
                serializer.data
            )

        serializer = self.serializer_class(
            queryset,
            many=True
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):

        serializer = self.serializer_class(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Response Created Successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
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

    def update(self, request, *args, **kwargs):

        response_instance = self.get_object()

        serializer = self.serializer_class(
            response_instance,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Response Updated Successfully",
                    "data": serializer.data,
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

    def retrieve(self, request, *args, **kwargs):

        response_instance = self.get_object()

        serializer = self.serializer_class(
            response_instance
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):

        response_instance = self.get_object()

        response_instance.delete()

        return Response(
            {
                "success": True,
                "message": "Response Deleted Successfully",
            },
            status=status.HTTP_200_OK,
        )