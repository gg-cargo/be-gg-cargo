# Delivery Note Order History

## Overview
Menambahkan order history pada method `createDeliveryNote` dengan pesan "berangkat ke svc ${hub tujuan}".

## Perubahan yang Diimplementasikan

### **Update Delivery Notes Service** (`src/delivery-notes/delivery-notes.service.ts`)

#### **Import Tambahan**:
```typescript
import { OrderHistory } from '../models/order-history.model';
import { getOrderHistoryDateTime } from '../common/utils/date.utils';
```

#### **Constructor Injection**:
```typescript
constructor(
    @InjectModel(Order) private readonly orderModel: typeof Order,
    @InjectModel(OrderPiece) private readonly orderPieceModel: typeof OrderPiece,
    @InjectModel(OrderDeliveryNote) private readonly orderDeliveryNoteModel: typeof OrderDeliveryNote,
    @InjectModel(Hub) private readonly hubModel: typeof Hub,
    @InjectModel(TruckList) private readonly truckListModel: typeof TruckList,
    @InjectModel(JobAssign) private readonly jobAssignModel: typeof JobAssign,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(OrderHistory) private readonly orderHistoryModel: typeof OrderHistory,
) { }
```

#### **Order History Creation**:
```typescript
// Insert order_histories untuk setiap order
const { date, time } = getOrderHistoryDateTime();
for (const order of orders) {
    await this.orderHistoryModel.create({
        order_id: order.id,
        status: 'Delivery Note Created',
        remark: `berangkat ke svc ${hubTujuan.getDataValue('nama')}`,
        date: date,
        time: time,
        created_by: createdByUserId,
        created_at: new Date(),
        provinsi: '', // akan diisi dari order jika diperlukan
        kota: ''     // akan diisi dari order jika diperlukan
    });
}
```

### **Update Delivery Notes Module** (`src/delivery-notes/delivery-notes.module.ts`)

#### **Import Tambahan**:
```typescript
import { OrderHistory } from '../models/order-history.model';
```

#### **Module Configuration**:
```typescript
@Module({
    imports: [SequelizeModule.forFeature([Order, OrderPiece, OrderDeliveryNote, Hub, TruckList, JobAssign, User, OrderHistory])],
    controllers: [DeliveryNotesController],
    providers: [DeliveryNotesService],
    exports: [DeliveryNotesService],
})
export class DeliveryNotesModule { }
```

## Logic Order History

### **Trigger**: 
- Setelah delivery note berhasil dibuat
- Setelah semua orders diupdate
- Setelah job_assigns dibuat
- Setelah truck status diupdate
- Sebelum return response

### **Status**: 
- `'Delivery Note Created'`

### **Remark**: 
- `'berangkat ke svc ${hub tujuan}'`
- Contoh: `'berangkat ke svc Hub Jakarta Pusat'`

### **Data yang Disimpan**:
- `order_id`: ID order yang terkait dengan delivery note
- `status`: Status delivery note creation
- `remark`: Pesan dengan nama hub tujuan
- `date`: Tanggal dalam format YYYY-MM-DD
- `time`: Waktu dalam format HH:MM:SS
- `created_by`: User ID yang membuat delivery note
- `created_at`: Timestamp creation
- `provinsi`: String kosong (default)
- `kota`: String kosong (default)

## Contoh Data Order History

```json
{
    "id": 123,
    "order_id": 456,
    "status": "Delivery Note Created",
    "remark": "berangkat ke svc Hub Jakarta Pusat",
    "date": "2024-01-15",
    "time": "14:30:25",
    "created_by": 789,
    "created_at": "2024-01-15T14:30:25.000Z",
    "provinsi": "",
    "kota": ""
}
```

## Endpoint yang Terpengaruh

### **Create Delivery Note Endpoint**
- **URL**: `POST /delivery-notes`
- **Method**: `createDeliveryNote()`
- **Fitur**: Sekarang akan membuat order history untuk setiap order dengan pesan yang sesuai

## Flow Proses

1. **Validasi Input** - Validasi resi_list, hubs, kendaraan, transporter
2. **Validasi Orders** - Validasi orders berdasarkan resi_list
3. **Generate Delivery Note** - Generate nomor delivery note
4. **Create Delivery Note** - Buat record delivery note
5. **Update Orders** - Update status orders
6. **Update Pieces** - Update delivery_note_id di pieces
7. **Create Job Assigns** - Buat job_assigns
8. **Update Truck Status** - Update status truck menjadi digunakan
9. **Create Order History** - ✅ **BARU**: Buat order history untuk setiap order
10. **Return Response** - Return hasil proses

## Order History Creation Logic

### **Loop untuk Setiap Order**:
```typescript
// Insert order_histories untuk setiap order
const { date, time } = getOrderHistoryDateTime();
for (const order of orders) {
    await this.orderHistoryModel.create({
        order_id: order.id,
        status: 'Delivery Note Created',
        remark: `berangkat ke svc ${hubTujuan.getDataValue('nama')}`,
        date: date,
        time: time,
        created_by: createdByUserId,
        created_at: new Date(),
        provinsi: '', // akan diisi dari order jika diperlukan
        kota: ''     // akan diisi dari order jika diperlukan
    });
}
```

### **Data yang Digunakan**:
- `hubTujuan.getDataValue('nama')`: Nama hub tujuan dari delivery note
- `createdByUserId`: User ID yang membuat delivery note
- `order.id`: ID setiap order yang terkait dengan delivery note
- `getOrderHistoryDateTime()`: Utility function untuk format tanggal dan waktu

## Testing

### **Test Case 1: Create Delivery Note dengan Multiple Orders**
1. Buat delivery note dengan beberapa resi
2. Cek database `order_histories` table
3. Pastikan setiap order memiliki record dengan:
   - `status` = `'Delivery Note Created'`
   - `remark` = `'berangkat ke svc [nama_hub_tujuan]'`

### **Test Case 2: Create Delivery Note dengan Single Order**
1. Buat delivery note dengan satu resi
2. Cek database `order_histories` table
3. Pastikan order memiliki record dengan:
   - `status` = `'Delivery Note Created'`
   - `remark` = `'berangkat ke svc [nama_hub_tujuan]'`

### **Test Case 3: Hub Tujuan dengan Nama Khusus**
1. Buat delivery note dengan hub tujuan yang memiliki nama khusus
2. Cek database `order_histories` table
3. Pastikan `remark` = `'berangkat ke svc [nama_hub_tujuan]'`

## Keuntungan

- **Tracking yang Jelas**: User dapat melihat bahwa delivery note telah dibuat
- **Hub Information**: Menampilkan informasi hub tujuan yang dituju
- **Audit Trail**: Mencatat kapan dan oleh siapa delivery note dibuat
- **Format Konsisten**: Menggunakan format tanggal dan waktu yang konsisten
- **Multiple Orders**: Setiap order dalam delivery note mendapatkan history sendiri
- **Status Tracking**: Menunjukkan bahwa order sedang dalam perjalanan ke hub tujuan

## Catatan Penting

- Order history dibuat untuk setiap order dalam delivery note
- Hub tujuan diambil dari `hubTujuan.getDataValue('nama')`
- Format tanggal dan waktu menggunakan utility function yang sudah dibuat
- Order history dibuat setelah semua proses selesai dan sebelum return response
- Field `provinsi` dan `kota` diisi dengan string kosong sebagai default
- Status menunjukkan bahwa delivery note telah dibuat dan order sedang dalam perjalanan

## Contoh Penggunaan

### **Input**:
```json
{
    "resi_list": ["GG250827780438", "GG250827780439"],
    "hub_asal_id": 1,
    "hub_tujuan_id": 2,
    "no_polisi": "B1234ABC",
    "transporter_id": 123,
    "jenis_kendaraan": "Truck"
}
```

### **Output Order History**:
```json
[
    {
        "order_id": 456,
        "status": "Delivery Note Created",
        "remark": "berangkat ke svc Hub Jakarta Pusat",
        "date": "2024-01-15",
        "time": "14:30:25"
    },
    {
        "order_id": 457,
        "status": "Delivery Note Created",
        "remark": "berangkat ke svc Hub Jakarta Pusat",
        "date": "2024-01-15",
        "time": "14:30:25"
    }
]
```
