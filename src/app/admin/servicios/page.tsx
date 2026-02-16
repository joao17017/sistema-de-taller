"use client";

import { useEffect, useState } from "react";
import { Wrench, Plus, Trash2, Package, Search, Tag, Info, Settings, Pencil, X } from "lucide-react";
import { formatMoneyShort, getCurrency } from "@/lib/currencies";

interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  linkedPartId?: string;
  linkedPartName?: string;
  linkedPartCost?: number;
}

interface PartItem {
  id: string;
  name: string;
  cost: number;
  stock: number;
}

interface Category {
  id: string;
  name: string;
}

export default function ServiciosPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [availableParts, setAvailableParts] = useState<PartItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currency, setCurrency] = useState("MXN");
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newPartId, setNewPartId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Management Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    Promise.all([
      fetch("/api/services").then(r => r.json()).catch(() => []),
      fetch("/api/parts").then(r => r.json()).catch(() => []),
      fetch("/api/categories").then(r => r.json()).catch(() => []),
      fetch("/api/settings").then(r => r.json()).catch(() => ({})),
    ]).then(([servicesData, partsData, catsData, settings]) => {
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setAvailableParts(Array.isArray(partsData) ? partsData : []);
      const cats = Array.isArray(catsData) ? catsData : [];
      setCategories(cats);
      if (cats.length > 0) setNewCategory(cats[0].name);
      if (settings?.currency) setCurrency(settings.currency);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handleEdit = (svc: ServiceItem) => {
    setEditingId(svc.id);
    setNewName(svc.name);
    setNewDesc(svc.description || "");
    setNewCategory(svc.category || (categories[0]?.name || "General"));
    setNewPrice(svc.basePrice);
    setNewPartId(svc.linkedPartId || "");
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName("");
    setNewDesc("");
    setNewCategory(categories[0]?.name || "General");
    setNewPrice(0);
    setNewPartId("");
  };

  const handleSubmit = async () => {
    if (!newName.trim() || newPrice < 0) return;
    setIsSubmitting(true);
    const linkedPart = availableParts.find(p => p.id === newPartId);

    const payload = {
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      category: newCategory,
      basePrice: newPrice,
      linkedPartId: linkedPart?.id || undefined,
      linkedPartName: linkedPart?.name || undefined,
      linkedPartCost: linkedPart?.cost || undefined,
    };

    try {
      const url = editingId ? `/api/services/${editingId}` : "/api/services";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (editingId) {
          setServices(services.map(s => s.id === editingId ? data : s));
        } else {
          setServices([...services, data]);
        }
        cancelEdit();
      }
    } catch { } finally {
      setIsSubmitting(false);
    }
  };

  const removeService = async (id: string) => {
    const svc = services.find(s => s.id === id);
    if (!confirm(`¿Eliminar el servicio "${svc?.name || ""}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (res.ok) setServices(services.filter(s => s.id !== id));
      if (editingId === id) cancelEdit();
    } catch { }
  };

  // Category Management
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName }),
      });
      if (res.ok) {
        const cat = await res.json();
        setCategories([...categories, cat]);
        setNewCatName("");
      }
    } catch { }
  };

  const removeCategory = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría? Los servicios asociados NO se eliminarán, pero quedarán sin categoría válida.")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) setCategories(categories.filter(c => c.id !== id));
    } catch { }
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "Todas" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalRevenue = services.reduce((s, svc) => s + svc.basePrice, 0);
  const withParts = services.filter(s => s.linkedPartId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Catálogo de Servicios
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona los servicios, precios y categorías
          </p>
        </div>
        <button
          onClick={() => setShowCatModal(true)}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Settings className="h-4 w-4" />
          Gestionar Categorías
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card !p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Total Servicios</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{services.length}</p>
          </div>
          <div className="bg-blue-50 p-2 rounded-lg">
            <Wrench className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="card !p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Valor del Catálogo</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatMoneyShort(totalRevenue, currency)}</p>
          </div>
          <div className="bg-emerald-50 p-2 rounded-lg">
            <Tag className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
        <div className="card !p-4 border-l-4 border-l-purple-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Con Piezas</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{withParts.length}</p>
          </div>
          <div className="bg-purple-50 p-2 rounded-lg">
            <Package className="h-5 w-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className={`card sticky top-6 transition-all ${editingId ? "ring-2 ring-primary-500 shadow-lg" : ""}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                {editingId ? <Pencil className="h-5 w-5 text-primary-600" /> : <Plus className="h-5 w-5 text-primary-600" />}
                {editingId ? "Editar Servicio" : "Nuevo Servicio"}
              </h3>
              {editingId && (
                <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input-field w-full"
                  placeholder="Ej: Formateo Windows 11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewCategory(cat.name)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${newCategory === cat.name
                        ? "bg-primary-50 border-primary-200 text-primary-700 font-medium"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-xs text-gray-400">No hay categorías. Crea una en &quot;Gestionar Categorías&quot;.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="input-field w-full resize-none"
                  rows={2}
                  placeholder="Detalles..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio al Cliente ({getCurrency(currency).symbol})</label>
                <input
                  type="number"
                  value={newPrice || ""}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="input-field w-full"
                  placeholder="0.00"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pieza Necesaria (Opcional)</label>
                <select
                  value={newPartId}
                  onChange={(e) => setNewPartId(e.target.value)}
                  className="input-field w-full text-sm"
                >
                  <option value="">Ninguna</option>
                  {availableParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
                {newPartId && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Se descontará 1 unidad del inventario.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!newName.trim() || newPrice < 0 || isSubmitting}
                className={`w-full py-2.5 flex items-center justify-center gap-2 mt-2 rounded-lg font-medium text-white transition-colors ${editingId ? "bg-primary-600 hover:bg-primary-700" : "bg-gray-900 hover:bg-gray-800"
                  }`}
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {editingId ? "Guardar Cambios" : "Agregar Catálogo"}
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancelar Edición
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 w-full border-none focus:ring-0 bg-transparent"
                placeholder="Buscar servicio..."
              />
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block self-center" />
            <div className="flex overflow-x-auto pb-1 sm:pb-0 gap-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategory("Todas")}
                className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${selectedCategory === "Todas" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
              >
                Todas
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${selectedCategory === cat.name ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {filteredServices.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium">No se encontraron servicios</h3>
                <p className="text-gray-500 text-sm">Prueba con otros términos de búsqueda o categoría</p>
              </div>
            ) : (
              filteredServices.map((svc) => (
                <div key={svc.id} className={`card group hover:shadow-md transition-all !p-4 ${editingId === svc.id ? "ring-2 ring-primary-500 bg-primary-50" : ""}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gray-100 text-gray-700`}>
                          {svc.category || "General"}
                        </span>
                        <h4 className="font-bold text-gray-900 truncate">{svc.name}</h4>
                      </div>

                      {svc.description && (
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{svc.description}</p>
                      )}

                      {svc.linkedPartName && (
                        <div className="flex items-center gap-1.5 text-xs bg-gray-50 w-fit px-2 py-1 rounded border border-gray-200">
                          <Package className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">Incluye: {svc.linkedPartName}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-emerald-600 font-medium">Margen: {formatMoneyShort(svc.basePrice - (svc.linkedPartCost || 0), currency)}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end justify-between h-full min-h-[60px]">
                      <span className="text-lg font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                        {formatMoneyShort(svc.basePrice, currency)}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(svc)}
                          className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Editar servicio"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeService(svc.id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Category Management Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900">Gestionar Categorías</h3>
              <button
                onClick={() => setShowCatModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Nueva categoría..."
                />
                <button
                  onClick={addCategory}
                  disabled={!newCatName.trim()}
                  className="btn-primary px-4"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">No hay categorías</p>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                      <button
                        onClick={() => removeCategory(cat.id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
