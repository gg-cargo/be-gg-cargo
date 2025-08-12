# Endpoint: GET /payments/:no_tracking/status

## **📋 Informasi Umum**
- **Method**: GET
- **URL**: `/payments/:no_tracking/status`
- **Tujuan**: Memberikan status pembayaran terkini untuk sebuah order agar frontend dapat memperbarui tampilan UI tanpa perlu menunggu notifikasi atau refresh halaman.

## **🔗 Path Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `no_tracking` | string | ✅ | Nomor resi dari order yang akan diperiksa status pembayarannya |

## **📤 Request**
```http
GET /payments/GG250723566559/status
```

**Headers:**
```http
Content-Type: application/json
```

## **📥 Response**

### **Success Response (200 OK)**
```json
{
    "message": "Status pembayaran berhasil diambil",
    "data": {
        "no_tracking": "GG250723566559",
        "payment_status": "pending"
    }
}
```

### **Error Response (404 Not Found)**
```json
{
    "statusCode": 404,
    "message": "Order dengan no_tracking GG250723566559 tidak ditemukan",
    "error": "Not Found"
}
```

### **Error Response (500 Internal Server Error)**
```json
{
    "statusCode": 500,
    "message": "Gagal mendapatkan status pembayaran",
    "error": "Internal Server Error"
}
```

## **🎯 Payment Status Values**
| Status | Description |
|--------|-------------|
| `pending` | Pembayaran sedang menunggu konfirmasi |
| `paid` | Pembayaran berhasil |
| `failed` | Pembayaran gagal |
| `expired` | Pembayaran sudah expired |

## **🔄 Alur Logika Backend**

### **1. Menerima Permintaan**
- Backend menerima permintaan GET dari frontend
- Parameter `no_tracking` diekstrak dari URL

### **2. Kueri Database**
- Backend melakukan kueri ke tabel `orders` menggunakan `no_tracking`
- Mengambil kolom: `id`, `no_tracking`, `payment_status`, `payment_expire_time`

### **3. Validasi Data**
- Jika order tidak ditemukan → throw `NotFoundException`
- Jika order ditemukan → lanjut ke proses berikutnya

### **4. Cek Status Expired**
- Jika `payment_status = 'pending'` dan ada `payment_expire_time`
- Bandingkan dengan waktu sekarang
- Jika sudah expired → update status menjadi `'expired'`

### **5. Mengirim Respons**
- Format response sesuai dengan `PaymentStatusResponseDto`
- `message`: pesan sukses yang informatif
- `data`: object yang berisi `no_tracking` dan `payment_status`

## **💾 Keterkaitan Database**

### **Tabel yang Diakses:**
- **`orders`**: Untuk mendapatkan status pembayaran dan waktu expired

### **Kolom yang Digunakan:**
```sql
SELECT id, no_tracking, payment_status, payment_expire_time 
FROM orders 
WHERE no_tracking = ?
```

### **Update yang Mungkin:**
```sql
UPDATE orders 
SET payment_status = 'expired', updated_at = NOW() 
WHERE no_tracking = ? AND payment_status = 'pending' AND payment_expire_time < NOW()
```

## **🎭 Peran dalam Alur Pembayaran**

### **1. Frontend Polling**
- Frontend menampilkan instruksi pembayaran dan nomor Virtual Account
- Frontend melakukan polling dengan interval tertentu (misal: setiap 10 detik)
- Memanggil `GET /payments/:no_tracking/status` secara berulang

### **2. Real-time Status Update**
- Ketika pelanggan berhasil membayar, Midtrans mengirim webhook
- Backend memproses webhook dan update `orders.payment_status = 'paid'`
- Pada polling berikutnya, endpoint akan return `'paid'`
- Frontend update UI menjadi "Pembayaran Berhasil!"

### **3. Handling Expired Payments**
- Jika VA sudah expired, status otomatis berubah menjadi `'expired'`
- Frontend dapat menampilkan pesan "Pembayaran Expired"
- User dapat request VA baru melalui endpoint `POST /payments/midtrans/va`

## **🔧 Testing**

### **Test dengan cURL:**
```bash
# Test dengan no_tracking yang valid
curl -X GET "http://localhost:3000/payments/GG250723566559/status"

# Test dengan no_tracking yang tidak valid
curl -X GET "http://localhost:3000/payments/INVALID123/status"
```

### **Expected Output:**
```bash
# Success case
{
    "message": "Status pembayaran berhasil diambil",
    "data": {
        "no_tracking": "GG250723566559",
        "payment_status": "pending"
    }
}

# Error case
{
    "statusCode": 404,
    "message": "Order dengan no_tracking INVALID123 tidak ditemukan",
    "error": "Not Found"
}
```

## **⚠️ Error Handling**

### **1. NotFoundException (404)**
- **Trigger**: Order dengan `no_tracking` tidak ditemukan
- **Response**: 404 Not Found dengan pesan error yang jelas

### **2. InternalServerErrorException (500)**
- **Trigger**: Error database atau error internal lainnya
- **Response**: 500 Internal Server Error dengan pesan generic

## **📝 Logging**

### **Debug Logs:**
- Error saat query database
- Error saat update status expired
- Error saat validasi data

### **Access Logs:**
- Request ke endpoint dengan `no_tracking`
- Response status dan waktu response

## **🔒 Security Considerations**

### **1. Rate Limiting**
- Endpoint ini bisa diakses tanpa authentication
- Pertimbangkan rate limiting untuk mencegah abuse

### **2. Input Validation**
- `no_tracking` parameter divalidasi sebagai string
- Panjang dan format `no_tracking` sesuai dengan business rules

### **3. Data Exposure**
- Hanya mengekspos informasi status pembayaran
- Tidak ada data sensitif yang di-expose

## **🚀 Performance Considerations**

### **1. Database Indexing**
- Pastikan ada index pada kolom `no_tracking`
- Index pada `payment_status` untuk query yang lebih cepat

### **2. Caching (Optional)**
- Status pembayaran bisa di-cache untuk beberapa detik
- Mengurangi beban database untuk polling yang frequent

### **3. Query Optimization**
- Hanya select kolom yang diperlukan
- Gunakan `findOne` dengan `where` clause yang spesifik
