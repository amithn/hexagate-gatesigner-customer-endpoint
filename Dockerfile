FROM node:18-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
# If you add a package-lock.json, speed your build by switching to 'npm ci'.
# RUN npm ci --only=production
RUN npm install --only=production

# Copy local code to the container image.
COPY . ./

RUN npm install -g uglify-js

# Minify the JS file
RUN uglifyjs public/js/client.js -o public/js/client.min.js -m reserved='["$scope","$http","$timeout"]' -c

# Remove the original (unminified) JS file
RUN rm public/js/client.js

EXPOSE 8080  

# Run the web service on container startup.
CMD [ "node", "app.js" ]