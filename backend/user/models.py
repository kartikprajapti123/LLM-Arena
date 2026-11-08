from django.db import models
from django.contrib.auth.models import (
    BaseUserManager,
    AbstractBaseUser,
    PermissionsMixin,
)
from master.models import Country, State, City


class UserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        user = self.model(email=email, **extra_fields)

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_email_verified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        return self.create_user(email=email, password=password, **extra_fields)


class UserModel(AbstractBaseUser, PermissionsMixin):

    username = models.CharField(max_length=255, blank=True)

    email = models.EmailField(unique=True)

    phone_number = models.CharField(max_length=20, blank=True)

    profile_image = models.ImageField(
        upload_to="profile_images/", blank=True, null=True
    )

    is_email_verified = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)

    is_staff = models.BooleanField(default=False)

    country = models.ForeignKey(
        Country, on_delete=models.CASCADE, related_name="country_user",null=True,blank=True
    )

    state = models.ForeignKey(
        State, on_delete=models.CASCADE, related_name="state_user",null=True,blank=True
    )

    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="city_user",null=True,blank=True)

    otp = models.CharField(max_length=6, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
