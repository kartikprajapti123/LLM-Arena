
from rest_framework import serializers
from comparison.models import ComparisonModel
from response.models import ResponseModel
from decouple import config


class ComparisonSerializer(serializers.ModelSerializer):
    responses = serializers.SerializerMethodField()

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    created_by_profileImage = serializers.CharField(
        source="created_by.profile_image",
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = ComparisonModel

        fields = [
            "id",
            "project",
            "created_by",
            "created_by_username",
            "created_by_profileImage",
            "title",
            "prompt",
            "status",
            "winner_response",
            "responses",
            "completed_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "status",
            "winner_response",
            "responses",
            "completed_at",
            "created_at",
            "updated_at",
        ]

    def get_responses(self, obj):
        return list(
            ResponseModel.objects.filter(comparison=obj).values()
        )

    def validate(self, attrs):
        project = attrs.get(
            "project", getattr(self.instance, "project", None)
        )
        title = attrs.get(
            "title", getattr(self.instance, "title", None)
        )
        prompt = attrs.get(
            "prompt", getattr(self.instance, "prompt", None)
        )

        if not project:
            raise serializers.ValidationError({
                "project": "A project is required."
            })

        if not title or not title.strip():
            raise serializers.ValidationError({
                "title": "Comparison title cannot be empty."
            })

        if not prompt or not prompt.strip():
            raise serializers.ValidationError({
                "prompt": "Prompt cannot be empty."
            })

        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)

        user = instance.created_by

        if user and user.profile_image:
            backendurl = config("BACKEND_URL").rstrip("/")
            image_path = user.profile_image.url

            if image_path.startswith(("http://", "https://")):
                data["created_by_profileImage"] = image_path
            else:
                data["created_by_profileImage"] = (
                    f"{backendurl}{image_path}"
                )
        else:
            data["created_by_profileImage"] = None

        return data
