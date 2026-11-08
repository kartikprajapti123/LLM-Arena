from django.db import models
from user.models import UserModel
import secrets

from LLMProvider.models import LLMProviderModel

class WorkspaceModel(models.Model):
    name=models.CharField(max_length=100)
    description=models.TextField(null=True,blank=True)
    owner=models.ForeignKey(UserModel,on_delete=models.CASCADE,related_name="owned_workspaces")
    is_active=models.BooleanField(default=True)
    image=models.ImageField(upload_to="workspace/",null=True,blank=True)
    
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now_add=True)
    
    def __str__(self, *args, **kwargs):
        return self.name
    
    
class WorkspaceMemberModel(models.Model):

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("member", "Member"),
    ]

    workspace = models.ForeignKey(
        WorkspaceModel,
        on_delete=models.CASCADE,
        related_name="members"
    )

    user = models.ForeignKey(
        UserModel,
        on_delete=models.CASCADE,
        related_name="workspace_members"
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="member"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user"],
                name="unique_workspace_member"
            )
        ]

    def __str__(self):
        return f"{self.user.username} - {self.workspace.name}"
    
    
def generate_invite_code():
    return secrets.token_urlsafe(16)


class WorkspaceInviteModel(models.Model):

    workspace = models.ForeignKey(
        WorkspaceModel,
        on_delete=models.CASCADE,
        related_name="invites",
    
    )

    invite_code = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.workspace.name} - {self.invite_code}"
    
    

class WorkspaceCredentialModel(models.Model):

    workspace = models.ForeignKey(
        WorkspaceModel,
        on_delete=models.CASCADE,
        related_name="llm_credentials"
    )

    provider = models.ForeignKey(
        LLMProviderModel,
        on_delete=models.CASCADE,
        related_name="workspace_credentials"
    )

    api_key = models.TextField()

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "provider"],
                name="unique_workspace_provider_credential"
            )
        ]

    def __str__(self):
        return f"{self.workspace.name} - {self.provider.name}"