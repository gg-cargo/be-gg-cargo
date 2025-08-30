# Submit & Bypass Reweight Order History

## Overview
Menambahkan order history pada method `submitReweight` dan `bypassReweight` dengan pesan "proses di service center ${hub asal}".

## Perubahan yang Diimplementasikan

### **1. Submit Reweight Method** (`src/orders/orders.service.ts`)

#### **Data Retrieval**:
```typescript
// Ambil data hub asal
const hubAsal = await this.hubModel.findByPk(order.getDataValue('hub_source_id'), {
    attributes: ['id', 'nama'],
    raw: true,
    transaction
});
```

#### **Order History Creation**:
```typescript
// 9. Catat di order histories
const hubAsalName = hubAsal?.nama || 'Unknown Hub';
const remark = submitReweightDto.remark ||
    `Reweight finalized. Total berat: ${chargeableWeight.toFixed(2)} kg, Total volume: ${totalVolume.toFixed(2)} m³`;

const { date, time } = getOrderHistoryDateTime();
await this.orderHistoryModel.create({
    order_id: orderId,
    status: 'Reweight Finalized',
    remark: `proses di service center ${hubAsalName}`,
    date: date,
    time: time,
    created_by: submitReweightDto.submitted_by_user_id,
    created_at: new Date(),
    provinsi: order.getDataValue('provinsi_pengirim') || '',
    kota: order.getDataValue('kota_pengirim') || ''
}, { transaction });
```

### **2. Bypass Reweight Method** (`src/orders/orders.service.ts`)

#### **Data Retrieval**:
```typescript
// Ambil data hub asal
const hubAsal = await this.hubModel.findByPk(order.getDataValue('hub_source_id'), {
    attributes: ['id', 'nama'],
    raw: true,
});
```

#### **Order History Creation**:
```typescript
// 5. Create order_histories
const hubAsalName = hubAsal?.nama || 'Unknown Hub';
const statusText = isBypassEnabled ? 'Reweight Bypass Enabled' : 'Reweight Bypass Disabled';
const historyRemark = `${statusText} oleh User ID ${updated_by_user_id}${reason ? ` dengan alasan: ${reason}` : ''}${proofImageData ? ` - Foto bukti: ${proofImageData.file_name}` : ''}${invoiceData ? ` - Invoice otomatis dibuat: ${invoiceData.invoice_no}` : ''}`;

const { date, time } = getOrderHistoryDateTime();
await this.orderHistoryModel.create(
    {
        order_id: orderId,
        status: statusText,
        remark: `proses di service center ${hubAsalName}`,
        provinsi: order.getDataValue('provinsi_pengirim') || '',
        kota: order.getDataValue('kota_pengirim') || '',
        date: date,
        time: time,
        created_by: updated_by_user_id,
    },
    { transaction }
);
```

## Logic Order History

### **Submit Reweight**:
- **Trigger**: Setelah reweight finalized dan sebelum commit transaction
- **Status**: `'Reweight Finalized'`
- **Remark**: `'proses di service center ${hub asal}'`
- **Data**: Menggunakan data provinsi dan kota dari order

### **Bypass Reweight**:
- **Trigger**: Setelah bypass reweight selesai dan sebelum commit transaction
- **Status**: `'Reweight Bypass Enabled'` atau `'Reweight Bypass Disabled'`
- **Remark**: `'proses di service center ${hub asal}'`
- **Data**: Menggunakan data provinsi dan kota dari order

## Contoh Data Order History

### **Submit Reweight**:
```json
{
    "id": 123,
    "order_id": 456,
    "status": "Reweight Finalized",
    "remark": "proses di service center Hub Jakarta Pusat",
    "date": "2024-01-15",
    "time": "14:30:25",
    "created_by": 789,
    "created_at": "2024-01-15T14:30:25.000Z",
    "provinsi": "DKI Jakarta",
    "kota": "Jakarta Pusat"
}
```

### **Bypass Reweight**:
```json
{
    "id": 124,
    "order_id": 456,
    "status": "Reweight Bypass Enabled",
    "remark": "proses di service center Hub Bandung",
    "date": "2024-01-15",
    "time": "15:45:30",
    "created_by": 790,
    "created_at": "2024-01-15T15:45:30.000Z",
    "provinsi": "Jawa Barat",
    "kota": "Bandung"
}
```

## Endpoint yang Terpengaruh

### **Submit Reweight Endpoint**
- **URL**: `POST /orders/:order_id/submit-reweight`
- **Method**: `submitReweight()`
- **Fitur**: Sekarang akan membuat order history dengan pesan yang sesuai

### **Bypass Reweight Endpoint**
- **URL**: `POST /orders/:order_id/bypass-reweight`
- **Method**: `bypassReweight()`
- **Fitur**: Sekarang akan membuat order history dengan pesan yang sesuai

## Flow Proses

### **Submit Reweight**:
1. **Validasi User** - Validasi user yang melakukan submit
2. **Validasi Order** - Validasi order exists
3. **Get Hub Data** - ✅ **BARU**: Ambil data hub asal
4. **Validasi Pieces** - Validasi semua pieces sudah di-reweight
5. **Calculate Totals** - Hitung total berat dan volume
6. **Update Order** - Update order dengan data reweight final
7. **Update Shipments** - Update order shipments
8. **Auto Create Invoice** - Auto-create invoice
9. **Create Order History** - ✅ **BARU**: Buat order history
10. **Commit Transaction** - Commit transaction

### **Bypass Reweight**:
1. **Validasi Order** - Validasi order exists
2. **Get Hub Data** - ✅ **BARU**: Ambil data hub asal
3. **Validasi Authorization** - Validasi user authorization
4. **Validasi Proof Image** - Validasi foto bukti jika diperlukan
5. **Update Order** - Update order bypass status
6. **Update Pieces** - Update order pieces
7. **Save Proof Image** - Simpan foto bukti jika ada
8. **Auto Create Invoice** - Auto-create invoice jika diperlukan
9. **Create Order History** - ✅ **BARU**: Buat order history
10. **Commit Transaction** - Commit transaction

## Testing

### **Test Case 1: Submit Reweight dengan Hub Asal**
1. Lakukan submit reweight untuk order tertentu
2. Cek database `order_histories` table
3. Pastikan `status` = `'Reweight Finalized'`
4. Pastikan `remark` = `'proses di service center [nama_hub]'`

### **Test Case 2: Bypass Reweight Enabled dengan Hub Asal**
1. Lakukan bypass reweight enabled untuk order tertentu
2. Cek database `order_histories` table
3. Pastikan `status` = `'Reweight Bypass Enabled'`
4. Pastikan `remark` = `'proses di service center [nama_hub]'`

### **Test Case 3: Bypass Reweight Disabled dengan Hub Asal**
1. Lakukan bypass reweight disabled untuk order tertentu
2. Cek database `order_histories` table
3. Pastikan `status` = `'Reweight Bypass Disabled'`
4. Pastikan `remark` = `'proses di service center [nama_hub]'`

### **Test Case 4: Tanpa Hub Asal**
1. Lakukan submit/bypass reweight untuk order tanpa hub asal
2. Cek database `order_histories` table
3. Pastikan `remark` = `'proses di service center Unknown Hub'`

## Keuntungan

- **Tracking yang Jelas**: User dapat melihat bahwa submit/bypass reweight telah selesai
- **Hub Information**: Menampilkan informasi hub asal di mana proses dilakukan
- **Audit Trail**: Mencatat kapan dan oleh siapa submit/bypass reweight dilakukan
- **Format Konsisten**: Menggunakan format tanggal dan waktu yang konsisten
- **Data Lengkap**: Menyimpan data provinsi dan kota dari order

## Catatan Penting

- Order history dibuat dalam transaction untuk konsistensi data
- Hub asal diambil dari `order.hub_source_id`
- Jika hub tidak ditemukan, akan menggunakan 'Unknown Hub'
- Format tanggal dan waktu menggunakan utility function yang sudah dibuat
- Data provinsi dan kota diambil dari order untuk konsistensi
- Order history dibuat sebelum commit transaction untuk memastikan data tersimpan
