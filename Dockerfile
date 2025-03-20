# Use an official Node.js image
FROM node:18

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["node", "index.js"]
