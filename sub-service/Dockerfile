FROM python:3.13-alpine

# Install uv, ca-certificates, and deno via apk.
RUN apk add --no-cache ca-certificates uv deno

# Copy the application into the container.
COPY . /app

# Install the application dependencies.
WORKDIR /app
RUN uv sync --frozen --no-cache

# Run the application.
CMD ["/app/.venv/bin/fastapi", "run", "/app/main.py", "--port", "80", "--host", "0.0.0.0"]
