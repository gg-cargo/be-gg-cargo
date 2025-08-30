# Driver Assignment Order History

## Overview
Menambahkan order history ketika driver ditugaskan untuk pickup atau delivery dengan remarks yang sesuai berdasarkan task_type.

## Perubahan yang Diimplementasikan

### 1. **Update Drivers Service** (`src/drivers/drivers.service.ts`)

#### **Import yang Ditambahkan**:
```typescript
import { OrderHistory } from '../models/order-history.model';
import { getOrderHistoryDateTime } from '../common/utils/date.utils';
```

#### **Constructor Update**:
```typescript
constructor(
    // ... existing models
    @InjectModel(OrderHistory)
    private orderHistoryModel: typeof OrderHistory,
) { }
```

#### **Order History Creation**:
```typescript
// 7. Catat di order histories
const historyStatus = assignDriverDto.task_type === 'pickup'
    ? 'Driver Assigned for Pickup'
    : 'Driver Assigned for Delivery';

// Set remarks berdasarkan task_type
let historyRemark: string;
if (assignDriverDto.task_type === 'pickup') {
    historyRemark = 'Kurir dalam perjalanan';
} else if (assignDriverDto.task_type === 'delivery') {
    historyRemark = 'Kiriman dibawa oleh kurir';
} else {
    historyRemark = `Order ditugaskan kepada ${driver.getDataValue('name')} untuk tugas ${assignDriverDto.task_type}`;
}

// Buat order history dengan format tanggal dan waktu yang benar
const { date, time } = getOrderHistoryDateTime();
await this.orderHistoryModel.create({
    order_id: assignDriverDto.order_id,
    status: historyStatus,
    remark: historyRemark,
    date: date,
    time: time,
    created_by: assignDriverDto.assigned_by_user_id,
    created_at: new Date(),
    provinsi: '', // default empty string untuk field wajib
    kota: ''     // default empty string untuk field wajib
}, { transaction });
```

### 2. **Update Drivers Module** (`src/drivers/drivers.module.ts`)

#### **Import OrderHistory Model**:
```typescript
import { OrderHistory } from '../models/order-history.model';
```

#### **SequelizeModule.forFeature Update**:
```typescript
SequelizeModule.forFeature([
    User,
    OrderPickupDriver,
    OrderDeliverDriver,
    Order,
    LogGps,
    Hub,
    OrderHistory, // ✅ Ditambahkan
]),
```

## Logic Remarks Berdasarkan Task Type

### **Pickup Task** (`task_type = 'pickup'`)
- **Status**: `'Driver Assigned for Pickup'`
- **Remark**: `'Kurir dalam perjalanan'`
- **Deskripsi**: Ketika driver ditugaskan untuk mengambil barang dari pengirim

### **Delivery Task** (`task_type = 'delivery'`)
- **Status**: `'Driver Assigned for Delivery'`
- **Remark**: `'Kiriman dibawa oleh kurir'`
- **Deskripsi**: Ketika driver ditugaskan untuk mengirimkan barang ke penerima

### **Fallback** (untuk task_type lain)
- **Status**: `'Driver Assigned for [task_type]'`
- **Remark**: `'Order ditugaskan kepada [driver_name] untuk tugas [task_type]'`

## Contoh Data Order History

### **Pickup Assignment**:
```json
{
    "id": 123,
    "order_id": 456,
    "status": "Driver Assigned for Pickup",
    "remark": "Kurir dalam perjalanan",
    "date": "2024-01-15",
    "time": "14:30:25",
    "created_by": 789,
    "created_at": "2024-01-15T14:30:25.000Z",
    "provinsi": "",
    "kota": ""
}
```

### **Delivery Assignment**:
```json
{
    "id": 124,
    "order_id": 456,
    "status": "Driver Assigned for Delivery",
    "remark": "Kiriman dibawa oleh kurir",
    "date": "2024-01-15",
    "time": "16:45:30",
    "created_by": 789,
    "created_at": "2024-01-15T16:45:30.000Z",
    "provinsi": "",
    "kota": ""
}
```

## Endpoint yang Terpengaruh

### **Assign Driver Endpoint**
- **URL**: `POST /drivers/assign`
- **Method**: `assignDriverToOrder()`
- **Fitur**: Sekarang akan membuat order history dengan remarks yang sesuai

## Testing

### **Test Case 1: Pickup Assignment**
1. Assign driver untuk pickup
2. Cek database `order_histories` table
3. Pastikan `status` = `'Driver Assigned for Pickup'`
4. Pastikan `remark` = `'Kurir dalam perjalanan'`

### **Test Case 2: Delivery Assignment**
1. Assign driver untuk delivery
2. Cek database `order_histories` table
3. Pastikan `status` = `'Driver Assigned for Delivery'`
4. Pastikan `remark` = `'Kiriman dibawa oleh kurir'`

## Keuntungan

- **Tracking yang Jelas**: User dapat melihat status driver assignment dengan jelas
- **Remarks yang Informatif**: Remarks memberikan informasi yang mudah dipahami
- **Format Konsisten**: Menggunakan format tanggal dan waktu yang konsisten
- **Audit Trail**: Mencatat siapa yang melakukan assignment dan kapan

## Catatan Penting

- Order history dibuat dalam transaction yang sama dengan driver assignment
- Jika assignment gagal, order history juga akan di-rollback
- Format tanggal dan waktu menggunakan utility function yang sudah dibuat
- Field `provinsi` dan `kota` diisi dengan string kosong sebagai default
