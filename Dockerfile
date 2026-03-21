FROM node:20-bookworm

# Install dev tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    build-essential \
    python3 \
    python3-pip \
    ca-certificates \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m coder

WORKDIR /workspace
USER coder
