from django.db import models
from user.models import UserModel
from project.models import ProjectModel
# Create your models here.
class ComparisonModel(models.Model):

    project = models.ForeignKey(
        ProjectModel,
        on_delete=models.CASCADE,
        related_name="comparisons"
    )

    created_by = models.ForeignKey(
        UserModel,
        on_delete=models.CASCADE,
        related_name="comparisons"
    )

    title = models.CharField(
        max_length=255
    )

    prompt = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("running", "Running"),
            ("evaluating", "Evaluating"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ],
        default="pending"
    )

    winner_response = models.ForeignKey(
    "response.ResponseModel",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="won_comparisons"
)

    completed_at = models.DateTimeField(
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
        return self.title