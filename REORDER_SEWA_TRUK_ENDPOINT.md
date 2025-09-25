# Reorder Sewa Truk Endpoint Documentation

## Overview
Endpoint ini digunakan untuk mengambil data order sewa truk yang sudah pernah dibuat sebelumnya, sehingga user dapat melakukan "reorder" (memesan ulang) dengan data yang sama.

## Endpoint

### GET /orders/:id/reorder-sewa-truk

**Tujuan:** Mengambil data order sewa truk untuk keperluan reorder.

#### Authentication
- **JWT Required:** User harus login
- **Authorization:** User hanya bisa mengakses order miliknya sendiri

#### Path Parameters

| Parameter | Tipe | Wajib | Deskripsi | Contoh |
|-----------|------|-------|-----------|--------|
| `id` | number | Ya | ID order sewa truk yang akan di-reorder | `123` |

#### Contoh Request

```http
GET /orders/123/reorder-sewa-truk
Authorization: Bearer <jwt_token>
```

#### Response Format

**Success Response (200 OK):**
```json
{
    "message": "Data reorder sewa truk berhasil diambil",
    "data": {
        // Data Pengirim
        "nama_pengirim": "John Doe",
        "alamat_pengirim": "Jl. Sudirman No. 123",
        "provinsi_pengirim": "DKI Jakarta",
        "kota_pengirim": "Jakarta Selatan",
        "kecamatan_pengirim": "Kebayoran Baru",
        "kelurahan_pengirim": "Senayan",
        "kodepos_pengirim": "12190",
        "no_telepon_pengirim": "081234567890",

        // Data Penerima
        "nama_penerima": "Jane Doe",
        "alamat_penerima": "Jl. Thamrin No. 456",
        "provinsi_penerima": "DKI Jakarta",
        "kota_penerima": "Jakarta Pusat",
        "kecamatan_penerima": "Menteng",
        "kelurahan_penerima": "Gondangdia",
        "kodepos_penerima": "10350",
        "no_telepon_penerima": "089876543210",

        // Data Pesanan Spesifik Sewa Truk
        "layanan": "Sewa truck",
        "origin_latlng": "-6.2088,106.8456",
        "destination_latlng": "-7.2575,112.7521",
        "isUseToll": true,
        "toll_payment_method": 1,
        "truck_type": "Fuso",
        "pickup_time": "2025-01-15T08:00:00.000Z",
        "keterangan_barang": "Muatan sewa truck",
        "asuransi": true
    }
}
```

#### Error Responses

**404 Not Found:**
```json
{
    "statusCode": 404,
    "message": "Order sewa truk tidak ditemukan atau tidak memiliki akses",
    "error": "Not Found"
}
```

**401 Unauthorized:**
```json
{
    "statusCode": 401,
    "message": "Unauthorized",
    "error": "Unauthorized"
}
```

**400 Bad Request:**
```json
{
    "statusCode": 400,
    "message": "Validation failed (numeric string is expected)",
    "error": "Bad Request"
}
```

## Validasi dan Keamanan

### 1. **Authentication & Authorization**
- User harus login dengan JWT token yang valid
- User hanya bisa mengakses order yang dibuat oleh dirinya sendiri (`order_by: userId`)

### 2. **Order Type Validation**
- Endpoint ini khusus untuk order dengan `layanan: 'Sewa truck'`
- Jika order bukan sewa truk, akan mengembalikan 404

### 3. **Input Validation**
- Parameter `id` harus berupa integer
- Menggunakan `ParseIntPipe` untuk validasi

## Data Transformation

### Boolean Conversion
- `isUseToll`: Dikonversi dari integer (1/0) ke boolean
- `asuransi`: Dikonversi dari integer (1/0) ke boolean

### Date Format
- `pickup_time`: Dikonversi ke ISO string format
- Jika `pickup_time` null, akan mengembalikan null

### Field Mapping
- `latlngAsal` → `origin_latlng`
- `latlngTujuan` → `destination_latlng`
- `metode_bayar_truck` → `toll_payment_method`
- `nama_barang` → `keterangan_barang`

## Perbedaan dengan Endpoint Reorder Biasa

| Aspek | Reorder Biasa | Reorder Sewa Truk |
|-------|---------------|-------------------|
| **Endpoint** | `GET /orders/:id/reorder` | `GET /orders/:id/reorder-sewa-truk` |
| **Layanan** | Semua jenis layanan | Hanya "Sewa truck" |
| **Data Pieces** | Mengambil data shipments | Tidak mengambil data shipments |
| **Field Khusus** | Tidak ada | `origin_latlng`, `destination_latlng`, `isUseToll`, `toll_payment_method`, `truck_type` |
| **Validasi** | Tidak ada validasi layanan | Validasi khusus untuk sewa truk |

## Use Cases

### 1. **Quick Reorder**
User ingin memesan ulang sewa truk dengan data yang sama:
```javascript
// Ambil data reorder
const response = await fetch('/api/orders/123/reorder-sewa-truk', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const reorderData = await response.json();

// Gunakan data untuk form order baru
formData.set('nama_pengirim', reorderData.data.nama_pengirim);
formData.set('origin_latlng', reorderData.data.origin_latlng);
// ... set field lainnya
```

### 2. **Template Order**
Menggunakan order sebelumnya sebagai template untuk order baru dengan modifikasi:
```javascript
const reorderData = await getReorderData(orderId);
// User bisa mengubah beberapa field sebelum submit
reorderData.data.pickup_time = newPickupTime;
reorderData.data.keterangan_barang = "Muatan berbeda";
```

### 3. **Bulk Reorder**
Untuk order yang sering diulang (misal: kirim ke customer yang sama):
```javascript
// Ambil data reorder
const reorderData = await getReorderData(orderId);
// Langsung submit dengan data yang sama
await createTruckRentalOrder(reorderData.data);
```

## Integration dengan Create Truck Rental Order

Data yang dikembalikan oleh endpoint ini dapat langsung digunakan untuk endpoint `POST /orders/sewa-truk`:

```javascript
// 1. Ambil data reorder
const reorderResponse = await fetch('/api/orders/123/reorder-sewa-truk');
const reorderData = await reorderResponse.json();

// 2. Gunakan data untuk create order baru
const createResponse = await fetch('/api/orders/sewa-truk', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(reorderData.data)
});
```

## Catatan Penting

### 1. **Data Consistency**
- Data yang dikembalikan sesuai dengan format `CreateTruckRentalOrderDto`
- Semua field yang diperlukan untuk create order sudah tersedia

### 2. **Performance**
- Query hanya mengambil data dari tabel `orders`
- Tidak melakukan join dengan tabel lain untuk optimasi

### 3. **Security**
- Validasi ketat untuk mencegah akses data order milik user lain
- Validasi tipe layanan untuk memastikan endpoint digunakan dengan benar

### 4. **Error Handling**
- Error message yang informatif untuk debugging
- HTTP status code yang sesuai dengan standar REST API

## Contoh Frontend Integration

```javascript
class TruckRentalService {
    async getReorderData(orderId) {
        try {
            const response = await fetch(`/api/orders/${orderId}/reorder-sewa-truk`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error getting reorder data:', error);
            throw error;
        }
    }

    async reorderTruckRental(orderId) {
        try {
            // Ambil data reorder
            const reorderResponse = await this.getReorderData(orderId);
            
            // Buat order baru dengan data yang sama
            const createResponse = await fetch('/api/orders/sewa-truk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(reorderResponse.data)
            });
            
            return await createResponse.json();
        } catch (error) {
            console.error('Error reordering truck rental:', error);
            throw error;
        }
    }
}
```

Endpoint ini memberikan kemudahan bagi user untuk melakukan reorder sewa truk dengan data yang sudah pernah digunakan sebelumnya, meningkatkan user experience dan efisiensi dalam proses pemesanan! 🚛
