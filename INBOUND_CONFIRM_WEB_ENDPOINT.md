# Inbound Confirm Web Endpoint

## Overview
Endpoint untuk mengkonfirmasi penerimaan seluruh muatan nota kirim secara manual di hub tujuan melalui dashboard web.

## Endpoint Details

### **URL**: `PATCH /delivery-notes/:no_delivery_note/inbound-confirm-web`
### **Method**: `PATCH`
### **Authentication**: `JwtAuthGuard` required

## Request Structure

### **Path Parameters**:
- `no_delivery_note` (string): Nomor nota kirim yang akan dikonfirmasi

### **Request Body** (JSON):
```json
{
    "inbound_by_user_id": 101,
    "destination_hub_id": 2
}
```

### **Field Descriptions**:
- `inbound_by_user_id` (number): ID staf di hub tujuan
- `destination_hub_id` (number): ID hub tujuan

## Response Structure

### **Success Response** (200):
```json
{
    "message": "Inbound confirm web berhasil diproses",
    "success": true,
    "data": {
        "no_delivery_note": "2024Jan15HUB001",
        "destination_hub_id": 2,
        "total_orders_confirmed": 3,
        "total_pieces_confirmed": 5,
        "orders_updated": [
            {
                "order_id": 123,
                "no_tracking": "GG250827780438",
                "status": "Arrived at Destination Hub",
                "current_hub": 2
            },
            {
                "order_id": 124,
                "no_tracking": "GG250827780439",
                "status": "Arrived at Destination Hub",
                "current_hub": 2
            }
        ],
        "pieces_updated": [
            {
                "piece_id": "XPDC4686595900-1",
                "status": "success",
                "message": "Piece berhasil dikonfirmasi inbound"
            },
            {
                "piece_id": "XPDC4686595900-2",
                "status": "success",
                "message": "Piece berhasil dikonfirmasi inbound"
            }
        ],
        "history_records_created": 3
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
- ✅ Validasi user level (admin/checker - level 1 atau 3)
- ✅ Validasi `no_delivery_note` exists di tabel `order_delivery_notes`
- ✅ Validasi `destination_hub_id` exists
- ✅ Validasi hub tujuan sesuai dengan delivery note

### **2. Mengidentifikasi Semua Order dan Piece**
- ✅ Parse `no_tracking` dari delivery note menjadi array resi
- ✅ Query orders berdasarkan resi list
- ✅ Query pieces berdasarkan order_id list
- ✅ Validasi semua resi dan pieces ditemukan

### **3. Pembaruan Status Secara Massal**
**Pembaruan Per Piece**:
- ✅ Update semua pieces sekaligus:
  - `inbound_status` = 1
  - `hub_current_id` = destination_hub_id
  - `inbound_by` = inbound_by_user_id

**Pembaruan Per Order**:
- ✅ Update semua orders sekaligus:
  - `current_hub` = destination_hub_id
  - `status` = 'Arrived at Destination Hub'
  - `issetManifest_inbound` = 1

### **4. Audit Trail dan Logging**
- ✅ Buat order history untuk setiap order:
  - `status`: "Inbound Manifest Confirmed (Manual)"
  - `remark`: "pesanan tiba di svc [Nama Hub Tujuan]"
  - `created_by`: inbound_by_user_id

## Database Updates

### **Table: `order_pieces` (Mass Update)**
```sql
UPDATE order_pieces 
SET inbound_status = 1,
    hub_current_id = :destination_hub_id,
    inbound_by = :inbound_by_user_id,
    updatedAt = NOW()
WHERE order_id IN (:order_ids);
```

### **Table: `orders` (Mass Update)**
```sql
UPDATE orders 
SET current_hub = :destination_hub_id,
    status = 'Arrived at Destination Hub',
    issetManifest_inbound = 1,
    updatedAt = NOW()
WHERE id IN (:order_ids);
```

### **Table: `order_histories` (Multiple Inserts)**
```sql
INSERT INTO order_histories (
    order_id, status, remark, date, time, 
    created_by, created_at, provinsi, kota
) VALUES 
(:order_id_1, 'Inbound Manifest Confirmed (Manual)', 
 'pesanan tiba di svc :hub_nama',
 :date, :time, :inbound_by_user_id, NOW(), '', ''),
(:order_id_2, 'Inbound Manifest Confirmed (Manual)', 
 'pesanan tiba di svc :hub_nama',
 :date, :time, :inbound_by_user_id, NOW(), '', ''),
-- ... untuk setiap order
```

## Validation Rules

### **User Authorization**:
- User harus memiliki level 1 (Admin) atau level 3 (Checker)
- User harus exists di database

### **Delivery Note**:
- `no_delivery_note` harus exists di tabel `order_delivery_notes`
- Hub tujuan di delivery note harus sesuai dengan `destination_hub_id`

### **Hub Validation**:
- `destination_hub_id` harus exists di tabel `hubs`
- Hub tujuan harus sesuai dengan yang tercatat di delivery note

### **Data Validation**:
- Delivery note harus memiliki resi yang valid
- Semua resi harus exists di database
- Semua orders harus memiliki pieces

## Error Handling

### **400 Bad Request**:
- User tidak memiliki hak akses (level bukan 1 atau 3)
- Hub tujuan tidak sesuai dengan delivery note
- Resi tidak ditemukan
- Tidak ada pieces yang ditemukan
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
curl -X PATCH "https://api.example.com/delivery-notes/2024Jan15HUB001/inbound-confirm-web" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "inbound_by_user_id": 101,
    "destination_hub_id": 2
  }'
```

### **JavaScript Example**:
```javascript
const response = await fetch('/delivery-notes/2024Jan15HUB001/inbound-confirm-web', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    inbound_by_user_id: 101,
    destination_hub_id: 2
  })
});

const result = await response.json();
console.log(result);
```

### **Postman Example**:
1. **Method**: PATCH
2. **URL**: `{{base_url}}/delivery-notes/2024Jan15HUB001/inbound-confirm-web`
3. **Headers**: 
   - `Content-Type: application/json`
   - `Authorization: Bearer {{jwt_token}}`
4. **Body** (raw JSON):
```json
{
    "inbound_by_user_id": 101,
    "destination_hub_id": 2
}
```

## Testing Scenarios

### **Test Case 1: Successful Inbound Confirm**
1. Konfirmasi inbound untuk delivery note dengan multiple orders
2. Verify semua orders dan pieces berhasil di-update
3. Verify order history terbuat untuk setiap order
4. Verify status orders berubah menjadi 'Arrived at Destination Hub'

### **Test Case 2: Invalid User Level**
1. Gunakan user dengan level bukan 1 atau 3
2. Verify error 400 dengan message yang sesuai

### **Test Case 3: Invalid Hub Destination**
1. Gunakan destination_hub_id yang tidak sesuai dengan delivery note
2. Verify error 400 dengan message yang sesuai

### **Test Case 4: Invalid Delivery Note**
1. Gunakan no_delivery_note yang tidak exists
2. Verify error 404

### **Test Case 5: Empty Delivery Note**
1. Gunakan delivery note tanpa resi
2. Verify error 400 dengan message yang sesuai

## Security Considerations

- ✅ JWT Authentication required
- ✅ User level validation (admin/checker only)
- ✅ Input validation dengan class-validator
- ✅ SQL injection protection via Sequelize ORM
- ✅ Transaction rollback on error
- ✅ Hub destination validation

## Performance Considerations

- ✅ Database transaction untuk atomicity
- ✅ Mass updates untuk efficiency
- ✅ Proper indexing pada order_id, no_tracking
- ✅ Efficient queries dengan batch operations

## Monitoring and Logging

- ✅ Audit trail di order_histories untuk setiap order
- ✅ Error logging dengan detail
- ✅ Success metrics tracking
- ✅ Mass operation tracking

## Comparison with Inbound Scan

### **Inbound Scan**:
- ✅ Scan individual pieces dengan QR code
- ✅ Update per piece
- ✅ Detailed piece tracking
- ✅ Real-time validation

### **Inbound Confirm Web**:
- ✅ Konfirmasi seluruh muatan sekaligus
- ✅ Mass updates untuk efficiency
- ✅ Manual confirmation via web dashboard
- ✅ Bulk operation tracking

## Key Differences

| Feature | Inbound Scan | Inbound Confirm Web |
|---------|-------------|-------------------|
| **Method** | POST | PATCH |
| **Scope** | Individual pieces | Entire delivery note |
| **Input** | List of piece_ids | Simple user + hub |
| **Validation** | Piece-level | Order-level |
| **Performance** | Per-piece updates | Mass updates |
| **Use Case** | QR scanning | Manual confirmation |
