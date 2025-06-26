
set -e

# For Linux based amd64 architecture
# docker build . --platform linux/amd64  -t filter-iapi-app

# While building on Mac with Apple M1 Pro chip 
docker build .  -t gatesigner-app
docker run -p 3000:3000  gatesigner-app

# Go to http://localhost:3000 to view the app
