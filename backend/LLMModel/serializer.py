from rest_framework import serializers

from LLMProvider.models import LLMProviderModel
from LLMModel.models import LLMModelModel


class LLMModelSerializer(serializers.ModelSerializer):

    class Meta:
        model = LLMModelModel

        fields = [
            "id",
            "provider",
            "name",
            "model_identifier",
            "description",
            "context_window",
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

        provider = attrs.get(
            "provider",
            getattr(self.instance, "provider", None)
        )

        name = attrs.get(
            "name",
            getattr(self.instance, "name", None)
        )

        model_identifier = attrs.get(
            "model_identifier",
            getattr(self.instance, "model_identifier", None)
        )

        # Validate duplicate model name for the same provider
        if provider and name:

            name_qs = LLMModelModel.objects.filter(
                provider=provider,
                name=name
            )

            if self.instance:
                name_qs = name_qs.exclude(
                    id=self.instance.id
                )

            if name_qs.exists():
                raise serializers.ValidationError({
                    "name": "This model already exists for this provider."
                })

        # Validate unique model identifier
        if model_identifier:

            identifier_qs = LLMModelModel.objects.filter(
                model_identifier=model_identifier
            )

            if self.instance:
                identifier_qs = identifier_qs.exclude(
                    id=self.instance.id
                )

            if identifier_qs.exists():
                raise serializers.ValidationError({
                    "model_identifier": (
                        "A model with this identifier already exists."
                    )
                })

        return attrs