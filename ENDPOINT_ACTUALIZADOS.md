Aquí tienes el `README.md` completamente actualizado y sincronizado con la definición Swagger que me acabas de pasar. He mantenido el formato profesional, actualizado los ejemplos de respuesta y verificado los parámetros.

```markdown
# 📚 Documentación Técnica - Endpoints GET

## Charlotte KPI Backend API

Documentación exhaustiva de todos los endpoints GET disponibles en el backend de Charlotte KPI. Este sistema integra datos de múltiples módulos (Delivery-Pickup, Atención al Cliente, Cocina) para proporcionar KPIs en tiempo real.

**Versión de API:** 1.0.0  
**Servidores:**
- Desarrollo: `http://localhost:8005/api/kpi/v1`
- Producción: `https://kpi.irissoftware.lat/api/kpi/v1`

---

## 📊 Módulo: Financial (Finanzas)

Indicadores financieros omnicanal.

---

### 1. Venta Total del Día (Omnicanal)

#### `GET /api/kpi/v1/financial/daily-revenue`

**Propósito:** Suma de ventas entregadas (Delivery) y cerradas (Sala) del día actual.

#### 📊 Parámetros (Query String)

| Propiedad | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `date` | `string` | ❌ No | Fecha opcional (YYYY-MM-DD). |

**Ejemplo:**
```bash
GET /api/kpi/v1/financial/daily-revenue?date=2026-02-04

```

#### 📤 Respuesta (200 OK)

```json
{
  "date_range": {
    "start": "2026-02-04T00:00:00.000Z",
    "end": "2026-02-04T23:59:59.999Z"
  },
  "daily_revenue": {
    "total": 4520,
    "delivery": 2500,
    "dine_in": 2020
  }
}

```

---

### 2. Ticket Promedio Global (AOV)

#### `GET /api/kpi/v1/financial/aov`

**Propósito:** Promedio de gasto por cliente unificando todos los canales.

#### 📊 Parámetros (Query String)

| Propiedad | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `date` | `string` | ❌ No | Fecha opcional (YYYY-MM-DD). |

#### 📤 Respuesta (200 OK)

```json
{
  "average_ticket": {
    "value": 25.5,
    "total_revenue": 4520,
    "total_orders": 177
  }
}

```

---

### 3. Costo de Oportunidad (Dinero Perdido)

#### `GET /api/kpi/v1/financial/lost-revenue`

**Propósito:** Suma de ventas perdidas por cancelaciones en delivery o rechazos en cocina.

#### 📊 Parámetros (Query String)

| Propiedad | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `date` | `string` | ❌ No | Fecha opcional (YYYY-MM-DD). |

#### 📤 Respuesta (200 OK)

```json
{
  "lost_revenue": {
    "total_estimated": 150,
    "delivery_cancelled": 100,
    "kitchen_rejected_estimated": 50
  }
}

```

---

## ⚙️ Módulo: Operations (Operaciones)

Métricas de velocidad y alertas.

---

### 4. Tiempo Promedio de Preparación

#### `GET /api/kpi/v1/operations/kitchen-velocity`

**Propósito:** Promedio de tiempo desde que entra una orden a pantalla hasta que sale.

#### 📊 Parámetros (Query String)

| Propiedad | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `date` | `string` | ❌ No | Fecha opcional (YYYY-MM-DD). |

#### 📤 Respuesta (200 OK)

```json
{
  "kitchen_velocity": {
    "avg_minutes": 14.5,
    "avg_ms": 870000
  }
}

```

---

### 5. Tasa de Cumplimiento de Delivery

#### `GET /api/kpi/v1/operations/delivery-success-rate`

**Propósito:** Porcentaje de órdenes entregadas vs total creadas.

#### 📊 Parámetros (Query String)

| Propiedad | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `date` | `string` | ❌ No | Fecha opcional (YYYY-MM-DD). Si se envía, calcula la tasa del día. |

#### 📤 Respuesta (200 OK)

```json
{
  "date": "2026-02-01T00:00:00.000Z",
  "delivery_success_rate": {
    "percentage": 95.5,
    "delivered": 120,
    "total": 126
  }
}

```

---

### 6. Monitor de Alertas Críticas

#### `GET /api/kpi/v1/operations/critical-alerts`

**Propósito:** Listado de órdenes que han excedido umbrales de tiempo.

#### 📊 Parámetros

*Sin parámetros.*

#### 📤 Respuesta (200 OK)

```json
{
  "critical_alerts": {
    "count": 3,
    "alerts": [
      {
        "alert_id": "uuid-string",
        "severity": "critical",
        "message": "TIEMPO_MAXIMO_ESPERA_PENDIENTE: 6810 min > 5 min",
        "order": "DL-4717"
      }
    ]
  }
}

```

---

## 🍽️ Módulo: Product (Inteligencia de Producto)

Métricas sobre productos y menú.

---

### 7. Ranking de Platos (Top Sellers)

#### `GET /api/kpi/v1/product/top-sellers`

**Propósito:** Productos más vendidos basados en el historial del KDS.

#### 📊 Parámetros (Query String)

| Propiedad | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `top` | `integer` | ❌ No | Cantidad de resultados. |
| `date` | `string` | ❌ No | Fecha opcional (YYYY-MM-DD) para el inicio de semana. |

#### 📤 Respuesta (200 OK)

```json
{
  "top_sellers": {
    "top": 10,
    "items": [
      {
        "name": "Hamburguesa Clásica",
        "count": 150
      }
    ]
  }
}

```

---

### 8. Análisis de Disponibilidad de Menú

#### `GET /api/kpi/v1/product/menu-availability`

**Propósito:** Porcentaje del catálogo disponible para venta.

#### 📊 Parámetros

*Sin parámetros.*

#### 📤 Respuesta (200 OK)

```json
{
  "menu_availability": {
    "availability_percentage": 85,
    "active": 95,
    "total": 112
  }
}

```

---

## 📦 Módulo: Inventory (Control de Inventario)

Stock crítico y mermas.

---

### 9. Semáforo de Stock Crítico

#### `GET /api/kpi/v1/inventory/low-stock`

**Propósito:** Items de inventario por debajo del nivel mínimo.

#### 📊 Parámetros

*Sin parámetros.*

#### 📤 Respuesta (200 OK)

```json
{
  "low_stock": {
    "count": 2,
    "items": [
      {
        "name": "Tomate",
        "currentStock": 2.5,
        "minStock": 5
      }
    ]
  }
}

```

---

### 10. Monitor de Mermas

#### `GET /api/kpi/v1/inventory/waste-tracker`

**Propósito:** Registro de inventario perdido por desperdicio (muestreo por item).

#### 📊 Parámetros (Query String)

| Propiedad | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `limitItems` | `integer` | ❌ No | Número de items a muestrear. |

#### 📤 Respuesta (200 OK)

```json
{
  "waste_tracker": {
    "sampled_items_count": 10,
    "total_logs_count": 42,
    "sampled_items": [
      {
        "name": "Lechuga",
        "logs_count": 3
      }
    ]
  }
}

```

---

## 👥 Módulo: CX (Experiencia del Cliente)

Atención en sala y ocupación.

---

### 11. Calidad de Servicio (Tiempos de Respuesta)

#### `GET /api/kpi/v1/cx/service-quality`

**Propósito:** Tiempo promedio de atención a solicitudes en mesa.

#### 📊 Parámetros

*Sin parámetros.*

#### 📤 Respuesta (200 OK)

```json
{
  "service_quality": {
    "avg_response_minutes": 2.5,
    "pending_calls": 1
  }
}

```

---

### 12. Ocupación de Sala

#### `GET /api/kpi/v1/cx/room-occupancy`

**Propósito:** Porcentaje de mesas ocupadas en tiempo real.

#### 📊 Parámetros

*Sin parámetros.*

#### 📤 Respuesta (200 OK)

```json
{
  "room_occupancy": {
    "percentage": 75,
    "occupied": 15,
    "total": 20
  }
}

```

---

### 13. Detección de Clientes Fantasma

#### `GET /api/kpi/v1/cx/ghost-clients`

**Propósito:** Mesas ocupadas sin actividad reciente.

#### 📊 Parámetros

*Sin parámetros.*

#### 📤 Respuesta (200 OK)

```json
{
  "ghost_clients": {
    "count": 2,
    "clients": [
      {
        "table_id": 5
      }
    ]
  }
}

```

---

### 14. Índice de Satisfacción (CSAT)

#### `GET /api/kpi/v1/cx/satisfaction-score`

**Propósito:** Promedio de calificaciones y distribución (0–5).

#### 📊 Parámetros (Query String)

| Propiedad | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `from` | `string` | ❌ No | Inicio de rango (ISO). |
| `to` | `string` | ❌ No | Fin de rango (ISO). |

#### 📤 Respuesta (200 OK)

```json
{
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
  }
}

```

---

## 👨‍🍳 Módulo: Workforce (Gestión de Personal)

Balance de carga operativa.

---

### 15. Personal Activo vs. Demanda

#### `GET /api/kpi/v1/workforce/orders-per-chef`

**Propósito:** Ratio de órdenes activas por cocinero disponible.

#### 📊 Parámetros

*Sin parámetros.*

#### 📤 Respuesta (200 OK)

```json
{
  "orders_per_chef": {
    "ratio": 4.5,
    "chefs": 3,
    "tasks": 14
  }
}

```

---

### 16. Ranking de Desempeño de Meseros

#### `GET /api/kpi/v1/workforce/waiter-ranking`

**Propósito:** Lista de meseros ordenados por calificación promedio.

#### 📊 Parámetros (Query String)

| Propiedad | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `from` | `string` | ❌ No | Inicio de rango (ISO). |
| `to` | `string` | ❌ No | Fin de rango (ISO). |
| `page` | `integer` | ❌ No | Página. |
| `page_size` | `integer` | ❌ No | Tamaño de página (máx 100). |

#### 📤 Respuesta (200 OK)

```json
{
  "waiter_ranking": {
    "total_waiters": 25,
    "items": [
      {
        "waiter_id": "b3f9f5f0-1a2b-4c3d-8e9f-0123456789ab",
        "name": "Juan Pérez",
        "average": 4.5,
        "total_reviews": 12
      }
    ]
  }
}

```

---

## 📈 Módulo: Dashboard (Executive Dashboard)

Vista consolidada para gerencia.

---

### 17. Executive Dashboard (Endpoint Maestro)

#### `GET /api/kpi/v1/dashboard/overview`

**Propósito:** Vista consolidada de métricas críticas para la gerencia.

#### 📊 Parámetros (Query String)

| Propiedad | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `date` | `string` | ❌ No | Fecha (YYYY-MM-DD) o `today` para filtrar métricas por día. |

#### 📤 Respuesta (200 OK)

```json
{
  "warnings": [
    {
      "module": "atc_clients_active",
      "status": 0,
      "message": "Upstream request failed"
    }
  ],
  "financial_summary": {
    "daily_revenue": {
      "total": 0,
      "delivery": 0,
      "dine_in": 0
    },
    "average_ticket": 0
  },
  "operational_health": {
    "kitchen_load": "HIGH",
    "active_delivery_orders": 0,
    "ghost_clients_warning": 0
  },
  "critical_alerts": {
    "low_stock_items": [
      "string"
    ],
    "delivery_delays": 0
  }
}

```

---

**Generado:** Sistema Charlotte KPI - Backend API v1.2

**Última actualización:** 2026-02-04
