FROM node:16

# Create and configure a working directory
RUN mkdir -p /client
RUN mkdir -p /types
WORKDIR /client

# Copy package.json and install dependencies
COPY client/package.json ./
RUN yarn

# Copy and build the source code
WORKDIR /types
COPY types/ .
WORKDIR /client
COPY client/ .

# Export port and start the client
EXPOSE 8080
CMD ["yarn", "start"]
