# charlotte-kpi

Microservicio de agregación de datos que orquesta la información de los módulos de Delivery, Cocina, Seguridad y Atención al Cliente del proyecto de Control de Proyectos "Charlotte Bistró". Provee endpoints unificados para la generación de Dashboards Ejecutivos, cálculo de KPIs financieros y monitoreo de alertas de stock en tiempo real.

## Requisitos

- Node.js 18+

## Configuración

Este proyecto usa `.env` (ignorado por git). Variables mínimas:

```dotenv
DP_URL=https://delivery.irissoftware.lat/
ATC_URL=https://charlotte-atencion-cliente.onrender.com/
COCINA_URL=https://charlotte-cocina.onrender.com/
SEGURIDAD_URL=https://charlotte-seguridad.onrender.com/
```

Opcionales:

```dotenv
PORT=3000
TIMEZONE=America/Lima
CACHE_TTL_MS=15000
HTTP_TIMEOUT_MS=10000
```

## Ejecutar

```bash
npm install
npm run dev
```

Healthcheck:

```bash
curl http://localhost:3000/healthz
```

## Endpoints (KPI & Analytics)

Base: `/api/kpi/v1`

Nota: la mayoría de endpoints aceptan `?date=YYYY-MM-DD` (opcional). Si no se envía, se asume hoy.

### Finanzas

- `GET /financial/daily-revenue`
- `GET /financial/aov`
- `GET /financial/lost-revenue`

### Operaciones

- `GET /operations/kitchen-velocity`
- `GET /operations/delivery-success-rate`
- `GET /operations/critical-alerts`

### Producto

- `GET /product/top-sellers?top=10&date=YYYY-MM-DD`
- `GET /product/menu-availability`

### Inventario

- `GET /inventory/low-stock`
- `GET /inventory/waste-tracker?limitItems=10`

### CX (Atención al Cliente)

- `GET /cx/service-quality`
- `GET /cx/room-occupancy`
- `GET /cx/ghost-clients`

### Workforce

- `GET /workforce/orders-per-chef`

### Executive Dashboard

- `GET /dashboard/overview`

Incluye un resumen consolidado (finanzas + salud operativa + alertas críticas) orquestando llamadas a DP/ATC/COCINA en paralelo con caché de corta duración.
