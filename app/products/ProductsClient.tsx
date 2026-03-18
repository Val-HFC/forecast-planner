"use client";

import { useState, useRef } from "react";
import type { Product } from "../types";

const STORAGE_KEY = "forecast_products";

function calcCBM(l: number, w: number, h: number): number {
  if (!l || !w || !h) return 0;
  return parseFloat(((l * w * h) / 1_000_000).toFixed(4));
}

function emptyProduct(): Omit<Product, "cbmPerCarton"> & { cbmPerCarton?: number } {
  return {
    sku: "",
    name: "",
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
    weightKg: 0,
    unitsPerCarton: 1,
  };
}

function loadProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [form, setForm] = useState<Omit<Product, "cbmPerCarton">>(emptyProduct());
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cbmPreview = calcCBM(form.lengthCm, form.widthCm, form.heightCm);

  function updateField(field: keyof typeof form, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const product: Product = {
      ...form,
      cbmPerCarton: calcCBM(form.lengthCm, form.widthCm, form.heightCm),
    };
    let updated: Product[];
    if (editIdx !== null) {
      updated = products.map((p, i) => (i === editIdx ? product : p));
      setEditIdx(null);
    } else {
      updated = [...products, product];
    }
    setProducts(updated);
    saveProducts(updated);
    setForm(emptyProduct());
  }

  function handleEdit(idx: number) {
    const p = products[idx];
    setForm({
      sku: p.sku,
      name: p.name,
      lengthCm: p.lengthCm,
      widthCm: p.widthCm,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      unitsPerCarton: p.unitsPerCarton,
    });
    setEditIdx(idx);
  }

  function handleDelete(idx: number) {
    const updated = products.filter((_, i) => i !== idx);
    setProducts(updated);
    saveProducts(updated);
  }

  function exportCSV() {
    const header = "sku,name,lengthCm,widthCm,heightCm,weightKg,unitsPerCarton,cbmPerCarton";
    const rows = products.map((p) =>
      [p.sku, p.name, p.lengthCm, p.widthCm, p.heightCm, p.weightKg, p.unitsPerCarton, p.cbmPerCarton].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const imported: Product[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (cols.length < 7) continue;
        const l = parseFloat(cols[2]);
        const w = parseFloat(cols[3]);
        const h = parseFloat(cols[4]);
        imported.push({
          sku: cols[0].trim(),
          name: cols[1].trim(),
          lengthCm: l,
          widthCm: w,
          heightCm: h,
          weightKg: parseFloat(cols[5]),
          unitsPerCarton: parseInt(cols[6]),
          cbmPerCarton: cols[7] ? parseFloat(cols[7]) : calcCBM(l, w, h),
        });
      }
      const updated = [...products, ...imported];
      setProducts(updated);
      saveProducts(updated);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  const numField = (field: keyof typeof form, label: string, step = "0.01") => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <input
        type="number"
        step={step}
        min="0"
        value={(form as Record<string, number | string>)[field] || ""}
        onChange={(e) => updateField(field, parseFloat(e.target.value) || 0)}
        className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
        required
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="text-sm bg-white border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50">
            Export CSV
          </button>
          <button onClick={() => fileRef.current?.click()} className="text-sm bg-white border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50">
            Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
        </div>
      </div>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3 text-sm text-gray-700">{editIdx !== null ? "Edit Product" : "Add Product"}</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-40"
              required
            />
          </div>
          {numField("lengthCm", "Length (cm)")}
          {numField("widthCm", "Width (cm)")}
          {numField("heightCm", "Height (cm)")}
          {numField("weightKg", "Weight (kg)")}
          {numField("unitsPerCarton", "Units/Carton", "1")}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">CBM/Carton</label>
            <div className="border border-gray-200 bg-gray-50 rounded px-2 py-1 text-sm w-24 text-gray-500">
              {cbmPreview.toFixed(4)}
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-1.5 text-sm hover:bg-blue-700 self-end">
            {editIdx !== null ? "Update" : "Add"}
          </button>
          {editIdx !== null && (
            <button type="button" onClick={() => { setEditIdx(null); setForm(emptyProduct()); }} className="text-sm text-gray-500 hover:text-gray-700 self-end">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      {products.length === 0 ? (
        <p className="text-gray-400 text-sm">No products yet. Add one above or import a CSV.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {["SKU", "Name", "L (cm)", "W (cm)", "H (cm)", "Weight (kg)", "Units/Ctn", "CBM/Ctn", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono">{p.sku}</td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.lengthCm}</td>
                  <td className="px-4 py-2">{p.widthCm}</td>
                  <td className="px-4 py-2">{p.heightCm}</td>
                  <td className="px-4 py-2">{p.weightKg}</td>
                  <td className="px-4 py-2">{p.unitsPerCarton}</td>
                  <td className="px-4 py-2 font-mono">{p.cbmPerCarton.toFixed(4)}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleEdit(i)} className="text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(i)} className="text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
