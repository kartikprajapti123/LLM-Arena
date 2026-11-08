from rest_framework import serializers
from workspace.models import WorkspaceMemberModel,WorkspaceInviteModel,WorkspaceModel
from decouple import config
from workspace.models import WorkspaceModel,WorkspaceCredentialModel


class WorkspaceSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(
        source="owner.username", required=False, read_only=True
    )
    owner_profile_image = serializers.CharField(
        source="owner.profile_image", required=False, read_only=True
    )
    

    class Meta:
        model = WorkspaceModel
        fields = [
            "id",
            "name",
            "image",
            "owner",
            "description",
            "owner_username",
            "owner_profile_image",
            "is_active",
            "created_at",
            "updated_at",
        ]
    def validate(self, attrs):
        name = attrs.get("name")
        if name:
            if self.instance:
                workspace_instance = (
                    WorkspaceModel.objects.filter(name=name)
                    .exclude(id=self.instance.id)
                    .exists()
                )
                if workspace_instance:
                    raise serializers.ValidationError(
                        "Workspace with this name alreay exists"
                    )

            else:
                workspace_instance = WorkspaceModel.objects.filter(name=name).exists()
                if workspace_instance:
                    raise serializers.ValidationError(
                        "Workspace with this name alreay exists"
                    )

        return attrs

    def create(self, validated_data):
        workspace = super().create(validated_data)
    
        WorkspaceMemberModel.objects.create(
            workspace=workspace,
            user=workspace.owner,
            role="admin",
        )
    
        return workspace

    def update(self, instance, validated_data):
            image = validated_data.get("image", "NOT_PROVIDED")
            if image is None:
                if instance.image:
                    instance.image.delete(save=False)
                    instance.image = None
    
            elif image != "NOT_PROVIDED" and hasattr(image, "name"):
                if instance.image:
                    instance.image.delete(save=False)
    
                instance.image = image
    
            for attr, value in validated_data.items():
                if attr != "image":
                    setattr(instance, attr, value)
    
            instance.save()
    
            return instance
    
    def to_representation(self, instance):
            data = super().to_representation(instance)
    
            if instance.image:
                backendurl = config("BACKEND_URL")
                data["image"] = backendurl + "/media/" + str(instance.image)
    
            return data


class WorkspaceMemberSerializer(serializers.ModelSerializer):

    username = serializers.CharField(source="user.username", read_only=True)

    user_email = serializers.CharField(source="user.email", read_only=True)

    user_profile_image = serializers.CharField(
        source="user.profile_image", read_only=True
    )

    workspace_name = serializers.CharField(source="workspace.name", read_only=True)

    class Meta:
        model = WorkspaceMemberModel

        fields = [
            "id",
            "workspace",
            "workspace_name",
            "user",
            "username",
            "user_email",
            "user_profile_image",
            "role",
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
        workspace = attrs.get("workspace", getattr(self.instance, "workspace", None))

        user = attrs.get("user", getattr(self.instance, "user", None))

        if workspace and user:
            queryset = WorkspaceMemberModel.objects.filter(
                workspace=workspace, user=user
            )

            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)

            if queryset.exists():
                raise serializers.ValidationError(
                    "This user is already a member of this workspace."
                )

        return attrs




class WorkspaceInviteSerializer(serializers.ModelSerializer):

    workspace_name = serializers.CharField(
        source="workspace.name",
        read_only=True
    )

    class Meta:
        model = WorkspaceInviteModel

        fields = [
            "id",
            "workspace",
            "workspace_name",
            "invite_code",
            "is_active",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]
        
    def validate(self, attrs):
        invite_code=attrs.get("invite_code")
        if self.instance:
            invite_code_instance=WorkspaceInviteModel.objects.filter(invite_code=invite_code).exclude(id=self.instance.id)
            if invite_code_instance.exists():
                raise serializers.ValidationError("This Invite Code is already created")
        
        else:
            invite_code_instance=WorkspaceInviteModel.objects.filter(invite_code=invite_code)
            if invite_code_instance.exists():
                raise serializers.ValidationError("This Invite Code is already created")
                    
        return attrs
    
    



class WorkspaceCredentialSerializer(serializers.ModelSerializer):

    workspace_name = serializers.CharField(
        source="workspace.name",
        read_only=True
    )

    provider_name = serializers.CharField(
        source="provider.name",
        read_only=True
    )

    class Meta:
        model = WorkspaceCredentialModel

        fields = [
            "id",
            "workspace",
            "workspace_name",
            "provider",
            "provider_name",
            "api_key",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

        # extra_kwargs = {
        #     "api_key": {
        #         "write_only": True
        #     }
        # }

    def validate(self, attrs):

        workspace = attrs.get(
            "workspace",
            getattr(self.instance, "workspace", None)
        )

        provider = attrs.get(
            "provider",
            getattr(self.instance, "provider", None)
        )

        if workspace and provider:

            queryset = WorkspaceCredentialModel.objects.filter(
                workspace=workspace,
                provider=provider
            )

            if self.instance:
                queryset = queryset.exclude(
                    id=self.instance.id
                )

            if queryset.exists():
                raise serializers.ValidationError(
                    "This provider already has a credential "
                    "for this workspace."
                )

        api_key = attrs.get("api_key")

        if api_key is not None:

            api_key = api_key.strip()

            if not api_key:
                raise serializers.ValidationError({
                    "api_key": "API key cannot be empty."
                })

            attrs["api_key"] = api_key

        return attrs