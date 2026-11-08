from django.db import models

from response.models import ResponseModel


class EvaluationModel(models.Model):
    response = models.OneToOneField(
        ResponseModel,
        on_delete=models.CASCADE,
        related_name="evaluation",
    )

    accuracy_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
    )

    relevance_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
    )

    completeness_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
    )

    clarity_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
    )

    helpfulness_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
    )

    overall_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
    )

    reasoning = models.TextField(
        blank=True,
        default="",
    )

    is_winner = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"Evaluation - Response {self.response_id}"