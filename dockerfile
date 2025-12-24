# Use Node.js LTS
FROM node:20-alpine

# Create working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the project files
COPY . .

# Create necessary directories
RUN mkdir -p session plugins sila lib data config

# Expose port
EXPOSE 8000

# Start app
CMD ["node", "index.js"]