# Test Change My Password Endpoint

## Test Case 1: Valid Request
```bash
curl -X PATCH http://localhost:3000/users/me/password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "password_lama_123",
    "new_password": "PasswordBaru123!",
    "confirm_new_password": "PasswordBaru123!"
  }'
```

**Expected Response:**
```json
{
  "message": "Password berhasil diubah. Silakan login ulang dengan password baru.",
  "success": true
}
```

## Test Case 2: Invalid Old Password
```bash
curl -X PATCH http://localhost:3000/users/me/password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "password_salah",
    "new_password": "PasswordBaru123!",
    "confirm_new_password": "PasswordBaru123!"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "Password lama tidak valid",
  "error": "Bad Request"
}
```

## Test Case 3: Password Mismatch
```bash
curl -X PATCH http://localhost:3000/users/me/password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "password_lama_123",
    "new_password": "PasswordBaru123!",
    "confirm_new_password": "PasswordBerbeda123!"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "Konfirmasi password baru tidak cocok",
  "error": "Bad Request"
}
```

## Test Case 4: Weak Password
```bash
curl -X PATCH http://localhost:3000/users/me/password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "password_lama_123",
    "new_password": "weak",
    "confirm_new_password": "weak"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 422,
  "message": [
    "Password baru minimal 8 karakter",
    "Password baru harus mengandung minimal 1 huruf kecil, 1 huruf besar, 1 angka, dan 1 simbol"
  ],
  "error": "Unprocessable Entity"
}
```

## Test Case 5: Missing Authorization
```bash
curl -X PATCH http://localhost:3000/users/me/password \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "password_lama_123",
    "new_password": "PasswordBaru123!",
    "confirm_new_password": "PasswordBaru123!"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Debug Steps

Jika masih ada error, cek:

1. **Database**: Pastikan user memiliki password yang valid
2. **JWT Token**: Pastikan token valid dan tidak expired
3. **User ID**: Pastikan user ID dari token ada di database
4. **Password Field**: Pastikan field password di database tidak null

## Common Issues

1. **"data and hash arguments required"**: 
   - User tidak memiliki password di database
   - Password field null/undefined

2. **"User tidak ditemukan"**: 
   - JWT token invalid
   - User ID tidak ada di database

3. **"Password lama tidak valid"**: 
   - Password lama salah
   - Hash comparison gagal
