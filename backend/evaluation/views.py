from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import SearchFilter, OrderingFilter

from evaluation.models import EvaluationModel
from evaluation.serializer import EvaluationSerializer

from utils.myPagination import MyPagination


class EvaluationViewSet(ModelViewSet):

    queryset = EvaluationModel.objects.all().order_by("-id")
    serializer_class = EvaluationSerializer

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    pagination_class = MyPagination

    search_fields = [
        "response__response_text",
        "reasoning",
        "response__comparison__title",
    ]

    ordering_fields = [
        "id",
        "accuracy_score",
        "relevance_score",
        "completeness_score",
        "clarity_score",
        "helpfulness_score",
        "overall_score",
        "created_at",
        "updated_at",
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        response_id = self.request.query_params.get("response")

        if response_id:
            queryset = queryset.filter(
                response_id=response_id
            )

        comparison_id = self.request.query_params.get("comparison")

        if comparison_id:
            queryset = queryset.filter(
                response__comparison_id=comparison_id
            )

        is_winner = self.request.query_params.get("isWinner")

        if is_winner is not None:
            queryset = queryset.filter(
                is_winner=is_winner.lower() == "true"
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
                    "message": "Evaluation Created Successfully",
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

        evaluation_instance = self.get_object()

        serializer = self.serializer_class(
            evaluation_instance,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Evaluation Updated Successfully",
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

        evaluation_instance = self.get_object()

        serializer = self.serializer_class(
            evaluation_instance
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):

        evaluation_instance = self.get_object()

        evaluation_instance.delete()

        return Response(
            {
                "success": True,
                "message": "Evaluation Deleted Successfully",
            },
            status=status.HTTP_200_OK,
        )
