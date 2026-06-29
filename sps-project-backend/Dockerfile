# Dockerfile
FROM php:7.4-fpm

# Install Laravel dependencies and extensions
RUN apt-get update && apt-get install -y \
    git \
    zip \
    unzip \
    libpng-dev \
    libjpeg-dev

RUN docker-php-ext-configure gd --with-jpeg
RUN docker-php-ext-install gd pdo pdo_mysql

# Set the working directory
WORKDIR /var/www/html

# Copy your Laravel application into the container
COPY . .

# Install Composer dependencies
RUN composer install