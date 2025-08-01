# User Management API

## Endpoints

### 1. List Users
**GET** `/users`

Menampilkan daftar semua pengguna beserta detailnya dengan fitur pagination, filtering, dan sorting.

### 2. Create User
**POST** `/users`

Membuat pengguna baru dalam sistem.

### 3. Get User Detail
**GET** `/users/:id`

Mengambil detail lengkap pengguna berdasarkan ID.

### 4. Update User
**PATCH** `/users/:id`

Memperbarui informasi pengguna berdasarkan ID.

#### Request Body (Create User)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Nama lengkap pengguna (min 2 karakter) |
| `email` | string | Yes | Email pengguna (format valid) |
| `phone` | string | Yes | Nomor telepon (format: 62xxxxxxxxxx) |
| `password` | string | Yes | Password (min 8 karakter, harus mengandung huruf besar, kecil, angka, dan karakter khusus) |
| `level_id` | number | Yes | ID level pengguna |
| `hub_id` | number | No | ID Hub (opsional) |
| `service_center_id` | number | No | ID Service Center (opsional) |
| `aktif` | number | No | Status aktif (1: aktif, 0: non-aktif, default: 1) |
| `nik` | string | No | Nomor NIK |
| `sim` | string | No | Nomor SIM |
| `stnk` | string | No | Nomor STNK |
| `kir` | string | No | Nomor KIR |
| `expired_sim` | string | No | Tanggal expired SIM |
| `expired_stnk` | string | No | Tanggal expired STNK |
| `expired_kir` | string | No | Tanggal expired KIR |
| `no_polisi` | string | No | Nomor polisi kendaraan |
| `address` | string | No | Alamat pengguna |
| `location` | string | No | Lokasi pengguna |

#### Request Body (Update User)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Nama lengkap pengguna (min 2 karakter) |
| `email` | string | No | Email pengguna (format valid) |
| `phone` | string | No | Nomor telepon |
| `level_id` | number | No | ID level pengguna |
| `hub_id` | number | No | ID Hub |
| `service_center_id` | number | No | ID Service Center |
| `aktif` | number | No | Status aktif (1: aktif, 0: non-aktif) |
| `nik` | string | No | Nomor NIK |
| `sim` | string | No | Nomor SIM |
| `stnk` | string | No | Nomor STNK |
| `kir` | string | No | Nomor KIR |
| `expired_sim` | string | No | Tanggal expired SIM |
| `expired_stnk` | string | No | Tanggal expired STNK |
| `expired_kir` | string | No | Tanggal expired KIR |
| `no_polisi` | string | No | Nomor polisi kendaraan |
| `address` | string | No | Alamat pengguna |
| `location` | string | No | Lokasi pengguna |
| `customer` | number | No | Customer flag |
| `payment_terms` | number | No | Payment terms |
| `discount_rate` | number | No | Discount rate |
| `type_transporter` | string | No | Type transporter |
| `type_expeditor` | number | No | Type expeditor |
| `stakeholder_id` | number | No | Stakeholder ID |
| `aktif_disabled_super` | number | No | Aktif disabled super |
| `status_app` | number | No | Status app |
| `isSales` | number | No | Is sales |
| `isApprove` | number | No | Is approve |
| `isHandover` | number | No | Is handover |
| `show_price` | number | No | Show price |

#### Path Parameters (Get User Detail & Update User)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | ID pengguna yang akan diambil detailnya/diperbarui |

#### Query Parameters (List Users)

#### Contoh Request

**Create User:**
```bash
POST /users
Content-Type: application/json

{
    "name": "Nama Pengguna Baru",
    "email": "baru@example.com",
    "phone": "6281234567890",
    "password": "PasswordAman123!",
    "level_id": 3,
    "hub_id": 10,
    "service_center_id": 15,
    "aktif": 1,
    "nik": "1234567890123456",
    "address": "Jl. Contoh No. 123"
}
```

**Update User:**
```bash
PATCH /users/123
Content-Type: application/json

{
    "name": "Nama Pengguna Diperbarui",
    "email": "updated@example.com",
    "phone": "6281211223344",
    "level_id": 4,
    "aktif": 0
}
```

**Get User Detail:**
```bash
GET /users/123
```

**List Users:**
```bash
GET /users?page=1&limit=10&search=nurokhmah&sort_by=name&order=asc&level=Checker&status=Aktif
```

#### Response Format

**Get User Detail Response:**
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

**Update User Response:**
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

**Create User Response:**
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

**List Users Response:**
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
    }
  ]
}
```

#### Status Codes

- `201` - Created (Create User)
- `200` - Success (List Users, Get User Detail, Update User)
- `401` - Unauthorized (JWT token required)
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (user not found)
- `409` - Conflict (email/phone already exists)

#### Authentication

Endpoint ini memerlukan JWT token yang valid. Tambahkan header:
```
Authorization: Bearer <your-jwt-token>
```

## Database Relations

Endpoint ini menggunakan relasi dari tabel berikut:
- `users` - Tabel utama pengguna
- `levels` - Informasi level pengguna
- `service_centers` - Informasi service center
- `hubs` - Informasi hub

## Features

- **Pagination**: Mendukung pagination dengan parameter `page` dan `limit`
- **Search**: Pencarian berdasarkan name, email, phone, dan code
- **Filtering**: Filter berdasarkan level dan status pengguna
- **Sorting**: Pengurutan berdasarkan berbagai kolom
- **Join Relations**: Mengambil data dari tabel terkait (service center, hub, level) 