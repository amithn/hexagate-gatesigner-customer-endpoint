
set -e

docker build . --platform linux/amd64  -t australia-southeast2-docker.pkg.dev/gatesigner-app/gatesigner-app/app:latest
docker push australia-southeast2-docker.pkg.dev/gatesigner-app/gatesigner-app/app:latest
gcloud run deploy iapi-filter-app --image australia-southeast2-docker.pkg.dev/gatesigner-app/gatesigner-app/app:latest


