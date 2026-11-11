// Recorrido E2E local del #82: el checkout solo permite «Recoger en tienda».
// La API se simula con page.route (Stripe simulado, no Stripe TEST real).
// Uso: FRONT=http://127.0.0.1:<puerto> node qa/e2e-solo-recoger-82.mjs [carpeta-capturas]
// Variable opcional CHROME con la ruta del navegador. Nunca contra producción ni el backend de pruebas.
import { chromium } from "playwright";

const FRONT = process.env.FRONT;
const SHOTS = process.argv[2] ?? "/tmp/nb82/shots";
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "OK  " : "FALLA"} ${name}${detail ? ` (${detail})` : ""}`);
}

// Pedido mixto con centavos: un manual (2 × $899.50) y uno del POS (1 × $350.25) = $2,149.25.
const cart = [
  { productId: "man-1", source: "manual", slug: "casco-dev", name: "DEV-Casco", image: "", price: 899.5, quantity: 2, maxStock: 5 },
  { productId: "pos-1", slug: "camara-dev", name: "DEV-Cámara", image: "", price: 350.25, quantity: 1, maxStock: 5 },
];
const FORBIDDEN = /env[ií]o a domicilio|por confirmar|gratis|tarifa|cotiza|calle y n[uú]mero|c[oó]digo postal/i;

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});

async function run(label, viewport, submit) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on("pageerror", (error) => check(`${label}: sin errores JS en la página`, false, error.message));
  const sessionRequests = [];
  await page.route((url) => url.pathname.startsWith("/api/") && url.port !== new URL(FRONT).port, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/checkout/session")) {
      sessionRequests.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ checkoutUrl: `${FRONT}/stripe-simulado`, orderId: "o1" }) });
    }
    // Sin respuesta del catálogo, el carrito conserva las líneas tal cual (precios con centavos).
    if (url.pathname.endsWith("/online-products") || url.pathname.endsWith("/products")) return route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.addInitScript((items) => { if (!window.sessionStorage.getItem("seeded")) { localStorage.setItem("northbike-cart", JSON.stringify(items)); window.sessionStorage.setItem("seeded", "1"); } }, cart);
  await page.goto(`${FRONT}/checkout`);
  const main = page.locator("main");
  const aside = page.locator("aside").filter({ hasText: "Tu pedido" });
  await aside.waitFor();

  const text = await main.innerText();
  check(`${label}: se muestra «Recoger en tienda»`, await page.getByTestId("fulfillment-pickup").isVisible());
  check(`${label}: no hay opciones para elegir entrega (radios)`, (await page.locator('input[name="fulfillment"]').count()) === 0);
  check(`${label}: sin textos de envío, tarifa ni dirección`, !FORBIDDEN.test(text), text.match(FORBIDDEN)?.[0]);
  check(`${label}: sin campos de dirección`, (await page.locator("#checkout-line1, #checkout-city, #checkout-state, #checkout-postalCode").count()) === 0);
  const summary = await aside.innerText();
  check(`${label}: resumen con subtotal y total $2,149.25`, /Subtotal\s*\$2,149\.25/.test(summary) && /Total\s*\$2,149\.25/.test(summary), summary.replace(/\s+/g, " ").slice(-200));
  check(`${label}: el resumen dice Entrega: Recoger en tienda`, /Entrega\s*Recoger en tienda/.test(summary));
  await page.screenshot({ path: `${SHOTS}/${label}-checkout.png`, fullPage: true });

  if (!submit) { await context.close(); return; }
  // Validación del comprador: sin datos no se pide la sesión.
  await page.getByRole("button", { name: /Continuar al pago/ }).click();
  check(`${label}: sin datos marca error en nombre`, await page.getByText("Escribe tu nombre completo").isVisible());
  check(`${label}: sin datos no se pidió sesión de pago`, sessionRequests.length === 0);
  await page.getByLabel("Nombre completo").fill("DEV Comprador");
  await page.getByLabel("Correo electrónico").fill("dev@example.com");
  await page.getByLabel("Teléfono").fill("+52 614 123 4567");
  await page.getByRole("button", { name: /Continuar al pago/ }).click();
  await page.waitForURL(/stripe-simulado/, { timeout: 5000 }).catch(() => undefined);
  const sent = sessionRequests[0];
  check(`${label}: se creó una sesión de pago`, sessionRequests.length === 1);
  check(`${label}: manda fulfillment exactamente {method:"pickup"}`, sent && JSON.stringify(sent.fulfillment) === '{"method":"pickup"}', JSON.stringify(sent?.fulfillment));
  check(`${label}: manda source manual solo en la línea manual`, sent && sent.items.find((i) => i.productId === "man-1")?.source === "manual" && !("source" in sent.items.find((i) => i.productId === "pos-1")), JSON.stringify(sent?.items));
  check(`${label}: el cliente no manda importes`, sent && !/"(price|total|shipping\w*|subtotal)"/.test(JSON.stringify(sent)), JSON.stringify(sent));
  await context.close();
}

await run("escritorio", { width: 1366, height: 900 }, true);
await run("movil", { width: 390, height: 844 }, true);
await browser.close();

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones OK`);
process.exit(failed.length ? 1 : 0);
