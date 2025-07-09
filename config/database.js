require('dotenv').config();
const { Sequelize } = require('sequelize');

module.exports = {
  development: {
    username: process.env.DB_DEVELOPMENT_USERNAME || 'root',
    password: process.env.DB_DEVELOPMENT_PASSWORD || '',
    database: process.env.DB_DEVELOPMENT_DATABASE || 'maxapp',
    host: process.env.DB_DEVELOPMENT_HOST || 'localhost',
    dialect: process.env.DB_DEVELOPMENT_DIALECT || 'mysql',
    port: process.env.DB_DEVELOPMENT_PORT || 3306,
    logging: console.log,
    pool: {
      max: 50,  // Maksimum koneksi dalam pool
      min: 5,   // Minimum koneksi idle
      acquire: 30000, // Waktu maksimum untuk mendapatkan koneksi (ms)
      idle: 10000,   // Waktu sebelum koneksi idle dihapus (ms)
      evict: 5000,   // Interval penghapusan koneksi idle (ms)
    },
    retry: {
      match: [/Deadlock/i, Sequelize.ConnectionError], // Retry on connection errors
      max: 3, // Maximum retry 3 times
      backoffBase: 3000, // Initial backoff duration in ms. Default: 100,
      backoffExponent: 1.5, // Exponent to increase backoff each try. Default: 1.1
    },
  },
  staging: {
    username: process.env.DB_STAGING_USERNAME,
    password: process.env.DB_STAGING_PASSWORD,
    database: process.env.DB_STAGING_DATABASE,
    host: process.env.DB_STAGING_HOST,
    dialect: process.env.DB_STAGING_DIALECT,
  },
  test: {
    username: process.env.DB_DEVELOPMENT_LOCAL_USERNAME,
    password: process.env.DB_DEVELOPMENT_LOCAL_PASSWORD,
    database: process.env.DB_DEVELOPMENT_LOCAL_DATABASE,
    host: process.env.DB_DEVELOPMENT_LOCAL_HOST,
    dialect: process.env.DB_DEVELOPMENT_LOCAL_DIALECT,
    port: process.env.DB_DEVELOPMENT_LOCAL_PORT || 3306,
    logging: console.log,
  },
  production: {
    username: process.env.DB_PRODUCTION_USERNAME,
    password: process.env.DB_PRODUCTION_PASSWORD,
    database: process.env.DB_PRODUCTION_DATABASE,
    host: process.env.DB_PRODUCTION_HOST,
    dialect: process.env.DB_PRODUCTION_DIALECT,
    port: process.env.DB_PRODUCTION_PORT || 3306,
    logging: false,
    pool: {
      max: 100, // Maksimum koneksi aktif
      min: 10,  // Minimum koneksi aktif
      acquire: 30000, // Timeout ambil koneksi (default 10000ms)
      idle: 10000 // Waktu idle sebelum koneksi dihapus
    }
  },
};
