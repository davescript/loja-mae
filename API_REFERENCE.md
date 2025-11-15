# 📚 API Reference - Loja Mãe

Base URL: `https://loja-mae-api.YOUR-USERNAME.workers.dev`

## Authentication

### Customer Auth
```
Header: Authorization: Bearer <customer_token>
Cookie: customer_token=<token>
```

### Admin Auth
```
Header: Authorization: Bearer <admin_token>
Cookie: admin_token=<token>
```

---

## 🛍️ Products

### List Products
```http
GET /api/products?page=1&pageSize=20&category_id=1&search=termo
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### Get Product
```http
GET /api/products/:slug
GET /api/products/:slug?include=images,variants
```

---

## 📦 Orders

### Create Payment Intent
```http
POST /api/stripe/create-intent
Content-Type: application/json

{
  "items": [
    { "product_id": 1, "variant_id": 2, "quantity": 1 }
  ],
  "address_id": 5,
  "shipping_address": {
    "first_name": "João",
    "last_name": "Silva",
    "address_line1": "Rua X, 123",
    "city": "Lisboa",
    "postal_code": "1000-001",
    "country": "PT"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "client_secret": "pi_xxx_secret_xxx",
    "order_id": 42,
    "order_number": "ORD-2025-00042",
    "total_cents": 5000,
    "payment_intent_id": "pi_xxx"
  }
}
```

### Update Order Shipping
```http
PUT /api/orders/:id/shipping
Content-Type: application/json

{
  "shipping_address": { ... },
  "address_id": 5,
  "payment_intent_id": "pi_xxx"
}
```

### List Orders (Admin)
```http
GET /api/orders?page=1&status=paid&customer_id=10
Authorization: Bearer <admin_token>
```

### Get Order Details
```http
GET /api/orders/:id?include=items
Authorization: Bearer <admin_token>
```

---

## 🚚 Order Tracking (Admin)

### Update Tracking Info
```http
PUT /api/admin/orders/:id/tracking
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "tracking_number": "BR123456789PT",
  "carrier": "CTT",
  "estimated_delivery": "2025-01-20"
}
```

### Mark as Shipped
```http
POST /api/admin/orders/:id/ship
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "tracking_number": "BR123456789PT",
  "carrier": "CTT",
  "estimated_delivery": "2025-01-20"
}
```

### Mark as Delivered
```http
POST /api/admin/orders/:id/deliver
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "location": "Entregue ao destinatário"
}
```

### Add Tracking Event
```http
POST /api/admin/orders/:id/tracking-event
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "event_type": "in_transit",
  "description": "Mercadoria em trânsito",
  "location": "Centro de Distribuição - Porto"
}
```

### Get Tracking Events
```http
GET /api/admin/orders/:id/tracking
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "event_type": "shipped",
        "description": "Pedido enviado via CTT",
        "location": "Centro de Distribuição",
        "created_at": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## 👥 Customers

### Get Customer
```http
GET /api/customers/:id
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "customer@example.com",
    "first_name": "João",
    "last_name": "Silva",
    "phone": "+351912345678",
    "segment": "vip",
    "lifetime_value_cents": 50000,
    "addresses": [...]
  }
}
```

### List Customers
```http
GET /api/customers?page=1&search=joão&segment=vip
Authorization: Bearer <admin_token>
```

---

## 📍 Addresses

### List Customer Addresses
```http
GET /api/customers/addresses
Authorization: Bearer <customer_token>
```

### Create Address
```http
POST /api/customers/addresses
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "type": "shipping",
  "first_name": "João",
  "last_name": "Silva",
  "address_line1": "Rua X, 123",
  "city": "Lisboa",
  "state": "Lisboa",
  "postal_code": "1000-001",
  "country": "PT",
  "phone": "+351912345678",
  "is_default": 1
}
```

### Update Address
```http
PUT /api/customers/addresses/:id
Authorization: Bearer <customer_token>
```

### Delete Address
```http
DELETE /api/customers/addresses/:id
Authorization: Bearer <customer_token>
```

---

## ❤️ Favorites

### List Favorites
```http
GET /api/favorites
Authorization: Bearer <customer_token>
```

### Add to Favorites
```http
POST /api/favorites
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "product_id": 42
}
```

### Remove from Favorites
```http
DELETE /api/favorites/:product_id
Authorization: Bearer <customer_token>
```

### Sync Favorites (Batch)
```http
POST /api/favorites/sync
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "product_ids": [1, 5, 10, 42]
}
```

---

## ⭐ Reviews

### Get Product Reviews
```http
GET /api/products/:product_id/reviews?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "stats": {
      "averageRating": 4.5,
      "totalReviews": 42,
      "distribution": {
        "1": 2,
        "2": 3,
        "3": 5,
        "4": 12,
        "5": 20
      }
    }
  }
}
```

### Create Review
```http
POST /api/products/:product_id/reviews
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "rating": 5,
  "title": "Excelente produto!",
  "comment": "Superou minhas expectativas...",
  "order_id": 42
}
```

### Mark Review as Helpful
```http
POST /api/reviews/:id/helpful
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "is_helpful": true
}
```

---

## 📊 Dashboard (Admin)

### Get Dashboard Stats
```http
GET /api/admin/dashboard/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "salesToday": 1500.00,
    "salesTodayChange": 15.5,
    "salesMonth": 45000.00,
    "salesMonthChange": 22.3,
    "ordersToday": 12,
    "ordersTodayChange": 20.0,
    "ordersMonth": 320,
    "customersNew": 45,
    "customersTotal": 1250,
    "averageTicket": 140.62,
    "abandonedCarts": 8
  }
}
```

### Get Sales Chart
```http
GET /api/admin/dashboard/sales-chart
Authorization: Bearer <admin_token>
```

### Get Top Products
```http
GET /api/admin/dashboard/top-products
Authorization: Bearer <admin_token>
```

---

## 🔧 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": { ... }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

---

## 🔒 Rate Limits

- Public endpoints: 100 req/min
- Authenticated: 300 req/min
- Admin: 1000 req/min

---

## 📝 Notes

- All dates in ISO 8601 format
- All prices in cents (€1.00 = 100)
- All timestamps in UTC
- Pagination starts at page 1
- Default pageSize: 20, max: 100
