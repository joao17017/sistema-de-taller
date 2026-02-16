"use client";

import { useEffect, useState } from "react";
import { Package, Plus, Pencil, Trash2, AlertTriangle, Search, X, Check, ArrowUpDown, Filter, Save } from "lucide-react";
import { formatMoneyShort } from "@/lib/currencies";
import { useCurrency } from "@/components/providers/currency-provider";

interface Part {
  id: string;
  name: string;
  cost: number;
  stock: number;
  timesUsed?: number;
  createdAt: string;
  updatedAt: string;
}

type FilterType = "all" | "low" | "out";
type SortField = "name" | "stock" | "cost" | "value";
type SortOrder = "asc" | "desc";

export default function InventarioPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formName, setFormName] = useState("");
  const [formCost, setFormCost] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(3);
  const { currency } = useCurrency();

  useEffect(() => {
    Promise.all([
      fetch("/api/parts").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([partsData, settings]) => {
      setParts(Array.isArray(partsData) ? partsData : []);
      setLowStockThreshold(settings.lowStockThreshold || 3);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filtered = parts
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      if (filter === "low") return matchesSearch && p.stock <= lowStockThreshold && p.stock > 0;
      if (filter === "out") return matchesSearch && p.stock === 0;
      return matchesSearch;
    })
    .sort((a, b) => {
      let valA: number | string = "";
      let valB: number | string = "";

      switch (sortField) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "stock":
          valA = a.stock;
          valB = b.stock;
          break;
        case "cost":
          valA = a.cost;
          valB = b.cost;
          break;
        case "value":
          valA = a.cost * a.stock;
          valB = b.cost * b.stock;
          break;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const lowStockParts = parts.filter((p) => p.stock <= lowStockThreshold && p.stock > 0);
  const outOfStockParts = parts.filter((p) => p.stock === 0);

  // Calculate total inventory value
  const totalValue = parts.reduce((sum, part) => sum + (part.cost * part.stock), 0);
  const totalItems = parts.reduce((sum, part) => sum + part.stock, 0);

  const openAdd = () => {
    setEditingPart(null);
    setFormName("");
    setFormCost(0);
    setFormStock(0);
    setShowForm(true);
  };

  const openEdit = (part: Part) => {
    setEditingPart(part);
    setFormName(part.name);
    setFormCost(part.cost);
    setFormStock(part.stock);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);

    try {
      if (editingPart) {
        const res = await fetch(`/api/parts/${editingPart.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName, cost: formCost, stock: formStock }),
        });
        const updated = await res.json();
        setParts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const res = await fetch("/api/parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName, cost: formCost, stock: formStock }),
        });
        const created = await res.json();
        setParts((prev) => [...prev, created]);
      }
      setShowForm(false);
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta pieza del inventario?")) return;
    try {
      await fetch(`/api/parts/${id}`, { method: "DELETE" });
      setParts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Error al eliminar");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventario
          </h2>
          <p className="text-gray-500 text-sm mt-1">Gestión de piezas y refacciones</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4" />
          Agregar Pieza
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card !p-4 border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor Total</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{formatMoneyShort(totalValue, currency)}</span>
          </div>
        </div>
        <div className="card !p-4 border-l-4 border-l-purple-500">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Piezas</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{filtered.length}</span>
            <span className="text-sm text-gray-500">({totalItems} unidades)</span>
          </div>
        </div>
        <div className="card !p-4 border-l-4 border-l-yellow-500">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Bajo</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-yellow-700">{lowStockParts.length}</span>
            <span className="text-sm text-yellow-600">piezas</span>
          </div>
        </div>
        <div className="card !p-4 border-l-4 border-l-red-500">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Agotado</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-700">{outOfStockParts.length}</span>
            <span className="text-sm text-red-600">piezas</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
            placeholder="Buscar por nombre..."
          />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
          {(["all", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                }`}
            >
              {f === "all" ? "Todos" : f === "low" ? "Stock Bajo" : "Agotados"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0 shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors group"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Pieza
                    <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortField === "name" ? "opacity-100 text-primary-600" : "opacity-0 group-hover:opacity-50"}`} />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors group"
                  onClick={() => handleSort("cost")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Costo Unit.
                    <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortField === "cost" ? "opacity-100 text-primary-600" : "opacity-0 group-hover:opacity-50"}`} />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors group"
                  onClick={() => handleSort("stock")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Stock
                    <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortField === "stock" ? "opacity-100 text-primary-600" : "opacity-0 group-hover:opacity-50"}`} />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors group"
                  onClick={() => handleSort("value")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Valor Total
                    <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortField === "value" ? "opacity-100 text-primary-600" : "opacity-0 group-hover:opacity-50"}`} />
                  </div>
                </th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-sm font-medium">No se encontraron piezas</p>
                      <p className="text-xs text-gray-400">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((part) => {
                  const isLow = part.stock <= lowStockThreshold && part.stock > 0;
                  const isOut = part.stock === 0;
                  return (
                    <tr key={part.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isOut ? "bg-red-100 text-red-600" : isLow ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"
                            }`}>
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{part.name}</p>
                            {part.timesUsed && part.timesUsed > 0 && (
                              <p className="text-xs text-gray-500">Usada {part.timesUsed} veces</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap text-gray-600">
                        {formatMoneyShort(part.cost, currency)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isOut
                          ? "bg-red-50 text-red-700 border-red-200"
                          : isLow
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-green-50 text-green-700 border-green-200"
                          }`}>
                          {isOut && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {part.stock} unid.
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-gray-900">
                        {formatMoneyShort(part.cost * part.stock, currency)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(part)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(part.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPart ? "Editar Pieza" : "Registrar Nueva Pieza"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la pieza</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input-field w-full"
                  placeholder="Ej: Batería iPhone 11 Original"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Costo Unitario</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      value={formCost || ""}
                      onChange={(e) => setFormCost(Number(e.target.value))}
                      className="input-field w-full pl-7"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Inicial</label>
                  <input
                    type="number"
                    value={formStock || ""}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="input-field w-full"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              {formCost > 0 && formStock > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center text-sm">
                  <span className="text-blue-700">Valor total del inventario:</span>
                  <span className="font-bold text-blue-900">{formatMoneyShort(formCost * formStock, currency)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="btn-primary flex items-center gap-2 px-6"
              >
                {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Guardando..." : "Guardar Pieza"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
