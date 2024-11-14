# Uninspired

A minimalist, self-hosted wishlist application with no unnecessary complexity. Built with Next.js, Prisma, and TypeScript.

## Features

- 🏠 **Self-hosted**: Keep your data private and under your control
- 🌍 **Multilingual**: Supports English and French out of the box
- 🎁 **Simple Wishlist Management**: Easy to add, edit, and manage wish items
- 👥 **Share Easily**: Your wishlist is public, simply share the link to /wishlist
- 🎨 **Modern UI**: Simple, light and responsive design
- 🔒 **Basic Security**: Simple token-based admin access
- 📈 **Scraper**: Very rudimentary page scraper
- 🌓 **Theme**: Switch between light and dark (default) mode

# Screenshots

### Homepage
<img width="1085" alt="image" src="https://github.com/user-attachments/assets/5a4d7208-4c4c-4900-abbc-bf4d137955b4">

### Public wishlist
![image](https://github.com/user-attachments/assets/e52e1ddb-7e9c-4b1e-a370-64e04380877d)

### Gifting
<img width="538" alt="image" src="https://github.com/user-attachments/assets/82bc1a33-e8f1-4eee-b848-47e76f4b212b">

### Admin page
<img width="1091" alt="image" src="https://github.com/user-attachments/assets/652e83d0-47f1-4910-a360-f212f7227337">

# Demo
A demo is available at [uninspired.demo.morveus.com](https://uninspired.demo.morveus.com/)

Admin token for the demo is `this-is-a-test-token`, which means you can connect to the admin panel at `/en/admin/this-is-a-test-token` (or `/fr/admin/this-is-a-test-token` if you prefer French)

Full URL: [https://uninspired.demo.morveus.com/en/admin/this-is-a-test-token](https://uninspired.demo.morveus.com/en/admin/this-is-a-test-token)

I'll reset the demo database regularly, so don't expect to keep your changes after a while.

# Instructions

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
  -e LOGIN_TOKEN=ALongAsstokenYouWillUseAsALoginToken \
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
