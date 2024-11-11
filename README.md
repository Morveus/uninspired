docker buildx create --name uninspiredbuilder --use

docker buildx build --platform linux/amd64,linux/arm64 -t morveus/uninspired:latest --push .

# Copyrights
Icon by Freepik