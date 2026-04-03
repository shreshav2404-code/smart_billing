FROM node:22-alpine

# Install Python and required system dependencies
RUN apk add --no-cache python3 py3-pip sqlite g++ gcc musl-dev python3-dev

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY ml/requirements.txt ./ml/

# Install Node dependencies (production)
RUN cd backend && npm ci --omit=dev
RUN cd frontend && npm ci

# Install Python dependencies
RUN pip install --no-cache-dir --break-system-packages -r ml/requirements.txt

# Copy application code
COPY backend ./backend
COPY frontend ./frontend
COPY ml ./ml
COPY database ./database

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Set working directory back to backend
WORKDIR /app/backend

# Expose port
EXPOSE 8080

# Start the application
CMD ["sh", "-c", "node init.js && exec node server.js"]
