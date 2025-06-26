# Production Dockerfile for Laravel Backend
FROM php:8.2-fpm-alpine

# Set working directory
WORKDIR /var/www/html

# Install system dependencies
RUN apk add --no-cache \
    build-base \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    zip \
    jpegoptim optipng pngquant gifsicle \
    vim \
    unzip \
    git \
    curl \
    oniguruma-dev \
    postgresql-dev \
    icu-dev

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg
RUN docker-php-ext-install -j$(nproc) \
    pdo \
    pdo_pgsql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    intl

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application files
COPY . /var/www/html

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html/storage
RUN chmod -R 755 /var/www/html/bootstrap/cache

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Generate application key (placeholder - should be set via environment)
RUN php artisan config:cache
RUN php artisan route:cache
RUN php artisan view:cache

# Expose port 8000
EXPOSE 8000

# Start PHP-FPM server
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]