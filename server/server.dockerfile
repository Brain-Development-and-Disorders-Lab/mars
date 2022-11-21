FROM node:16

# Create and configure a working directory
RUN mkdir -p /server
WORKDIR /server

# Copy package.json and install dependencies
COPY server/package.json ./
COPY server/tsconfig.json ./
RUN yarn

# Copy and build the source code
COPY server/ .
RUN yarn build

# Export port and start the client
EXPOSE 8000
CMD ["yarn", "start"]