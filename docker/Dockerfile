# Use the official Bun image as the base image
FROM oven/bun:latest

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./

# Install the dependencies
RUN bun install

# Copy the built application to the working directory
COPY dist/ .

# Command to run the application
CMD ["bun", "main.js"]
