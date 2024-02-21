FROM node:16.15.0 as build-stage
ENV NODE_OPTIONS=--max_old_space_size=4096
COPY package*.json ./
RUN npm -g install @quasar/cli
COPY ./ .
RUN npm install
RUN quasar build

FROM nginx as production-stage
COPY --from=build-stage /dist/spa .
COPY nginx.conf /etc/nginx/nginx.conf
RUN sed -i 's#href=\"/#href=\"./#g' index.html
RUN sed -i 's#src=\"/#src=\"./#g' index.html