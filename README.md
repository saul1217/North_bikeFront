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

- El catálogo une `GET /api/products` (productos del POS publicados, `source: "pos"`) y `GET /api/online-products` (productos manuales publicados, `source: "manual"`). El origen lo decide la ruta. Si `/online-products` responde 404 (backend sin los dos modos) se toma como catálogo manual vacío; si una fuente falla se muestra la otra con un aviso.
- `source` es parte de la identidad del producto en el carrito (`northbike-cart`). Un carrito guardado sin `source` se lee como `pos`.
- La respuesta se valida y se adapta en `src/lib/catalog/adapter.ts`.
- Precio, stock, variantes e imágenes se toman del backend. El slug de navegación se deriva localmente de `name + id` porque el backend no expone `slug`.
- El catálogo, la página de detalle y el home tienen estados de carga, error y vacío.
- Antes de agregar un artículo se vuelve a consultar el catálogo para validar stock y precio; el carrito también reconcilia esos datos al cargar cuando la API está disponible.
- El carrito sigue siendo local (`northbike-cart`) y provisional. No reserva inventario.

## Panel administrativo

El panel se encuentra en `/admin/login` y reutiliza el login JWT del backend.
Sólo los usuarios con rol `admin` pueden entrar. La sesión se conserva en
`sessionStorage` y se invalida automáticamente cuando la API devuelve `401`.

- `/admin` muestra ingresos, pedidos pagados, unidades, ticket promedio y los 10 productos más vendidos.
- `/admin/orders` permite buscar por folio, cliente o correo, filtrar pago, logística, método de entrega y fechas, y paginar a 25 pedidos.
- `/admin/orders/:id` muestra el detalle y permite avanzar únicamente el siguiente estado logístico válido (recoger en tienda; los pedidos históricos con envío, si existen, se siguen mostrando).

- `/admin/products` («Productos online») tiene dos pestañas:
  - **Sincronizados con el POS**: lista de `GET /api/admin/ecommerce/products` con búsqueda, filtros y paginación. Solo cambia «Disponible en tienda online» con `PATCH /api/admin/ecommerce/products/:id/online`; el cambio se muestra únicamente con la respuesta 200. Muestra los avisos `onlineRisks` (`serialized`, `low_stock`) como pendientes para LIVE.
  - **Manuales / Solo tienda online**: alta, edición parcial (solo los campos cambiados), publicación, retiro lógico con confirmación y SKU duplicado (409) con las rutas `/api/admin/ecommerce/manual-products`. Imágenes por URL https o con la subida existente `POST /api/uploads/product-image`.
- El detalle de pedidos marca cada línea como sincronizada o manual (`inventorySource`). El total mostrado es el de `ecommerce_orders`; en pedidos mixtos se aclara que la venta de caja solo incluye la parte del POS.

Todo esto requiere el backend de los dos modos (NorthBike_back PR #2).

El panel no contiene claves de Stripe, no modifica pagos ni realiza reembolsos.
Las métricas sólo consideran órdenes ecommerce con pago confirmado.

El backend actual no expone campos visuales como marca, descripción, características, especificaciones, `featured`, `isNew` o `bikeType`; el adaptador no los inventa y la interfaz los omite cuando no existen.

## Checkout y Stripe Test

El checkout real está disponible en `/checkout`. El frontend envía al backend
únicamente los IDs de productos/variantes y cantidades; el backend recalcula
precios, valida stock, reserva inventario y devuelve una URL de Stripe Checkout
hospedado. Los datos de tarjeta no llegan al frontend ni al backend North Bike.

North Bike **no hace envíos a domicilio**: la única entrega es «Recoger en
tienda» y el checkout no pide dirección ni cobra envío (ver `docs/entrega.md`).

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
npm test
```

### Prueba E2E local

`qa/e2e-dos-modos.mjs` recorre el panel, la tienda, el carrito y el checkout
contra el backend del PR #2 levantado en local con Postgres (base `vtest77`,
usuarios `admin` y `cajero77`, datos de `prisma/seed.ts`). El checkout exitoso
se simula en el navegador para no llamar a Stripe; los 409 sí van al backend.

```bash
npm i --no-save playwright@1.63.0
FRONT=http://127.0.0.1:<puerto-front> API=http://127.0.0.1:<puerto-api>/api DB=vtest77 node qa/e2e-dos-modos.mjs /tmp/capturas
```

La API debe permitir explícitamente el origen desde el que se sirva este
frontend en `CORS_ALLOWED_ORIGINS` de Railway.
