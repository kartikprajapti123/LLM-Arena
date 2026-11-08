from rest_framework import serializers

from response.models import ResponseModel


class ResponseSerializer(serializers.ModelSerializer):

    class Meta:
        model = ResponseModel

        fields = [
            "id",
            "comparison",
            "llm_project_model",
            "content",
            "status",
            "response_time",
            "input_tokens",
            "output_tokens",
            "error_message",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "content",
            "status",
            "response_time",
            "input_tokens",
            "output_tokens",
            "error_message",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        comparison = attrs.get(
            "comparison",
            getattr(self.instance, "comparison", None)
        )

        llm_project_model = attrs.get(
            "llm_project_model",
            getattr(self.instance, "llm_project_model", None)
        )

        if not comparison:
            raise serializers.ValidationError({
                "comparison": "A comparison is required."
            })

        if not llm_project_model:
            raise serializers.ValidationError({
                "llm_project_model": "An LLM project model is required."
            })

        # Make sure the selected LLM model belongs
        # to the same project as the comparison.
        if (
            comparison.project_id
            != llm_project_model.project_id
        ):
            raise serializers.ValidationError({
                "llm_project_model": (
                    "This LLM model does not belong to "
                    "the comparison's project."
                )
            })

        # Prevent the same LLM project model from being
        # added twice to the same comparison.
        response_qs = ResponseModel.objects.filter(
            comparison=comparison,
            llm_project_model=llm_project_model
        )

        if self.instance:
            response_qs = response_qs.exclude(
                id=self.instance.id
            )

        if response_qs.exists():
            raise serializers.ValidationError({
                "llm_project_model": (
                    "This LLM model already has a response "
                    "for this comparison."
                )
            })

        return attrs