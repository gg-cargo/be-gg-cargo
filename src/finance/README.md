# Finance API Documentation

## Endpoints

### 1. Get Finance Summary
**GET** `/finance/summary`

Get financial summary with various statistics.

### 2. Get Finance Shipments
**GET** `/finance/shipments`

Get list of shipments with financial data and filtering options.

#### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | number | ❌ | Page number for pagination | `1` |
| `limit` | number | ❌ | Items per page | `20` |
| `search` | string | ❌ | Search by tracking number, sender, or receiver | `"GGK-2024"` |
| `billing_status` | string | ❌ | Filter by billing status | `"unpaid"`, `"paid"`, `"partial_paid"` |
| `layanan` | string | ❌ | Filter by service type | `"Express"`, `"Regular"`, `"Economy"` |
| `start_date` | string | ❌ | Start date filter (YYYY-MM-DD) | `"2024-01-01"` |
| `end_date` | string | ❌ | End date filter (YYYY-MM-DD) | `"2024-12-31"` |
| `invoice_date_start` | string | ❌ | Invoice start date filter | `"2024-01-01"` |
| `invoice_date_end` | string | ❌ | Invoice end date filter | `"2024-12-31"` |
| `created_by_user_id` | number | ❌ | Filter by user who created | `1` |
| `sort_by` | string | ❌ | Sort field | `"created_at"`, `"layanan"`, `"total_harga"` |
| `order` | string | ❌ | Sort order | `"asc"`, `"desc"` |

#### Response
```json
{
  "message": "Daftar shipments berhasil diambil",
  "success": true,
  "data": {
    "pagination": {
      "total_items": 150,
      "total_pages": 8,
      "current_page": 1,
      "items_per_page": 20
    },
    "shipments": [
      {
        "no": 1,
        "order_id": 123,
        "resi": "GGK-2024-001234",
        "tgl_pengiriman": "2024-01-15T10:30:00.000Z",
        "pengirim": "PT ABC",
        "penerima": "PT XYZ",
        "layanan": "Express",
        "qty": 2,
        "berat_aktual_kg": 15.5,
        "berat_volume_kg": 12.3,
        "volume_m3": 0.049,
        "status_pengiriman": "In Transit",
        "status_tagihan": "Lunas",
        "tgl_tagihan": "2024-01-15",
        "dibuat_oleh": "John Doe",
        "total_harga": 250000,
        "sisa_tagihan": 0
      }
    ]
  }
}
```

#### cURL Example
```bash
curl -X GET \
  "http://localhost:3000/finance/shipments?page=1&limit=20&layanan=Express&billing_status=paid&sort_by=layanan&order=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Create Invoice
**POST** `/finance/invoices`

Create invoice for orders.

### 4. Update Invoice
**PATCH** `/finance/invoices/:invoice_no`

Update existing invoice.

### 5. Get Invoice PDF
**GET** `/finance/invoices/:no_resi/pdf`

Get invoice PDF by tracking number.

### 6. Get Invoice Details
**GET** `/finance/invoices/:invoice_no`

Get invoice details by invoice number. 