from rest_framework import serializers
from LLMProjectModel.models import LLMProjectModelModel


class LLMProjectModelSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(
        source="project.name",
        read_only=True
    )

    llm_model_name = serializers.CharField(
        source="llm_model.name",
        read_only=True
    )

    llm_model_identifier = serializers.CharField(
        source="llm_model.model_identifier",
        read_only=True
    )

    provider_name = serializers.CharField(
        source="llm_model.provider.name",
        read_only=True
    )

    class Meta:
        model = LLMProjectModelModel

        fields = [
            "id",
            "project",
            "project_name",
            "llm_model",
            "llm_model_name",
            "llm_model_identifier",
            "provider_name",
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
        project = attrs.get(
            "project",
            getattr(self.instance, "project", None)
        )

        llm_model = attrs.get(
            "llm_model",
            getattr(self.instance, "llm_model", None)
        )

        if project and llm_model:
            queryset = LLMProjectModelModel.objects.filter(
                project=project,
                llm_model=llm_model
            )

            if self.instance:
                queryset = queryset.exclude(
                    id=self.instance.id
                )

            if queryset.exists():
                raise serializers.ValidationError(
                    "This LLM model is already associated with this project."
                )

        return attrs