# Base node image
FROM node:18-alpine as base

# Install openssl for Prisma
RUN apk update && apk add --no-cache openssl
ENV NODE_ENV production

# Install all node_modules, including dev dependencies
FROM base as deps

RUN mkdir /app
WORKDIR /app

ADD package.json ./
RUN npm install --production=false

# Setup production node_modules
FROM base as production

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
ADD package.json ./
RUN npm prune --production

# Build the app
FROM base as build

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

ADD prisma .
RUN npx prisma generate

ADD . .

# Finally, build the production image with minimal footprint
FROM base

ENV NODE_ENV production

RUN mkdir /app
WORKDIR /app

COPY --from=production /app/node_modules /app/node_modules
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
ADD . .

EXPOSE 5555

CMD ["npx", "prisma", "studio", "--browser=none"]