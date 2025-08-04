# Orders API Documentation

## Endpoints

### 1. Create Order
**POST** `/orders`

Creates a new order with pieces and shipments.

### 2. Update Order
**PATCH** `/orders/:no_resi`

Updates an existing order based on tracking number.

### 3. Reweight Order Piece
**PATCH** `/order-pieces/:id/reweight`

Input actual weight and dimensions for a specific order piece after pickup.

### 4. Bypass Reweight
**PATCH** `/orders/:order_id/bypass-reweight`

Set or cancel bypass reweight status for a specific order. This allows the order to skip the reweighting process in the warehouse.

#### Path Parameters
- `order_id` (number): Unique ID of the order to set bypass reweight status

#### Request Body
```json
{
  "bypass_reweight_status": "true",
  "reason": "Kontrak khusus dengan tarif flat",
  "updated_by_user_id": 1
}
```

#### Field Descriptions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bypass_reweight_status` | string | ✅ | Status bypass ("true" or "false") |
| `reason` | string | ❌ | Reason for bypass (optional but recommended) |
| `updated_by_user_id` | number | ✅ | ID of user performing the change |

#### Response
```json
{
  "message": "Bypass reweight berhasil diaktifkan",
  "success": true,
  "data": {
    "order_id": 123,
    "no_tracking": "GGK-2024-001234",
    "bypass_reweight_status": "true",
    "reason": "Kontrak khusus dengan tarif flat",
    "updated_by_user": "User ID 1",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "order_pieces_updated": 3
  }
}
```

#### Business Rules
- **Authorization**: Only Admin/Super Admin users can perform bypass reweight
- **Order Validation**: Order must exist in database
- **Status Impact**: 
  - When bypass enabled: All pieces marked as reweighted, order can proceed to next stage
  - When bypass disabled: Pieces reset to pending reweight if they were bypassed
- **Audit Trail**: All changes logged in order_histories table

#### cURL Example
```bash
curl -X PATCH \
  http://localhost:3000/orders/123/bypass-reweight \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bypass_reweight_status": "true",
    "reason": "Kontrak khusus dengan tarif flat",
    "updated_by_user_id": 1
  }'
```

#### Error Responses
```json
{
  "statusCode": 404,
  "message": "Order tidak ditemukan",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 400,
  "message": "Status bypass reweight harus \"true\" atau \"false\"",
  "error": "Bad Request"
}
```

#### Technical Implementation
1. **Validation**: Check order exists and user authorization
2. **Database Transaction**: All updates performed in single transaction
3. **Order Update**: Set bypass_reweight status and remark
4. **Pieces Update**: 
   - If bypass enabled: Mark all pieces as reweighted
   - If bypass disabled: Reset bypassed pieces to pending
5. **Order Status**: Update reweight_status based on pieces status
6. **Audit Trail**: Create order_histories entry
7. **Response**: Return success with updated data

#### Use Cases
- **Special Contracts**: Orders with flat rate pricing
- **Large Volume**: Orders with high volume where manual reweighting is impractical
- **Trusted Customers**: Regular customers with accurate initial measurements
- **Express Services**: Time-sensitive orders requiring fast processing 