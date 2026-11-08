from django.shortcuts import render

# Create your views here.
from django.shortcuts import render

# Create your views here.
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.authentication import JWTAuthentication
from utils.myPagination import MyPagination
from master.models import Country, State, City
from master.serializer import CountrySerializer, StateSerializer, CitySerializer
import json


class CountryViewset(ModelViewSet):
    queryset = Country.objects.all().order_by("-id")
    serializer_class = CountrySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    filter_backends = [SearchFilter, OrderingFilter]
    pagination_class = MyPagination

    search_fields = ["name",]
    ordering_fields = ["name","created_at"]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        no_pagination = request.query_params.get("no_pagination")
        if no_pagination:
            serializer = self.serializer_class(queryset, many=True)
            return Response(
                {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.serializer_class(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.serializer_class(queryset, many=True)
        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    def create(self, request, *args, **kwargs):
        data = (
            json.loads(request.data.get("form_data", "{}"))
            if "form_data" in request.data
            else request.data
        )
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Country created successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        first_field = list(serializer.errors.keys())[0]
        first_error_message = f"{first_field} :- {serializer.errors[first_field][0]}"
        return Response(
            {"success": False, "error": first_error_message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = (
            json.loads(request.data.get("form_data", "{}"))
            if "form_data" in request.data
            else request.data
        )
        serializer = self.serializer_class(instance=instance, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "Country updated successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        first_field = list(serializer.errors.keys())[0]
        first_error_message = f"{first_field} :- {serializer.errors[first_field][0]}"
        return Response(
            {"success": False, "error": first_error_message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.serializer_class(instance=instance)
        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        id=instance.id
        instance.delete()
        return Response(
            {"success": True, "message": "Country deleted successfully","id":id},
            status=status.HTTP_200_OK,
        )


class StateViewset(ModelViewSet):
    queryset = State.objects.select_related("country").order_by("-id")
    serializer_class = StateSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    filter_backends = [SearchFilter, OrderingFilter]
    pagination_class = MyPagination

    search_fields = ["name", "country__name"]
    ordering_fields = ["id", "name", "country__name","created_at"]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        country_name=request.query_params.get("country_name")
        if country_name:
            queryset=queryset.filter(country__name=country_name)
            
        no_pagination = request.query_params.get("no_pagination")
        if no_pagination:
            serializer = self.serializer_class(queryset, many=True)
            return Response(
                {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.serializer_class(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.serializer_class(queryset, many=True)
        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    def create(self, request, *args, **kwargs):
        data = (
            json.loads(request.data.get("form_data", "{}"))
            if "form_data" in request.data
            else request.data
        )
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "State created successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        first_field = list(serializer.errors.keys())[0]
        first_error_message = f"{serializer.errors[first_field][0]}"
        return Response(
            {"success": False, "error": first_error_message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = (
            json.loads(request.data.get("form_data", "{}"))
            if "form_data" in request.data
            else request.data
        )
        serializer = self.serializer_class(instance=instance, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "State updated successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        first_field = list(serializer.errors.keys())[0]
        first_error_message = f" {serializer.errors[first_field][0]}"
        return Response(
            {"success": False, "error": first_error_message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.serializer_class(instance=instance)
        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        id=instance.id
        instance.delete()
        instance.save()
        return Response(
            {"success": True, "message": "State deleted successfully","id":id},
            status=status.HTTP_200_OK,
        )


class CityViewSet(ModelViewSet):
    queryset = City.objects.select_related("state").order_by("-id")
    serializer_class = CitySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    filter_backends = [SearchFilter, OrderingFilter]
    pagination_class = MyPagination

    search_fields = ["name", "state__name","state__country__name"]
    ordering_fields = ["id", "name", "state__name","state__country__name","created_at"]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        country_name=request.query_params.get("country_name")
        if country_name:
            queryset=queryset.filter(state__country__name=country_name)
            
        state_name=request.query_params.get("state_name")
        if state_name:
            queryset=queryset.filter(state__name=state_name)
            
        no_pagination = request.query_params.get("no_pagination")
        if no_pagination:
            serializer = self.serializer_class(queryset, many=True)
            return Response(
                {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.serializer_class(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.serializer_class(queryset, many=True)
        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    def create(self, request, *args, **kwargs):
        data = (
            json.loads(request.data.get("form_data", "{}"))
            if "form_data" in request.data
            else request.data
        )
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "City created successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        first_field = list(serializer.errors.keys())[0]
        first_error_message = f" {serializer.errors[first_field][0]}"
        return Response(
            {"success": False, "error": first_error_message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = (
            json.loads(request.data.get("form_data", "{}"))
            if "form_data" in request.data
            else request.data
        )
        serializer = self.serializer_class(instance=instance, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "City updated successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        first_field = list(serializer.errors.keys())[0]
        first_error_message = f" {serializer.errors[first_field][0]}"
        return Response(
            {"success": False, "error": first_error_message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.serializer_class(instance=instance)
        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        id=instance.id
        instance.delete()
        return Response(
            {"success": True, "message": "City deleted successfully","id":id},
            status=status.HTTP_200_OK,
        )
