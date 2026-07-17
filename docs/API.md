# EcoSync API Summary

All request and response bodies use JSON. Authentication is stored in the `ecosync_session` HTTP-only cookie.

## Authentication

### `POST /api/auth/register`

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "phone": "9876543210",
  "password": "minimum-eight-characters"
}
```

### `POST /api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### `POST /api/auth/logout`

Clears the current session.

## Estimation

### `POST /api/estimate`

```json
{
  "materialId": 1,
  "weightKg": 25
}
```

Returns estimated scrap value, rate, and CO₂ savings.

## Pickup requests

### `GET /api/pickups`

Returns pickups owned by the signed-in user.

### `POST /api/pickups`

```json
{
  "materialId": 1,
  "weightKg": 25,
  "address": "Building and street address",
  "city": "Agartala",
  "pincode": "799001",
  "preferredDate": "2026-07-20",
  "notes": "Optional instructions"
}
```

## Partner application

### `POST /api/partners/apply`

```json
{
  "businessName": "Green Loop Pvt Ltd",
  "businessType": "collector",
  "gstNumber": "",
  "address": "Registered business address",
  "city": "Agartala",
  "state": "Tripura",
  "pincode": "799001",
  "monthlyCapacityKg": 5000,
  "serviceRadiusKm": 50
}
```

Allowed business types: `retailer`, `installer`, `distributor`, `collector`, `recycler`.

## Admin APIs

Admin role is required.

### `PATCH /api/admin/pickups/:id`

```json
{ "status": "completed" }
```

Allowed statuses: `pending`, `scheduled`, `collected`, `completed`, `cancelled`.

Completing a pickup automatically creates the user's environmental impact entry.

### `PATCH /api/admin/partners/:id`

```json
{ "status": "approved" }
```

Allowed decisions: `approved`, `rejected`.
