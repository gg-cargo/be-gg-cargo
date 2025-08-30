# Order Manifest Inbound Migration & Model

## Overview
Membuat migration dan model untuk tabel `order_manifest_inbound` yang digunakan untuk tracking manifest inbound orders.

## Struktur Tabel

### **Table: `order_manifest_inbound`**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `int(11)` | `PRIMARY KEY, AUTO_INCREMENT, NOT NULL` | ID unik record |
| `order_id` | `varchar(100)` | `DEFAULT NULL` | ID order yang dimanifest |
| `svc_id` | `varchar(100)` | `DEFAULT NULL` | ID service center |
| `user_id` | `varchar(100)` | `DEFAULT NULL` | ID user yang melakukan manifest |
| `created_at` | `timestamp` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Timestamp pembuatan record |

## Files yang Dibuat

### **1. Migration File**
**Path**: `migrations/20250130000000-create-order-manifest-inbound-table.js`

```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_manifest_inbound', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER(11)
      },
      order_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null
      },
      svc_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null
      },
      user_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('order_manifest_inbound');
  }
};
```

### **2. Model File**
**Path**: `src/models/order-manifest-inbound.model.ts`

```typescript
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'order_manifest_inbound',
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
})
export class OrderManifestInbound extends Model<OrderManifestInbound> {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    })
    declare id: number;

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null,
    })
    order_id: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null,
    })
    svc_id: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null,
    })
    user_id: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;
}
```

### **3. Model Index Update**
**Path**: `src/models/index.ts`

```typescript
// ... existing exports ...
export * from './order-manifest-inbound.model';
```

## Cara Menjalankan Migration

### **Development Environment**:
```bash
# Jalankan migration
npm run migration:run

# Atau menggunakan sequelize-cli langsung
npx sequelize-cli db:migrate
```

### **Production Environment**:
```bash
# Jalankan migration dengan environment production
NODE_ENV=production npm run migration:run
```

## Cara Rollback Migration

```bash
# Rollback migration terakhir
npx sequelize-cli db:migrate:undo

# Rollback migration spesifik
npx sequelize-cli db:migrate:undo --to 20250130000000-create-order-manifest-inbound-table.js
```

## Cara Menggunakan Model

### **Import Model**:
```typescript
import { OrderManifestInbound } from '../models/order-manifest-inbound.model';
```

### **Inject Model di Service**:
```typescript
constructor(
    @InjectModel(OrderManifestInbound) 
    private readonly orderManifestInboundModel: typeof OrderManifestInbound,
) { }
```

### **Contoh Penggunaan**:
```typescript
// Create record
const manifestRecord = await this.orderManifestInboundModel.create({
    order_id: 'GG250827780438',
    svc_id: 'SVC001',
    user_id: '123',
});

// Find records
const manifests = await this.orderManifestInboundModel.findAll({
    where: { svc_id: 'SVC001' },
    order: [['created_at', 'DESC']],
});

// Find by order_id
const orderManifest = await this.orderManifestInboundModel.findOne({
    where: { order_id: 'GG250827780438' },
});
```

## Database Schema

### **SQL CREATE TABLE**:
```sql
CREATE TABLE `order_manifest_inbound` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) DEFAULT NULL,
  `svc_id` varchar(100) DEFAULT NULL,
  `user_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Validasi dan Constraints

### **Field Validations**:
- `id`: Auto increment, primary key
- `order_id`: String max 100 karakter, nullable
- `svc_id`: String max 100 karakter, nullable
- `user_id`: String max 100 karakter, nullable
- `created_at`: Timestamp, auto-set saat create

### **Business Logic Considerations**:
- Semua field utama (order_id, svc_id, user_id) nullable untuk fleksibilitas
- `created_at` otomatis terisi saat record dibuat
- Tidak ada `updated_at` karena ini adalah log/audit trail

## Testing

### **Test Case 1: Create Record**
```typescript
const manifest = await this.orderManifestInboundModel.create({
    order_id: 'GG250827780438',
    svc_id: 'SVC001',
    user_id: '123',
});

expect(manifest.id).toBeDefined();
expect(manifest.created_at).toBeDefined();
```

### **Test Case 2: Find by Order ID**
```typescript
const manifest = await this.orderManifestInboundModel.findOne({
    where: { order_id: 'GG250827780438' },
});

expect(manifest).toBeDefined();
expect(manifest.svc_id).toBe('SVC001');
```

### **Test Case 3: Find by SVC ID**
```typescript
const manifests = await this.orderManifestInboundModel.findAll({
    where: { svc_id: 'SVC001' },
});

expect(manifests.length).toBeGreaterThan(0);
```

## Keuntungan

- **Audit Trail**: Mencatat setiap manifest inbound yang dilakukan
- **Tracking**: Dapat melacak order mana yang sudah dimanifest
- **User Accountability**: Mengetahui user yang melakukan manifest
- **Service Center Tracking**: Melacak manifest per service center
- **Flexible Schema**: Semua field utama nullable untuk fleksibilitas
- **Auto Timestamp**: `created_at` otomatis terisi

## Catatan Penting

- Migration menggunakan timestamp `20250130000000` untuk urutan yang tepat
- Model menggunakan `timestamps: false` karena hanya ada `created_at`
- Field `created_at` menggunakan `defaultValue: DataType.NOW`
- Semua field utama nullable untuk mendukung berbagai skenario bisnis
- Model sudah diexport di `src/models/index.ts` untuk kemudahan import

## Next Steps

Setelah migration dan model dibuat, Anda dapat:

1. **Jalankan Migration**: `npm run migration:run`
2. **Test Model**: Pastikan model berfungsi dengan benar
3. **Integrate dengan Service**: Gunakan model di service yang sesuai
4. **Add Relationships**: Tambahkan relationships dengan model lain jika diperlukan
5. **Add Indexes**: Tambahkan indexes untuk optimasi query jika diperlukan
