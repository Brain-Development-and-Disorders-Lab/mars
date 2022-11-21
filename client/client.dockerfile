FROM node:16

# Create and configure a working directory
RUN mkdir -p /client
WORKDIR /client

# Copy package.json and install dependencies
COPY client/package.json ./
RUN yarn

# Copy and build the source code
COPY client/ .

# Export port and start the client
EXPOSE 8080
CMD ["yarn", "start"]