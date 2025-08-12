# Endpoint: POST /payments/midtrans/va

## Deskripsi
Endpoint untuk membuat transaksi pembayaran melalui Midtrans Core API, menggenerasi Virtual Account (VA) dengan masa berlaku 2 hari, dan menyimpan responsnya ke database.

## Method
`POST`

## URL
`/payments/midtrans/va`

## Request Body
```json
{
    "order_id": 12345,
    "payment_method": "bca_va",
    "created_by_user_id": 10
}
```

### Field Validation
- `order_id`: Number, wajib diisi, harus valid order ID
- `payment_method`: String, wajib diisi, harus salah satu dari: `bca_va`, `mandiri_va`, `bni_va`, `bri_va`, `permata_va`
- `created_by_user_id`: Number, wajib diisi, harus valid user ID

## Response Success (201 Created)
```json
{
    "message": "Virtual Account berhasil dibuat.",
    "data": {
        "transaction_id": "sample-transaction-id",
        "va_number": "123456789012",
        "bank_name": "BCA Virtual Account",
        "expiry_time": "2025-08-14T12:00:00+07:00",
        "payment_link": "https://99delivery.id/payment/12345"
    }
}
```

## Response Error

### 400 Bad Request
```json
{
    "statusCode": 400,
    "message": "Order ini sudah memiliki transaksi pembayaran aktif"
}
```

### 404 Not Found
```json
{
    "statusCode": 404,
    "message": "Order tidak ditemukan"
}
```

### 500 Internal Server Error
```json
{
    "statusCode": 500,
    "message": "Gagal membuat Virtual Account: [error detail]"
}
```

## Alur Logika Backend

### 1. Validasi Input
- Verifikasi `created_by_user_id` memiliki hak akses
- Validasi `order_id` dan `payment_method` tidak kosong
- Periksa apakah `order_id` valid di tabel `orders`
- Cek apakah order sudah memiliki transaksi pembayaran aktif

### 2. Persiapan Data Midtrans
- Query tabel `orders` untuk mendapatkan:
  - `no_tracking`: sebagai order_id unik Midtrans
  - `total_harga`: sebagai gross_amount transaksi
  - `nama_penerima`, `email_penerima`, `no_telepon_penerima`: untuk customer_details
- Query tabel `order_invoices` untuk mendapatkan detail invoice

### 3. Konstruksi Payload Midtrans
```json
{
    "payment_type": "bank_transfer",
    "transaction_details": {
        "order_id": "no_tracking",
        "gross_amount": total_harga
    },
    "customer_details": {
        "first_name": "nama_penerima",
        "email": "email_penerima",
        "phone": "no_telepon_penerima"
    },
    "bank_transfer": {
        "bank": "bca|mandiri|bni|bri|permata"
    },
    "custom_expiry": {
        "expiry_unit": "day",
        "expiry_duration": 2
    }
}
```

### 4. Panggilan API ke Midtrans
- POST ke Midtrans Core API dengan Server-Key untuk otentikasi
- Gunakan method `snap.charge()` untuk membuat transaksi

### 5. Penyimpanan Response Midtrans ke Database

#### Tabel `orders`
- Update `payment_uuid` dengan `transaction_id` dari Midtrans
- Update `payment_status` menjadi `'pending'`
- Update `payment_expire_time` dengan `expiry_time` dari Midtrans
- Update `payment_redirect` dengan URL instruksi pembayaran

#### Tabel `order_invoices`
- Update `konfirmasi_bayar` menjadi `1` (sudah di-submit dengan pembayaran)

#### Tabel `transaction_payment`
- Buat entri baru dengan kolom:
  - `user_id`: dari `orders.order_by`
  - `order_id`, `no_tracking`, `price`
  - `sid`: `transaction_id` dari Midtrans
  - `bank_code`, `bank_name`, `no_va`, `expired_at`
  - `link_payment`: URL instruksi pembayaran (https://99delivery.id/payment/{order_id})

#### Tabel `order_histories`
- Tambah entri dengan status `"VA Created"`
- Remark berisi nomor VA dan masa berlakunya

## Environment Variables
```bash
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
```

## Mapping Payment Method ke Bank Code
- `bca_va` → `bca`
- `mandiri_va` → `mandiri`
- `bni_va` → `bni`
- `bri_va` → `bri`
- `permata_va` → `permata`

## Error Handling
- Validasi input dengan class-validator
- Database transaction untuk konsistensi data
- Try-catch untuk Midtrans API calls
- Proper error logging untuk debugging
- HTTP status codes yang sesuai

## Testing
```bash
# Test dengan curl
curl -X POST http://localhost:3000/payments/midtrans/va \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 12345,
    "payment_method": "bca_va",
    "created_by_user_id": 10
  }'
```

## Dependencies
- `midtrans-client`: Untuk integrasi dengan Midtrans Core API
- `@nestjs/sequelize`: Untuk database operations
- `class-validator`: Untuk input validation
