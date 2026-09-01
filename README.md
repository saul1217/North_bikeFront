# North Bike — Ecommerce frontend

Frontend React + Vite del ecommerce North Bike. El catálogo se consume exclusivamente desde el backend central; los datos de `src/lib/data/products.ts` de la demo fueron retirados.

## Desarrollo

```bash
npm install
copy .env.example .env
npm run dev
```

El frontend usa `http://localhost:5173`. Configura `VITE_API_BASE_URL` en `.env` para apuntar a la API local o a producción:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
# VITE_API_BASE_URL=https://northbikeback-production.up.railway.app/api
```

Solo se aceptan variables públicas `VITE_*`. No agregues credenciales de base de datos, Supabase, JWT, Resend o usuarios internos al frontend.

## Integración actual

- `GET /api/products` es la única ruta de catálogo usada por el frontend.
- La respuesta se valida y se adapta en `src/lib/catalog/adapter.ts`.
- Precio, stock, variantes e imágenes se toman del backend. El slug de navegación se deriva localmente de `name + id` porque el backend no expone `slug`.
- El catálogo, la página de detalle y el home tienen estados de carga, error y vacío.
- Antes de agregar un artículo se vuelve a consultar el catálogo para validar stock y precio; el carrito también reconcilia esos datos al cargar cuando la API está disponible.
- El carrito sigue siendo local (`northbike-cart`) y provisional. No reserva inventario.

El backend actual no expone campos visuales como marca, descripción, características, especificaciones, `featured`, `isNew` o `bikeType`; el adaptador no los inventa y la interfaz los omite cuando no existen.

## Checkout y Stripe Test

El checkout real está disponible en `/checkout`. El frontend envía al backend
únicamente los IDs de productos/variantes y cantidades; el backend recalcula
precios, valida stock, reserva inventario y devuelve una URL de Stripe Checkout
hospedado. Los datos de tarjeta no llegan al frontend ni al backend North Bike.

La página de éxito consulta `/api/orders/:id/status` y sólo limpia el carrito
cuando un webhook firmado confirma el estado `paid`. Si el cliente cancela o
la sesión expira, el backend libera la reserva. El carrito local sigue siendo
provisional hasta iniciar el pago.

Para probar en local, configura:

```dotenv
VITE_API_BASE_URL=https://northbikeback-production.up.railway.app/api
```

El backend usa Stripe Test. No se usa `POST /api/sales/sync`, porque es una
ruta autenticada del POS.

## Verificación

```bash
npm run build
npm run lint
```

La API debe permitir explícitamente el origen desde el que se sirva este
frontend en `CORS_ALLOWED_ORIGINS` de Railway.
