#!/bin/sh

# Jalankan migrasi database
echo "Menjalankan migrasi database..."
npx sequelize-cli db:migrate

# Jalankan aplikasi utama
echo "Menjalankan aplikasi NestJS..."
exec node dist/main 