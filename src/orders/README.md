# Order Management API

## Update Order

**Endpoint**: `PATCH /orders/:no_resi`  
**Method**: `PATCH`  
**Authentication**: Required (JWT Token)  
**Description**: Memperbarui detail pengiriman (order) yang sudah ada berdasarkan nomor resi (no_tracking).

### Path Parameters
- `no_resi` (string): Nomor resi (no_tracking) dari order yang ingin diedit

### Request Body
Semua field bersifat **optional** (partial update). Hanya field yang ingin diubah yang perlu dikirim.

```typescript
{
  // Informasi Pengirim (Sender)
  nama_pengirim?: string;
  alamat_pengirim?: string;
  no_telepon_pengirim?: string;
  
  // Informasi Penerima (Receiver)
  nama_penerima?: string;
  alamat_penerima?: string;
  no_telepon_penerima?: string;
  
  // Informasi Barang
  nama_barang?: string;
  layanan?: string;
  status?: string;
  
  // Update Detail Barang (Pieces)
  order_pieces_update?: Array<{
    piece_id: string;        // ID dari piece yang akan diupdate
    berat?: number;          // Berat dalam kg
    panjang?: number;        // Panjang dalam cm
    lebar?: number;          // Lebar dalam cm
    tinggi?: number;         // Tinggi dalam cm
    nama_barang?: string;    // Nama barang per piece
  }>;
  
  // Metadata
  updated_by_user_id: number;  // ID user yang melakukan update (required)
}
```

## Contoh Payload

### 1. Mengubah Detail Penerima
```json
{
  "nama_penerima": "Citra Dewi Kusuma",
  "alamat_penerima": "Jl. Damai No. 5, Blok C, Jakarta Selatan",
  "no_telepon_penerima": "628765432109",
  "updated_by_user_id": 10
}
```

### 2. Mengubah Detail Pengirim
```json
{
  "nama_pengirim": "PT Maju Bersama",
  "alamat_pengirim": "Jl. Industri No. 15, Kawasan Industri Bekasi",
  "no_telepon_pengirim": "628123456789",
  "updated_by_user_id": 10
}
```

### 3. Mengoreksi Detail Barang (Berat/Dimensi)
```json
{
  "nama_barang": "PAKET (Isi Pakaian dan Sepatu)",
  "order_pieces_update": [
    {
      "piece_id": "PCE123-ABC",
      "berat": 5.5,
      "panjang": 55,
      "lebar": 35,
      "tinggi": 25,
      "nama_barang": "Pakaian Casual"
    },
    {
      "piece_id": "PCE123-DEF",
      "berat": 3.2,
      "panjang": 40,
      "lebar": 30,
      "tinggi": 20,
      "nama_barang": "Sepatu Sneakers"
    }
  ],
  "updated_by_user_id": 10
}
```

### 4. Mengubah Status Order
```json
{
  "status": "Ready for Shipment",
  "layanan": "Express",
  "updated_by_user_id": 10
}
```

### 5. Update Komprehensif (Multiple Fields)
```json
{
  "nama_penerima": "Ahmad Rizki",
  "alamat_penerima": "Jl. Sudirman No. 123, Jakarta Pusat",
  "no_telepon_penerima": "628987654321",
  "nama_barang": "Dokumen Penting",
  "layanan": "Same Day",
  "status": "In Transit",
  "order_pieces_update": [
    {
      "piece_id": "PCE456-XYZ",
      "berat": 2.0,
      "panjang": 30,
      "lebar": 25,
      "tinggi": 5,
      "nama_barang": "Dokumen Kontrak"
    }
  ],
  "updated_by_user_id": 15
}
```

### 6. Update Hanya Satu Piece
```json
{
  "order_pieces_update": [
    {
      "piece_id": "PCE789-123",
      "berat": 4.8,
      "nama_barang": "Laptop Gaming"
    }
  ],
  "updated_by_user_id": 12
}
```

### 7. Update Dimensi Saja
```json
{
  "order_pieces_update": [
    {
      "piece_id": "PCE999-888",
      "panjang": 60,
      "lebar": 40,
      "tinggi": 30
    }
  ],
  "updated_by_user_id": 8
}
```

## Response Format

### Success Response (200 OK)
```json
{
  "no_resi": "RES123456789",
  "status": "success",
  "message": "Order berhasil diperbarui",
  "updated_fields": [
    "nama_penerima",
    "alamat_penerima",
    "no_telepon_penerima",
    "piece_PCE123-ABC_berat",
    "piece_PCE123-ABC_panjang"
  ],
  "order_pieces_updated": 2
}
```

### Error Responses

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Order dengan nomor resi RES123456789 tidak ditemukan",
  "error": "Not Found"
}
```

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Order dengan status 'Delivered' tidak dapat diperbarui",
  "error": "Bad Request"
}
```

#### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Piece dengan ID PCE123-ABC tidak ditemukan dalam order ini",
  "error": "Conflict"
}
```

## Business Rules

### ✅ Yang Diizinkan
- Update order dengan status: `Draft`, `Pending`, `Ready for Shipment`, `In Transit`
- Update detail pengirim/penerima sebelum pickup
- Update berat/dimensi jika `reweight_status = 0`
- Update nama barang dan layanan
- Partial update (hanya field yang diubah)

### ❌ Yang Tidak Diizinkan
- Update order dengan status: `Delivered`, `Cancelled`
- Update berat/dimensi jika `reweight_status = 1` (sudah reweight)
- Update field yang tidak ada dalam skema

### 🔄 Auto Recalculation
- Jika `order_pieces_update` ada dan `reweight_status = 0`:
  - `total_berat` akan dihitung ulang dari sum semua pieces
  - `total_koli` akan dihitung ulang dari jumlah pieces
- Jika `reweight_status = 1`, recalculation tidak dilakukan

### 📝 Audit Trail
- Semua perubahan akan dicatat di `order_histories`
- Format: `"Order details updated: field1, field2, field3"`
- `created_by` = `updated_by_user_id`

## Contoh cURL

### Update Detail Penerima
```bash
curl -X PATCH "http://localhost:3000/orders/RES123456789" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nama_penerima": "Citra Dewi Kusuma",
    "alamat_penerima": "Jl. Damai No. 5, Blok C, Jakarta",
    "no_telepon_penerima": "628765432109",
    "updated_by_user_id": 10
  }'
```

### Update Berat Barang
```bash
curl -X PATCH "http://localhost:3000/orders/RES123456789" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_pieces_update": [
      {
        "piece_id": "PCE123-ABC",
        "berat": 5.5,
        "panjang": 55,
        "lebar": 35,
        "tinggi": 25
      }
    ],
    "updated_by_user_id": 10
  }'
```

### Update Status
```bash
curl -X PATCH "http://localhost:3000/orders/RES123456789" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Ready for Shipment",
    "updated_by_user_id": 10
  }'
``` 