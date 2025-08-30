# Inbound Scan Endpoint

## Overview
Endpoint untuk merekam bahwa muatan dari sebuah nota kirim telah tiba di hub tujuan dan memverifikasi setiap barang (piece_id) dengan memindai kode QR.

## Endpoint Details

### **URL**: `POST /delivery-notes/:no_delivery_note/inbound-scan`
### **Method**: `POST`
### **Authentication**: `JwtAuthGuard` required

## Request Structure

### **Path Parameters**:
- `no_delivery_note` (string): Nomor nota kirim yang dipindai

### **Request Body** (JSON):
```json
{
    "scanned_piece_ids": [
        "XPDC4686595900-1",
        "XPDC4686595900-2"
    ],
    "inbound_by_user_id": 101,
    "destination_hub_id": 2
}
```

### **Field Descriptions**:
- `scanned_piece_ids` (string[]): List piece_id yang berhasil di-scan
- `inbound_by_user_id` (number): ID staf di hub tujuan
- `destination_hub_id` (number): ID hub tujuan

## Response Structure

### **Success Response** (200):
```json
{
    "message": "Inbound scan berhasil diproses",
    "success": true,
    "data": {
        "no_delivery_note": "2024Jan15HUB001",
        "destination_hub_id": 2,
        "total_pieces_scanned": 2,
        "pieces_updated": [
            {
                "piece_id": "XPDC4686595900-1",
                "status": "success",
                "message": "Piece berhasil di-inbound"
            },
            {
                "piece_id": "XPDC4686595900-2",
                "status": "success",
                "message": "Piece berhasil di-inbound"
            }
        ],
        "orders_updated": [
            {
                "order_id": 123,
                "no_tracking": "GG250827780438",
                "status": "Arrived at Destination Hub",
                "current_hub": 2
            }
        ],
        "manifest_records_created": 2,
        "history_records_created": 2
    }
}
```

### **Error Response** (400/404/500):
```json
{
    "success": false,
    "message": "Error message",
    "statusCode": 400,
    "error": "Bad Request"
}
```

## Business Logic Flow

### **1. Validasi dan Otorisasi**
- ✅ Validasi `inbound_by_user_id` exists
- ✅ Validasi user level (checker/ops - level 3 atau 4)
- ✅ Validasi `no_delivery_note` exists di tabel `order_delivery_notes`
- ✅ Validasi `destination_hub_id` exists

### **2. Validasi Pieces**
- ✅ Validasi semua `scanned_piece_ids` exists di database
- ✅ Validasi pieces terkait dengan delivery note yang benar

### **3. Pembaruan Status Per Piece**
Untuk setiap piece yang di-scan:
- ✅ Update `order_pieces.inbound_status` = 1
- ✅ Update `order_pieces.hub_current_id` = destination_hub_id
- ✅ Update `order_pieces.inbound_by` = inbound_by_user_id

### **4. Pembaruan Status Order**
Untuk setiap order yang terkait:
- ✅ Update `orders.current_hub` = destination_hub_id
- ✅ Update `orders.issetManifest_inbound` = 1
- ✅ Jika semua pieces sudah di-inbound, update `orders.status` = 'Arrived at Destination Hub'

### **5. Audit Trail dan Logging**
Untuk setiap piece yang di-scan:
- ✅ Buat record di `order_histories`:
  - `status`: "Piece Inbound Scanned"
  - `remark`: "pesanan tiba di svc [Nama Hub Tujuan]"
  - `created_by`: inbound_by_user_id
- ✅ Buat record di `order_manifest_inbound`:
  - `order_id`: no_tracking order
  - `svc_id`: destination_hub_id
  - `user_id`: inbound_by_user_id

## Database Updates

### **Table: `order_pieces`**
```sql
UPDATE order_pieces 
SET inbound_status = 1,
    hub_current_id = :destination_hub_id,
    inbound_by = :inbound_by_user_id,
    updatedAt = NOW()
WHERE piece_id = :scanned_piece_id;
```

### **Table: `orders`**
```sql
UPDATE orders 
SET current_hub = :destination_hub_id,
    issetManifest_inbound = 1,
    status = CASE 
        WHEN all_pieces_inbound THEN 'Arrived at Destination Hub'
        ELSE status 
    END,
    updatedAt = NOW()
WHERE id = :order_id;
```

### **Table: `order_histories`**
```sql
INSERT INTO order_histories (
    order_id, status, remark, date, time, 
    created_by, created_at, provinsi, kota
) VALUES (
    :order_id, 'Piece Inbound Scanned', 
    'pesanan tiba di svc :hub_nama',
    :date, :time, :inbound_by_user_id, NOW(), '', ''
);
```

### **Table: `order_manifest_inbound`**
```sql
INSERT INTO order_manifest_inbound (
    order_id, svc_id, user_id, created_at
) VALUES (
    :no_tracking, :destination_hub_id, :inbound_by_user_id, NOW()
);
```

## Validation Rules

### **User Authorization**:
- User harus memiliki level 3 (Checker) atau level 4 (Ops)
- User harus exists di database

### **Delivery Note**:
- `no_delivery_note` harus exists di tabel `order_delivery_notes`
- Status delivery note harus menunjukkan sedang dalam perjalanan

### **Hub Validation**:
- `destination_hub_id` harus exists di tabel `hubs`

### **Pieces Validation**:
- Semua `scanned_piece_ids` harus exists di database
- Pieces harus terkait dengan delivery note yang benar
- Minimal satu piece harus di-scan

## Error Handling

### **400 Bad Request**:
- User tidak memiliki hak akses (level bukan 3 atau 4)
- Pieces tidak ditemukan
- Request body tidak valid

### **404 Not Found**:
- Delivery note tidak ditemukan
- Hub tujuan tidak ditemukan
- User tidak ditemukan

### **500 Internal Server Error**:
- Database transaction error
- Unexpected server error

## Usage Examples

### **cURL Example**:
```bash
curl -X POST "https://api.example.com/delivery-notes/2024Jan15HUB001/inbound-scan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "scanned_piece_ids": ["XPDC4686595900-1", "XPDC4686595900-2"],
    "inbound_by_user_id": 101,
    "destination_hub_id": 2
  }'
```

### **JavaScript Example**:
```javascript
const response = await fetch('/delivery-notes/2024Jan15HUB001/inbound-scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    scanned_piece_ids: ['XPDC4686595900-1', 'XPDC4686595900-2'],
    inbound_by_user_id: 101,
    destination_hub_id: 2
  })
});

const result = await response.json();
console.log(result);
```

### **Postman Example**:
1. **Method**: POST
2. **URL**: `{{base_url}}/delivery-notes/2024Jan15HUB001/inbound-scan`
3. **Headers**: 
   - `Content-Type: application/json`
   - `Authorization: Bearer {{jwt_token}}`
4. **Body** (raw JSON):
```json
{
    "scanned_piece_ids": ["XPDC4686595900-1", "XPDC4686595900-2"],
    "inbound_by_user_id": 101,
    "destination_hub_id": 2
}
```

## Testing Scenarios

### **Test Case 1: Successful Inbound Scan**
1. Scan multiple pieces dari delivery note
2. Verify semua pieces berhasil di-update
3. Verify order status berubah jika semua pieces inbound
4. Verify audit trail terbuat

### **Test Case 2: Partial Inbound Scan**
1. Scan sebagian pieces dari order
2. Verify order status tidak berubah
3. Verify hanya scanned pieces yang di-update

### **Test Case 3: Invalid User Level**
1. Gunakan user dengan level bukan 3 atau 4
2. Verify error 400 dengan message yang sesuai

### **Test Case 4: Invalid Pieces**
1. Scan pieces yang tidak exists
2. Verify error 400 dengan list pieces yang tidak ditemukan

### **Test Case 5: Invalid Delivery Note**
1. Gunakan no_delivery_note yang tidak exists
2. Verify error 404

## Security Considerations

- ✅ JWT Authentication required
- ✅ User level validation (checker/ops only)
- ✅ Input validation dengan class-validator
- ✅ SQL injection protection via Sequelize ORM
- ✅ Transaction rollback on error

## Performance Considerations

- ✅ Database transaction untuk atomicity
- ✅ Batch processing untuk multiple pieces
- ✅ Proper indexing pada piece_id, order_id
- ✅ Efficient queries dengan includes

## Monitoring and Logging

- ✅ Audit trail di order_histories
- ✅ Manifest tracking di order_manifest_inbound
- ✅ Error logging dengan detail
- ✅ Success metrics tracking
