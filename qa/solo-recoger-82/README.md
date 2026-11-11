# #82: solo recoger en tienda

- `capturas/`: checkout en escritorio y móvil con Stripe simulado (`qa/e2e-solo-recoger-82.mjs`, 24/24).
- `back/0001-...patch`: cambio para `NorthBike_back` sobre la rama del PR #3
  (`bot/78-validacion-pre-live`, commit f111b29). `shipping` da siempre 400, se retira
  `ECOMMERCE_SHIPPING_ENABLED`, se ajustan pruebas (`test/launch-restrictions.spec.ts`,
  `qa/pre-live-78/e2e-backend.ts`) y docs (`tienda-online-publicacion.md`,
  `validacion-pre-live-78.md`). No se aplica solo: alguien con acceso lo integra al PR #3.

```bash
# en NorthBike_back, rama bot/78-validacion-pre-live
git am /ruta/a/North_bikeFront/qa/solo-recoger-82/back/0001-*.patch
npm test
```
