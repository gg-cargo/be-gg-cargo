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

### 7. Get Revenue Summary by Service
**GET** `/finance/revenue/summary-by-service`

Get revenue statistics summary grouped by service type (Ekonomi, Reguler, Express, Paket, etc.).

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | string | ❌ | Start date for data range (YYYY-MM-DD) |
| `end_date` | string | ❌ | End date for data range (YYYY-MM-DD) |
| `hub_id` | number | ❌ | Filter by Hub ID |
| `layanan` | string | ❌ | Filter by specific service type |

#### Example Request
```
GET /finance/revenue/summary-by-service?start_date=2025-07-01&end_date=2025-07-31&hub_id=5&layanan=Reguler
```

#### Response
```json
{
    "message": "Ringkasan pendapatan berdasarkan layanan berhasil diambil",
    "success": true,
    "data": {
        "periode": "2025-07-01 to 2025-07-31",
        "summary_by_service": [
            {
                "layanan": "Ekonomi",
                "jumlah_order": 500,
                "total_pendapatan": 75000000,
                "rata_rata_pendapatan_per_order": 150000,
                "total_berat": 2500.5
            },
            {
                "layanan": "Reguler",
                "jumlah_order": 1200,
                "total_pendapatan": 240000000,
                "rata_rata_pendapatan_per_order": 200000,
                "total_berat": 4800.0
            },
            {
                "layanan": "Express",
                "jumlah_order": 150,
                "total_pendapatan": 90000000,
                "rata_rata_pendapatan_per_order": 600000,
                "total_berat": 450.5
            },
            {
                "layanan": "Paket",
                "jumlah_order": 80,
                "total_pendapatan": 1200000,
                "rata_rata_pendapatan_per_order": 15000,
                "total_berat": 160.0
            }
        ],
        "grand_total": {
            "jumlah_order": 1930,
            "total_pendapatan": 406200000,
            "rata_rata_pendapatan_per_order": 210466,
            "total_berat": 7911.0
        }
    }
}
```

#### cURL Example
```bash
curl -X GET \
  "http://localhost:3000/finance/revenue/summary-by-service?start_date=2025-07-01&end_date=2025-07-31&hub_id=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Business Rules
- **Authorization**: Requires JWT authentication
- **Date Filter**: If both start_date and end_date provided, filters orders by created_at
- **Hub Filter**: If hub_id provided, filters by hub_source_id
- **Service Filter**: If layanan provided, filters by specific service type
- **Data Source**: Uses orders table with total_harga and total_berat
- **Calculations**: 
  - Average revenue per order = Total revenue / Number of orders
  - Grand totals calculated from all service types
- **Available Services**: Ekonomi, Reguler, Express, Paket, Sewa Truk, Kirim Motor 