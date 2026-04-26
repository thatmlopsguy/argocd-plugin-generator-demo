FROM python:3.13.13-slim-trixie@sha256:d2462a6bed37b4fc6cabecf5a2132ae70df772fe03c7393c4d98a0c2fb48aa2e

COPY --from=ghcr.io/astral-sh/uv:0.7 /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY plugin/main.py .

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 4355

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4355"]