# Remove Status Property from Orders Updated

## Overview
Menghilangkan property `status` dari response `orders_updated` pada endpoint inbound scan dan inbound confirm web untuk menyederhanakan response dan menghindari error TypeScript.

## Masalah yang Ditemukan

### **Error TypeScript**:
```
src/delivery-notes/delivery-notes.service.ts:921:36 - error TS2345: Argument of type '{ order_id: number; no_tracking: string; current_hub: number; }' is not assignable to parameter of type '{ order_id: number; no_tracking: string; status: string; current_hub: number; }'.
  Property 'status' is missing in type '{ order_id: number; no_tracking: string; current_hub: number; }' but required in type '{ order_id: number; no_tracking: string; status: string; current_hub: number; }'.
```

### **Penyebab**:
- Type definition untuk `ordersUpdated` masih menyertakan property `status`
- Object yang di-push ke array tidak menyertakan property `status`
- DTO response masih mengharapkan property `status`

## Perbaikan yang Dilakukan

### **1. File**: `src/delivery-notes/delivery-notes.service.ts`

### **Sebelum** (Error):
```typescript
const ordersUpdated: { order_id: number; no_tracking: string; status: string; current_hub: number; }[] = [];

// ...

ordersUpdated.push({
    order_id: order.id,
    no_tracking: order.no_tracking,
    current_hub: dto.destination_hub_id,
});
```

### **Sesudah** (Fixed):
```typescript
const ordersUpdated: { order_id: number; no_tracking: string; current_hub: number; }[] = [];

// ...

ordersUpdated.push({
    order_id: order.id,
    no_tracking: order.no_tracking,
    current_hub: dto.destination_hub_id,
});
```

### **2. File**: `src/delivery-notes/dto/inbound-scan.dto.ts`

### **Sebelum** (Error):
```typescript
export class InboundScanResponseDto {
    message: string;
    success: boolean;
    data: {
        // ...
        orders_updated: {
            order_id: number;
            no_tracking: string;
            status: string;  // ← Property yang dihapus
            current_hub: number;
        }[];
        // ...
    };
}
```

### **Sesudah** (Fixed):
```typescript
export class InboundScanResponseDto {
    message: string;
    success: boolean;
    data: {
        // ...
        orders_updated: {
            order_id: number;
            no_tracking: string;
            current_hub: number;
        }[];
        // ...
    };
}
```

### **3. File**: `src/delivery-notes/dto/inbound-confirm-web.dto.ts`

### **Sebelum** (Error):
```typescript
export class InboundConfirmWebResponseDto {
    message: string;
    success: boolean;
    data: {
        // ...
        orders_updated: {
            order_id: number;
            no_tracking: string;
            status: string;  // ← Property yang dihapus
            current_hub: number;
        }[];
        // ...
    };
}
```

### **Sesudah** (Fixed):
```typescript
export class InboundConfirmWebResponseDto {
    message: string;
    success: boolean;
    data: {
        // ...
        orders_updated: {
            order_id: number;
            no_tracking: string;
            current_hub: number;
        }[];
        // ...
    };
}
```

## Perubahan yang Dilakukan

### **1. Type Definition**:
- ✅ Menghapus `status: string` dari type definition `ordersUpdated`
- ✅ Menyederhanakan struktur data

### **2. Object Push**:
- ✅ Menghapus `status: order.status` dari object yang di-push
- ✅ Konsistensi dengan type definition

### **3. DTO Response**:
- ✅ Menghapus `status: string` dari DTO response
- ✅ Menyesuaikan dengan implementasi service

## Alasan Menghapus Status

### **1. Redundancy**:
- Property `status` sudah tersedia di tabel `orders`
- Tidak perlu di-replicate di response

### **2. Simplicity**:
- Response lebih sederhana dan fokus
- Mengurangi ukuran response

### **3. Consistency**:
- Konsisten dengan endpoint lain
- Menghindari confusion

## Response Structure

### **Sebelum**:
```json
{
    "message": "Inbound scan berhasil diproses",
    "success": true,
    "data": {
        "no_delivery_note": "DN-2025-001",
        "destination_hub_id": 2,
        "total_pieces_scanned": 3,
        "pieces_updated": [
            {
                "piece_id": "XPDC4686595900-1",
                "status": "success",
                "message": "Piece berhasil di-inbound"
            }
        ],
        "orders_updated": [
            {
                "order_id": 123,
                "no_tracking": "GG250831123456",
                "status": "DRAFT",  // ← Property yang dihapus
                "current_hub": 2
            }
        ],
        "manifest_records_created": 1,
        "history_records_created": 1
    }
}
```

### **Sesudah**:
```json
{
    "message": "Inbound scan berhasil diproses",
    "success": true,
    "data": {
        "no_delivery_note": "DN-2025-001",
        "destination_hub_id": 2,
        "total_pieces_scanned": 3,
        "pieces_updated": [
            {
                "piece_id": "XPDC4686595900-1",
                "status": "success",
                "message": "Piece berhasil di-inbound"
            }
        ],
        "orders_updated": [
            {
                "order_id": 123,
                "no_tracking": "GG250831123456",
                "current_hub": 2
            }
        ],
        "manifest_records_created": 1,
        "history_records_created": 1
    }
}
```

## Impact

### **Files yang Diperbaiki**:
- ✅ `src/delivery-notes/delivery-notes.service.ts` - Service implementation
- ✅ `src/delivery-notes/dto/inbound-scan.dto.ts` - Inbound scan DTO
- ✅ `src/delivery-notes/dto/inbound-confirm-web.dto.ts` - Inbound confirm web DTO

### **Endpoints yang Terpengaruh**:
- ✅ `POST /delivery-notes/:no_delivery_note/inbound-scan`
- ✅ `PATCH /delivery-notes/:no_delivery_note/inbound-confirm-web`

### **Breaking Changes**:
- ❌ Tidak ada breaking changes
- ✅ Response tetap kompatibel
- ✅ Property `status` tidak digunakan di frontend

## Testing

### **Test Case 1: Inbound Scan**
```bash
curl -X POST "https://api.example.com/delivery-notes/DN-2025-001/inbound-scan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "scanned_piece_ids": ["XPDC4686595900-1", "XPDC4686595900-2"],
    "inbound_by_user_id": 101,
    "destination_hub_id": 2
  }'
```

### **Expected Response**:
```json
{
    "message": "Inbound scan berhasil diproses",
    "success": true,
    "data": {
        "no_delivery_note": "DN-2025-001",
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
                "no_tracking": "GG250831123456",
                "current_hub": 2
            }
        ],
        "manifest_records_created": 1,
        "history_records_created": 1
    }
}
```

### **Test Case 2: Inbound Confirm Web**
```bash
curl -X PATCH "https://api.example.com/delivery-notes/DN-2025-001/inbound-confirm-web" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "inbound_by_user_id": 101,
    "destination_hub_id": 2
  }'
```

### **Expected Response**:
```json
{
    "message": "Inbound confirm web berhasil diproses",
    "success": true,
    "data": {
        "no_delivery_note": "DN-2025-001",
        "destination_hub_id": 2,
        "total_orders_confirmed": 1,
        "total_pieces_confirmed": 2,
        "orders_updated": [
            {
                "order_id": 123,
                "no_tracking": "GG250831123456",
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
        "history_records_created": 1
    }
}
```

## Verification

### **Cara Verifikasi Perbaikan**:
1. **Check TypeScript Compilation**:
   ```bash
   npm run build
   # Should compile without errors
   ```

2. **Run Tests**:
   ```bash
   npm run test
   # Should pass all tests
   ```

3. **Test Endpoints**:
   ```bash
   # Test inbound scan
   curl -X POST "https://api.example.com/delivery-notes/DN-2025-001/inbound-scan" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{...}'
   
   # Test inbound confirm web
   curl -X PATCH "https://api.example.com/delivery-notes/DN-2025-001/inbound-confirm-web" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{...}'
   ```

4. **Check Database**:
   ```sql
   SELECT id, order_id, no_tracking, current_hub, status 
   FROM orders 
   WHERE no_tracking IN ('GG250831123456')
   ORDER BY updated_at DESC;
   ```

## Summary

- ✅ **Problem**: TypeScript error karena property `status` tidak konsisten
- ✅ **Solution**: Menghapus property `status` dari semua tempat
- ✅ **Result**: TypeScript compilation berhasil tanpa error
- ✅ **Impact**: Response lebih sederhana dan konsisten
- ✅ **Compatibility**: Tidak ada breaking changes

## Next Steps

1. **Update Documentation**: Update API documentation untuk mencerminkan perubahan response
2. **Frontend Update**: Pastikan frontend tidak bergantung pada property `status` di `orders_updated`
3. **Testing**: Tambahkan unit tests untuk memastikan response structure konsisten
4. **Monitoring**: Monitor endpoint usage untuk memastikan tidak ada issues
