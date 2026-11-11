// Recorrido E2E local del #80: checkout con «Recoger en tienda» y «Envío a domicilio».
// La API se simula con page.route (no hay tarifa de envío autorizada en el backend todavía).
// Uso: FRONT=http://127.0.0.1:<puerto> node qa/e2e-envios-80.mjs [carpeta-capturas]
// Variable opcional CHROME con la ruta del navegador. Nunca contra producción ni el backend de pruebas.
import { chromium } from "playwright";

const FRONT = process.env.FRONT;
const SHOTS = process.argv[2] ?? "/tmp/nb80/shots";
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "OK  " : "FALLA"} ${name}${detail ? ` (${detail})` : ""}`);
}

const cart = [{ productId: "man-1", source: "manual", slug: "casco-dev", name: "DEV-Casco", image: "", price: 899.5, quantity: 2, maxStock: 5 }];

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();
page.on("pageerror", (error) => check("sin errores JS en la página", false, error.message));

const sessionRequests = [];
await page.route((url) => url.pathname.startsWith("/api/") && url.port !== new URL(FRONT).port, async (route) => {
  const url = new URL(route.request().url());
  if (url.pathname.endsWith("/checkout/session")) {
    sessionRequests.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ checkoutUrl: `${FRONT}/stripe-simulado`, orderId: "o1" }) });
  }
  // Sin respuesta de manuales, el carrito conserva la línea tal cual (precio con centavos).
  if (url.pathname.endsWith("/online-products")) return route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
  return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
});

await page.addInitScript((items) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("northbike-cart", JSON.stringify(items)); sessionStorage.setItem("seeded", "1"); } }, cart);
await page.goto(`${FRONT}/checkout`);
await page.getByLabel("Nombre completo").fill("DEV Comprador");
await page.getByLabel("Correo electrónico").fill("dev@example.com");
await page.getByLabel("Teléfono").fill("+52 614 123 4567");
const aside = page.locator("aside").filter({ hasText: "Tu pedido" });

// 1. Envío a domicilio visible y seleccionable
const shippingOption = page.getByText("Envío a domicilio", { exact: true });
check("la opción Envío a domicilio está disponible", await shippingOption.isVisible());
check("la opción Recoger en tienda está disponible", await page.getByText("Recoger en tienda", { exact: true }).isVisible());

// 2. Recoger: sin dirección, total = subtotal, sin «Gratis»
const pickupText = await aside.innerText();
check("recoger: total $1,799 sin cargo de envío", /Total\s*\$1,799/.test(pickupText) && /No aplica/.test(pickupText), pickupText.match(/Envío.*\n?.*/)?.[0]);
check("no aparece «Gratis» en el resumen", !/gratis/i.test(pickupText));
check("recoger: no se piden campos de dirección", !(await page.getByLabel("Calle y número").isVisible().catch(() => false)));

// 3. Envío: dirección obligatoria
await shippingOption.click();
await page.screenshot({ path: `${SHOTS}/01-envio-por-confirmar.png`, fullPage: true });
const shippingText = await aside.innerText();
check("envío: el resumen dice «Por confirmar» en envío y total", /Envío\s*Por confirmar/.test(shippingText) && /Total\s*Por confirmar/.test(shippingText));
check("envío: no muestra «Gratis» ni «$0»", !/gratis|\$0(?!\d)/i.test(shippingText));
check("envío: la opción dice «Costo de envío por confirmar»", await page.getByText("Costo de envío por confirmar.").isVisible());
await page.getByRole("button", { name: /Continuar al pago/ }).click();
check("envío: sin dirección marca error en calle", await page.getByText("Escribe la calle y el número.").isVisible());
check("envío: sin dirección no se pidió sesión de pago", sessionRequests.length === 0);

// 4. Envío con dirección válida pero sin tarifa: mensaje y sin cobro
await page.getByLabel("Calle y número").fill("DEV Calle 1 #23");
await page.getByLabel("Ciudad").fill("Chihuahua");
await page.getByLabel("Estado").fill("Chihuahua");
await page.getByLabel("Código postal").fill("31000");
await page.getByRole("button", { name: /Continuar al pago/ }).click();
await page.waitForTimeout(300);
check("envío sin tarifa: aparece el aviso al comprador", await page.getByRole("alert").filter({ hasText: "por confirmar" }).isVisible());
check("envío sin tarifa: no se creó sesión de Stripe", sessionRequests.length === 0, `peticiones=${sessionRequests.length}`);
check("envío sin tarifa: sigue en el checkout", new URL(page.url()).pathname === "/checkout");
await page.screenshot({ path: `${SHOTS}/02-envio-sin-tarifa-no-cobra.png`, fullPage: true });

// 5. Volver a recoger: el pago sí sale, sin dirección y sin montos del cliente
await page.getByText("Recoger en tienda", { exact: true }).click();
await page.getByRole("button", { name: /Continuar al pago/ }).click();
await page.waitForURL(/stripe-simulado/, { timeout: 5000 }).catch(() => undefined);
const sent = sessionRequests[0];
check("recoger: se creó la sesión de pago", sessionRequests.length === 1);
check("recoger: no manda dirección", sent && sent.fulfillment.method === "pickup" && !sent.fulfillment.address);
check("el cliente no manda importes (ni envío ni total)", sent && !JSON.stringify(sent).match(/shipping(Total|Cost)|"total"|"price"/), JSON.stringify(sent));

// 6. Móvil
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mpage = await mobile.newPage();
await mpage.route((url) => url.pathname.startsWith("/api/") && url.port !== new URL(FRONT).port, (route) => route.fulfill({ status: 200, contentType: "application/json", status: new URL(route.request().url()).pathname.endsWith("/online-products") ? 503 : 200, body: new URL(route.request().url()).pathname.endsWith("/online-products") ? "{}" : "[]" }));
await mpage.addInitScript((items) => localStorage.setItem("northbike-cart", JSON.stringify(items)), cart);
await mpage.goto(`${FRONT}/checkout`);
await mpage.getByText("Envío a domicilio", { exact: true }).click();
await mpage.screenshot({ path: `${SHOTS}/03-envio-movil.png`, fullPage: true });

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} verificaciones OK`);
process.exit(failed ? 1 : 0);
