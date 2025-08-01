# Contoh Penggunaan User Management API

## 1. Create User - Basic

```bash
curl -X POST "http://localhost:3000/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nama Pengguna Baru",
    "email": "baru@example.com",
    "phone": "6281234567890",
    "password": "PasswordAman123!",
    "level_id": 3,
    "hub_id": 10,
    "service_center_id": 15,
    "aktif": 1
  }'
```

## 2. Create User - With Additional Fields

```bash
curl -X POST "http://localhost:3000/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Driver Baru",
    "email": "driver@example.com",
    "phone": "6281234567891",
    "password": "DriverPass123!",
    "level_id": 4,
    "hub_id": 10,
    "nik": "1234567890123456",
    "sim": "B1234567",
    "stnk": "AB1234CD",
    "no_polisi": "B1234ABC",
    "address": "Jl. Driver No. 123",
    "aktif": 1
  }'
```

## 3. Get User Detail

```bash
curl -X GET "http://localhost:3000/users/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 4. Update User - Basic

```bash
curl -X PATCH "http://localhost:3000/users/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nama Pengguna Diperbarui",
    "email": "updated@example.com",
    "phone": "6281211223344",
    "level_id": 4,
    "aktif": 0
  }'
```

## 5. Update User - Partial Update

```bash
curl -X PATCH "http://localhost:3000/users/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nama Baru Saja",
    "aktif": 1
  }'
```

## 6. List Users - Basic

```bash
curl -X GET "http://localhost:3000/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 2. List Users - Dengan Pagination

```bash
curl -X GET "http://localhost:3000/users?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 3. List Users - Dengan Search

```bash
curl -X GET "http://localhost:3000/users?search=nurokhmah" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 4. List Users - Dengan Filter Level

```bash
curl -X GET "http://localhost:3000/users?level=Customer" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 5. List Users - Dengan Filter Status

```bash
curl -X GET "http://localhost:3000/users?status=Aktif" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 6. List Users - Dengan Sorting

```bash
curl -X GET "http://localhost:3000/users?sort_by=name&order=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 10. List Users - Kombinasi Semua Parameter

```bash
curl -X GET "http://localhost:3000/users?page=1&limit=10&search=nurokhmah&sort_by=name&order=asc&level=Checker&status=Aktif" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response yang Diharapkan

### Get User Detail Response:
```json
{
  "id": 123,
  "code": "USR123456789",
  "name": "Nama Pengguna",
  "email": "user@example.com",
  "phone": "6281234567890",
  "email_verified_at": "2024-01-15T10:30:00.000Z",
  "phone_verify_at": "2024-01-15T10:30:00.000Z",
  "level": {
    "id": 3,
    "nama": "Customer"
  },
  "hub": {
    "id": 10,
    "nama": "JAKARTA PUSAT"
  },
  "service_center": {
    "id": 15,
    "nama": "MITRA NON FT"
  },
  "aktif": 1,
  "status": "Verified",
  "nik": "1234567890123456",
  "sim": "B1234567",
  "stnk": "AB1234CD",
  "kir": "KIR123456",
  "expired_sim": "2025-01-15",
  "expired_stnk": "2025-01-15",
  "expired_kir": "2025-01-15",
  "no_polisi": "B1234ABC",
  "address": "Jl. Contoh No. 123",
  "location": "Jakarta",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "customer": 1,
  "payment_terms": 30,
  "discount_rate": 0,
  "type_transporter": "1",
  "type_expeditor": 0,
  "stakeholder_id": null,
  "aktif_disabled_super": 0,
  "status_app": 1,
  "isSales": 0,
  "isApprove": 1,
  "isHandover": 0,
  "show_price": 1
}
```

### Update User Response:
```json
{
  "id": 123,
  "name": "Nama Pengguna Diperbarui",
  "email": "updated@example.com",
  "phone": "6281211223344",
  "level": "Checker",
  "status": "Non Aktif",
  "message": "Pengguna berhasil diperbarui"
}
```

### Create User Response:
```json
{
  "id": 123,
  "name": "Nama Pengguna Baru",
  "email": "baru@example.com",
  "phone": "6281234567890",
  "level": "Customer",
  "status": "Aktif",
  "message": "Pengguna berhasil dibuat"
}
```

## Response yang Diharapkan

```json
{
  "pagination": {
    "total_items": 2693,
    "total_pages": 270,
    "current_page": 1,
    "items_per_page": 10
  },
  "users": [
    {
      "id": 1,
      "service_center": "MITRA NON FT",
      "code": null,
      "name": "dimas",
      "email": "sp.mitra@xapakango.at",
      "phone": "100000000000001",
      "level": "Customer",
      "status": "Verified",
      "saldo": 0
    },
    {
      "id": 2,
      "service_center": "JAKARTA PUSAT",
      "code": "USR001",
      "name": "nurokhmah",
      "email": "nurokhmah@example.com",
      "phone": "081234567890",
      "level": "Checker",
      "status": "Aktif",
      "saldo": 150000
    }
  ]
}
```

## Error Response

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "limit must not be greater than 100",
    "page must be a positive number",
    "Email sudah terdaftar",
    "Nomor telepon sudah terdaftar"
  ]
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Pengguna tidak ditemukan"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email sudah terdaftar"
}
``` 