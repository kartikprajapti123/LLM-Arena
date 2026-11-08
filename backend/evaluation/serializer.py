from rest_framework import serializers

# from response.models import ResponseModel
from evaluation.models import EvaluationModel


class EvaluationSerializer(serializers.ModelSerializer):

    class Meta:
        model = EvaluationModel

        fields = [
            "id",
            "response",
            "accuracy_score",
            "relevance_score",
            "completeness_score",
            "clarity_score",
            "helpfulness_score",
            "overall_score",
            "reasoning",
            "is_winner",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "overall_score",
            "is_winner",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        response = attrs.get(
            "response",
            getattr(self.instance, "response", None)
        )

        accuracy_score = attrs.get(
            "accuracy_score",
            getattr(self.instance, "accuracy_score", None)
        )

        relevance_score = attrs.get(
            "relevance_score",
            getattr(self.instance, "relevance_score", None)
        )

        completeness_score = attrs.get(
            "completeness_score",
            getattr(self.instance, "completeness_score", None)
        )

        clarity_score = attrs.get(
            "clarity_score",
            getattr(self.instance, "clarity_score", None)
        )

        helpfulness_score = attrs.get(
            "helpfulness_score",
            getattr(self.instance, "helpfulness_score", None)
        )

        if not response:
            raise serializers.ValidationError(
                {"response": "A response is required."}
            )

        scores = {
            "accuracy_score": accuracy_score,
            "relevance_score": relevance_score,
            "completeness_score": completeness_score,
            "clarity_score": clarity_score,
            "helpfulness_score": helpfulness_score,
        }

        for field, score in scores.items():

            if score is None:
                raise serializers.ValidationError(
                    {field: f"{field.replace('_', ' ').capitalize()} is required."}
                )

            if score < 0 or score > 10:
                raise serializers.ValidationError(
                    {field: "Score must be between 0 and 10."}
                )

        return attrs
