# Sử dụng Nginx làm web server siêu nhẹ
FROM nginx:alpine
# Copy toàn bộ file trong thư mục hiện tại vào thư mục web của Nginx
COPY . /usr/share/nginx/html