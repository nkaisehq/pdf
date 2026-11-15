FROM node:24

WORKDIR /usr/src/pdf

COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig.json instrument.ts ./
COPY server ./server
COPY public ./public
COPY scripts ./scripts

RUN npm run build && npm prune --omit=dev && npm cache clean --force

ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
ENV OC_ENV=production
ENV WEBSITE_URL=https://betterlife.nkaise.com
ENV API_URL=https://api.betterlife.nkaise.com
ENV IMAGES_URL=https://images.betterlife.nkaise.com
ENV HYPERWATCH_ENABLED=false

EXPOSE 3002

CMD [ "npm", "run", "start" ]
