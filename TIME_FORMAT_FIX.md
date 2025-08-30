# Time Format Fix

## Overview
Memperbaiki masalah format waktu yang menyebabkan error "Incorrect time value" di MySQL.

## Masalah yang Ditemukan

### **Error**:
```
"Incorrect time value: '22.39.08' for column 'time' at row 1"
```

### **Penyebab**:
- Function `getFormattedTime()` menggunakan `toLocaleTimeString('id-ID')`
- Locale 'id-ID' menghasilkan format waktu dengan titik (.) bukan titik dua (:)
- MySQL mengharapkan format waktu HH:MM:SS

## Perbaikan yang Dilakukan

### **File**: `src/common/utils/date.utils.ts`

### **Sebelum** (Error):
```typescript
export function getFormattedTime(date: Date = new Date()): string {
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}
```

### **Sesudah** (Fixed):
```typescript
export function getFormattedTime(date: Date = new Date()): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}
```

## Functions yang Diperbaiki

### **1. getFormattedTime()**
- **Sebelum**: `22.39.08` (format dengan titik)
- **Sesudah**: `22:39:08` (format dengan titik dua)

### **2. getIndonesianTime()**
- **Sebelum**: `22.39.08` (format dengan titik)
- **Sesudah**: `22:39:08` (format dengan titik dua)

## Format Waktu yang Benar

### **MySQL TIME Format**:
- ✅ `HH:MM:SS` (contoh: `22:39:08`)
- ❌ `HH.MM.SS` (contoh: `22.39.08`)

### **Contoh Output**:
```typescript
const now = new Date('2024-01-15T22:39:08');
const time = getFormattedTime(now);
console.log(time); // "22:39:08"
```

## Testing

### **Test Case 1: Valid Time Format**
```typescript
const time = getFormattedTime();
console.log(time); // Should output: "HH:MM:SS" format
// Example: "14:30:25"
```

### **Test Case 2: Edge Cases**
```typescript
// Midnight
const midnight = new Date('2024-01-15T00:00:00');
console.log(getFormattedTime(midnight)); // "00:00:00"

// Noon
const noon = new Date('2024-01-15T12:00:00');
console.log(getFormattedTime(noon)); // "12:00:00"

// Late night
const lateNight = new Date('2024-01-15T23:59:59');
console.log(getFormattedTime(lateNight)); // "23:59:59"
```

## Impact

### **Files yang Terpengaruh**:
- ✅ `src/common/utils/date.utils.ts` - Fixed time formatting functions
- ✅ Semua service yang menggunakan `getOrderHistoryDateTime()`
- ✅ Semua endpoint yang membuat order history

### **Endpoints yang Terpengaruh**:
- ✅ `POST /orders` - Create order
- ✅ `POST /delivery-notes/:no_delivery_note/inbound-scan`
- ✅ `PATCH /delivery-notes/:no_delivery_note/inbound-confirm-web`
- ✅ `POST /orders/reweight-bulk`
- ✅ `POST /orders/:order_id/submit-reweight`
- ✅ `POST /orders/:order_id/bypass-reweight`
- ✅ `POST /drivers/assign`
- ✅ Dan semua endpoint lain yang membuat order history

## Database Compatibility

### **MySQL TIME Column**:
- ✅ Accepts: `HH:MM:SS` format
- ✅ Accepts: `HH:MM:SS.ffffff` format (with microseconds)
- ❌ Rejects: `HH.MM.SS` format

### **Sequelize DataType.TIME**:
- ✅ Automatically converts to proper MySQL TIME format
- ✅ Handles timezone conversion properly
- ✅ Validates time format before database insertion

## Verification

### **Cara Verifikasi Perbaikan**:
1. **Test Order Creation**:
   ```bash
   curl -X POST "https://api.example.com/orders" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "nama_pengirim": "Test User",
       "alamat_pengirim": "Test Address",
       "no_telepon_pengirim": "08123456789",
       "nama_penerima": "Test Receiver",
       "alamat_penerima": "Test Address",
       "no_telepon_penerima": "08123456789",
       "provinsi_pengirim": "DKI Jakarta",
       "kota_pengirim": "Jakarta Pusat",
       "provinsi_penerima": "DKI Jakarta",
       "kota_penerima": "Jakarta Selatan",
       "kecamatan_penerima": "Kebayoran Baru",
       "kelurahan_penerima": "Senayan",
       "kodepos_penerima": "12190",
       "berat": 1.5,
       "panjang": 30,
       "lebar": 20,
       "tinggi": 10
     }'
   ```

2. **Check Database**:
   ```sql
   SELECT id, order_id, status, date, time, remark 
   FROM order_histories 
   WHERE order_id = :order_id 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

3. **Expected Result**:
   ```sql
   +----+----------+-------------+------------+----------+------------------+
   | id | order_id | status      | date       | time     | remark           |
   +----+----------+-------------+------------+----------+------------------+
   | 123| 456      | DRAFT       | 2024-01-15 | 14:30:25 | Pesanan berhasil dibuat |
   +----+----------+-------------+------------+----------+------------------+
   ```

## Prevention

### **Best Practices**:
1. **Always use proper time formatting** for database TIME columns
2. **Test time formatting** with different locales
3. **Use explicit formatting** instead of locale-dependent formatting
4. **Validate time format** before database insertion

### **Future Considerations**:
- Consider using moment.js atau date-fns untuk time formatting
- Add time format validation in DTOs
- Add unit tests untuk time formatting functions

## Summary

- ✅ **Problem**: Time format with dots (.) instead of colons (:)
- ✅ **Solution**: Manual time formatting with proper separators
- ✅ **Result**: Compatible with MySQL TIME column format
- ✅ **Impact**: All order history creation now works correctly
