import { type FormEvent, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Link2, Star, Trash2, Upload } from "lucide-react";
import {
  createAdminManualProduct,
  fetchAdminManualProduct,
  setAdminManualProductPublished,
  updateAdminManualProduct,
  uploadAdminProductImage,
} from "@/lib/api/admin";
import type { AdminManualProduct } from "@/lib/api/admin-types";
import { ApiRequestError } from "@/lib/api/types";
import {
  adminProductErrorMessage,
  emptyManualProductForm,
  formFromProduct,
  isHttpsUrl,
  MAX_MANUAL_IMAGES,
  toCreateInput,
  toUpdatePatch,
  validateManualProductForm,
  type ManualProductFormErrors,
  type ManualProductFormValues,
} from "@/lib/admin/manual-product-form";
import { inputClass } from "./shared";

const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];
const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  /** Producto a editar; sin él es un alta. */
  product?: AdminManualProduct;
  categories: string[];
  onCancel: () => void;
  onSaved: (product: AdminManualProduct, message: string) => void;
};

function FieldError({ message, id }: { message?: string; id: string }) {
  return message ? <p id={id} role="alert" className="mt-1 text-xs font-normal text-red-700">{message}</p> : null;
}

export function ManualProductForm({ product, categories, onCancel, onSaved }: Props) {
  const isEdit = Boolean(product);
  const [original, setOriginal] = useState<AdminManualProduct | undefined>(product);
  const [values, setValues] = useState<ManualProductFormValues>(product ? formFromProduct(product) : emptyManualProductForm);
  const [errors, setErrors] = useState<ManualProductFormErrors>({});
  const [formError, setFormError] = useState("");
  const [stockWarning, setStockWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof ManualProductFormValues>(field: K, value: ManualProductFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function addImage(url: string) {
    const value = url.trim();
    if (!isHttpsUrl(value)) {
      setErrors((current) => ({ ...current, images: "La imagen debe ser una URL que empiece con https://." }));
      return false;
    }
    if (values.images.length >= MAX_MANUAL_IMAGES) {
      setErrors((current) => ({ ...current, images: `Máximo ${MAX_MANUAL_IMAGES} imágenes.` }));
      return false;
    }
    if (!values.images.includes(value)) set("images", [...values.images, value]);
    return true;
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    if (!UPLOAD_TYPES.includes(file.type)) {
      setErrors((current) => ({ ...current, images: "Solo se permiten imágenes JPG, PNG o WebP." }));
      return;
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      setErrors((current) => ({ ...current, images: "La imagen no puede superar 5 MB." }));
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadAdminProductImage(file);
      addImage(uploaded.url);
    } catch (reason) {
      setErrors((current) => ({ ...current, images: adminProductErrorMessage(reason, "No se pudo subir la imagen. Puedes pegar una URL https.") }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const nextErrors = validateManualProductForm(values);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      if (!original) {
        const created = await createAdminManualProduct(toCreateInput(values));
        onSaved(created, created.published ? `${created.name} se creó y quedó publicado.` : `${created.name} se creó sin publicar.`);
        return;
      }

      const patch = toUpdatePatch(original, values);
      if (patch.stock !== undefined) {
        // Si un pedido apartó o liberó piezas mientras se editaba, no se
        // sobrescribe sin que el administrador lo vea.
        const fresh = await fetchAdminManualProduct(original.id);
        if (fresh.stock !== original.stock) {
          setOriginal(fresh);
          setStockWarning(`La existencia cambió en el servidor de ${original.stock} a ${fresh.stock} mientras editabas (un pedido en línea apartó o liberó piezas). Revisa el número y vuelve a guardar.`);
          return;
        }
      }
      let saved = original;
      if (Object.keys(patch).length) saved = await updateAdminManualProduct(original.id, patch);
      if (values.published !== saved.published) {
        try {
          saved = await setAdminManualProductPublished(original.id, values.published);
        } catch (reason) {
          setOriginal(saved);
          setValues(formFromProduct(saved));
          setFormError(`Los cambios se guardaron, pero no se pudo cambiar la publicación: ${adminProductErrorMessage(reason, "error desconocido")}`);
          return;
        }
      }
      onSaved(saved, `${saved.name} se actualizó.`);
    } catch (reason) {
      const message = adminProductErrorMessage(reason, "No se pudo guardar el producto.");
      if (reason instanceof ApiRequestError && reason.status === 409) setErrors((current) => ({ ...current, sku: message }));
      else setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = (field: keyof ManualProductFormValues) => `${inputClass} mt-1.5 ${errors[field] ? "border-red-500" : ""}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="border border-north-border bg-white" aria-label={isEdit ? "Editar producto manual" : "Nuevo producto manual"}>
      <div className="flex items-center justify-between gap-3 border-b border-north-border px-5 py-4">
        <div>
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 text-xs font-semibold text-north-primary hover:text-north-dark"><ArrowLeft className="h-3.5 w-3.5" /> Volver a la lista</button>
          <h3 className="mt-1 font-display text-2xl font-bold uppercase text-north-dark">{isEdit ? "Editar producto manual" : "Nuevo producto manual"}</h3>
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <label className="text-sm font-semibold text-north-dark md:col-span-2">
          Nombre *
          <input value={values.name} onChange={(event) => set("name", event.target.value)} maxLength={160} className={fieldClass("name")} aria-invalid={Boolean(errors.name)} aria-describedby="mp-name-error" />
          <FieldError id="mp-name-error" message={errors.name} />
        </label>
        <label className="text-sm font-semibold text-north-dark md:col-span-2">
          Descripción
          <textarea value={values.description} onChange={(event) => set("description", event.target.value)} maxLength={5000} rows={4} className={`${fieldClass("description")} h-auto py-2`} />
          <FieldError id="mp-description-error" message={errors.description} />
        </label>
        <label className="text-sm font-semibold text-north-dark">
          Categoría *
          <input value={values.category} onChange={(event) => set("category", event.target.value)} list="manual-product-categories" maxLength={80} placeholder="ropa, accesorios…" className={fieldClass("category")} aria-invalid={Boolean(errors.category)} aria-describedby="mp-category-error" />
          <datalist id="manual-product-categories">{categories.map((value) => <option key={value} value={value} />)}</datalist>
          <FieldError id="mp-category-error" message={errors.category} />
        </label>
        <label className="text-sm font-semibold text-north-dark">
          SKU <span className="font-normal text-north-muted">(opcional)</span>
          <input value={values.sku} onChange={(event) => set("sku", event.target.value)} maxLength={60} placeholder="WEB-JER-01" className={fieldClass("sku")} aria-invalid={Boolean(errors.sku)} aria-describedby="mp-sku-error" />
          <FieldError id="mp-sku-error" message={errors.sku} />
        </label>
        <label className="text-sm font-semibold text-north-dark">
          Precio MXN *
          <input value={values.price} onChange={(event) => set("price", event.target.value)} inputMode="decimal" placeholder="899.50" className={fieldClass("price")} aria-invalid={Boolean(errors.price)} aria-describedby="mp-price-error" />
          <FieldError id="mp-price-error" message={errors.price} />
        </label>
        <label className="text-sm font-semibold text-north-dark">
          Stock para la tienda online *
          <input value={values.stock} onChange={(event) => { set("stock", event.target.value); setStockWarning(""); }} inputMode="numeric" placeholder="10" className={fieldClass("stock")} aria-invalid={Boolean(errors.stock)} aria-describedby="mp-stock-error mp-stock-help" />
          <FieldError id="mp-stock-error" message={errors.stock} />
          <p id="mp-stock-help" className="mt-1 text-xs font-normal text-north-muted">
            {isEdit
              ? "Es lo disponible ahora: las piezas apartadas por pedidos pendientes ya están descontadas y regresan solas si el pedido expira o se cancela. Si lo cambias con pedidos pendientes, esas piezas se sumarán al número que escribas."
              : "Piezas que la tienda online puede vender. No es el inventario del POS."}
          </p>
          {stockWarning && <p role="alert" className="mt-2 border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-normal text-amber-900">{stockWarning}</p>}
        </label>

        <fieldset className="md:col-span-2">
          <legend className="text-sm font-semibold text-north-dark">Imágenes <span className="font-normal text-north-muted">(URLs https, hasta {MAX_MANUAL_IMAGES}; la primera es la principal)</span></legend>
          {values.images.length > 0 && (
            <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {values.images.map((url, index) => (
                <li key={url} className="border border-north-border bg-[#f8faf9] p-2">
                  <img src={url} alt={`Imagen ${index + 1}`} className="aspect-square w-full object-cover" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
                  <div className="mt-2 flex items-center justify-between gap-1 text-[11px]">
                    {index === 0 ? <span className="font-semibold text-north-primary">Principal</span> : (
                      <button type="button" onClick={() => set("images", [url, ...values.images.filter((item) => item !== url)])} className="inline-flex items-center gap-1 text-north-muted hover:text-north-dark"><Star className="h-3 w-3" /> Principal</button>
                    )}
                    <button type="button" onClick={() => set("images", values.images.filter((item) => item !== url))} className="text-north-muted hover:text-red-700" aria-label={`Quitar imagen ${index + 1}`}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">URL de imagen</span>
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-north-muted" />
              <input value={imageUrl} onChange={(event) => { setImageUrl(event.target.value); setErrors((current) => ({ ...current, images: undefined })); }} placeholder="https://…/imagen.jpg" className={`${inputClass} pl-9`} />
            </label>
            <button type="button" onClick={() => { if (addImage(imageUrl)) setImageUrl(""); }} className="inline-flex h-10 items-center justify-center gap-2 border border-north-border px-3 text-sm font-semibold text-north-dark hover:border-north-primary"><ImagePlus className="h-4 w-4" /> Agregar URL</button>
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="inline-flex h-10 items-center justify-center gap-2 border border-north-border px-3 text-sm font-semibold text-north-dark hover:border-north-primary disabled:opacity-50"><Upload className="h-4 w-4" /> {uploading ? "Subiendo…" : "Subir imagen"}</button>
            <input ref={fileRef} type="file" accept={UPLOAD_TYPES.join(",")} className="hidden" onChange={(event) => handleUpload(event.target.files?.[0])} />
          </div>
          <FieldError id="mp-images-error" message={errors.images} />
        </fieldset>

        <label className="flex items-start gap-3 text-sm text-north-dark md:col-span-2">
          <input type="checkbox" checked={values.published} onChange={(event) => set("published", event.target.checked)} className="mt-1 h-4 w-4" />
          <span>
            <strong>Disponible en tienda online</strong>
            <span className="block text-xs text-north-muted">{isEdit ? "Si lo desmarcas, deja de venderse en la tienda." : "Déjalo sin marcar para revisarlo antes de publicarlo."}</span>
          </span>
        </label>
      </div>

      {formError && <div role="alert" className="mx-5 mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{formError}</div>}
      <div className="flex flex-col-reverse gap-2 border-t border-north-border bg-[#f8faf9] px-5 py-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="h-10 border border-north-border bg-white px-4 text-sm font-semibold text-north-dark">Cancelar</button>
        <button type="submit" disabled={saving || uploading} className="h-10 bg-north-primary px-5 text-sm font-semibold text-white hover:bg-north-dark disabled:opacity-60">{saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}</button>
      </div>
    </form>
  );
}
