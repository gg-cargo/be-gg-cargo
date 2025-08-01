# Finance Service API

## Invoice Number Generation

### Format Invoice Number

Invoice number sekarang menggunakan format berdasarkan `order.no_tracking`:

#### Single Order Invoice
- **Format**: `{no_tracking}`
- **Contoh**: `RES123456789`

#### Multiple Orders Invoice
- **Format**: `{no_tracking}-{sequence}`
- **Contoh**: `RES123456789-001`, `RES123456789-002`

### Business Logic

1. **Single Order**: Invoice number langsung menggunakan no_tracking order
2. **Multiple Orders**: Invoice number menggunakan no_tracking order pertama + sequence number
3. **Sequence**: Otomatis increment jika sudah ada invoice dengan no_tracking yang sama

### Contoh Penggunaan

```javascript
// Single order
const singleOrderInvoice = "RES123456789";

// Multiple orders (batch invoice)
const batchInvoice1 = "RES123456789-001";
const batchInvoice2 = "RES123456789-002";
```

### Keuntungan

- **Traceability**: Mudah melacak invoice berdasarkan resi
- **Consistency**: Format yang konsisten dan mudah dipahami
- **Uniqueness**: Memastikan invoice number tetap unik
- **Business Friendly**: Sesuai dengan kebutuhan bisnis logistik 