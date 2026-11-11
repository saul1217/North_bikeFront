# Envíos a domicilio en el checkout (#80)

North Bike ofrece **recoger en tienda** y **envío a domicilio**. Esto corrige la
decisión del #78 de lanzar solo con recogida: se revierte esa decisión, no la
funcionalidad de envío.

## Política de envío encontrada

Se buscó en `North_bikeFront`, `NorthBike_back` (incluida la rama del PR #3) y
en ControlVersiones: **no existe** ninguna tarifa, zona de cobertura,
paquetería, umbral de envío gratis ni cotizador. El backend guardaba
`shippingTotal = 0` en todos los pedidos. Por eso no se inventa ningún importe.

Pregunta de negocio pendiente: **¿el envío se cobra con tarifa fija, por zona
(¿cuáles y cuánto cada una?) o con cotización por pedido?** Y si hay envío
gratis, ¿a partir de qué monto o con qué regla?

## Cómo funciona hoy

| Caso | Front | Backend (parche `qa/correccion-envios-80/back/`) |
|---|---|---|
| Recoger en tienda | Sin dirección. Resumen: «Envío: No aplica», total = subtotal. Va a Stripe. | `shippingTotal 0`, total = subtotal. |
| Envío sin tarifa | Pide y valida la dirección. Resumen: envío y total «Por confirmar» y un aviso. Al enviar **no** crea la sesión de pago. | 400 `SHIPPING_RATE_PENDING` antes de apartar inventario, crear orden o abrir Stripe (también por API directa). |
| Envío con tarifa (futuro) | Muestra el importe que dé el servidor y el total final antes de ir a Stripe. Un envío en $0 solo se acepta si el servidor lo marca como gratis por regla. | `shippingCentsFor` calcula los centavos; entran a `shippingTotal`, `total` y una línea «Envío a domicilio» en Stripe, así el webhook compara el mismo total. |

El cliente nunca manda importes: el cuerpo del checkout solo lleva artículos,
datos del cliente y método/dirección. El backend descarta campos extra.

## Qué falta para cobrar envíos

1. Respuesta del negocio a la pregunta de arriba.
2. Backend: implementar la regla en `shippingCentsFor` (con zona/CP si aplica) y
   un endpoint de cotización para que el front muestre el importe antes de pagar.
3. Front: sustituir `SHIPPING_QUOTE_PENDING` (`src/lib/checkout/shipping.ts`) por
   la cotización del servidor.

## Parches del #78 (`qa/pre-live-78/front/` del backend)

- `0001` (caché del catálogo y lint) y `0002` (precios con centavos): aplicados.
- `0003`: **no** se aplicó el bloqueo de envíos (`VITE_ECOMMERCE_SHIPPING_ENABLED`
  y ocultar la opción). Sí se aplicaron sus avisos del panel (LIVE y stock manual).

## Prueba E2E local

`qa/e2e-envios-80.mjs` simula la API con Playwright (16 comprobaciones):

```bash
npx vite --host 127.0.0.1 --port <puerto>
FRONT=http://127.0.0.1:<puerto> node qa/e2e-envios-80.mjs /tmp/capturas
```

Necesita `playwright` instalado donde se corra el script (no es dependencia del proyecto).
