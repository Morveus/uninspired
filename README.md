# Uninspired

A minimalist, self-hosted wishlist application with no unnecessary complexity. Built with Next.js, Prisma, and TypeScript.

## Features

- 🏠 **Self-hosted**: Keep your data private and under your control
- 🌍 **Multilingual**: Supports English and French out of the box
- 🎁 **Simple Wishlist Management**: Easy to add, edit, and manage wish items
- 👥 **Share Easily**: Your wishlist is public, simply share the link to /wishlist
- 🎨 **Modern UI**: Simple, light and responsive design
- 🔒 **Basic Security**: Simple token-based admin access

## How to build and push to Docker Hub
```
docker buildx create --name uninspiredbuilder --use
docker buildx build --platform linux/amd64,linux/arm64 -t YOUR_DOCKER_HUB_USERNAME/uninspired:latest --push .
```

## How to run
```
docker run -d \
  --name uninspired \
  -e NEXT_PUBLIC_USER_NAME=Yourname \
  -e LOGIN_TOKEN=alongasstokenyou \
  -p 3000:3000 \
  morveus/uninspired:latest
```

## How to use
### Admin
Go to `/en/admin/yourlongasstoken` and add your wishes.

### Friends and family
Simply direct your friends to the root URL, or `/language/wishlist` (for instance `/en/wishlist`)

## Suggestions
This was built for my own use, so suggestions are welcome!

# Copyrights
Icon by Freepik