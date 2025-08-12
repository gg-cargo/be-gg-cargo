# Endpoint: POST /payments/midtrans/notification

## Deskripsi
Endpoint untuk menerima notifikasi real-time (webhook) dari Midtrans untuk memperbarui status pembayaran yang terkait dengan order.

## Method
`POST`

## URL
`/payments/midtrans/notification`

## Request Body (Contoh dari Midtrans)
```json
{
    "transaction_id": "bec1f974-26ed-45ba-8843-630e60943813",
    "transaction_status": "settlement",
    "fraud_status": "accept",
    "order_id": "GG250723523676",
    "gross_amount": "10000.00",
    "signature_key": "abc123def456...",
    "status_code": "200",
    "payment_type": "bank_transfer",
    "merchant_id": "G680407308",
    "va_numbers": [
        {
            "bank": "bca",
            "va_number": "07308114312153859668506"
        }
    ],
    "settlement_time": "2025-08-12 08:29:57",
    "transaction_time": "2025-08-12 08:26:57",
    "expiry_time": "2025-08-12 08:29:57"
}
```

## Response Success (200 OK)
```json
{
    "message": "Notification processed successfully"
}
```

## Response Error

### 403 Forbidden
```json
{
    "statusCode": 403,
    "message": "Invalid signature key"
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
    "message": "Error processing notification"
}
```

## Alur Logika Backend

### 1. Validasi Keamanan (Wajib)
- **Signature Key Validation**: Memvalidasi `signature_key` yang disertakan dalam request body
- **Formula**: `SHA512(transaction_id + status_code + gross_amount + server_key)`
- **Keamanan**: Mencegah serangan siber dan memastikan notifikasi datang dari Midtrans yang sah

### 2. Menerima Request
- Backend menerima POST request dari Midtrans
- Request body berisi detail transaksi dalam format JSON
- Semua field dari Midtrans diproses sesuai kebutuhan

### 3. Memproses Status Transaksi

#### **Skenario Pembayaran Sukses (Status 'settlement' atau 'capture')**
- **Tabel `orders`**:
  - Update `payment_status` menjadi `'paid'`
  - Update `isUnpaid` menjadi `0`
  - Update `isPartialPaid` menjadi `0`
  - Update `sisaAmount` menjadi `'0'`

- **Tabel `order_invoices`**:
  - Update `konfirmasi_bayar` menjadi `1`

- **Tabel `saldo`** (Opsional):
  - Jika user memiliki akun saldo, tambahkan amount yang dibayarkan

#### **Skenario Pembayaran Gagal (Status 'expire', 'deny', 'cancel')**
- **Tabel `orders`**:
  - Update `payment_status` menjadi `'failed'`
  - Update `isUnpaid` menjadi `1`
  - Update `isPartialPaid` menjadi `0`

- **Tabel `order_invoices`**:
  - Update `konfirmasi_bayar` menjadi `0`

### 4. Pembaruan Database

#### **Tabel `payment_order`**
- Buat entri baru untuk mencatat setiap transaksi pembayaran
- **Fields**:
  - `id`: Auto-generated payment order ID
  - `order_id`: ID order yang terkait
  - `no_tracking`: Nomor tracking order
  - `amount`: Jumlah pembayaran dari Midtrans
  - `bank_name`: Jenis pembayaran (Virtual Account, dll)
  - `user_id`: ID user yang melakukan pembayaran
  - `date`: Tanggal transaksi
  - `created_at`: Timestamp pembuatan record

#### **Tabel `order_histories`**
- Tambah entri riwayat untuk setiap perubahan status pembayaran
- **Status Values**:
  - `"Payment Success"`: Untuk settlement/capture
  - `"Payment Failed"`: Untuk deny/cancel
  - `"Payment Expired"`: Untuk expire
  - `"Payment Denied"`: Untuk deny
  - `"Payment Cancelled"`: Untuk cancel
- **Remark**: Detail lengkap dari notifikasi Midtrans

### 5. Database Transaction
- Semua operasi database dilakukan dalam satu transaction
- Memastikan konsistensi data jika ada error
- Rollback otomatis jika ada kegagalan

## Environment Variables
```bash
MIDTRANS_SERVER_KEY=your_server_key_here
```

## Keamanan

### **Signature Key Validation**
```typescript
// Formula validasi signature Midtrans
const signatureString = `${transaction_id}${status_code}${gross_amount}${server_key}`;
const expectedSignature = crypto.createHash('sha512').update(signatureString).digest('hex');
```

### **Validasi yang Dilakukan**
- ✅ **Signature Key**: Memastikan request dari Midtrans yang sah
- ✅ **Transaction ID**: Mencari order yang valid
- ✅ **Status Code**: Memproses hanya status yang diizinkan
- ✅ **Amount Validation**: Memastikan jumlah pembayaran sesuai

## Status Transaksi yang Didukung

| Status | Deskripsi | Action |
|--------|------------|---------|
| `settlement` | Pembayaran berhasil | Update status paid, konfirmasi invoice |
| `capture` | Pembayaran berhasil | Update status paid, konfirmasi invoice |
| `expire` | Pembayaran expired | Update status failed, reset invoice |
| `deny` | Pembayaran ditolak | Update status failed, reset invoice |
| `cancel` | Pembayaran dibatalkan | Update status failed, reset invoice |

## Testing

### **Test dengan cURL**
```bash
curl -X POST http://localhost:3000/payments/midtrans/notification \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-123",
    "transaction_status": "settlement",
    "fraud_status": "accept",
    "order_id": "TEST-123",
    "gross_amount": "10000.00",
    "signature_key": "valid_signature_here",
    "status_code": "200",
    "payment_type": "bank_transfer",
    "merchant_id": "G123456789",
    "transaction_time": "2025-08-12 08:26:57"
  }'
```

### **Test Signature Key**
```bash
# Generate signature key untuk testing
echo -n "test-12320010000.00your_server_key" | openssl dgst -sha512
```

## Error Handling

### **Signature Invalid**
- HTTP 403 Forbidden
- Log error untuk monitoring
- Request ditolak untuk keamanan

### **Order Not Found**
- HTTP 404 Not Found
- Log error untuk debugging
- Midtrans akan retry notification

### **Database Error**
- HTTP 500 Internal Server Error
- Log error lengkap
- Rollback transaction otomatis

## Monitoring dan Logging

### **Log yang Dicatat**
- ✅ **Success**: Notification processed successfully
- ❌ **Error**: Signature validation failed
- ❌ **Error**: Order not found
- ❌ **Error**: Database operation failed

### **Metrics yang Bisa Dimonitor**
- Jumlah notification yang diterima
- Success rate processing
- Response time endpoint
- Error rate per status code

## Dependencies
- `crypto`: Untuk validasi signature key
- `@nestjs/sequelize`: Untuk database operations
- Database models: Order, OrderInvoice, PaymentOrder, OrderHistory, Saldo
