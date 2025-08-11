# Endpoint Change My Password

## PATCH /users/me/password

Endpoint ini memungkinkan pengguna yang sudah terotentikasi untuk mengubah kata sandi mereka sendiri. Endpoint ini menggunakan DTO dan service yang terpisah dari endpoint change-password untuk level master.

### Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
    "old_password": "password_lama_123",
    "new_password": "PasswordBaru123!",
    "confirm_new_password": "PasswordBaru123!"
}
```

### Validasi Password Baru
Password baru harus memenuhi kriteria berikut:
- Minimal 8 karakter
- Mengandung minimal 1 huruf kecil (a-z)
- Mengandung minimal 1 huruf besar (A-Z)
- Mengandung minimal 1 angka (0-9)
- Mengandung minimal 1 simbol (@$!%*?&)

### Response Success (200)
```json
{
    "message": "Password berhasil diubah. Silakan login ulang dengan password baru.",
    "success": true
}
```

### Response Error (400 - Bad Request)
```json
{
    "statusCode": 400,
    "message": "Konfirmasi password baru tidak cocok",
    "error": "Bad Request"
}
```

### Response Error (400 - Password Lama Salah)
```json
{
    "statusCode": 400,
    "message": "Password lama tidak valid",
    "error": "Bad Request"
}
```

### Response Error (401 - Unauthorized)
```json
{
    "statusCode": 401,
    "message": "Unauthorized",
    "error": "Unauthorized"
}
```

### Response Error (422 - Validation Error)
```json
{
    "statusCode": 422,
    "message": [
        "Password baru harus mengandung minimal 1 huruf kecil, 1 huruf besar, 1 angka, dan 1 simbol"
    ],
    "error": "Unprocessable Entity"
}
```

### Alur Logika Backend

1. **Otentikasi Pengguna**
   - Endpoint dilindungi dengan JWT Guard
   - User ID diambil dari token JWT

2. **Validasi Input**
   - Validasi `old_password`, `new_password`, dan `confirm_new_password`
   - Pastikan `new_password` dan `confirm_new_password` sama
   - Validasi format password baru sesuai aturan keamanan

3. **Verifikasi Password Lama**
   - Ambil password hash dari database
   - Bandingkan dengan `old_password` menggunakan bcrypt.compare()
   - Jika tidak cocok, return error 400

4. **Update Password**
   - Hash password baru dengan bcrypt (salt rounds: 10)
   - Update kolom password dan updated_at di database
   - TODO: Hapus semua token aktif untuk memaksa login ulang

5. **Response**
   - Return success message dengan instruksi login ulang

### Keamanan
- Endpoint hanya bisa diakses oleh user yang sudah login
- Password lama harus diverifikasi sebelum update
- Password baru di-hash dengan bcrypt
- User harus login ulang setelah password berubah

### Perbedaan dengan /users/change-password

| Aspek | /users/me/password | /users/change-password |
|-------|-------------------|------------------------|
| **DTO** | `ChangeMyPasswordDto` | `ChangePasswordDto` |
| **Service** | `changeMyPassword()` | `changePassword()` |
| **Response** | `ChangeMyPasswordResponseDto` | `ChangePasswordResponseDto` |
| **Permission** | Hanya untuk diri sendiri | Master/Admin level |
| **Target User** | Current user | Bisa user lain |
| **Validation** | Password lama + baru | Password baru saja |

### Struktur File

```
src/users/
├── dto/
│   ├── change-my-password.dto.ts          # DTO untuk request
│   └── change-my-password-response.dto.ts # DTO untuk response
├── users.service.ts                       # Service method changeMyPassword()
├── users.controller.ts                    # Endpoint /me/password
└── CHANGE_MY_PASSWORD_ENDPOINT.md        # Dokumentasi ini
```

### Catatan
- Endpoint ini sepenuhnya terpisah dari endpoint change-password
- Menggunakan DTO dan service yang berbeda
- Tidak ada ketergantungan dengan logika level master
- Fokus hanya pada user mengubah password sendiri
