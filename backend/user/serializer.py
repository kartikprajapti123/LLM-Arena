from rest_framework import serializers
from user.models import UserModel
from decouple import config
from django.contrib.auth.models import Group

class UserSerialzier(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    password2 = serializers.CharField(write_only=True, required=False)
    email=serializers.CharField(required=False)
    otp=serializers.CharField(write_only=True,required=False)
    country_name=serializers.CharField(source="country.name",required=False)
    state_name=serializers.CharField(source="state.name",required=False)
    city_name=serializers.CharField(source="city.name",required=False)
    
    class Meta:
        model = UserModel
        fields = [
            "id",
            "username",
            "email",
            "phone_number",
            "is_active",
            "is_email_verified",
            "profile_image",
            "otp",
            "country",
            "country_name",
            "state",
            "state_name",
            "city",
            "city_name",
            "password",
            "password2",
            "created_at",
            "updated_at"
        ]

        
    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.profile_image:
            backendurl = config("BACKEND_URL")
            data["profile_image"] = backendurl + "/media/" + str(instance.profile_image)

        return data

    def validate(self, data):
        
        email = data.get("email")
        if email:
            if self.instance:
                user_data_validate = (
                    UserModel.objects.filter(email=email, )
                    .exclude(id=self.instance.id)
                    .first()
                )
                if user_data_validate:
                    raise serializers.ValidationError(
                        "user with this email already exists"
                    )

            else:
                user_data_validate = UserModel.objects.filter(
                    email=email, 
                ).first()
                print(user_data_validate)
                if user_data_validate:
                    raise serializers.ValidationError(
                        "user with this email already exists"
                    )
        else:
            raise serializers.ValidationError("email  is required")

        username = data.get("username")
        if username:
            if self.instance:
                user_data_validate = (
                    UserModel.objects.filter(username=username, is_email_verified=True)
                    .exclude(id=self.instance.id)
                    .first()
                )
                if user_data_validate:
                    raise serializers.ValidationError(
                        "user with this Username already exists"
                    )

            else:
                user_data_validate = UserModel.objects.filter(
                    username=username, is_email_verified=True
                ).first()
                if user_data_validate:
                    raise serializers.ValidationError(
                        "user with this Username already exists"
                    )
        else:
            raise serializers.ValidationError("username is required")

        phone_number = data.get("phone_number")
        if phone_number:
            if len(phone_number) < 10:
                raise serializers.ValidationError("Phone number is invalid")
            if self.instance:
                user_data_validate = (
                    UserModel.objects.filter(
                        phone_number=phone_number, is_email_verified=True
                    )
                    .exclude(id=self.instance.id)
                    .first()
                )
                if user_data_validate:
                    raise serializers.ValidationError(
                        "user with this Phone Number already exists"
                    )

            else:
                user_data_validate = UserModel.objects.filter(
                    phone_number=phone_number, is_email_verified=True
                ).first()
                if user_data_validate:
                    raise serializers.ValidationError(
                        "user with this Phone Number already exists"
                    )


        password = data.get("password")
        if password:
            if len(password) < 8 or len(password) > 14:
                raise serializers.ValidationError(
                    "Your Password length should be between 8 to 14"
                )

        if not self.instance:
            if not password:
                raise serializers.ValidationError("Password2 is required")

        password2 = data.get("password2")
        if not self.instance:
            if not password2:
                raise serializers.ValidationError("Password2 is required")

            if password != password2:
                raise serializers.ValidationError(
                    "Password is not matching to password2 "
                )
                
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        password2 = validated_data.pop("password2")

        user = UserModel.objects.create(**validated_data)
        user.set_password(password)
        user.save()


        return user

    def update(self, instance, validated_data):
        profile_image = validated_data.get("profile_image", "NOT_PROVIDED")
        if profile_image is None:
            if instance.profile_image:
                instance.profile_image.delete(save=False)
                instance.profile_image = None

        elif profile_image != "NOT_PROVIDED" and hasattr(profile_image, "name"):
            if instance.profile_image:
                instance.profile_image.delete(save=False)

            instance.profile_image = profile_image

        for attr, value in validated_data.items():
            if attr != "profile_image":
                setattr(instance, attr, value)

        instance.save()

        return instance

