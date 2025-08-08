# 🗑️ Delete Order Endpoint Documentation

## 📋 **Overview**

Endpoint untuk menghapus order dan semua data terkaitnya secara permanen dari database. Ini adalah operasi yang sangat sensitif dan memerlukan validasi otorisasi yang ketat.

## 🎯 **Endpoint Details**

### **Basic Information:**
- **URL:** `DELETE /orders/:no_resi`
- **Method:** `DELETE`
- **Authentication:** Required (JWT Token)
- **Authorization:** Admin only (level = 1)

### **Path Parameters:**
- `no_resi` (string): Nomor resi order yang akan dihapus

### **Request Body:**
```json
{
  "user_id": 123
}
```

### **Response Format:**
```json
{
  "message": "Order berhasil dihapus",
  "success": true,
  "data": {
    "order_id": 456,
    "no_resi": "GG250806008748",
    "deleted_by": "Admin User",
    "deleted_at": "2025-08-08T10:30:00.000Z",
    "deleted_tables": [
      "order_pieces",
      "order_shipments", 
      "order_invoices",
      "request_cancel",
      "order_delivery_notes",
      "order_histories",
      "orders"
    ],
    "deleted_records_count": {
      "order_pieces": 2,
      "order_shipments": 1,
      "order_invoices": 0,
      "request_cancel": 1,
      "order_delivery_notes": 0,
      "order_histories": 5,
      "order_invoice_details": 0
    }
  }
}
```

## 🔐 **Authorization & Validation**

### **1. User Authentication:**
- ✅ JWT token required
- ✅ User must exist in database
- ✅ User must be active (`aktif = 1`)

### **2. Authorization Level:**
- ✅ Only users with `level = 1` (admin) can delete orders
- ❌ Other user levels will receive error: "Anda tidak memiliki izin untuk menghapus order. Hanya admin yang dapat melakukan operasi ini."

### **3. Order Status Validation:**
- ✅ Only orders with status `'Draft'` or `'Cancelled'` can be deleted
- ❌ Orders with other statuses will receive error: "Order tidak bisa dihapus karena status saat ini adalah '{status}'. Hanya order dengan status 'Draft' atau 'Cancelled' yang dapat dihapus."

### **4. Order Existence:**
- ✅ Order must exist in database (based on `no_resi`)
- ❌ Non-existent orders will receive error: "Order tidak ditemukan"

## 🗂️ **Data Deletion Process**

### **Deletion Order (Child to Parent):**

1. **Order Pieces** (`order_pieces`)
   - Deletes all pieces associated with the order
   - Foreign key: `order_id`

2. **Order Shipments** (`order_shipments`)
   - Deletes all shipments associated with the order
   - Foreign key: `order_id`

3. **Order Invoices** (`order_invoices`)
   - Deletes all invoices associated with the order
   - Foreign key: `order_id`
   - **Note:** Also deletes related `order_invoice_details`

4. **Request Cancel** (`request_cancel`)
   - Deletes cancellation requests for the order
   - Foreign key: `order_id`

5. **Order Delivery Notes** (`order_delivery_notes`)
   - Deletes delivery notes associated with the order
   - Foreign key: `no_tracking`

6. **Order Histories** (`order_histories`)
   - Deletes all history records for the order
   - Foreign key: `order_id`
   - **Note:** Includes the "Order Deleted" history entry

7. **Order** (`orders`)
   - Finally deletes the main order record
   - Primary key: `id`

## 📝 **Audit Trail**

### **History Recording:**
Before deletion, the system automatically creates an audit trail entry:

```sql
INSERT INTO order_histories (
  order_id,
  status,
  remark,
  created_by,
  created_at
) VALUES (
  456,
  'Order Deleted',
  'Order dihapus oleh Admin User (ID: 123) pada 2025-08-08T10:30:00.000Z',
  123,
  NOW()
);
```

## 🚨 **Error Handling**

### **Common Error Responses:**

#### **1. Unauthorized Access:**
```json
{
  "message": "Error deleting order: Anda tidak memiliki izin untuk menghapus order. Hanya admin yang dapat melakukan operasi ini.",
  "success": false
}
```

#### **2. Invalid Order Status:**
```json
{
  "message": "Error deleting order: Order tidak bisa dihapus karena status saat ini adalah 'In Transit'. Hanya order dengan status 'Draft' atau 'Cancelled' yang dapat dihapus.",
  "success": false
}
```

#### **3. Order Not Found:**
```json
{
  "message": "Error deleting order: Order tidak ditemukan",
  "success": false
}
```

#### **4. User Not Found:**
```json
{
  "message": "Error deleting order: User tidak ditemukan",
  "success": false
}
```

## 🔄 **Usage Examples**

### **Example 1: Successful Deletion**
```bash
curl -X DELETE \
  http://localhost:3000/orders/GG250806008748 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123
  }'
```

**Response:**
```json
{
  "message": "Order berhasil dihapus",
  "success": true,
  "data": {
    "order_id": 456,
    "no_resi": "GG250806008748",
    "deleted_by": "Admin User",
    "deleted_at": "2025-08-08T10:30:00.000Z",
    "deleted_tables": ["order_pieces", "order_shipments", "orders"],
    "deleted_records_count": {
      "order_pieces": 2,
      "order_shipments": 1,
      "order_invoices": 0,
      "request_cancel": 0,
      "order_delivery_notes": 0,
      "order_histories": 1
    }
  }
}
```

### **Example 2: Unauthorized Access**
```bash
curl -X DELETE \
  http://localhost:3000/orders/GG250806008748 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 456
  }'
```

**Response:**
```json
{
  "message": "Error deleting order: Anda tidak memiliki izin untuk menghapus order. Hanya admin yang dapat melakukan operasi ini.",
  "success": false
}
```

## 🛡️ **Security Considerations**

### **1. Authorization:**
- ✅ Admin-only access
- ✅ JWT token validation
- ✅ User existence verification

### **2. Data Integrity:**
- ✅ Cascading deletion in correct order
- ✅ Audit trail creation
- ✅ Transaction safety

### **3. Validation:**
- ✅ Order status validation
- ✅ User level validation
- ✅ Order existence validation (by `no_resi`)

## 📊 **Monitoring & Logging**

### **Log Entries:**
```typescript
// Start of process
this.logger.log(`Starting delete order process for no_resi: ${noResi}, user_id: ${user_id}`);

// Order found
this.logger.log(`Found order: ${orderId} with status: ${currentStatus}`);

// Deletion progress
this.logger.log(`Deleted ${deletedPieces} order_pieces for order ${orderId}`);
this.logger.log(`Deleted ${deletedShipments} order_shipments for order ${orderId}`);

// Success
this.logger.log(`Order ${orderId} successfully deleted by user ${user_id}`);

// Errors
this.logger.error(`User not found: ${user_id}`);
this.logger.error(`Order not found: ${noResi}`);
this.logger.warn(`Order ${orderId} cannot be deleted - current status: ${currentStatus}`);
```

## 🎯 **Best Practices**

### **1. Before Deletion:**
- ✅ Verify user permissions
- ✅ Check order status
- ✅ Create audit trail
- ✅ Backup critical data (if needed)

### **2. During Deletion:**
- ✅ Delete in correct order (child to parent)
- ✅ Handle errors gracefully
- ✅ Log all operations

### **3. After Deletion:**
- ✅ Return comprehensive response
- ✅ Include deletion statistics
- ✅ Maintain audit trail

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **1. Foreign Key Constraints:**
- **Issue:** Cannot delete order due to foreign key constraints
- **Solution:** Ensure deletion order is correct (child to parent)

#### **2. Permission Denied:**
- **Issue:** User cannot delete orders
- **Solution:** Verify user level is 1 (admin)

#### **3. Order Status Invalid:**
- **Issue:** Order cannot be deleted due to status
- **Solution:** Cancel order first or change status to 'Draft'

#### **4. Database Errors:**
- **Issue:** Database errors during deletion
- **Solution:** Check database connectivity and table structure

#### **5. Order Not Found:**
- **Issue:** Order not found by `no_resi`
- **Solution:** Verify the `no_resi` is correct and exists in database

---

**Last Updated:** August 8, 2025  
**Version:** 1.0.0  
**Author:** Development Team 