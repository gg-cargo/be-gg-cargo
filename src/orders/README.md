# Orders API Documentation

## Endpoints

### 1. Create Order
**POST** `/orders`

Creates a new order with pieces and shipments.

### 2. Update Order
**PATCH** `/orders/:no_resi`

Updates an existing order based on tracking number. This endpoint can update order information, shipper details, and consignee details, but cannot update order pieces.

#### Path Parameters
- `no_resi` (string): Tracking number (no_tracking) of the order

#### Request Body
```json
{
  "nama_barang": "PAKET (Isi Pakaian)",
  "harga_barang": 500000,
  "status": "In Transit",
  "layanan": "Express",
  "nama_pengirim": "Budi Santoso",
  "alamat_pengirim": "Jl. Merdeka No. 10, Surabaya",
  "no_telepon_pengirim": "6281234567890",
  "email_pengirim": "budi@example.com",
  "provinsi_pengirim": "Jawa Timur",
  "kota_pengirim": "Surabaya",
  "kecamatan_pengirim": "Kecamatan A",
  "kelurahan_pengirim": "Kelurahan A",
  "kodepos_pengirim": "60111",
  "nama_penerima": "Citra Dewi",
  "alamat_penerima": "Jl. Damai No. 5, Jakarta",
  "no_telepon_penerima": "6287654321098",
  "email_penerima": "citra@example.com",
  "provinsi_penerima": "DKI Jakarta",
  "kota_penerima": "Jakarta Selatan",
  "kecamatan_penerima": "Kecamatan B",
  "kelurahan_penerima": "Kelurahan B",
  "kodepos_penerima": "12190",
  "updated_by_user_id": 1
}
```

#### Field Descriptions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nama_barang` | string | ❌ | Nama barang yang dikirim |
| `harga_barang` | number | ❌ | Nilai barang (untuk asuransi) |
| `status` | string | ❌ | Status pengiriman (Draft, Ready for Pickup, Picked Up, In Transit, Out for Delivery, Delivered, Cancelled) |
| `layanan` | string | ❌ | Jenis layanan |
| `nama_pengirim` | string | ❌ | Nama pengirim |
| `alamat_pengirim` | string | ❌ | Alamat pengirim |
| `no_telepon_pengirim` | string | ❌ | Telepon pengirim |
| `email_pengirim` | string | ❌ | Email pengirim |
| `provinsi_pengirim` | string | ❌ | Provinsi pengirim |
| `kota_pengirim` | string | ❌ | Kota pengirim |
| `kecamatan_pengirim` | string | ❌ | Kecamatan pengirim |
| `kelurahan_pengirim` | string | ❌ | Kelurahan pengirim |
| `kodepos_pengirim` | string | ❌ | Kode pos pengirim |
| `nama_penerima` | string | ❌ | Nama penerima |
| `alamat_penerima` | string | ❌ | Alamat penerima |
| `no_telepon_penerima` | string | ❌ | Telepon penerima |
| `email_penerima` | string | ❌ | Email penerima |
| `provinsi_penerima` | string | ❌ | Provinsi penerima |
| `kota_penerima` | string | ❌ | Kota penerima |
| `kecamatan_penerima` | string | ❌ | Kecamatan penerima |
| `kelurahan_penerima` | string | ❌ | Kelurahan penerima |
| `kodepos_penerima` | string | ❌ | Kode pos penerima |
| `updated_by_user_id` | number | ✅ | ID user yang melakukan update |

#### Response
```json
{
  "message": "Order berhasil diperbarui",
  "success": true,
  "data": {
    "no_resi": "GGK-2024-001234",
    "updated_fields": ["nama_barang", "status", "nama_pengirim"]
  }
}
```

#### cURL Example
```bash
curl -X PATCH \
  http://localhost:3000/orders/GGK-2024-001234 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "nama_barang": "PAKET (Isi Pakaian)",
    "status": "In Transit",
    "nama_pengirim": "Budi Santoso",
    "updated_by_user_id": 1
  }'
```

#### Business Rules
- **Order Validation**: Order must exist in database
- **Status Restriction**: Orders with status 'Delivered' or 'Cancelled' cannot be updated
- **No Pieces Update**: Order pieces cannot be updated through this endpoint
- **Partial Update**: Only provided fields will be updated
- **Audit Trail**: No audit trail is created (removed as requested)
- **Status Standardization**: All statuses use English labels (Draft, Ready for Pickup, Picked Up, In Transit, Out for Delivery, Delivered, Cancelled)

### 3. Reweight Order Piece
**PATCH** `/order-pieces/:id/reweight`

Input actual weight and dimensions for a specific order piece after pickup.

### 4. Get Order Detail
**GET** `/orders/:no_resi`

Get complete order details including general information, summary metrics, and piece details based on tracking number.

#### Path Parameters
- `no_resi` (string): Tracking number (no_tracking) of the order

#### Response
```json
{
  "message": "Detail order berhasil diambil",
  "success": true,
  "data": {
    "order_info": {
      "tracking_no": "GGK-2024-001234",
      "nama_barang": "PAKET",
      "harga_barang": 500000,
      "status": "In Transit",
      "bypass_reweight": "false",
      "layanan": "Express",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    "shipper": {
      "name": "Budi Santoso",
      "address": "Jl. Merdeka No. 10, Surabaya",
      "phone": "6281234567890",
      "email": "budi@example.com",
      "province": "Jawa Timur",
      "city": "Surabaya",
      "district": "Kecamatan A",
      "postal_code": "60111"
    },
    "consignee": {
      "name": "Citra Dewi",
      "address": "Jl. Damai No. 5, Jakarta",
      "phone": "6287654321098",
      "email": "citra@example.com",
      "province": "DKI Jakarta",
      "city": "Jakarta Selatan",
      "district": "Kecamatan B",
      "postal_code": "12190"
    },
    "summary_metrics": {
      "jumlah_koli": 2,
      "berat_aktual_kg": 15.5,
      "berat_volume_kg": 20.0,
      "kubikasi_m3": 0.125,
      "total_harga": 250000
    },
    "pieces_detail": [
      {
        "piece_id": 101,
        "qty": 1,
        "berat": 10.0,
        "panjang": 50,
        "lebar": 40,
        "tinggi": 30,
        "reweight_status": 1,
        "pickup_status": 1
      },
      {
        "piece_id": 102,
        "qty": 1,
        "berat": 5.5,
        "panjang": 40,
        "lebar": 30,
        "tinggi": 25,
        "reweight_status": 0,
        "pickup_status": 0
      }
    ]
  }
}
```

#### cURL Example
```bash
curl -X GET \
  http://localhost:3000/orders/GGK-2024-001234 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Error Responses
```json
{
  "statusCode": 404,
  "message": "Order tidak ditemukan",
  "error": "Not Found"
}
```

### 5. Bypass Reweight
**PATCH** `/orders/:order_id/bypass-reweight`

Set or cancel bypass reweight status for a specific order. This allows the order to skip the reweighting process in the warehouse.

#### Path Parameters
- `order_id` (number): Unique ID of the order to set bypass reweight status

#### Request Body
```json
{
  "bypass_reweight_status": "true",
  "reason": "Kontrak khusus dengan tarif flat",
  "updated_by_user_id": 1
}
```

#### Field Descriptions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bypass_reweight_status` | string | ✅ | Status bypass ("true" or "false") |
| `reason` | string | ❌ | Reason for bypass (optional but recommended) |
| `updated_by_user_id` | number | ✅ | ID of user performing the change |

#### Response
```json
{
  "message": "Bypass reweight berhasil diaktifkan",
  "success": true,
  "data": {
    "order_id": 123,
    "no_tracking": "GGK-2024-001234",
    "bypass_reweight_status": "true",
    "reason": "Kontrak khusus dengan tarif flat",
    "updated_by_user": "User ID 1",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "order_pieces_updated": 3
  }
}
```

#### Business Rules
- **Authorization**: Only Admin/Super Admin users can perform bypass reweight
- **Order Validation**: Order must exist in database
- **Status Impact**: 
  - When bypass enabled: All pieces marked as reweighted, order can proceed to next stage
  - When bypass disabled: Pieces reset to pending reweight if they were bypassed
- **Audit Trail**: All changes logged in order_histories table

#### cURL Example
```bash
curl -X PATCH \
  http://localhost:3000/orders/123/bypass-reweight \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bypass_reweight_status": "true",
    "reason": "Kontrak khusus dengan tarif flat",
    "updated_by_user_id": 1
  }'
```

#### Error Responses
```json
{
  "statusCode": 404,
  "message": "Order tidak ditemukan",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 400,
  "message": "Status bypass reweight harus \"true\" atau \"false\"",
  "error": "Bad Request"
}
```

#### Technical Implementation
1. **Validation**: Check order exists and user authorization
2. **Database Transaction**: All updates performed in single transaction
3. **Order Update**: Set bypass_reweight status and remark
4. **Pieces Update**: 
   - If bypass enabled: Mark all pieces as reweighted
   - If bypass disabled: Reset bypassed pieces to pending
5. **Order Status**: Update reweight_status based on pieces status
6. **Audit Trail**: Create order_histories entry
7. **Response**: Return success with updated data

#### Use Cases
- **Special Contracts**: Orders with flat rate pricing
- **Large Volume**: Orders with high volume where manual reweighting is impractical
- **Trusted Customers**: Regular customers with accurate initial measurements
- **Express Services**: Time-sensitive orders requiring fast processing 

## Resolve Missing Item

**Endpoint:** `PATCH /orders/:no_tracking/resolve-missing`

**Description:** Menyelesaikan masalah barang hilang dengan upload foto bukti penemuan

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Parameters:**
- `no_tracking` (path): Nomor tracking order

**Body (multipart/form-data):**
- `piece_id` (string, required): ID piece yang ditemukan
- `found_at_hub_id` (number, required): ID hub tempat barang ditemukan
- `notes_on_finding` (string, required): Catatan tentang penemuan barang (max 500 karakter)
- `photo` (file, optional): Foto bukti penemuan barang
  - Format: JPEG, PNG, GIF
  - Ukuran maksimal: 5MB

**Response:**
```json
{
  "message": "Masalah barang hilang berhasil diselesaikan",
  "data": {
    "no_tracking": "TRK123456789",
    "piece_id": "PIECE001",
    "found_at_hub": "Hub Jakarta Pusat",
    "resolved_by": "John Doe",
    "resolved_at": "2024-01-15T10:30:00.000Z",
    "all_pieces_found": true,
    "order_status": "Ready for Delivery"
  }
}
```

**Validasi:**
- User harus memiliki level 1, 2, atau 3 (Traffic Controller atau Admin)
- Order harus dalam status 'Item Missing'
- Piece ID harus valid dan dalam status 'Missing'
- Hub ID harus valid
- File foto harus dalam format gambar yang didukung
- Ukuran file tidak boleh lebih dari 5MB

**Catatan:**
- Foto akan disimpan di folder `/public/uploads/` dengan nama file yang unik
- Jika semua piece yang hilang sudah ditemukan, status order akan berubah menjadi 'Ready for Delivery'
- Endpoint ini akan mencatat history dan update status kendala order

**Contoh Penggunaan:**

**cURL:**
```bash
curl -X PATCH \
  "http://localhost:3000/orders/TRK123456789/resolve-missing" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "piece_id=PIECE001" \
  -F "found_at_hub_id=1" \
  -F "notes_on_finding=Barang ditemukan di gudang utama, kondisi baik" \
  -F "photo=@/path/to/photo.jpg"
```

**Postman:**
1. Set method ke `PATCH`
2. URL: `http://localhost:3000/orders/TRK123456789/resolve-missing`
3. Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
4. Body: `form-data`
   - `piece_id`: `PIECE001`
   - `found_at_hub_id`: `1`
   - `notes_on_finding`: `Barang ditemukan di gudang utama, kondisi baik`
   - `photo`: Select file (tipe: File)

**JavaScript/Fetch:**
```javascript
const formData = new FormData();
formData.append('piece_id', 'PIECE001');
formData.append('found_at_hub_id', '1');
formData.append('notes_on_finding', 'Barang ditemukan di gudang utama, kondisi baik');
formData.append('photo', fileInput.files[0]);

const response = await fetch('/orders/TRK123456789/resolve-missing', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

## Get Reweight Proof

**Endpoint:** `GET /orders/:order_id/reweight-proof`

**Description:** Mendapatkan bukti foto reweight dari order ID tertentu

**Headers:**
- `Authorization: Bearer <token>`

**Parameters:**
- `order_id` (path, number): ID order

**Response:**
```json
{
  "message": "Bukti foto reweight berhasil diambil",
  "success": true,
  "data": {
    "order_id": 123,
    "total_files": 2,
    "files": [
      {
        "id": 456,
        "file_name": "reweight_proof_1.jpg",
        "file_path": "https://api.99delivery.id/uploads/reweight_proof_1.jpg",
        "file_type": "jpg",
        "file_size": 1024000,
        "user_id": 789,
        "used_for": "bulk_reweight_proof_order_id_123",
        "created_at": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": 457,
        "file_name": "reweight_proof_2.jpg",
        "file_path": "https://api.99delivery.id/uploads/reweight_proof_2.jpg",
        "file_type": "jpg",
        "file_size": 2048000,
        "user_id": 789,
        "used_for": "bulk_reweight_proof_order_id_123",
        "created_at": "2024-01-15T10:35:00.000Z"
      }
    ]
  }
}
```

**Error Response:**
```json
{
  "message": "Order dengan ID 123 tidak ditemukan",
  "statusCode": 404
}
```

**Contoh Penggunaan:**

**cURL:**
```bash
curl -X GET \
  "http://localhost:3000/orders/123/reweight-proof" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript/Fetch:**
```javascript
const response = await fetch('/orders/123/reweight-proof', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const result = await response.json();
console.log(result);
```

**Catatan:**
- Endpoint ini mencari file log dengan `used_for = bulk_reweight_proof_order_id_${orderId}`
- File diurutkan berdasarkan `created_at` DESC (terbaru dulu)
- Jika order tidak ditemukan, akan mengembalikan error 404
- Jika tidak ada file bukti, akan mengembalikan array kosong 

## Complete Order

**Endpoint:** `PATCH /orders/:no_tracking/complete`

**Description:** Mengkonfirmasi bahwa seluruh proses order telah selesai, termasuk pengantaran dan pembayaran, sehingga order dapat ditandai dengan status Completed.

**Headers:**
- `Authorization: Bearer <token>`

**Parameters:**
- `no_tracking` (path, string): Nomor resi unik order yang akan diselesaikan

**Request Body:**
```json
{
  "completed_by_user_id": 101
}
```

**Request Body Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `completed_by_user_id` | number | Yes | ID user yang mengkonfirmasi penyelesaian order |

**Success Response (200 OK):**
```json
{
  "message": "Pesanan berhasil diselesaikan",
  "success": true,
  "data": {
    "no_tracking": "GG250831123456",
    "status": "Completed",
    "completed_at": "2025-08-31T15:30:00.000Z",
    "completed_by": 101
  }
}
```

**Error Responses:**

**400 Bad Request - Order belum terkirim:**
```json
{
  "success": false,
  "message": "Pesanan tidak dapat diselesaikan karena belum terkirim. Status pengantaran harus \"Delivered\"",
  "error": "Bad Request",
  "statusCode": 400
}
```

**400 Bad Request - Pembayaran belum lunas:**
```json
{
  "success": false,
  "message": "Pesanan tidak dapat diselesaikan karena belum lunas. Status pembayaran harus \"paid\" atau invoice status \"success\" dengan isUnpaid = 0",
  "error": "Bad Request",
  "statusCode": 400
}
```

**404 Not Found - Order tidak ditemukan:**
```json
{
  "success": false,
  "message": "Order dengan nomor tracking GG250831123456 tidak ditemukan",
  "error": "Not Found",
  "statusCode": 404
}
```

**404 Not Found - User tidak ditemukan:**
```json
{
  "success": false,
  "message": "User dengan ID 101 tidak ditemukan",
  "error": "Not Found",
  "statusCode": 404
}
```

**Business Rules:**
- Order harus memiliki status `'Delivered'`
- Order harus sudah lunas dengan salah satu kondisi:
  - `payment_status = 'paid'` **ATAU**
  - `invoiceStatus = 'success'` **DAN** `isUnpaid = 0`
- User yang melakukan complete harus exists di sistem
- Setelah complete, status order akan berubah menjadi `'Completed'`
- Order history akan dibuat dengan status `'Order Completed'`

**Contoh Penggunaan:**

**cURL:**
```bash
curl -X PATCH \
  "http://localhost:3000/orders/GG250831123456/complete" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completed_by_user_id": 101
  }'
```

**JavaScript/Fetch:**
```javascript
const response = await fetch('/orders/GG250831123456/complete', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    completed_by_user_id: 101
  })
});

const result = await response.json();
console.log(result);
```

**Catatan:**
- Endpoint ini berfungsi sebagai titik akhir dalam alur proses logistik
- Semua validasi harus terpenuhi sebelum order dapat diselesaikan
- Audit trail lengkap akan dibuat di tabel `order_histories`
- Status order akan berubah dari `'Delivered'` menjadi `'Completed'`