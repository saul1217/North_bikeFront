# Entrega de las compras en línea: solo recoger en tienda (#82)

**Decisión definitiva del propietario:** North Bike **no hace envíos a domicilio**.
La única forma de entrega de las compras del ecommerce es **recoger en tienda**.
Para este lanzamiento no hay desarrollo de envíos: ni tarifas, ni cotizador, ni
direcciones de entrega, ni envío gratis. Esta decisión reemplaza lo que planteaba
el #80 (envío con costo «por confirmar»).

## Front (este repo)

- `/checkout` muestra «Recoger en tienda» como entrega fija (sin opciones para
  elegir) y no pide dirección. El resumen dice «Entrega: Recoger en tienda» y el
  total es el subtotal; no hay renglón de envío ni ningún cobro extra.
- Al pagar se manda `fulfillment: { method: "pickup" }` (el contrato que ya
  existe). El tipo `CheckoutRequest` solo admite `"pickup"`.
- No hay variable de entorno que vuelva a mostrar el envío.
- El panel administrativo sigue sabiendo mostrar pedidos con método `shipping`
  por si existe alguno histórico; no se modifican ni se borran.

## Backend (NorthBike_back, PR #3)

`POST /api/checkout/session` con `fulfillment.method = "shipping"` responde
**400** «North Bike no hace envíos a domicilio: las compras en línea se recogen en
tienda», antes de reservar stock, crear la orden o abrir una sesión de Stripe.
No depende de ninguna variable: se retira `ECOMMERCE_SHIPPING_ENABLED`. El cambio
va como parche en `qa/solo-recoger-82/back/` (ver su README) mientras no se integre en el PR #3.

## Prueba local

`qa/e2e-solo-recoger-82.mjs` simula la API (Stripe simulado) y revisa escritorio y
móvil: solo «Recoger en tienda», sin textos ni campos de envío, total con centavos
igual al subtotal, validación del comprador, `fulfillment` exacto `{"method":"pickup"}`
y `source: "manual"` solo en la línea manual de un pedido mixto.

```bash
npm run build && npx vite preview --host 127.0.0.1 --port <puerto>
FRONT=http://127.0.0.1:<puerto> node qa/e2e-solo-recoger-82.mjs /tmp/capturas
```
