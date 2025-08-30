# Get Reweight Proof Endpoint

## Overview
Endpoint untuk mendapatkan bukti foto reweight dari order ID tertentu. Endpoint ini mencari file log dengan `used_for = bulk_reweight_proof_order_id_${orderId}`.

## Endpoint Details

**Method:** `GET`  
**URL:** `/orders/:order_id/reweight-proof`  
**Authentication:** Required (JWT Token)

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `order_id` | number | Yes | ID order yang akan diambil bukti foto reweight-nya |

## Headers

```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

## Response Format

### Success Response (200 OK)

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

### Error Responses

#### 404 Not Found
```json
{
  "message": "Order dengan ID 123 tidak ditemukan",
  "statusCode": 404
}
```

#### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

#### 500 Internal Server Error
```json
{
  "message": "Terjadi kesalahan saat mengambil bukti foto reweight",
  "statusCode": 500
}
```

## Usage Examples

### cURL
```bash
curl -X GET \
  "http://localhost:3000/orders/123/reweight-proof" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript/Fetch
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

### Postman
1. Set method ke `GET`
2. URL: `http://localhost:3000/orders/123/reweight-proof`
3. Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

### Python/Requests
```python
import requests

url = "http://localhost:3000/orders/123/reweight-proof"
headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN"
}

response = requests.get(url, headers=headers)
result = response.json()
print(result)
```

## Implementation Details

### Database Query
Endpoint ini melakukan query ke tabel `file_log` dengan kondisi:
```sql
SELECT * FROM file_log 
WHERE used_for = 'bulk_reweight_proof_order_id_${orderId}'
ORDER BY created_at DESC
```

### File Information
Setiap file dalam response berisi:
- `id`: ID unik file log
- `file_name`: Nama asli file
- `file_path`: URL lengkap file (bisa diakses langsung)
- `file_type`: Ekstensi file (jpg, png, dll)
- `file_size`: Ukuran file dalam bytes
- `user_id`: ID user yang mengupload file
- `used_for`: Identifier untuk keperluan file
- `created_at`: Timestamp kapan file diupload

### Order Validation
Sebelum mengambil file, endpoint akan memvalidasi:
1. Order dengan ID tersebut exists di database
2. Jika tidak ditemukan, akan mengembalikan error 404

### Sorting
File diurutkan berdasarkan `created_at` DESC (terbaru dulu) untuk memudahkan akses ke bukti terbaru.

## Notes

- Endpoint ini hanya mengambil file dengan `used_for` yang spesifik untuk reweight proof
- Jika tidak ada file bukti, array `files` akan kosong dan `total_files` akan 0
- File path yang dikembalikan adalah URL lengkap yang bisa diakses langsung
- Endpoint ini memerlukan autentikasi JWT token
- Error handling mencakup validasi order, database errors, dan server errors
