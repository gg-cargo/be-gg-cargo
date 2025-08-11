# Tabel Transaction Payment

## Deskripsi
Tabel `transaction_payment` digunakan untuk menyimpan data transaksi pembayaran yang dilakukan oleh user untuk order tertentu.

## Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|-------|-----------|---------|------|---------|------------|
| `id` | INT | 11 | NOT NULL | AUTO_INCREMENT | Primary Key |
| `user_id` | INT | 11 | NOT NULL | - | Foreign Key ke tabel `users.id` |
| `order_id` | INT | 11 | NOT NULL | - | Foreign Key ke tabel `orders.id` |
| `price` | VARCHAR | 250 | NOT NULL | - | Harga yang dibayar |
| `sid` | LONGTEXT | - | NOT NULL | - | Session ID dari payment gateway |
| `link_payment` | LONGTEXT | - | NOT NULL | - | Link pembayaran dari payment gateway |
| `bank_code` | VARCHAR | 100 | NULL | NULL | Kode bank untuk pembayaran |
| `no_va` | VARCHAR | 100 | NULL | NULL | Nomor Virtual Account |
| `expired_at` | VARCHAR | 100 | NULL | NULL | Waktu expired pembayaran |
| `created_at` | DATETIME | - | NOT NULL | CURRENT_TIMESTAMP | Waktu pembuatan record |
| `updated_at` | DATETIME | - | NOT NULL | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Waktu update record |

## Relasi

### Foreign Keys
- `user_id` → `users.id` (CASCADE)
- `order_id` → `orders.id` (CASCADE)

### Relasi Sequelize
- **User**: `@HasMany(() => TransactionPayment, { foreignKey: 'user_id', sourceKey: 'id' })`
- **Order**: `@HasMany(() => TransactionPayment, { foreignKey: 'order_id', sourceKey: 'id' })`
- **TransactionPayment**: 
  - `@BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })`
  - `@BelongsTo(() => Order, { foreignKey: 'order_id', as: 'order' })`

## Indexes
Untuk performa yang lebih baik, tabel ini memiliki beberapa index:
- `user_id` - untuk query berdasarkan user
- `order_id` - untuk query berdasarkan order
- `sid` - untuk query berdasarkan session ID
- `created_at` - untuk query berdasarkan waktu pembuatan

## Contoh Data

```sql
INSERT INTO transaction_payment (
    user_id, 
    order_id, 
    price, 
    sid, 
    link_payment, 
    bank_code, 
    no_va, 
    expired_at
) VALUES (
    1, 
    1001, 
    '50000', 
    'session_123456789', 
    'https://payment.example.com/pay/123', 
    'BCA', 
    '1234567890', 
    '2025-01-01 23:59:59'
);
```

## Use Cases

### 1. **Pembayaran Order**
- User melakukan pembayaran untuk order tertentu
- Sistem menyimpan data transaksi pembayaran
- Payment gateway mengembalikan session ID dan link pembayaran

### 2. **Tracking Pembayaran**
- Melihat status pembayaran berdasarkan session ID
- Melihat riwayat pembayaran user tertentu
- Melihat pembayaran untuk order tertentu

### 3. **Virtual Account**
- Untuk pembayaran bank transfer
- Menyimpan nomor VA dan kode bank
- Tracking expired time pembayaran

### 4. **Link Pembayaran**
- User dapat mengakses link pembayaran langsung
- Redirect ke payment gateway
- Integrasi dengan berbagai metode pembayaran

## Business Rules

1. **Satu Order Bisa Banyak Transaksi**: Order dapat memiliki multiple transaksi pembayaran (partial payment)
2. **Session ID Unik**: Setiap transaksi memiliki session ID yang unik
3. **Expired Time**: Setiap transaksi memiliki waktu expired yang dapat dikonfigurasi
4. **Audit Trail**: Semua transaksi dicatat dengan timestamp lengkap

## Migration

File migration: `migrations/20250725000000-create-transaction-payment-table.js`

### Cara Menjalankan
```bash
# Jalankan migration
npx sequelize-cli db:migrate

# Rollback jika diperlukan
npx sequelize-cli db:migrate:undo
```

## Model

File model: `src/models/transaction-payment.model.ts`

### Import
```typescript
import { TransactionPayment } from '../models/transaction-payment.model';
```

### Penggunaan
```typescript
// Create
const transaction = await TransactionPayment.create({
    user_id: 1,
    order_id: 1001,
    price: '50000',
    sid: 'session_123',
    link_payment: 'https://payment.example.com/pay/123'
});

// Find with relations
const transaction = await TransactionPayment.findOne({
    where: { id: 1 },
    include: [
        { model: User, as: 'user' },
        { model: Order, as: 'order' }
    ]
});
```

## Catatan Penting

1. **Data Type**: Field `price` menggunakan VARCHAR untuk fleksibilitas format harga
2. **Long Text**: Field `sid` dan `link_payment` menggunakan LONGTEXT untuk data yang panjang
3. **Cascade**: Relasi menggunakan CASCADE untuk maintain data integrity
4. **Timestamps**: Otomatis update `updated_at` saat record diubah
5. **Indexes**: Indexes ditambahkan untuk performa query yang optimal
