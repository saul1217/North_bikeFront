// Recorrido E2E local del trabajo #77: front (vite) + backend del PR #2 de NorthBike_back + Postgres local.
// Ver README, sección «Prueba E2E local». No usar contra producción ni contra el backend de pruebas.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";

const FRONT = process.env.FRONT;
const API = process.env.API;
const SHOTS = process.argv[2] ?? "/tmp/nb77/shots";
const sql = (query) => execFileSync("psql", ["-h", "127.0.0.1", "-Atc", query, process.env.DB ?? "vtest77"]).toString().trim();
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "OK  " : "FALLA"} ${name}${detail ? ` (${detail})` : ""}`);
}

async function adminToken() {
  const res = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "admin", password: "LocalAdmin-77-pass" }) });
  return (await res.json()).access_token;
}
async function api(path, method = "GET", body) {
  const token = await adminToken();
  const res = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json().catch(() => null) };
}

const browser = await chromium.launch();
const desktop = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await desktop.newPage();
page.on("pageerror", (error) => check("sin errores JS en la página", false, error.message));

async function login(user, pass) {
  await page.goto(`${FRONT}/admin/login`);
  await page.getByLabel(/usuario/i).fill(user);
  await page.getByLabel(/contraseña/i).fill(pass);
  await page.getByRole("button", { name: /entrar|iniciar/i }).click();
}

// 1. Sin sesión y no admin
await page.goto(`${FRONT}/admin/products`);
await page.waitForURL(/\/admin\/login/);
check("sin sesión /admin/products redirige al login", page.url().includes("/admin/login"));
await login("cajero77", "LocalCajero-77");
await page.waitForTimeout(800);
check("cajero no entra al panel", page.url().includes("/admin/login") && (await page.getByText(/no tiene acceso/i).count()) > 0);

// 2. Admin: sincronizados
await login("admin", "LocalAdmin-77-pass");
await page.waitForURL((url) => url.pathname === "/admin");
await page.getByRole("link", { name: "Productos online" }).first().click();
await page.waitForSelector('[data-testid="synced-product"]');
check("lista de sincronizados carga 10 productos", (await page.locator('[data-testid="synced-product"]').count()) === 10);
check("etiqueta Sincronizado con POS visible", (await page.getByText("Sincronizado con POS").count()) >= 10);
const orbea = page.locator('[data-testid="synced-product"]', { hasText: "Orbea Oiz" });
check("aviso serialized en la bici con número de serie", (await orbea.getByText("Con número de serie").count()) === 1 && (await orbea.getByText("Pendiente para LIVE").count()) === 1);
const rekon = page.locator('[data-testid="synced-product"]', { hasText: "Rekon" });
check("aviso low_stock en producto con existencia 0", (await rekon.getByText("Inventario bajo").count()) === 1);
check("leyenda aclara que no es protección automática", (await page.getByText(/no son una protección automática/).count()) === 1);
await page.screenshot({ path: `${SHOTS}/01-sincronizados-escritorio.png`, fullPage: true });

await page.getByPlaceholder("Nombre, SKU, marca o código").fill("maxxis");
await page.waitForTimeout(900);
check("búsqueda 'maxxis' deja 2 productos", (await page.locator('[data-testid="synced-product"]').count()) === 2);
await page.getByPlaceholder("Nombre, SKU, marca o código").fill("");
await page.getByLabel("Publicación").selectOption("true");
await page.waitForTimeout(900);
check("filtro Publicados sin publicados = lista vacía", (await page.getByText(/No hay productos del POS/).count()) === 1);
await page.getByLabel("Publicación").selectOption("");
await page.waitForTimeout(900);

// Publicar Trek (200 real del backend)
const trek = page.locator('[data-testid="synced-product"]', { hasText: "Trek Marlin" });
let patchBody = null;
page.on("request", (request) => { if (request.method() === "PATCH" && request.url().includes("/online")) patchBody = request.postData(); });
const [resp] = await Promise.all([
  page.waitForResponse((r) => r.url().includes("/products/pos-002/online")),
  trek.getByRole("switch").click(),
]);
await page.waitForTimeout(200);
check("PATCH online manda booleano real", patchBody === '{"onlineEnabled":true}', patchBody);
check("publicar Trek: 200 y la fila cambia a Publicado", resp.status() === 200 && (await trek.getByText("Publicado", { exact: true }).count()) === 1 && (await trek.getByRole("switch").getAttribute("aria-checked")) === "true");
check("publicación persistida en la base", sql("select \"onlineEnabled\" from products where id='pos-002'") === "t");
// Publicar casco con variantes y Rekon agotado
for (const name of ["Casco Giro", "Rekon"]) {
  const row = page.locator('[data-testid="synced-product"]', { hasText: name });
  await Promise.all([page.waitForResponse((r) => r.url().includes("/online") && r.request().method() === "PATCH"), row.getByRole("switch").click()]);
}

// Error del PATCH sin falso positivo (500 simulado)
const tire = page.locator('[data-testid="synced-product"]', { hasText: "Minion DHF" });
await page.route("**/products/pos-004/online", (route) => route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"Error simulado"}' }));
await tire.getByRole("switch").click();
await tire.getByRole("alert").waitFor();
check("PATCH con error: el interruptor sigue apagado y muestra error", (await tire.getByRole("switch").getAttribute("aria-checked")) === "false" && (await tire.getByText("No publicado").count()) === 1);
await page.unroute("**/products/pos-004/online");
check("producto con error sigue sin publicar en la base", sql("select \"onlineEnabled\" from products where id='pos-004'") === "f");

// 3. Manuales
await page.getByRole("tab", { name: /Manuales/ }).click();
await page.waitForTimeout(600);
check("aviso persistente de existencias manuales", (await page.getByText("Las existencias se administran aquí; las ventas físicas no se descuentan automáticamente.").count()) === 1);
await page.getByRole("button", { name: "Nuevo producto" }).click();
await page.getByRole("button", { name: "Crear producto" }).click();
check("alta vacía muestra los 4 errores requeridos", (await page.locator('form [role="alert"]').count()) >= 4);
const form = page.locator("form");
await form.getByLabel(/^Nombre/).fill("DEV-Jersey web");
await form.getByLabel(/^Categoría/).fill("ropa");
await form.getByLabel(/^SKU/).fill("NB-TREK-MARLIN-7");
await form.getByLabel(/^Precio/).fill("899.505");
await form.getByLabel(/^Stock/).fill("3");
await page.getByRole("button", { name: "Crear producto" }).click();
check("precio con 3 decimales rechazado en el front", (await page.getByText(/hasta dos decimales/).count()) === 1);
await form.getByLabel(/^Precio/).fill("899.50");
await page.getByPlaceholder("https://…/imagen.jpg").fill("http://inseguro.example/a.jpg");
await page.getByRole("button", { name: "Agregar URL" }).click();
check("URL http rechazada", (await page.getByText(/empiece con https/).count()) >= 1);
await page.getByPlaceholder("https://…/imagen.jpg").fill("https://placehold.co/600x600/png");
await page.getByRole("button", { name: "Agregar URL" }).click();
await Promise.all([page.waitForResponse((r) => r.url().endsWith("/manual-products") && r.request().method() === "POST"), page.getByRole("button", { name: "Crear producto" }).click()]);
await page.waitForTimeout(300);
check("SKU del POS: 409 con mensaje claro", (await page.getByText(/Ese SKU ya lo usa un producto del POS. Usa otro SKU/).count()) === 1);
await form.getByLabel(/^SKU/).fill("DEV-WEB-01");
await page.screenshot({ path: `${SHOTS}/02-alta-manual.png`, fullPage: true });
await Promise.all([page.waitForResponse((r) => r.url().endsWith("/manual-products") && r.request().method() === "POST" && r.status() === 201), page.getByRole("button", { name: "Crear producto" }).click()]);
await page.getByText("se creó sin publicar").waitFor();
check("alta crea sin publicar", sql("select published::text || ':' || stock || ':' || price from online_products where sku='DEV-WEB-01'") === "false:3:899.50");

// Segundo manual publicado al crear y tercero para retirar
for (const [name, sku, stock, publish] of [["DEV-Calcetas web", "DEV-WEB-02", "1", true], ["DEV-Retirar web", "DEV-WEB-03", "2", false]]) {
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await form.getByLabel(/^Nombre/).fill(name);
  await form.getByLabel(/^Categoría/).fill("accesorios");
  await form.getByLabel(/^SKU/).fill(sku);
  await form.getByLabel(/^Precio/).fill("150");
  await form.getByLabel(/^Stock/).fill(stock);
  if (publish) await form.getByRole("checkbox").check();
  await Promise.all([page.waitForResponse((r) => r.url().endsWith("/manual-products") && r.status() === 201), page.getByRole("button", { name: "Crear producto" }).click()]);
  await page.getByText(/se creó/).waitFor();
}
await page.waitForFunction(() => document.querySelectorAll('[data-testid="manual-product"]').length === 3);
check("lista manual muestra etiqueta Manual / No sincronizado", (await page.locator('[data-testid="manual-product"]').getByText("Manual / No sincronizado", { exact: true }).count()) === 3);

// Editar precio: el PATCH solo manda el campo cambiado
const jersey = page.locator('[data-testid="manual-product"]', { hasText: "DEV-Jersey web" });
await jersey.getByRole("button", { name: "Editar" }).click();
await form.getByLabel(/^Precio/).fill("950");
let manualPatch = null;
page.on("request", (request) => { if (request.method() === "PATCH" && /manual-products\/onl_[^/]+$/.test(request.url())) manualPatch = request.postData(); });
await Promise.all([page.waitForResponse((r) => r.request().method() === "PATCH"), page.getByRole("button", { name: "Guardar cambios" }).click()]);
await page.getByText("se actualizó").waitFor();
check("edición manda solo el precio", manualPatch === '{"price":950}', manualPatch);

// Stock cambiado en el servidor mientras se edita
await jersey.getByRole("button", { name: "Editar" }).click();
sql("update online_products set stock = 2 where sku='DEV-WEB-01'");
await form.getByLabel(/^Stock/).fill("5");
await page.getByRole("button", { name: "Guardar cambios" }).click();
await page.getByText(/La existencia cambió en el servidor de 3 a 2/).waitFor();
check("aviso si el stock cambió en el servidor y no se sobrescribe", sql("select stock from online_products where sku='DEV-WEB-01'") === "2");
await form.getByLabel(/^Stock/).fill("4");
await Promise.all([page.waitForResponse((r) => r.request().method() === "PATCH"), page.getByRole("button", { name: "Guardar cambios" }).click()]);
await page.getByText("se actualizó").waitFor();
check("segundo guardado aplica el stock revisado", sql("select stock from online_products where sku='DEV-WEB-01'") === "4");

// Subir imagen con storage sin configurar (local): muestra el error del backend
await jersey.getByRole("button", { name: "Editar" }).click();
await page.locator('input[type="file"]').setInputFiles({ name: "x.png", mimeType: "image/png", buffer: Buffer.from("89504e470d0a1a0a", "hex") });
await page.waitForTimeout(1500);
check("subida de imagen con error 500 muestra mensaje claro", (await page.getByText(/No se pudo subir la imagen/).count()) >= 1 && (await page.getByText(/Internal server error/i).count()) === 0);
await page.getByRole("button", { name: "Cancelar" }).click();

// Publicar Jersey y retirar el tercero
await Promise.all([page.waitForResponse((r) => r.url().endsWith("/published") && r.status() === 200), jersey.getByRole("switch").click()]);
check("publicar manual cambia con la respuesta", (await jersey.getByRole("switch").getAttribute("aria-checked")) === "true");
const retirar = page.locator('[data-testid="manual-product"]', { hasText: "DEV-Retirar web" });
await retirar.getByRole("button", { name: "Retirar" }).click();
check("retiro pide confirmación y avisa de pedidos históricos", (await retirar.getByText(/pedidos históricos no se borran/).count()) === 1);
await Promise.all([page.waitForResponse((r) => r.request().method() === "DELETE"), retirar.getByRole("button", { name: "Sí, retirar" }).click()]);
await page.waitForTimeout(800);
check("retiro lógico: desaparece y queda deletedAt", (await page.locator('[data-testid="manual-product"]', { hasText: "DEV-Retirar web" }).count()) === 0 && sql("select (\"deletedAt\" is not null)::text from online_products where sku='DEV-WEB-03'") === "true");
await page.screenshot({ path: `${SHOTS}/03-manuales-escritorio.png`, fullPage: true });

// 4. Tienda pública
await page.goto(`${FRONT}/products`);
await page.waitForSelector("article");
const names = await page.locator("article a.font-display").allInnerTexts();
check("catálogo muestra POS publicados y manuales publicados", ["Trek Marlin 7 Gen 3", "DEV-Jersey web", "DEV-Calcetas web"].every((name) => names.includes(name)), names.join(" | "));
check("no aparecen no publicados ni retirados", !names.some((name) => /Minion DHF|Orbea|DEV-Retirar/.test(name)));
check("sin duplicados en el catálogo", new Set(names).size === names.length);
await page.screenshot({ path: `${SHOTS}/04-catalogo.png`, fullPage: true });

// 5. Carrito
await page.getByRole("link", { name: "DEV-Jersey web" }).first().click();
await page.getByRole("button", { name: /\+|Aumentar/ }).first().click().catch(() => {});
await page.getByRole("button", { name: "Agregar al carrito" }).click();
await page.waitForTimeout(800);
await page.goto(`${FRONT}/products`);
await page.getByRole("link", { name: "Trek Marlin 7 Gen 3" }).first().click();
await page.getByRole("button", { name: "Agregar al carrito" }).click();
await page.waitForTimeout(800);
await page.reload();
await page.waitForTimeout(800);
let cart = JSON.parse(await page.evaluate(() => localStorage.getItem("northbike-cart")));
check("carrito guarda source y lo conserva al recargar", cart.find((item) => item.productId.startsWith("onl_"))?.source === "manual" && cart.find((item) => item.productId === "pos-002")?.source === "pos", JSON.stringify(cart.map((i) => [i.productId, i.source, i.quantity])));

// Checkout: payload mixto (respuesta simulada para no llamar a Stripe)
let checkoutBody = null;
await page.route("**/checkout/session", async (route) => { checkoutBody = JSON.parse(route.request().postData()); await route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"Simulado: sin Stripe en local"}' }); });
async function fillCheckout() {
  await page.goto(`${FRONT}/checkout`);
  await page.locator("#checkout-name").fill("DEV Cliente");
  await page.locator("#checkout-email").fill("dev@example.com");
  await page.locator("#checkout-phone").fill("6141234567");
}
await fillCheckout();
await page.getByRole("button", { name: /Continuar al pago/ }).click();
await page.waitForTimeout(800);
const manualId = cart.find((item) => item.source === "manual").productId;
check("checkout mixto: manual con source manual, POS sin source y sin importes", JSON.stringify(checkoutBody.items) === JSON.stringify([{ productId: manualId, quantity: cart.find((i) => i.source === "manual").quantity, source: "manual" }, { productId: "pos-002", quantity: 1 }]), JSON.stringify(checkoutBody.items));
await page.screenshot({ path: `${SHOTS}/05-checkout.png`, fullPage: true });

// Carrito anterior sin source: se interpreta como POS
await page.evaluate(() => localStorage.setItem("northbike-cart", JSON.stringify([{ productId: "pos-002", slug: "x", name: "Trek Marlin 7 Gen 3", image: "", price: 1, quantity: 1, maxStock: 4 }])));
await fillCheckout();
await page.getByRole("button", { name: /Continuar al pago/ }).click();
await page.waitForTimeout(800);
check("carrito antiguo (sin source) va como POS", JSON.stringify(checkoutBody.items) === '[{"productId":"pos-002","quantity":1}]', JSON.stringify(checkoutBody.items));
cart = JSON.parse(await page.evaluate(() => localStorage.getItem("northbike-cart")));
check("carrito antiguo queda normalizado con source pos", cart[0].source === "pos");

// Solo manual
await page.evaluate((id) => localStorage.setItem("northbike-cart", JSON.stringify([{ productId: id, source: "manual", slug: "x", name: "DEV-Jersey web", image: "", price: 950, quantity: 2, maxStock: 4 }])), manualId);
await fillCheckout();
await page.getByRole("button", { name: /Continuar al pago/ }).click();
await page.waitForTimeout(800);
check("checkout solo manual", JSON.stringify(checkoutBody.items) === JSON.stringify([{ productId: manualId, quantity: 2, source: "manual" }]));
await page.unroute("**/checkout/session");

// 409 reales del backend: producto retirado y falta de stock
const calcetasId = sql("select id from online_products where sku='DEV-WEB-02'");
await page.evaluate(([j, c]) => localStorage.setItem("northbike-cart", JSON.stringify([
  { productId: j, source: "manual", slug: "x", name: "DEV-Jersey web", image: "", price: 950, quantity: 2, maxStock: 4 },
  { productId: c, source: "manual", slug: "y", name: "DEV-Calcetas web", image: "", price: 150, quantity: 1, maxStock: 1 },
])), [manualId, calcetasId]);
await fillCheckout();
await api(`/admin/ecommerce/manual-products/${calcetasId}/published`, "PATCH", { published: false });
const [r409] = await Promise.all([page.waitForResponse((r) => r.url().includes("/checkout/session")), page.getByRole("button", { name: /Continuar al pago/ }).click()]);
await page.getByRole("button", { name: "Quitar del carrito" }).waitFor();
check("409 producto despublicado: indica el artículo y permite quitarlo", r409.status() === 409 && (await page.getByText(/DEV-Calcetas web.*ya no está disponible/).count()) === 1);
await page.screenshot({ path: `${SHOTS}/06-checkout-409.png`, fullPage: true });
await page.getByRole("button", { name: "Quitar del carrito" }).click();
sql(`update online_products set stock = 1 where id='${manualId}'`);
const [r409b] = await Promise.all([page.waitForResponse((r) => r.url().includes("/checkout/session")), page.getByRole("button", { name: /Continuar al pago/ }).click()]);
await page.getByRole("button", { name: "Ajustar a 1" }).waitFor();
check("409 falta de stock: muestra mensaje del backend y ofrece ajustar", r409b.status() === 409 && (await page.getByText(/No hay suficiente stock de DEV-Jersey web/).count()) === 1);
await page.getByRole("button", { name: "Ajustar a 1" }).click();
cart = JSON.parse(await page.evaluate(() => localStorage.getItem("northbike-cart")));
check("carrito corregido: queda 1 pieza del manual", cart.length === 1 && cart[0].quantity === 1 && cart[0].source === "manual");
check("los 409 no movieron inventario", sql(`select stock from online_products where id='${manualId}'`) === "1");

// 6. Pedidos
await page.goto(`${FRONT}/admin/orders`);
await page.waitForSelector("table");
check("lista de pedidos marca Mixto y Manual", (await page.locator("td span", { hasText: /^Mixto$/ }).count()) === 1 && (await page.locator("td span", { hasText: /^Manual$/ }).count()) === 1);
await page.goto(`${FRONT}/admin/orders/web_dev_mixto`);
await page.getByText("Total del pedido", { exact: true }).waitFor();
const detail = await page.locator("main").innerText();
check("pedido mixto: total ecommerce 2,049.50 y venta de caja solo 1,150.00", /Total del pedido\s*\$2,049\.50/.test(detail) && /solo incluye los artículos sincronizados con el POS \(\$1,150\.00\)/.test(detail));
check("líneas identificadas por fuente", (await page.getByText("Manual / no sincronizado").count()) === 1 && (await page.getByText("Sincronizado con POS").count()) === 1);
await page.screenshot({ path: `${SHOTS}/07-pedido-mixto.png`, fullPage: true });
await page.goto(`${FRONT}/admin/orders/web_dev_manual`);
await page.getByText("Total del pedido", { exact: true }).waitFor();
check("pedido solo manual: aclara que no hay venta de caja", (await page.getByText(/no generan venta de caja/).count()) === 1);

// 7. Móvil
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const m = await mobile.newPage();
await m.goto(`${FRONT}/admin/login`);
await m.getByLabel(/usuario/i).fill("admin");
await m.getByLabel(/contraseña/i).fill("LocalAdmin-77-pass");
await m.getByRole("button", { name: /entrar|iniciar/i }).click();
await m.waitForURL((url) => url.pathname === "/admin");
await m.getByRole("navigation", { name: "Secciones del panel" }).getByRole("link", { name: "Productos online" }).click();
await m.waitForSelector('[data-testid="synced-product"]');
const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check("móvil: menú del panel llega a productos y no hay scroll horizontal", overflow <= 1, `overflow ${overflow}px`);
await m.screenshot({ path: `${SHOTS}/08-sincronizados-movil.png`, fullPage: true });
await m.getByRole("tab", { name: /Manuales/ }).click();
await m.waitForSelector('[data-testid="manual-product"]');
await m.screenshot({ path: `${SHOTS}/09-manuales-movil.png`, fullPage: true });
await m.goto(`${FRONT}/products`);
await m.waitForSelector("article");
await m.screenshot({ path: `${SHOTS}/10-catalogo-movil.png` });

await browser.close();
const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones OK`);
process.exit(failed.length ? 1 : 0);
