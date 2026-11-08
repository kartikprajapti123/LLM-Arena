from rest_framework.routers import DefaultRouter
from user.views import UserViewSet
from workspace.views import WorkspaceViewSet,WorkspaceMemberViewSet,WorkspaceInviteViewSet,WorkspaceCredentialViewSet
from project.views import ProjectViewSet
from user.views import RegisterViewset,LoginViewset,ForgotPasswordViewset,OtpVerifyViewSet,ChangePasswordViewset,LogoutViewSet,GoogleSocialAuthView,ResendOtpViewset,ResetPasswordViewset
from master.views import CountryViewset,StateViewset,CityViewSet
from LLMModel.views import LLMModelViewSet
from LLMProvider.views import LLMProviderViewSet
from LLMProjectModel.views import LLMProjectModelViewSet
from comparison.views import ComparisonViewSet
from response.views import ResponseViewSet
from evaluation.views import EvaluationViewSet
from chat.views import ConversationViewSet
from notification.views import NotificationViewSet
router=DefaultRouter()

router.register("register",RegisterViewset,basename="register")
router.register("otp-verify",OtpVerifyViewSet,basename="otp-verify")
router.register("resend-otp",ResendOtpViewset,basename="resend-otp")

router.register("login",LoginViewset,basename="login")
router.register("forgot-password",ForgotPasswordViewset,basename="forgot-password")
router.register("change-password",ChangePasswordViewset,basename="change-password")
router.register("reset-password",ResetPasswordViewset,basename="reset-password")


router.register("google-social-auth",GoogleSocialAuthView,basename="google-social-auth")

router.register("logout",LogoutViewSet,basename="logout")



router.register("user",UserViewSet,basename="user")
router.register("workspace",WorkspaceViewSet,basename="workspace")
router.register("workspace-member",WorkspaceMemberViewSet,basename="workspace-member")
router.register("workspace-invitation",WorkspaceInviteViewSet,basename="workspace-invitation")
router.register("workspace-credential",WorkspaceCredentialViewSet,basename="workspace-credential")


router.register("project",ProjectViewSet,basename="project")
router.register("llm-model",LLMModelViewSet,basename="llm-model")
router.register("llm-provider",LLMProviderViewSet,basename="llm-provider")
router.register("llm-project-model",LLMProjectModelViewSet,basename="llm-project-model")

router.register("comparison",ComparisonViewSet,basename="comparison")
router.register("response",ResponseViewSet,basename="response")
router.register("evaluation",EvaluationViewSet,basename="evaluation")


router.register("conversations",ConversationViewSet,basename="conversation")
router.register("notification",NotificationViewSet,basename="notification")


router.register("country",CountryViewset,basename="country")
router.register("state",StateViewset,basename="state")
router.register("city",CityViewSet,basename="city")


