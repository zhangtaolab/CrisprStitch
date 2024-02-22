FROM nginx
COPY /dist/spa .
COPY nginx.conf /etc/nginx/nginx.conf
RUN sed -i 's#href=\"/#href=\"./#g' index.html
RUN sed -i 's#src=\"/#src=\"./#g' index.html