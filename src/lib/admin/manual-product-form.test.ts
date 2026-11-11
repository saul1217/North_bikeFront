import { describe, expect, it } from "vitest";
import type { AdminManualProduct } from "@/lib/api/admin-types";
import { ApiRequestError } from "@/lib/api/types";
import {
  adminProductErrorMessage,
  emptyManualProductForm,
  formFromProduct,
  toCreateInput,
  toUpdatePatch,
  validateManualProductForm,
} from "./manual-product-form";

const valid = { ...emptyManualProductForm, name: "Jersey 2026", category: "ropa", price: "899.50", stock: "10" };

const saved: AdminManualProduct = {
  id: "onl_1", source: "manual", syncsWithPos: false, sku: "WEB-1", name: "Jersey", description: null, category: "ropa",
  price: 899.5, stock: 10, image: null, images: [], published: false, createdAt: "", updatedAt: "",
};

describe("validación del producto manual", () => {
  it("acepta el mínimo requerido", () => {
    expect(validateManualProductForm(valid)).toEqual({});
  });

  it("exige nombre, categoría, precio y stock", () => {
    expect(Object.keys(validateManualProductForm(emptyManualProductForm)).sort()).toEqual(["category", "name", "price", "stock"]);
  });

  it("precio no negativo con hasta dos decimales; stock entero no negativo", () => {
    expect(validateManualProductForm({ ...valid, price: "-1" }).price).toBeTruthy();
    expect(validateManualProductForm({ ...valid, price: "10.999" }).price).toBeTruthy();
    expect(validateManualProductForm({ ...valid, price: "0" }).price).toBeUndefined();
    expect(validateManualProductForm({ ...valid, stock: "1.5" }).stock).toBeTruthy();
    expect(validateManualProductForm({ ...valid, stock: "-2" }).stock).toBeTruthy();
    expect(validateManualProductForm({ ...valid, stock: "0" }).stock).toBeUndefined();
  });

  it("valida SKU e imágenes https", () => {
    expect(validateManualProductForm({ ...valid, sku: "con espacio" }).sku).toBeTruthy();
    expect(validateManualProductForm({ ...valid, images: ["http://x.com/a.jpg"] }).images).toBeTruthy();
    expect(validateManualProductForm({ ...valid, images: ["https://x.com/a.jpg"] }).images).toBeUndefined();
  });
});

describe("cuerpos para el backend", () => {
  it("el alta no publica si no se marca y omite SKU vacío", () => {
    expect(toCreateInput(valid)).toEqual({ name: "Jersey 2026", category: "ropa", price: 899.5, stock: 10, images: [], published: false });
  });

  it("la edición solo manda lo que cambió (no reescribe stock)", () => {
    const form = formFromProduct(saved);
    expect(toUpdatePatch(saved, form)).toEqual({});
    expect(toUpdatePatch(saved, { ...form, price: "950" })).toEqual({ price: 950 });
    expect(toUpdatePatch(saved, { ...form, sku: "" })).toEqual({ sku: null });
  });
});

describe("mensajes de error", () => {
  it("explica el SKU duplicado", () => {
    const error = new ApiRequestError("Ese SKU ya lo usa un producto del POS", { kind: "http", status: 409 });
    expect(adminProductErrorMessage(error, "x")).toContain("Usa otro SKU");
  });

  it("403 y 404 tienen mensaje propio", () => {
    expect(adminProductErrorMessage(new ApiRequestError("Forbidden", { kind: "http", status: 403 }), "x")).toContain("permiso");
    expect(adminProductErrorMessage(new ApiRequestError("Not found", { kind: "http", status: 404 }), "x")).toContain("ya no existe");
  });
});
