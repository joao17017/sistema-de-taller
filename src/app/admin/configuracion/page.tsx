"use client";

import { useEffect, useState } from "react";
import { Save, Settings, Download } from "lucide-react";
import { CURRENCIES } from "@/lib/currencies";
import { useToast } from "@/components/ui/ToastProvider";

interface BusinessSettings {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  logoUrl: string;
  brandColor: string;
  lowStockThreshold: number;
  currency: string;
  schedule: string;
  whatsappTemplateCreated: string;
  whatsappTemplateReady: string;
  countryCode: string;
}

export default function ConfiguracionPage() {
  const { toast, success, error } = useToast();
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: "",
    phone: "",
    email: "",
    address: "",
    whatsapp: "",
    logoUrl: "",
    brandColor: "#2563eb",
    lowStockThreshold: 3,
    currency: "MXN",
    schedule: "",
    whatsappTemplateCreated: "",
    whatsappTemplateReady: "",
    countryCode: "52",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      setSettings(data);
      setLoading(false);
    }).catch(() => {
      error("Error al cargar la configuración");
      setLoading(false);
    });
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: name === "lowStockThreshold" ? Number(value) : value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      error("La imagen es muy pesada. Máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setSettings(prev => ({ ...prev, logoUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      success("Configuración guardada correctamente");
      // Reload to ensure all components (CurrencyProvider, Layouts) pick up new settings
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success("Respaldo descargado correctamente");
    } catch {
      error("Error al descargar el respaldo");
    } finally {
      setDownloading(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuración
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Datos del negocio que aparecen en el sitio público
          </p>
        </div>
        <button
          onClick={handleBackup}
          disabled={downloading}
          className="btn-secondary flex items-center gap-2"
        >
          {downloading ? (
            <div className="h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Descargar Respaldo (ZIP)
        </button>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Información del Negocio</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del negocio
            </label>
            <input
              type="text"
              name="businessName"
              value={settings.businessName}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              name="address"
              value={settings.address}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de país (para WhatsApp)
            </label>
            <div className="flex gap-2">
              <div className="relative w-24 shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">+</span>
                <input
                  type="text"
                  name="countryCode"
                  value={settings.countryCode}
                  onChange={handleChange}
                  className="input-field pl-7"
                  placeholder="52"
                />
              </div>
              <input
                type="text"
                name="whatsapp"
                value={settings.whatsapp}
                onChange={handleChange}
                className="input-field flex-1"
                placeholder="Número de WhatsApp"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Ej: +52 para México, +1 para USA, +57 para Colombia
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horario de atención
            </label>
            <textarea
              name="schedule"
              value={settings.schedule}
              onChange={handleChange}
              rows={2}
              className="input-field resize-none"
              placeholder="Lun - Vie: 9:00 - 18:00&#10;Sábado: 9:00 - 14:00"
            />
            <p className="text-xs text-gray-400 mt-1">
              Una línea por cada horario. Se muestra en la página pública.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo del Negocio
            </label>
            <div className="flex items-start gap-4">
              {settings.logoUrl && (
                <div className="relative group w-24 h-24 shrink-0 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, logoUrl: "" }))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar logo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 mb-2"
                />
                <p className="text-xs text-gray-400">
                  Sube tu logo (PNG, JPG). Recomendado: fondo transparente. Máx 2MB.
                </p>
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">O pega una URL:</p>
                  <input
                    type="url"
                    name="logoUrl"
                    value={settings.logoUrl}
                    onChange={handleChange}
                    className="input-field text-xs py-1.5"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color de marca
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="brandColor"
                  value={settings.brandColor || "#2563eb"}
                  onChange={handleChange}
                  className="h-10 w-14 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  name="brandColor"
                  value={settings.brandColor || "#2563eb"}
                  onChange={handleChange}
                  className="input-field font-mono text-sm"
                  placeholder="#2563eb"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                name="currency"
                value={settings.currency || "MXN"}
                onChange={handleChange}
                className="input-field"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} — {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Se usará en precios, reportes y recibos
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umbral de stock bajo
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                value={settings.lowStockThreshold || 3}
                onChange={handleChange}
                className="input-field"
                min="1"
                placeholder="3"
              />
              <p className="text-xs text-gray-400 mt-1">
                Piezas con stock igual o menor se marcarán como &quot;stock bajo&quot;
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Plantillas de WhatsApp</h3>
        <p className="text-sm text-gray-500 mb-4">
          Personaliza los mensajes que se envían por WhatsApp. Variables disponibles: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{"\u007Bnombre\u007D"}</code> <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{"\u007Bequipo\u007D"}</code> <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{"\u007Borden\u007D"}</code>
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje al crear orden
            </label>
            <textarea
              name="whatsappTemplateCreated"
              value={settings.whatsappTemplateCreated}
              onChange={handleChange}
              rows={3}
              className="input-field resize-none"
              placeholder="Hola {nombre}, su equipo {equipo} ha sido recibido..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje cuando está listo
            </label>
            <textarea
              name="whatsappTemplateReady"
              value={settings.whatsappTemplateReady}
              onChange={handleChange}
              rows={3}
              className="input-field resize-none"
              placeholder="Hola {nombre}, su equipo {equipo} está listo para recoger..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>
    </div>
  );
}
