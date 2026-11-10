import random
import time
import requests


class LLMService:

    @staticmethod
    def generate(
        provider,
        model,
        api_key,
        prompt,
    ):
        """
        Generate a response from an LLM provider.
        """

        # ---------------------------------------------
        # Validate
        # ---------------------------------------------

        if not provider.website:
            raise ValueError(
                f"API URL is not configured for provider '{provider.name}'."
            )

        if not api_key:
            raise ValueError(
                f"API key is missing for provider '{provider.name}'."
            )

        if not model.model_identifier:
            raise ValueError(
                f"Model identifier is missing for model '{model.name}'."
            )

        # ---------------------------------------------
        # Provider Dispatch
        # ---------------------------------------------

        provider_name = provider.name.lower()

        if provider_name == "groq":
            return LLMService.generate_groq(
                provider=provider,
                model=model,
                api_key=api_key,
                prompt=prompt,
            )

        if provider_name in ["cloudflare ai", "cloudflare workers ai", "cf","Cloudflare AI"]:
            return LLMService.generate_cloudflare(
                provider=provider,
                model=model,
                api_key=api_key,
                prompt=prompt,
            )

        # return LLMService.generate_openai_compatible(
        #     provider=provider,
        #     model=model,
        #     api_key=api_key,
        #     prompt=prompt,
        # )

    # =================================================
    # Groq
    # =================================================
    @staticmethod
    def generate_groq(
        provider,
        model,
        api_key,
        prompt,
    ):
        base_url = provider.website.rstrip("/")
        
        if "/chat/completions" in base_url:
            url = base_url
        else:
            url = f"{base_url}/chat/completions"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model.model_identifier,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        }

        max_retries = 3
        start_time = time.perf_counter()

        print("========== GROQ DEBUG ==========")
        print("Provider:", provider.name)
        print("Target URL:", url)
        print("Model Identifier:", model.model_identifier)
        print("==================================")

        response = None
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=(10, 60),
                )

                print(f"Groq attempt {attempt + 1}: STATUS={response.status_code}")

                if response.status_code in [429, 500, 503, 504]:
                    if attempt < max_retries - 1:
                        wait_time = (2 * (2**attempt)) + random.uniform(0, 1)
                        print(
                            f"Groq status {response.status_code}. Retrying in {wait_time:.2f}s..."
                        )
                        time.sleep(wait_time)
                        continue

                response.raise_for_status()
                break

            except (
                requests.exceptions.ConnectionError,
                requests.exceptions.Timeout,
            ) as e:
                if attempt < max_retries - 1:
                    wait_time = (2 * (2**attempt)) + random.uniform(0, 1)
                    print(f"Groq connection/timeout problem ({type(e).__name__}): {e}")
                    print(f"Retrying in {wait_time:.2f}s...")
                    time.sleep(wait_time)
                    continue

                raise ValueError(
                    f"Groq connection failed after {max_retries} attempts: {e}"
                )

            except requests.exceptions.RequestException as e:
                raise ValueError(f"Groq request failed: {e}")

        if response is None:
            raise ValueError("No response returned from Groq API.")

        response_time = time.perf_counter() - start_time

        try:
            data = response.json()
        except ValueError as e:
            raise ValueError("Groq returned invalid JSON.") from e

        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            error_msg = data.get("error", {}).get(
                "message", f"Unexpected response structure: {data}"
            )
            raise ValueError(
                f"Invalid response received from Groq model '{model.name}': {error_msg}"
            )

        usage = data.get("usage") or {}

        return {
            "content": content,
            "response_time": response_time,
            "input_tokens": usage.get("prompt_tokens"),
            "output_tokens": usage.get("completion_tokens"),
            "raw_response": data,
        }

    # =================================================
    # Cloudflare Workers AI / AI Gateway
    # =================================================
    @staticmethod
    def generate_cloudflare(provider, model, api_key, prompt):
        """Generate a response using Cloudflare Workers AI."""
    
        base_url = provider.website.rstrip("/")
        url = f"{base_url}/{model.model_identifier.lstrip('/')}"
    
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
    
        # Match the Cloudflare example: input is a list of messages.
        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ]
    
        payload = {
            "messages": messages,
        }
    
        start_time = time.perf_counter()
    
        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=(10, 120),
            )
    
            response_time = time.perf_counter() - start_time
    
            try:
                data = response.json()
            except ValueError as exc:
                raise ValueError(
                    "Cloudflare returned invalid JSON."
                ) from exc
    
            if not response.ok or not data.get("success", False):
                raise ValueError(
                    f"Cloudflare API error ({response.status_code}): "
                    f"{data.get('errors') or data}"
                )
    
        except requests.exceptions.Timeout as exc:
            raise ValueError("Cloudflare request timed out.") from exc
    
        except requests.exceptions.RequestException as exc:
            raise ValueError(
                f"Cloudflare request failed: {exc}"
            ) from exc
    
        result = data.get("result") or {}
    
        # Chat models may return either response or a chat-completions result.
        content = result.get("response")
    
        if content is None and result.get("choices"):
            content = (
                result["choices"][0]
                .get("message", {})
                .get("content")
            )
    
        if content is None:
            raise ValueError(
                f"Unexpected Cloudflare response structure: {data}"
            )
    
        usage = result.get("usage") or data.get("usage") or {}
    
        return {
            "content": content,
            "response_time": response_time,
            "input_tokens": usage.get("prompt_tokens"),
            "output_tokens": usage.get("completion_tokens"),
            "raw_response": data,
        }