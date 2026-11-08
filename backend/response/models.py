from django.db import models

from comparison.models import ComparisonModel
from LLMProjectModel.models import LLMProjectModelModel


class ResponseModel(models.Model):

    comparison = models.ForeignKey(
        ComparisonModel,
        on_delete=models.CASCADE,
        related_name="responses"
    )

    llm_project_model = models.ForeignKey(
        LLMProjectModelModel,
        on_delete=models.CASCADE,
        related_name="responses"
    )

    content = models.TextField(
        blank=True,
        default=""
    )

    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("running", "Running"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ],
        default="pending"
    )

    response_time = models.FloatField(
        null=True,
        blank=True
    )

    input_tokens = models.IntegerField(
        null=True,
        blank=True
    )

    output_tokens = models.IntegerField(
        null=True,
        blank=True
    )

    error_message = models.TextField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.comparison.title} - {self.llm_project_model}"