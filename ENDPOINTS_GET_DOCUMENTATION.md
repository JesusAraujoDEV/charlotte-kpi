# 📚 Documentación Técnica - Endpoints GET

## Charlotte KPI Backend API

Documentación exhaustiva de todos los endpoints GET disponibles en el backend de Charlotte KPI. Este sistema integra datos de múltiples módulos (Delivery-Pickup, Atención al Cliente, Cocina) para proporcionar KPIs en tiempo real.

---

## 📊 Módulo: Financial (Finanzas)

Endpoints relacionados con métricas financieras y de ingresos.

---

### 1. Ingresos Diarios

#### `GET /api/kpi/v1/financial/daily-revenue`

**Propósito:** Obtiene los ingresos totales del día, desglosados por canal de venta (delivery y dine-in).

**Características:**
- ✅ Combina datos de órdenes entregadas (Delivery-Pickup) y clientes cerrados (Atención al Cliente)
- ✅ Soporta consulta por fecha específica o día actual
- ✅ Caché de 60 segundos (TTL: 60000ms)
- ✅ Respuesta incluye metadata de fuentes de datos

#### 📊 Parámetros (Query String)

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `string` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `date` |
| **Valores permitidos** | `today`, `YYYY-MM-DD` (formato ISO) |
| **Valor por defecto** | `today` |

**Descripción:** Filtra los ingresos por fecha específica. Si se omite o se usa `'today'`, retorna los ingresos del día actual según la zona horaria configurada.

**Ejemplos:**

```javascript
// Ingresos del día actual
GET /api/kpi/v1/financial/daily-revenue

// Ingresos de una fecha específica
GET /api/kpi/v1/financial/daily-revenue?date=2026-01-30

// Ingresos usando el alias 'today'
GET /api/kpi/v1/financial/daily-revenue?date=today
```

#### 📤 Formato de Respuesta

```json
{
  "date_range": {
    "start": "2026-01-30T00:00:00.000Z",
    "end": "2026-01-30T23:59:59.999Z"
  },
  "daily_revenue": {
    "total": 1250000,
    "delivery": 850000,
    "dine_in": 400000
  },
  "sources": {
    "dp": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    },
    "atc": {
      "ok": true,
      "status": 200,
      "cache": "MISS"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `date_range.start` | ISO DateTime | Inicio del rango de fecha consultado |
| `date_range.end` | ISO DateTime | Fin del rango de fecha consultado |
| `daily_revenue.total` | number | Ingresos totales (delivery + dine-in) |
| `daily_revenue.delivery` | number | Ingresos por delivery |
| `daily_revenue.dine_in` | number | Ingresos por servicio en mesa |
| `sources.dp.ok` | boolean | Indica si la fuente Delivery-Pickup respondió exitosamente |
| `sources.dp.status` | number | Código HTTP de la respuesta del módulo DP |
| `sources.dp.cache` | string | Estado del caché (`HIT` o `MISS`) |
| `sources.atc.ok` | boolean | Indica si la fuente Atención al Cliente respondió exitosamente |
| `sources.atc.status` | number | Código HTTP de la respuesta del módulo ATC |
| `sources.atc.cache` | string | Estado del caché (`HIT` o `MISS`) |

---

### 2. Ticket Promedio (AOV)

#### `GET /api/kpi/v1/financial/aov`

**Propósito:** Calcula el ticket promedio (Average Order Value) del día, considerando todos los canales de venta.

**Características:**
- ✅ Combina órdenes de delivery y clientes de dine-in
- ✅ Calcula automáticamente el promedio: `total_revenue / total_orders`
- ✅ Caché de 60 segundos
- ✅ Retorna 0 si no hay órdenes para evitar división por cero

#### 📊 Parámetros (Query String)

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `string` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `date` |
| **Valores permitidos** | `today`, `YYYY-MM-DD` |
| **Valor por defecto** | `today` |

**Descripción:** Filtra el cálculo del ticket promedio por fecha específica.

**Ejemplos:**

```javascript
// Ticket promedio del día actual
GET /api/kpi/v1/financial/aov

// Ticket promedio de una fecha específica
GET /api/kpi/v1/financial/aov?date=2026-01-28
```

#### 📤 Formato de Respuesta

```json
{
  "date_range": {
    "start": "2026-01-30T00:00:00.000Z",
    "end": "2026-01-30T23:59:59.999Z"
  },
  "average_ticket": {
    "value": 45454.54,
    "total_revenue": 1000000,
    "total_orders": 22
  },
  "sources": {
    "dp": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    },
    "atc": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `average_ticket.value` | number | Valor del ticket promedio (total_revenue / total_orders) |
| `average_ticket.total_revenue` | number | Suma total de ingresos considerados |
| `average_ticket.total_orders` | number | Número total de órdenes/clientes |

---

### 3. Ingresos Perdidos

#### `GET /api/kpi/v1/financial/lost-revenue`

**Propósito:** Estima los ingresos perdidos por órdenes canceladas y tareas rechazadas en cocina.

**Características:**
- ✅ Suma órdenes canceladas del módulo Delivery-Pickup
- ✅ Estima valor de tareas rechazadas en Cocina (basado en items)
- ✅ Caché de 60 segundos
- ✅ Incluye notas sobre metodología de estimación

#### 📊 Parámetros (Query String)

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `string` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `date` |
| **Valores permitidos** | `today`, `YYYY-MM-DD` |
| **Valor por defecto** | `today` |

**Descripción:** Filtra los ingresos perdidos por fecha específica.

**Ejemplos:**

```javascript
// Ingresos perdidos del día actual
GET /api/kpi/v1/financial/lost-revenue

// Ingresos perdidos de una fecha específica
GET /api/kpi/v1/financial/lost-revenue?date=2026-01-29
```

#### 📤 Formato de Respuesta

```json
{
  "day_start": "2026-01-30T00:00:00.000Z",
  "lost_revenue": {
    "total_estimated": 125000,
    "delivery_cancelled": 85000,
    "kitchen_rejected_estimated": 40000
  },
  "notes": {
    "kitchen_estimation": "If Cocina tasks do not include totals, value is estimated from items.* fields when available."
  },
  "sources": {
    "dp": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    },
    "cocina": {
      "ok": true,
      "status": 200,
      "cache": "MISS"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `day_start` | ISO DateTime | Inicio del día consultado |
| `lost_revenue.total_estimated` | number | Total estimado de ingresos perdidos |
| `lost_revenue.delivery_cancelled` | number | Ingresos perdidos por órdenes de delivery canceladas |
| `lost_revenue.kitchen_rejected_estimated` | number | Estimación de valor de tareas rechazadas en cocina |
| `notes.kitchen_estimation` | string | Nota metodológica sobre la estimación |

---

## ⚙️ Módulo: Operations (Operaciones)

Endpoints relacionados con métricas operacionales y eficiencia.

---

### 4. Velocidad de Cocina

#### `GET /api/kpi/v1/operations/kitchen-velocity`

**Propósito:** Calcula el tiempo promedio de preparación de tareas servidas en cocina.

**Características:**
- ✅ Analiza tareas con status `SERVED` del sistema KDS
- ✅ Calcula duración entre `startedAt` y `finishedAt`
- ✅ Retorna promedio en milisegundos y minutos
- ✅ Caché de 5 segundos (datos en tiempo real)
- ✅ Incluye tamaño de muestra (sample_size)

#### 📊 Parámetros (Query String)

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `string` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `date` |
| **Valores permitidos** | `today`, `YYYY-MM-DD` |
| **Valor por defecto** | `today` |

**Descripción:** Filtra la velocidad de cocina por fecha específica.

**Ejemplos:**

```javascript
// Velocidad de cocina del día actual
GET /api/kpi/v1/operations/kitchen-velocity

// Velocidad de cocina de una fecha específica
GET /api/kpi/v1/operations/kitchen-velocity?date=2026-01-30
```

#### 📤 Formato de Respuesta

```json
{
  "day_start": "2026-01-30T00:00:00.000Z",
  "kitchen_velocity": {
    "avg_ms": 420000,
    "avg_minutes": 7,
    "sample_size": 45
  },
  "sources": {
    "cocina": {
      "ok": true,
      "status": 200,
      "cache": "MISS"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `kitchen_velocity.avg_ms` | number | Tiempo promedio de preparación en milisegundos |
| `kitchen_velocity.avg_minutes` | number | Tiempo promedio de preparación en minutos |
| `kitchen_velocity.sample_size` | number | Número de tareas consideradas en el cálculo |

---

### 5. Tasa de Éxito de Delivery

#### `GET /api/kpi/v1/operations/delivery-success-rate`

**Propósito:** Calcula el porcentaje de órdenes entregadas exitosamente respecto al total.

**Características:**
- ✅ Consulta dashboard de órdenes del módulo DP
- ✅ Calcula porcentaje: `(delivered / total) * 100`
- ✅ Caché de 5 segundos
- ✅ Resiliencia ante variaciones en estructura de respuesta

#### 📊 Parámetros

**Sin parámetros** - Este endpoint no acepta query parameters. Retorna métricas del día actual.

**Ejemplo:**

```javascript
GET /api/kpi/v1/operations/delivery-success-rate
```

#### 📤 Formato de Respuesta

```json
{
  "delivery_success_rate": {
    "delivered": 85,
    "total": 100,
    "percentage": 85
  },
  "sources": {
    "dp": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `delivery_success_rate.delivered` | number | Número de órdenes entregadas |
| `delivery_success_rate.total` | number | Número total de órdenes |
| `delivery_success_rate.percentage` | number | Porcentaje de éxito (0-100) |

---

### 6. Alertas Críticas

#### `GET /api/kpi/v1/operations/critical-alerts`

**Propósito:** Retorna las alertas activas con severidad alta o crítica del sistema de delivery.

**Características:**
- ✅ Filtra alertas con severidad `HIGH` o `CRITICAL`
- ✅ Caché de 5 segundos
- ✅ Incluye contador y detalle de cada alerta
- ✅ Normaliza campos de severidad y mensaje

#### 📊 Parámetros

**Sin parámetros** - Este endpoint no acepta query parameters.

**Ejemplo:**

```javascript
GET /api/kpi/v1/operations/critical-alerts
```

#### 📤 Formato de Respuesta

```json
{
  "critical_alerts": {
    "count": 3,
    "alerts": [
      {
        "alert_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "severity": "CRITICAL",
        "message": "Orden DL-4409 excedió tiempo de entrega estimado por 45 minutos"
      },
      {
        "alert_id": "7fb92e81-8829-5673-c4gd-3d074g77bgb7",
        "severity": "HIGH",
        "message": "Zona Norte sin repartidores disponibles"
      },
      {
        "alert_id": "9hc03f92-9940-6784-d5he-4e185h88chc8",
        "severity": "HIGH",
        "message": "Tracking GPS inactivo para orden DL-4412"
      }
    ]
  },
  "sources": {
    "dp": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `critical_alerts.count` | number | Número de alertas críticas activas |
| `critical_alerts.alerts` | array | Array de objetos de alertas |
| `alerts[].alert_id` | UUID/string | Identificador único de la alerta |
| `alerts[].severity` | string | Nivel de severidad (`HIGH`, `CRITICAL`) |
| `alerts[].message` | string | Mensaje descriptivo de la alerta |

---

## 🍽️ Módulo: Product (Productos)

Endpoints relacionados con análisis de productos y menú.

---

### 7. Productos Más Vendidos

#### `GET /api/kpi/v1/product/top-sellers`

**Propósito:** Retorna un ranking de los productos más vendidos en la última semana.

**Características:**
- ✅ Analiza historial KDS de la semana actual
- ✅ Soporta límite configurable de resultados
- ✅ Caché de 60 segundos
- ✅ Extrae nombres de productos de múltiples campos

#### 📊 Parámetros (Query String)

**1. top - Límite de Resultados**

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `integer` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Rango permitido** | ≥ 1 |
| **Valor por defecto** | `10` |

**Descripción:** Número máximo de productos a retornar en el ranking.

**2. date - Fecha de Referencia**

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `string` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Valores permitidos** | `YYYY-MM-DD` |
| **Valor por defecto** | Semana actual |

**Descripción:** Fecha de referencia para calcular el inicio de la semana.

**Ejemplos:**

```javascript
// Top 10 productos de la semana actual
GET /api/kpi/v1/product/top-sellers

// Top 5 productos más vendidos
GET /api/kpi/v1/product/top-sellers?top=5

// Top 20 de una semana específica
GET /api/kpi/v1/product/top-sellers?top=20&date=2026-01-25
```

#### 📤 Formato de Respuesta

```json
{
  "week_start": "2026-01-27T00:00:00.000Z",
  "top_sellers": {
    "top": 5,
    "items": [
      {
        "name": "Hamburguesa Clásica",
        "count": 145
      },
      {
        "name": "Pizza Margherita",
        "count": 132
      },
      {
        "name": "Ensalada César",
        "count": 98
      },
      {
        "name": "Pasta Carbonara",
        "count": 87
      },
      {
        "name": "Limonada Natural",
        "count": 76
      }
    ]
  },
  "sources": {
    "cocina": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `week_start` | ISO DateTime | Inicio de la semana analizada |
| `top_sellers.top` | number | Número máximo solicitado en el ranking |
| `top_sellers.items` | array | Array de productos ordenados por popularidad |
| `items[].name` | string | Nombre del producto |
| `items[].count` | number | Número de veces vendido |

---

### 8. Disponibilidad del Menú

#### `GET /api/kpi/v1/product/menu-availability`

**Propósito:** Calcula el porcentaje de productos activos respecto al total del menú.

**Características:**
- ✅ Consulta todos los productos (activos e inactivos)
- ✅ Determina estado activo desde múltiples campos
- ✅ Caché de 60 segundos
- ✅ Calcula porcentaje de disponibilidad

#### 📊 Parámetros

**Sin parámetros** - Este endpoint no acepta query parameters.

**Ejemplo:**

```javascript
GET /api/kpi/v1/product/menu-availability
```

#### 📤 Formato de Respuesta

```json
{
  "menu_availability": {
    "active": 42,
    "total": 50,
    "percentage": 84
  },
  "sources": {
    "cocina": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `menu_availability.active` | number | Número de productos activos/disponibles |
| `menu_availability.total` | number | Número total de productos en el catálogo |
| `menu_availability.percentage` | number | Porcentaje de disponibilidad (0-100) |

---

## 📦 Módulo: Inventory (Inventario)

Endpoints relacionados con gestión de stock e inventario.

---

### 9. Productos con Stock Bajo

#### `GET /api/kpi/v1/inventory/low-stock`

**Propósito:** Retorna la lista de items de inventario con stock bajo.

**Características:**
- ✅ Consulta items con status `LOW` del módulo Cocina
- ✅ Caché de 30 segundos
- ✅ Incluye nivel actual vs. nivel mínimo
- ✅ Normaliza campos de diferentes fuentes

#### 📊 Parámetros

**Sin parámetros** - Este endpoint no acepta query parameters.

**Ejemplo:**

```javascript
GET /api/kpi/v1/inventory/low-stock
```

#### 📤 Formato de Respuesta

```json
{
  "low_stock": {
    "count": 5,
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Tomate",
        "currentStock": 12,
        "minStock": 50
      },
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Lechuga",
        "currentStock": 8,
        "minStock": 30
      },
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "Queso Mozzarella",
        "currentStock": 5,
        "minStock": 20
      },
      {
        "id": "507f1f77bcf86cd799439014",
        "name": "Pan para Hamburguesa",
        "currentStock": 15,
        "minStock": 100
      },
      {
        "id": "507f1f77bcf86cd799439015",
        "name": "Aceite de Oliva",
        "currentStock": 2,
        "minStock": 10
      }
    ]
  },
  "sources": {
    "cocina": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `low_stock.count` | number | Número de items con stock bajo |
| `low_stock.items` | array | Array de items en estado crítico |
| `items[].id` | string/ObjectId | Identificador único del item |
| `items[].name` | string | Nombre del item de inventario |
| `items[].currentStock` | number | Cantidad actual en stock |
| `items[].minStock` | number | Cantidad mínima configurada |

---

### 10. Rastreador de Desperdicio

#### `GET /api/kpi/v1/inventory/waste-tracker`

**Propósito:** Analiza logs de inventario para identificar potencial desperdicio.

**Características:**
- ✅ Muestrea items con stock bajo
- ✅ Consulta logs de movimientos de cada item
- ✅ Caché de 30 segundos
- ✅ Configurable mediante query param `limitItems`

#### 📊 Parámetros (Query String)

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `integer` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `limitItems` |
| **Rango permitido** | 1-50 |
| **Valor por defecto** | `10` |

**Descripción:** Número de items a muestrear (limita consultas a APIs externas).

**Ejemplos:**

```javascript
// Muestreo por defecto (10 items)
GET /api/kpi/v1/inventory/waste-tracker

// Muestreo de 25 items
GET /api/kpi/v1/inventory/waste-tracker?limitItems=25

// Muestreo máximo (50 items)
GET /api/kpi/v1/inventory/waste-tracker?limitItems=50
```

#### 📤 Formato de Respuesta

```json
{
  "waste_tracker": {
    "strategy": "Per-item inventory logs (sampling) because no global logs endpoint is documented.",
    "sampled_items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Tomate",
        "logs_ok": true,
        "logs_count": 15
      },
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Lechuga",
        "logs_ok": true,
        "logs_count": 8
      }
    ],
    "sampled_items_count": 2,
    "total_logs_count": 23
  },
  "sources": {
    "cocina_low": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `waste_tracker.strategy` | string | Nota sobre la estrategia de muestreo utilizada |
| `waste_tracker.sampled_items` | array | Items analizados |
| `sampled_items[].id` | string | ID del item |
| `sampled_items[].name` | string | Nombre del item |
| `sampled_items[].logs_ok` | boolean | Indica si se obtuvo logs correctamente |
| `sampled_items[].logs_count` | number | Número de logs de movimientos |
| `waste_tracker.sampled_items_count` | number | Número de items muestreados |
| `waste_tracker.total_logs_count` | number | Total de logs agregados |

---

## 👥 Módulo: CX (Customer Experience)

Endpoints relacionados con experiencia del cliente y servicio en mesa.

---

### 11. Calidad del Servicio

#### `GET /api/kpi/v1/cx/service-quality`

**Propósito:** Mide la calidad del servicio mediante análisis de llamadas a mesero.

**Características:**
- ✅ Analiza solicitudes del tipo `CALL_WAITER`
- ✅ Calcula tiempo promedio de respuesta
- ✅ Identifica solicitudes pendientes
- ✅ Caché de 5 segundos

#### 📊 Parámetros

**Sin parámetros** - Este endpoint no acepta query parameters.

**Ejemplo:**

```javascript
GET /api/kpi/v1/cx/service-quality
```

#### 📤 Formato de Respuesta

```json
{
  "service_quality": {
    "call_waiter_total": 45,
    "pending_calls": 3,
    "avg_response_ms": 180000,
    "avg_response_minutes": 3
  },
  "sources": {
    "atc": {
      "ok": true,
      "status": 200,
      "cache": "MISS"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `service_quality.call_waiter_total` | number | Total de llamadas a mesero registradas |
| `service_quality.pending_calls` | number | Llamadas pendientes de atención |
| `service_quality.avg_response_ms` | number | Tiempo promedio de respuesta en milisegundos |
| `service_quality.avg_response_minutes` | number | Tiempo promedio de respuesta en minutos |

---

### 12. Ocupación de Mesas

#### `GET /api/kpi/v1/cx/room-occupancy`

**Propósito:** Calcula el porcentaje de ocupación de las mesas del restaurante.

**Características:**
- ✅ Consulta mesas totales y ocupadas en paralelo
- ✅ Calcula porcentaje de ocupación
- ✅ Caché de 5 segundos
- ✅ Datos en tiempo real

#### 📊 Parámetros

**Sin parámetros** - Este endpoint no acepta query parameters.

**Ejemplo:**

```javascript
GET /api/kpi/v1/cx/room-occupancy
```

#### 📤 Formato de Respuesta

```json
{
  "room_occupancy": {
    "occupied": 18,
    "total": 25,
    "percentage": 72
  },
  "sources": {
    "atc_occupied": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    },
    "atc_total": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `room_occupancy.occupied` | number | Número de mesas ocupadas |
| `room_occupancy.total` | number | Número total de mesas disponibles |
| `room_occupancy.percentage` | number | Porcentaje de ocupación (0-100) |

---

### 13. Clientes Fantasma

#### `GET /api/kpi/v1/cx/ghost-clients`

**Propósito:** Identifica clientes activos que son candidatos a ser "fantasmas" (sin actividad reciente).

**Características:**
- ✅ Filtra clientes con flag `isGhostCandidate`
- ✅ Útil para detectar mesas ocupadas sin consumo
- ✅ Caché de 5 segundos
- ✅ Incluye timestamp de creación

#### 📊 Parámetros

**Sin parámetros** - Este endpoint no acepta query parameters.

**Ejemplo:**

```javascript
GET /api/kpi/v1/cx/ghost-clients
```

#### 📤 Formato de Respuesta

```json
{
  "ghost_clients": {
    "count": 2,
    "clients": [
      {
        "id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "table_id": "MESA-12",
        "since": "2026-01-30T14:30:00.000Z"
      },
      {
        "id": "75b2c3d4e5f6g7h8i9j0k1l2",
        "table_id": "MESA-08",
        "since": "2026-01-30T15:15:00.000Z"
      }
    ]
  },
  "sources": {
    "atc": {
      "ok": true,
      "status": 200,
      "cache": "MISS"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ghost_clients.count` | number | Número de clientes fantasma detectados |
| `ghost_clients.clients` | array | Array de clientes candidatos |
| `clients[].id` | string/ObjectId | ID del cliente |
| `clients[].table_id` | string | Identificador de la mesa |
| `clients[].since` | ISO DateTime | Timestamp de creación del cliente |

---

### 14. Índice de Satisfacción (CSAT)

#### `GET /api/kpi/v1/cx/satisfaction-score`

**Propósito:** Retorna el promedio de calificaciones y la distribución de puntajes (0–5).

**Características:**
- ✅ Consulta resumen de ratings desde Atención al Cliente
- ✅ Soporta consulta por fecha específica o rango (`from`/`to`)
- ✅ Caché de 5 segundos

#### 📊 Parámetros (Query String)

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `string` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `date` |
| **Valores permitidos** | `YYYY-MM-DD` |
| **Valor por defecto** | (sin valor) |

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `string` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `from` |
| **Valores permitidos** | ISO DateTime |
| **Valor por defecto** | (sin valor) |

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `string` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `to` |
| **Valores permitidos** | ISO DateTime |
| **Valor por defecto** | (sin valor) |

**Descripción:**
- Si se envía `date`, el KPI convierte esa fecha a rango completo del día.
- Si se envían `from` y/o `to`, se usan directamente en el resumen.

**Ejemplos:**

```javascript
// Resumen global
GET /api/kpi/v1/cx/satisfaction-score

// Resumen de un día específico
GET /api/kpi/v1/cx/satisfaction-score?date=2026-01-31

// Resumen por rango
GET /api/kpi/v1/cx/satisfaction-score?from=2026-01-01T00:00:00.000Z&to=2026-01-31T23:59:59.999Z
```

#### 📤 Formato de Respuesta

```json
{
  "date_range": {
    "start": "2026-01-31T00:00:00.000Z",
    "end": "2026-01-31T23:59:59.999Z"
  },
  "satisfaction_score": {
    "count": 42,
    "average": 4.2,
    "distribution": {
      "0": 0,
      "1": 1,
      "2": 3,
      "3": 8,
      "4": 15,
      "5": 15
    }
  },
  "sources": {
    "atc": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `satisfaction_score.count` | number | Total de calificaciones consideradas |
| `satisfaction_score.average` | number | Promedio global de calificaciones |
| `satisfaction_score.distribution` | object | Conteo por puntaje (0–5) |

---

## 👨‍🍳 Módulo: Workforce (Personal)

Endpoints relacionados con métricas de personal y carga laboral.

---

### 15. Órdenes por Chef

#### `GET /api/kpi/v1/workforce/orders-per-chef`

**Propósito:** Calcula la carga de trabajo en cocina mediante la relación tareas/chef.

**Características:**
- ✅ Cuenta chefs activos en el sistema
- ✅ Suma tareas pendientes y en cocción
- ✅ Calcula ratio `tasks / chefs`
- ✅ Caché de 5 segundos
- ✅ Consulta múltiples estados en paralelo

#### 📊 Parámetros

**Sin parámetros** - Este endpoint no acepta query parameters.

**Ejemplo:**

```javascript
GET /api/kpi/v1/workforce/orders-per-chef
```

---

### 16. Ranking de Desempeño de Meseros

#### `GET /api/kpi/v1/workforce/waiter-ranking`

**Propósito:** Lista de meseros ordenados por calificación promedio.

**Características:**
- ✅ Consulta calificaciones agrupadas por mesero (ATC)
- ✅ Ordena descendente por promedio
- ✅ Caché de 5 segundos

#### 📊 Parámetros (Query String)

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `string` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `date` |
| **Valores permitidos** | `YYYY-MM-DD` |
| **Valor por defecto** | (sin valor) |

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `string` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `from` |
| **Valores permitidos** | ISO DateTime |
| **Valor por defecto** | (sin valor) |

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `string` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `to` |
| **Valores permitidos** | ISO DateTime |
| **Valor por defecto** | (sin valor) |

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `int` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `page` |
| **Valor por defecto** | `1` |

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `int` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `page_size` |
| **Valor por defecto** | `50` |

**Ejemplos:**

```javascript
GET /api/kpi/v1/workforce/waiter-ranking?date=2026-01-31

GET /api/kpi/v1/workforce/waiter-ranking?from=2026-01-01T00:00:00.000Z&to=2026-01-31T23:59:59.999Z&page=1&page_size=50
```

#### 📤 Formato de Respuesta

```json
{
  "date_range": {
    "start": "2026-01-31T00:00:00.000Z",
    "end": "2026-01-31T23:59:59.999Z"
  },
  "waiter_ranking": {
    "page": 1,
    "page_size": 50,
    "total_waiters": 25,
    "items": [
      {
        "waiter_id": "b3f9f5f0-1a2b-4c3d-8e9f-0123456789ab",
        "name": "Juan Pérez",
        "average": 4.5,
        "total_reviews": 12
      }
    ]
  },
  "sources": {
    "atc": {
      "ok": true,
      "status": 200,
      "cache": "MISS"
    }
  }
}
```

#### 📤 Formato de Respuesta

```json
{
  "orders_per_chef": {
    "chefs": 5,
    "tasks": 18,
    "pending_tasks": 12,
    "cooking_tasks": 6,
    "ratio": 3.6
  },
  "sources": {
    "staff": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    },
    "pending": {
      "ok": true,
      "status": 200,
      "cache": "MISS"
    },
    "cooking": {
      "ok": true,
      "status": 200,
      "cache": "MISS"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `orders_per_chef.chefs` | number | Número de chefs activos |
| `orders_per_chef.tasks` | number | Total de tareas asignadas (pending + cooking) |
| `orders_per_chef.pending_tasks` | number | Tareas pendientes por iniciar |
| `orders_per_chef.cooking_tasks` | number | Tareas en proceso de cocción |
| `orders_per_chef.ratio` | number | Relación tareas/chef (carga promedio) |

---

## 📈 Módulo: Dashboard (Panel General)

Endpoint consolidado con métricas generales del sistema.

---

### 15. Vista General del Dashboard

#### `GET /api/kpi/v1/dashboard/overview`

**Propósito:** Endpoint consolidado que retorna un resumen ejecutivo con KPIs principales de todos los módulos.

**Características:**
- ✅ Consolida datos de 7 fuentes diferentes
- ✅ Resiliencia total - continúa aunque servicios fallen
- ✅ Retorna array de `warnings` con servicios caídos
- ✅ Caché de 5 segundos
- ✅ Ideal para pantallas de monitoreo en tiempo real

#### 📊 Parámetros (Query String)

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `string` |
| **Ubicación** | Query parameter |
| **Requerido** | ❌ No (opcional) |
| **Nombre** | `date` |
| **Valores permitidos** | `today`, `YYYY-MM-DD` |
| **Valor por defecto** | `today` |

**Descripción:** Filtra datos financieros por fecha específica.

**Ejemplos:**

```javascript
// Dashboard del día actual
GET /api/kpi/v1/dashboard/overview

// Dashboard de una fecha específica
GET /api/kpi/v1/dashboard/overview?date=2026-01-28
```

#### 📤 Formato de Respuesta

```json
{
  "date_range": {
    "start": "2026-01-30T00:00:00.000Z",
    "end": "2026-01-30T23:59:59.999Z"
  },
  "warnings": [],
  "financial_summary": {
    "daily_revenue": {
      "total": 1250000,
      "delivery": 850000,
      "dine_in": 400000
    },
    "average_ticket": 56818.18
  },
  "operational_health": {
    "kitchen_load": "MEDIUM",
    "kitchen_queue_pending": 8,
    "active_delivery_orders": 12,
    "ghost_clients_warning": 1
  },
  "critical_alerts": {
    "low_stock_items": [
      "Tomate",
      "Lechuga",
      "Queso Mozzarella",
      "Pan para Hamburguesa",
      "Aceite de Oliva"
    ],
    "delivery_delays": 2
  },
  "sources": {
    "dp_orders_delivered": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    },
    "atc_clients_closed": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    },
    "cocina_queue_pending": {
      "ok": true,
      "status": 200,
      "cache": "MISS"
    },
    "dp_orders_active": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    },
    "atc_clients_active": {
      "ok": true,
      "status": 200,
      "cache": "MISS"
    },
    "cocina_low_stock": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    },
    "dp_alerts": {
      "ok": true,
      "status": 200,
      "cache": "HIT"
    }
  }
}
```

**Descripción de Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `warnings` | array | Advertencias de servicios con fallas (vacío si todo ok) |
| `warnings[].module` | string | Nombre del módulo que falló |
| `warnings[].status` | number | Código HTTP (0 si error de red) |
| `warnings[].message` | string | Mensaje de error |
| `financial_summary.daily_revenue` | object | Resumen de ingresos del día |
| `financial_summary.average_ticket` | number | Ticket promedio calculado |
| `operational_health.kitchen_load` | enum | Estado de carga de cocina (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `operational_health.kitchen_queue_pending` | number | Tareas pendientes en cola |
| `operational_health.active_delivery_orders` | number | Órdenes de delivery activas |
| `operational_health.ghost_clients_warning` | number | Número de clientes fantasma detectados |
| `critical_alerts.low_stock_items` | array | Nombres de items con stock bajo (máximo 25) |
| `critical_alerts.delivery_delays` | number | Número de alertas de retraso en delivery |

**Niveles de Kitchen Load:**

| Nivel | Rango de Tareas Pendientes |
|-------|----------------------------|
| `LOW` | 0-4 tareas |
| `MEDIUM` | 5-14 tareas |
| `HIGH` | 15-29 tareas |
| `CRITICAL` | ≥ 30 tareas |

---

## 🔧 Notas Técnicas Generales

### Caché y Performance

Todos los endpoints implementan caché en memoria con diferentes TTLs según la naturaleza de los datos:

| Tipo de Datos | TTL (ms) | Razón |
|---------------|----------|-------|
| **Financieros** | 60,000 (1 min) | Datos consolidados, cambian menos frecuentemente |
| **Operacionales** | 5,000 (5 seg) | Métricas en tiempo real |
| **Productos** | 60,000 (1 min) | Catálogo relativamente estable |
| **Inventario** | 30,000 (30 seg) | Balance entre actualidad y carga |
| **Dashboard** | 5,000 (5 seg) | Vista de monitoreo en tiempo real |

### Headers de Respuesta

Todos los endpoints incluyen metadata en el campo `sources`:

```json
{
  "sources": {
    "<module_name>": {
      "ok": true,           // Indica si la petición fue exitosa
      "status": 200,        // Código HTTP de la respuesta
      "cache": "HIT"        // Estado del caché: HIT o MISS
    }
  }
}
```

### Manejo de Errores

- **Resiliencia:** Los endpoints continúan operando aunque dependencias fallen
- **Valores por defecto:** Retornan `0` o arrays vacíos en caso de error
- **Dashboard:** Implementa función `settle()` para manejar fallos sin bloquear
- **Normalización:** Múltiples campos alternativos para compatibilidad entre APIs

### Zona Horaria

El sistema utiliza una zona horaria configurable (parámetro `config.timezone`) para:
- Cálculo de rangos de fechas (`getDayRangeIso`, `getWeekStartIso`)
- Interpretación de `date=today`
- Generación de timestamps en respuestas

### Extracción de Datos

El backend normaliza datos de múltiples fuentes mediante funciones helper:

- `asArray()` - Garantiza arrays válidos
- `toNumber()` - Conversión segura a número
- `safeDiv()` - División protegida contra división por cero
- `get()` - Extracción de campos anidados con fallback
- `durationMs()` - Cálculo de duraciones entre timestamps

---

## 📞 Soporte

Para consultas sobre esta documentación o problemas con los endpoints, contactar al equipo de desarrollo backend.

**Generado:** Sistema Charlotte KPI - Backend API v1  
**Última actualización:** 2026-02-01
