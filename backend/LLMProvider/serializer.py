from rest_framework import serializers
from LLMProvider.models import LLMProviderModel
from decouple import config


class LLMProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = LLMProviderModel
        fields = [
            "id",
            "name",
            "slug",
            "website",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        name = attrs.get("name", getattr(self.instance, "name", None))
        slug = attrs.get("slug", getattr(self.instance, "slug", None))

        # Validate unique name
        if name:
            name_qs = LLMProviderModel.objects.filter(name=name)
            if self.instance:
                name_qs = name_qs.exclude(id=self.instance.id)
            if name_qs.exists():
                raise serializers.ValidationError(
                    {"name": "An LLM Provider with this name already exists."}
                )

        # Validate unique slug
        if slug:
            slug_qs = LLMProviderModel.objects.filter(slug=slug)
            if self.instance:
                slug_qs = slug_qs.exclude(id=self.instance.id)
            if slug_qs.exists():
                raise serializers.ValidationError(
                    {"slug": "An LLM Provider with this slug already exists."}
                )

        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        backendurl = config("BACKEND_URL", default="")

        if instance.website and not instance.website.startswith(
            ("http://", "https://")
        ):
            data["website"] = f"{backendurl.rstrip('/')}/{instance.website.lstrip('/')}"

        return data
