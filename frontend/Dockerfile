FROM node:18-bullseye as build

WORKDIR /app

# 1. Установка зависимостей с явным указанием прав
COPY package.json package-lock.json ./
RUN npm install --unsafe-perm && \
    chmod -R 755 node_modules/.bin

# 2. Копирование исходников и финальная сборка
COPY . .

RUN cd node_modules/.bin && \
    ls -la && \
    chmod 755 vite && \
    ./vite --version && \
    cd /app && \
    npm run build

# 3. Финальный образ с nginx
FROM nginx:1.27.5

# 4. Копируем собранное приложение
COPY --from=build /app/dist /usr/share/nginx/html

# 5. Копируем конфиг nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 6. Настраиваем права
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]