# Używa Node.js 20 Alpine dla mniejszego rozmiaru
FROM node:20-alpine AS base

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie plików package dla lepszego cachowania
COPY package*.json ./

# Instalacja zależności
RUN npm ci --only=production

# Kopiowanie kodu źródłowego
COPY . .

# Build aplikacji
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie zbudowanej aplikacji z poprzedniego stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules

# Ustawienie zmiennych środowiskowych
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Eksponowanie portu
EXPOSE 3000

# Uruchomienie aplikacji
CMD ["node", "./dist/server/entry.mjs"]
