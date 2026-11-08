from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import action
from django.utils import timezone
from comparison.models import ComparisonModel
from comparison.serializer import ComparisonSerializer
from LLMProjectModel.models import LLMProjectModelModel
from utils.myPagination import MyPagination
from project.models import ProjectModel
from workspace.models import WorkspaceCredentialModel
from response.models import ResponseModel
from llm.service import LLMService
from datetime import datetime
from evaluation.models import EvaluationModel
from llm.ai_judge import evaluate_responses
from django.db import transaction
import asyncio
import time
from asgiref.sync import async_to_sync
from django.db import transaction
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

MODEL_TIMEOUT = 150  # hard cap per model call (seconds)
JUDGE_TIMEOUT = 120  # hard cap for the judge (seconds)


def send_comparison_update(project_id, event_data):
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        f"project_{project_id}",
        {
            "type": "comparison.update",
            "data": event_data,
        },
    )


# ---------------------------------------------------------------
# Helpers (module level, above your ViewSet class)
# ---------------------------------------------------------------
async def _call_one(job):
    """
    Run one blocking LLMService.generate call in a worker thread.
    Never raises; returns {"response_obj": ..., "result": ...} or
    {"response_obj": ..., "error": "..."}.
    NO database access in here.
    """
    started = time.perf_counter()
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                LLMService.generate,
                provider=job["provider"],
                model=job["llm_model"],
                api_key=job["api_key"],
                prompt=job["prompt"],
            ),
            timeout=MODEL_TIMEOUT,
        )
        return {"response_obj": job["response_obj"], "result": result}
    except asyncio.TimeoutError:
        return {
            "response_obj": job["response_obj"],
            "error": f"Timed out after {MODEL_TIMEOUT}s",
            "elapsed": time.perf_counter() - started,
        }
    except Exception as exc:
        return {
            "response_obj": job["response_obj"],
            "error": str(exc),
            "elapsed": time.perf_counter() - started,
        }


async def _call_all(jobs):
    return await asyncio.gather(*(_call_one(job) for job in jobs))


class ComparisonViewSet(ModelViewSet):

    queryset = ComparisonModel.objects.all().order_by("-id")
    serializer_class = ComparisonSerializer

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    pagination_class = MyPagination

    search_fields = [
        "title",
        "prompt",
        "project__name",
        "created_by__email",
    ]

    ordering_fields = [
        "id",
        "title",
        "status",
        "created_at",
        "updated_at",
        "completed_at",
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        status_filter = self.request.query_params.get("statusFilter")

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        project_id = self.request.query_params.get("projectId")

        if project_id:
            queryset = queryset.filter(project_id=project_id)

        return queryset

    def list(self, request, *args, **kwargs):

        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)

        if page is not None:

            serializer = self.serializer_class(page, many=True)

            return self.get_paginated_response(serializer.data)

        serializer = self.serializer_class(queryset, many=True)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):

        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():

            serializer.save(created_by=request.user)

            return Response(
                {
                    "success": True,
                    "message": "Comparison Created Successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        first_field, first_error_list = next(iter(serializer.errors.items()))

        first_error = (
            first_error_list[0]
            if isinstance(first_error_list, list)
            else first_error_list
        )

        return Response(
            {
                "success": False,
                "error": first_error,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def update(self, request, *args, **kwargs):

        comparison_instance = self.get_object()

        serializer = self.serializer_class(
            comparison_instance, data=request.data, partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Comparison Updated Successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        first_field, first_error_list = next(iter(serializer.errors.items()))

        first_error = (
            first_error_list[0]
            if isinstance(first_error_list, list)
            else first_error_list
        )

        return Response(
            {
                "success": False,
                "error": first_error,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, *args, **kwargs):

        comparison_instance = self.get_object()

        serializer = self.serializer_class(comparison_instance)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):

        comparison_instance = self.get_object()

        comparison_instance.delete()

        return Response(
            {
                "success": True,
                "message": "Comparison Deleted Successfully",
            },
            status=status.HTTP_200_OK,
        )

    # @action(detail=False, methods=["post"], url_path="run")
    # def run(self, request):
    #     # --------------------------------------------------
    #     # 1. Validate request data
    #     # --------------------------------------------------
    #     project_id = request.data.get("project")
    #     title = request.data.get("title", "LLM Comparison")
    #     prompt = request.data.get("prompt", "").strip()

    #     if not project_id:
    #         return Response(
    #             {
    #                 "success": False,
    #                 "error": "Project ID is required.",
    #             },
    #             status=status.HTTP_400_BAD_REQUEST,
    #         )

    #     if not prompt:
    #         return Response(
    #             {
    #                 "success": False,
    #                 "error": "Prompt is required.",
    #             },
    #             status=status.HTTP_400_BAD_REQUEST,
    #         )

    #     # --------------------------------------------------
    #     # 2. Get project and check workspace access
    #     # --------------------------------------------------
    #     try:
    #         project = ProjectModel.objects.select_related(
    #             "workspace"
    #         ).get(pk=project_id)
    #     except ProjectModel.DoesNotExist:
    #         return Response(
    #             {
    #                 "success": False,
    #                 "error": "Project not found.",
    #             },
    #             status=status.HTTP_404_NOT_FOUND,
    #         )

    #     workspace = project.workspace

    #     is_owner = workspace.owner_id == request.user.id
    #     is_member = workspace.members.filter(
    #         user=request.user,
    #         is_active=True,
    #     ).exists()

    #     if not is_owner and not is_member:
    #         return Response(
    #             {
    #                 "success": False,
    #                 "error": "You do not have access to this workspace.",
    #             },
    #             status=status.HTTP_403_FORBIDDEN,
    #         )

    #     # --------------------------------------------------
    #     # 3. Get active LLM models assigned to the project
    #     # --------------------------------------------------
    #     project_models = list(
    #         LLMProjectModelModel.objects.filter(
    #             project=project,
    #             is_active=True,
    #         ).select_related(
    #             "llm_model",
    #             "llm_model__provider",
    #         )
    #     )

    #     if not project_models:
    #         return Response(
    #             {
    #                 "success": False,
    #                 "error": "No active LLM models are assigned to this project.",
    #             },
    #             status=status.HTTP_400_BAD_REQUEST,
    #         )

    #     # --------------------------------------------------
    #     # 4. Create comparison
    #     # --------------------------------------------------
    #     comparison = ComparisonModel.objects.create(
    #         project=project,
    #         created_by=request.user,
    #         title=title,
    #         prompt=prompt,
    #         status="running",
    #     )

    #     # --------------------------------------------------
    #     # 5. Call each LLM and save its response
    #     # --------------------------------------------------
    #     for project_model in project_models:
    #         llm_model = project_model.llm_model
    #         provider = llm_model.provider

    #         response_obj = ResponseModel.objects.create(
    #             comparison=comparison,
    #             llm_project_model=project_model,
    #             content="",
    #             status="running",
    #         )

    #         try:
    #             credential = WorkspaceCredentialModel.objects.filter(
    #                 workspace=workspace,
    #                 provider=provider,
    #                 is_active=True,
    #             ).first()

    #             if not credential:
    #                 raise ValueError(
    #                     f"No active {provider.name} credential "
    #                     "exists for this workspace."
    #                 )

    #             result = LLMService.generate(
    #                 provider=provider,
    #                 model=llm_model,
    #                 api_key=credential.api_key,
    #                 prompt=prompt,
    #             )

    #             response_obj.content = result.get("content", "")
    #             response_obj.response_time = result.get("response_time")
    #             response_obj.input_tokens = result.get("input_tokens")
    #             response_obj.output_tokens = result.get("output_tokens")

    #             if not response_obj.content:
    #                 raise ValueError(
    #                     "The provider returned an empty response."
    #                 )

    #             response_obj.status = "completed"
    #             response_obj.error_message = ""

    #             response_obj.save(
    #                 update_fields=[
    #                     "content",
    #                     "response_time",
    #                     "input_tokens",
    #                     "output_tokens",
    #                     "status",
    #                     "error_message",
    #                     "updated_at",
    #                 ]
    #             )

    #         except Exception as exc:
    #             response_obj.status = "failed"
    #             response_obj.error_message = str(exc)
    #             response_obj.save(
    #                 update_fields=[
    #                     "status",
    #                     "error_message",
    #                     "updated_at",
    #                 ]
    #             )

    #     # --------------------------------------------------
    #     # 6. Collect successfully completed responses
    #     # --------------------------------------------------
    #     completed_responses = list(
    #         ResponseModel.objects.filter(
    #             comparison=comparison,
    #             status="completed",
    #         )
    #         .select_related(
    #             "llm_project_model",
    #             "llm_project_model__llm_model",
    #             "llm_project_model__llm_model__provider",
    #         )
    #         .order_by("id")
    #     )

    #     if not completed_responses:
    #         comparison.status = "failed"
    #         comparison.completed_at = timezone.now()
    #         comparison.save(
    #             update_fields=[
    #                 "status",
    #                 "completed_at",
    #                 "updated_at",
    #             ]
    #         )

    #         return Response(
    #             {
    #                 "success": False,
    #                 "error": "All LLM requests failed.",
    #                 "comparison_id": comparison.id,
    #             },
    #             status=status.HTTP_502_BAD_GATEWAY,
    #         )

    #     # --------------------------------------------------
    #     # 7. Update status while the judge evaluates responses
    #     # --------------------------------------------------
    #     comparison.status = "evaluating"
    #     comparison.save(update_fields=["status", "updated_at"])

    #     # --------------------------------------------------
    #     # 8. Get the OpenRouter judge API credential
    #     # --------------------------------------------------

    #     # --------------------------------------------------
    #     # 9. Evaluate all completed responses with the AI judge
    #     # --------------------------------------------------
    #     try:
    #         judge_inputs = [
    #             {
    #                 "id": response_obj.id,
    #                 "content": response_obj.content,
    #             }
    #             for response_obj in completed_responses
    #         ]

    #         judge_result = evaluate_responses(

    #             prompt=prompt,
    #             responses=judge_inputs,
    #         )

    #         evaluations = judge_result["evaluations"]
    #         winner_number = judge_result["winner_answer_number"]

    #         # Validate the winner before saving evaluation records.
    #         if (
    #             type(winner_number) is not int
    #             or not 1 <= winner_number <= len(completed_responses)
    #         ):
    #             raise ValueError(
    #                 "The AI judge returned an invalid winner."
    #             )

    #         # Save all scores and the winner together.
    #         with transaction.atomic():
    #             for index, response_obj in enumerate(
    #                 completed_responses,
    #                 start=1,
    #             ):
    #                 scores = evaluations[index]

    #                 EvaluationModel.objects.update_or_create(
    #                     response=response_obj,
    #                     defaults={
    #                         "accuracy_score": scores["accuracy_score"],
    #                         "relevance_score": scores["relevance_score"],
    #                         "completeness_score": scores[
    #                             "completeness_score"
    #                         ],
    #                         "clarity_score": scores["clarity_score"],
    #                         "helpfulness_score": scores[
    #                             "helpfulness_score"
    #                         ],
    #                         "overall_score": scores["overall_score"],
    #                         "reasoning": scores["reasoning"],
    #                         "is_winner": index == winner_number,
    #                     },
    #                 )

    #             comparison.winner_response = (
    #                 completed_responses[winner_number - 1]
    #             )
    #             comparison.save(update_fields=["winner_response"])

    #     except Exception:
    #         # Log the exception in your server logs in production.
    #         comparison.status = "failed"
    #         comparison.completed_at = timezone.now()
    #         comparison.save(
    #             update_fields=[
    #                 "status",
    #                 "completed_at",
    #                 "updated_at",
    #             ]
    #         )

    #         return Response(
    #             {
    #                 "success": False,
    #                 "error": (
    #                     "AI evaluation failed. The LLM responses "
    #                     "have been saved, but the comparison could "
    #                     "not be completed."
    #                 ),
    #                 "comparison_id": comparison.id,
    #                 "responses_saved": True,
    #             },
    #             status=status.HTTP_502_BAD_GATEWAY,
    #         )

    #     # --------------------------------------------------
    #     # 10. Mark comparison as completed
    #     # --------------------------------------------------
    #     comparison.status = "completed"
    #     comparison.completed_at = timezone.now()
    #     comparison.save(
    #         update_fields=[
    #             "status",
    #             "winner_response",
    #             "completed_at",
    #             "updated_at",
    #         ]
    #     )

    #     # --------------------------------------------------
    #     # 11. Fetch responses with their saved evaluations
    #     # --------------------------------------------------
    #     all_responses = (
    #         ResponseModel.objects.filter(comparison=comparison)
    #         .select_related(
    #             "llm_project_model",
    #             "llm_project_model__llm_model",
    #             "llm_project_model__llm_model__provider",
    #             "evaluation",
    #         )
    #         .order_by("id")
    #     )

    #     results = []

    #     for response_obj in all_responses:
    #         project_model = response_obj.llm_project_model
    #         llm_model = project_model.llm_model
    #         provider = llm_model.provider

    #         evaluation = getattr(response_obj, "evaluation", None)

    #         results.append(
    #             {
    #                 "response_id": response_obj.id,
    #                 "provider": provider.name,
    #                 "model": llm_model.name,
    #                 "model_identifier": llm_model.model_identifier,
    #                 "content": response_obj.content,
    #                 "status": response_obj.status,
    #                 "response_time": response_obj.response_time,
    #                 "input_tokens": response_obj.input_tokens,
    #                 "output_tokens": response_obj.output_tokens,
    #                 "error_message": response_obj.error_message,
    #                 "is_winner": (
    #                     evaluation.is_winner if evaluation else False
    #                 ),
    #                 "evaluation": (
    #                     {
    #                         "accuracy_score": evaluation.accuracy_score,
    #                         "relevance_score": evaluation.relevance_score,
    #                         "completeness_score": (
    #                             evaluation.completeness_score
    #                         ),
    #                         "clarity_score": evaluation.clarity_score,
    #                         "helpfulness_score": (
    #                             evaluation.helpfulness_score
    #                         ),
    #                         "overall_score": evaluation.overall_score,
    #                         "reasoning": evaluation.reasoning,
    #                     }
    #                     if evaluation
    #                     else None
    #                 ),
    #             }
    #         )

    #     # --------------------------------------------------
    #     # 12. Return the final comparison result
    #     # --------------------------------------------------
    #     return Response(
    #         {
    #             "success": True,
    #             "message": "Comparison completed successfully.",
    #             "data": {
    #                 "comparison_id": comparison.id,
    #                 "project": project.id,
    #                 "title": comparison.title,
    #                 "prompt": comparison.prompt,
    #                 "status": comparison.status,
    #                 "winner_response": comparison.winner_response_id,
    #                 "completed_at": comparison.completed_at,
    #                 "results": results,
    #             },
    #         },
    #         status=status.HTTP_200_OK,
    #     )
    # ---------------------------------------------------------------
    # Imports (add to the top of your views file)
    # ---------------------------------------------------------------

    # ---------------------------------------------------------------
    # The action (inside your ViewSet class)
    # ---------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="run")
    def run(self, request):
        # --------------------------------------------------
        # 1. Validate request data
        # --------------------------------------------------
        project_id = request.data.get("project")
        title = request.data.get("title", "LLM Comparison")
        prompt = request.data.get("prompt", "").strip()

        if not project_id:
            return Response(
                {"success": False, "error": "Project ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not prompt:
            return Response(
                {"success": False, "error": "Prompt is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # 2. Get project and check workspace access
        # --------------------------------------------------
        try:
            project = ProjectModel.objects.select_related("workspace").get(
                pk=project_id
            )
        except ProjectModel.DoesNotExist:
            return Response(
                {"success": False, "error": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        workspace = project.workspace

        is_owner = workspace.owner_id == request.user.id
        is_member = workspace.members.filter(
            user=request.user,
            is_active=True,
        ).exists()

        if not is_owner and not is_member:
            return Response(
                {
                    "success": False,
                    "error": "You do not have access to this workspace.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # --------------------------------------------------
        # 3. Get active LLM models assigned to the project
        # --------------------------------------------------
        project_models = list(
            LLMProjectModelModel.objects.filter(
                project=project,
                is_active=True,
            ).select_related(
                "llm_model",
                "llm_model__provider",
            )
        )

        if not project_models:
            return Response(
                {
                    "success": False,
                    "error": "No active LLM models are assigned to this project.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # 4. Create comparison
        # --------------------------------------------------
        
        comparison = ComparisonModel.objects.create(
            project=project,
            created_by=request.user,
            title=title,
            prompt=prompt,
            status="running",
        )
        send_comparison_update(
                    project.id,
                    {
                        "type": "comparison_started",
                        "comparison_id": comparison.id,
                        "status": "running",
                        "message": "Comparison started.",
                    },
                )

        # --------------------------------------------------
        # 5a. Prepare jobs (ALL database work, main thread)
        # --------------------------------------------------
        # Fetch every active credential for this workspace in ONE query
        # instead of one query per model.
        credentials = {
            c.provider_id: c
            for c in WorkspaceCredentialModel.objects.filter(
                workspace=workspace,
                is_active=True,
            )
        }

        jobs = []

        for project_model in project_models:
            llm_model = project_model.llm_model
            provider = llm_model.provider

            response_obj = ResponseModel.objects.create(
                comparison=comparison,
                llm_project_model=project_model,
                content="",
                status="running",
            )

            credential = credentials.get(provider.id)
            send_comparison_update(
                project.id,
                {
                    "type": "model_started",
                    "comparison_id": comparison.id,
                    "response_id": response_obj.id,
                    "model_id": llm_model.id,
                    "model_name": llm_model.name,
                    "status": "running",
                },
            )

            if not credential:
                response_obj.status = "failed"
                response_obj.error_message = (
                    f"No active {provider.name} credential "
                    "exists for this workspace."
                )
                response_obj.save(
                    update_fields=["status", "error_message", "updated_at"]
                )
                send_comparison_update(
    project.id,
    {
        "type": "model_failed",
        "comparison_id": comparison.id,
        "response_id": response_obj.id,
        "model_name": llm_model.name,
        "status": "failed",
        "message": response_obj.error_message,
    },
)
                continue

            jobs.append(
                {
                    "response_obj": response_obj,
                    "provider": provider,
                    "llm_model": llm_model,
                    "api_key": credential.api_key,
                    "prompt": prompt,
                }
            )

        # --------------------------------------------------
        # 5b. Call all LLMs AT THE SAME TIME (no DB access here)
        # --------------------------------------------------
        outcomes = async_to_sync(_call_all)(jobs) if jobs else []

        # --------------------------------------------------
        # 5c. Save results (database work, main thread)
        # --------------------------------------------------
        for outcome in outcomes:
            response_obj = outcome["response_obj"]

            try:
                if "error" in outcome:
                    raise ValueError(outcome["error"])

                result = outcome["result"]

                response_obj.content = result.get("content", "")
                response_obj.response_time = result.get("response_time")
                response_obj.input_tokens = result.get("input_tokens")
                response_obj.output_tokens = result.get("output_tokens")

                if not response_obj.content:
                    raise ValueError("The provider returned an empty response.")

                response_obj.status = "completed"
                response_obj.error_message = ""

                response_obj.save(
                    update_fields=[
                        "content",
                        "response_time",
                        "input_tokens",
                        "output_tokens",
                        "status",
                        "error_message",
                        "updated_at",
                    ]
                )
                send_comparison_update(
    project.id,
    {
        "type": "model_completed",
        "comparison_id": comparison.id,
        "response_id": response_obj.id,
        "model_name": response_obj.llm_project_model.llm_model.name,
        "status": "completed",
        "message": "Model response received and saved.",
    },
)

            except Exception as exc:
                response_obj.status = "failed"
                response_obj.error_message = str(exc)
                response_obj.save(
                    update_fields=["status", "error_message", "updated_at"]
                )
                send_comparison_update(
    project.id,
    {
        "type": "model_failed",
        "comparison_id": comparison.id,
        "response_id": response_obj.id,
        "model_name": response_obj.llm_project_model.llm_model.name,
        "status": "failed",
        "message": str(exc),
    },
)

        # --------------------------------------------------
        # 6. Collect successfully completed responses
        # --------------------------------------------------
        completed_responses = list(
            ResponseModel.objects.filter(
                comparison=comparison,
                status="completed",
            )
            .select_related(
                "llm_project_model",
                "llm_project_model__llm_model",
                "llm_project_model__llm_model__provider",
            )
            .order_by("id")
        )

        if not completed_responses:
            comparison.status = "failed"
            comparison.completed_at = timezone.now()
            comparison.save(update_fields=["status", "completed_at", "updated_at"])
            send_comparison_update(
    project.id,
    {
        "type": "comparison_failed",
        "comparison_id": comparison.id,
        "status": "failed",
        "message": "All LLM requests failed.",
    },
)
            return Response(
                {
                    "success": False,
                    "error": "All LLM requests failed.",
                    "comparison_id": comparison.id,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # --------------------------------------------------
        # 7. Update status while the judge evaluates responses
        # --------------------------------------------------
        comparison.status = "evaluating"
        comparison.save(update_fields=["status", "updated_at"])
        send_comparison_update(
    project.id,
    {
        "type": "evaluation_started",
        "comparison_id": comparison.id,
        "status": "evaluating",
        "message": "Judge AI is evaluating the responses.",
    },
)
        # --------------------------------------------------
        # 8. (Judge API key now comes from the environment
        #     inside ai_judge.py: os.environ["OPENROUTER_API_KEY"])
        # --------------------------------------------------

        # --------------------------------------------------
        # 9. Evaluate all completed responses with the AI judge
        # --------------------------------------------------
        try:
            judge_inputs = [
                {"id": r.id, "content": r.content} for r in completed_responses
            ]

            # The judge is blocking; run it in a thread with a hard timeout.
            async def _judge():
                return await asyncio.wait_for(
                    asyncio.to_thread(
                        evaluate_responses,
                        prompt=prompt,
                        responses=judge_inputs,
                    ),
                    timeout=JUDGE_TIMEOUT,
                )

            judge_result = async_to_sync(_judge)()

            evaluations = judge_result["evaluations"]
            winner_number = judge_result["winner_answer_number"]

            if type(winner_number) is not int or not 1 <= winner_number <= len(
                completed_responses
            ):
                raise ValueError("The AI judge returned an invalid winner.")

            with transaction.atomic():
                for index, response_obj in enumerate(completed_responses, start=1):
                    scores = evaluations[index]

                    EvaluationModel.objects.update_or_create(
                        response=response_obj,
                        defaults={
                            "accuracy_score": scores["accuracy_score"],
                            "relevance_score": scores["relevance_score"],
                            "completeness_score": scores["completeness_score"],
                            "clarity_score": scores["clarity_score"],
                            "helpfulness_score": scores["helpfulness_score"],
                            "overall_score": scores["overall_score"],
                            "reasoning": scores["reasoning"],
                            "is_winner": index == winner_number,
                        },
                    )

                comparison.winner_response = completed_responses[winner_number - 1]
                comparison.save(update_fields=["winner_response"])
                

        except Exception:
            # Log the exception in your server logs in production.
            comparison.status = "failed"
            comparison.completed_at = timezone.now()
            comparison.save(update_fields=["status", "completed_at", "updated_at"])
            send_comparison_update(
    project.id,
    {
        "type": "comparison_failed",
        "comparison_id": comparison.id,
        "status": "failed",
        "message": "AI evaluation failed.",
    },
)
            return Response(
                {
                    "success": False,
                    "error": (
                        "AI evaluation failed. The LLM responses "
                        "have been saved, but the comparison could "
                        "not be completed."
                    ),
                    "comparison_id": comparison.id,
                    "responses_saved": True,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
            
            

        # --------------------------------------------------
        # 10. Mark comparison as completed
        # --------------------------------------------------
        comparison.status = "completed"
        comparison.completed_at = timezone.now()
        comparison.save(
            update_fields=[
                "status",
                "winner_response",
                "completed_at",
                "updated_at",
            ]
        )
        send_comparison_update(
    project.id,
    {
        "type": "comparison_completed",
        "comparison_id": comparison.id,
        "status": "completed",
        "winner_response_id": comparison.winner_response_id,
        "message": "Comparison completed successfully.",
    },
)

        # --------------------------------------------------
        # 11. Fetch responses with their saved evaluations
        # --------------------------------------------------
        all_responses = (
            ResponseModel.objects.filter(comparison=comparison)
            .select_related(
                "llm_project_model",
                "llm_project_model__llm_model",
                "llm_project_model__llm_model__provider",
                "evaluation",
            )
            .order_by("id")
        )

        results = []

        for response_obj in all_responses:
            project_model = response_obj.llm_project_model
            llm_model = project_model.llm_model
            provider = llm_model.provider

            evaluation = getattr(response_obj, "evaluation", None)

            results.append(
                {
                    "response_id": response_obj.id,
                    "provider": provider.name,
                    "model": llm_model.name,
                    "model_identifier": llm_model.model_identifier,
                    "content": response_obj.content,
                    "status": response_obj.status,
                    "response_time": response_obj.response_time,
                    "input_tokens": response_obj.input_tokens,
                    "output_tokens": response_obj.output_tokens,
                    "error_message": response_obj.error_message,
                    "is_winner": (evaluation.is_winner if evaluation else False),
                    "evaluation": (
                        {
                            "accuracy_score": evaluation.accuracy_score,
                            "relevance_score": evaluation.relevance_score,
                            "completeness_score": evaluation.completeness_score,
                            "clarity_score": evaluation.clarity_score,
                            "helpfulness_score": evaluation.helpfulness_score,
                            "overall_score": evaluation.overall_score,
                            "reasoning": evaluation.reasoning,
                        }
                        if evaluation
                        else None
                    ),
                }
            )

        # --------------------------------------------------
        # 12. Return the final comparison result
        # --------------------------------------------------
        return Response(
            {
                "success": True,
                "message": "Comparison completed successfully.",
                "data": {
                    "comparison_id": comparison.id,
                    "project": project.id,
                    "title": comparison.title,
                    "prompt": comparison.prompt,
                    "status": comparison.status,
                    "winner_response": comparison.winner_response_id,
                    "completed_at": comparison.completed_at,
                    "results": results,
                },
            },
            status=status.HTTP_200_OK,
        )
