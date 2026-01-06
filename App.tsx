
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Settings2, 
  Scale, 
  Droplets, 
  Thermometer, 
  Trash2, 
  Edit3, 
  Share2, 
  Download, 
  Upload,
  Info,
  Check,
  X,
  Sparkles,
  Share
} from 'lucide-react';
import { Filament, FilamentFilter } from './types';
import { suggestSettings } from './services/geminiService';

const STORAGE_KEY = 'filament_inventory_v1';

const App: React.FC = () => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [filter, setFilter] = useState<FilamentFilter>({ search: '', color: null, material: null });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState<Filament | null>(null);
  const [selectedFilamentId, setSelectedFilamentId] = useState<string | null>(null);
  const [usageAmount, setUsageAmount] = useState<number>(0);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFilaments(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse storage", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filaments));
  }, [filaments]);

  const filteredFilaments = useMemo(() => {
    return filaments.filter(f => {
      const matchesSearch = 
        f.brand.toLowerCase().includes(filter.search.toLowerCase()) || 
        f.model.toLowerCase().includes(filter.search.toLowerCase()) ||
        f.colorName.toLowerCase().includes(filter.search.toLowerCase());
      
      const matchesColor = !filter.color || f.color === filter.color;
      const matchesMaterial = !filter.material || f.model.toLowerCase() === filter.material.toLowerCase();

      return matchesSearch && matchesColor && matchesMaterial;
    });
  }, [filaments, filter]);

  const colorGroups = useMemo(() => {
    const groups: Record<string, { count: number, totalWeight: number, colorName: string }> = {};
    filaments.forEach(f => {
      if (!groups[f.color]) {
        groups[f.color] = { count: 0, totalWeight: 0, colorName: f.colorName };
      }
      groups[f.color].count += 1;
      groups[f.color].totalWeight += f.weightCurrent;
    });
    return groups;
  }, [filaments]);

  const handleSaveFilament = (filament: Filament) => {
    if (editingFilament) {
      setFilaments(prev => prev.map(f => f.id === filament.id ? filament : f));
    } else {
      setFilaments(prev => [...prev, filament]);
    }
    setIsModalOpen(false);
    setEditingFilament(null);
  };

  const handleDeleteFilament = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo filamento?')) {
      setFilaments(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleUpdateWeight = () => {
    if (selectedFilamentId && usageAmount > 0) {
      setFilaments(prev => prev.map(f => {
        if (f.id === selectedFilamentId) {
          return { ...f, weightCurrent: Math.max(0, f.weightCurrent - usageAmount) };
        }
        return f;
      }));
      setIsUsageModalOpen(false);
      setUsageAmount(0);
      setSelectedFilamentId(null);
    }
  };

  const shareInventory = async () => {
    const dataStr = JSON.stringify(filaments, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const file = new File([blob], 'magazzino_filamenti.json', { type: 'application/json' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Il mio Magazzino Filamenti 3D',
          text: 'Ecco il mio inventario aggiornato dei filamenti.'
        });
      } catch (err) {
        console.error("Errore condivisione:", err);
      }
    } else {
      // Fallback: download semplice se la condivisione non è supportata
      exportData();
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(filaments);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'magazzino_filamenti.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          if (window.confirm('L\'importazione sovrascriverà i dati attuali. Procedere?')) {
            setFilaments(json);
          }
        }
      } catch (err) {
        alert("File non valido");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Droplets className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">3D Filament Hub</h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={shareInventory}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center gap-1 text-sm font-semibold"
              title="Condividi con amici"
            >
              <Share2 size={18} />
              <span className="hidden sm:inline">Condividi</span>
            </button>
            <label className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-1 text-sm font-medium cursor-pointer">
              <Upload size={18} />
              <span className="hidden sm:inline">Importa</span>
              <input type="file" className="hidden" accept=".json" onChange={importData} />
            </label>
            <button 
              onClick={() => { setEditingFilament(null); setIsModalOpen(true); }}
              className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-100"
            >
              <Plus size={20} />
              <span className="hidden xs:inline">Aggiungi</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Settings2 size={20} className="text-indigo-500" />
            Riepilogo Colori
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {Object.entries(colorGroups).map(([hex, data]) => {
              const group = data as { count: number; totalWeight: number; colorName: string };
              return (
                <button
                  key={hex}
                  onClick={() => setFilter(prev => ({ ...prev, color: prev.color === hex ? null : hex }))}
                  className={`group relative flex flex-col items-center p-3 rounded-xl border transition-all ${
                    filter.color === hex ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div 
                    className="w-12 h-12 rounded-full border border-slate-200 mb-2 shadow-sm transition-transform group-hover:scale-110"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-xs font-bold text-slate-700 truncate w-full text-center">{group.colorName}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{group.totalWeight}g rimasti</span>
                  {filter.color === hex && (
                    <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              );
            })}
            {Object.keys(colorGroups).length === 0 && (
              <p className="text-slate-400 italic text-sm col-span-full py-4 text-center">Nessun filamento inserito</p>
            )}
          </div>
        </section>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cerca per marca, modello o colore..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm min-w-[150px]"
            value={filter.material || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, material: e.target.value || null }))}
          >
            <option value="">Tutti i materiali</option>
            <option value="PLA">PLA</option>
            <option value="PETG">PETG</option>
            <option value="ABS">ABS</option>
            <option value="ASA">ASA</option>
            <option value="TPU">TPU</option>
            <option value="Nylon">Nylon</option>
          </select>
          {(filter.search || filter.color || filter.material) && (
            <button 
              onClick={() => setFilter({ search: '', color: null, material: null })}
              className="text-indigo-600 font-medium hover:underline px-2"
            >
              Resetta filtri
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFilaments.map(filament => (
            <FilamentCard 
              key={filament.id} 
              filament={filament} 
              onUpdateWeight={(id) => { setSelectedFilamentId(id); setIsUsageModalOpen(true); }}
              onEdit={(f) => { setEditingFilament(f); setIsModalOpen(true); }}
              onDelete={handleDeleteFilament}
            />
          ))}
          {filteredFilaments.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center text-slate-400">
              <Droplets size={48} className="mb-4 opacity-20" />
              <p className="text-lg">Nessun filamento trovato con questi criteri</p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2024 3D Filament Hub • Il tuo magazzino digitale intelligente</p>
        </div>
      </footer>

      {isModalOpen && (
        <FilamentFormModal 
          filament={editingFilament} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveFilament} 
          isAiLoading={isAiLoading}
          setIsAiLoading={setIsAiLoading}
        />
      )}

      {isUsageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-slate-800">Registra Utilizzo</h3>
              <p className="text-sm text-slate-500">Quanti grammi hai consumato?</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <input 
                  type="number" 
                  autoFocus
                  className="w-full text-center text-4xl font-bold py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={usageAmount || ''}
                  onChange={(e) => setUsageAmount(Number(e.target.value))}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">g</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 250].map(val => (
                  <button 
                    key={val}
                    onClick={() => setUsageAmount(val)}
                    className="py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                  >
                    +{val}g
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3">
              <button 
                onClick={() => setIsUsageModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold transition-colors"
              >
                Annulla
              </button>
              <button 
                onClick={handleUpdateWeight}
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors shadow-lg shadow-indigo-200"
              >
                Aggiorna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilamentCard: React.FC<{ 
  filament: Filament; 
  onUpdateWeight: (id: string) => void; 
  onEdit: (f: Filament) => void;
  onDelete: (id: string) => void;
}> = ({ filament, onUpdateWeight, onEdit, onDelete }) => {
  const percentage = (filament.weightCurrent / filament.weightNew) * 100;
  const isLow = percentage < 20;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="h-2 w-full bg-slate-100 relative">
        <div 
          className={`h-full transition-all duration-1000 ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div 
              className="w-10 h-10 rounded-full border border-slate-200 shadow-inner" 
              style={{ backgroundColor: filament.color }}
              title={filament.colorName}
            />
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">{filament.brand}</h3>
              <p className="text-sm text-slate-500 font-medium">{filament.model} • {filament.colorName}</p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(filament)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><Edit3 size={16} /></button>
            <button onClick={() => onDelete(filament.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"><Trash2 size={16} /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Thermometer size={16} className="text-slate-400" />
            <span className="text-xs font-semibold">{filament.nozzleTemp}°C / {filament.bedTemp}°C</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Scale size={16} className="text-slate-400" />
            <span className="text-xs font-semibold">{filament.weightCurrent}g / {filament.weightNew}g</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Info size={16} className="text-slate-400" />
            <span className="text-xs font-semibold">Flow: {filament.flowRate}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Droplets size={16} className="text-slate-400" />
            <span className="text-xs font-semibold">PA: {filament.pressureAdvance}</span>
          </div>
        </div>

        <button 
          onClick={() => onUpdateWeight(filament.id)}
          className="w-full mt-2 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Registra Uso
        </button>
      </div>
    </div>
  );
};

const FilamentFormModal: React.FC<{
  filament: Filament | null;
  onClose: () => void;
  onSave: (f: Filament) => void;
  isAiLoading: boolean;
  setIsAiLoading: (v: boolean) => void;
}> = ({ filament, onClose, onSave, isAiLoading, setIsAiLoading }) => {
  const [formData, setFormData] = useState<Partial<Filament>>(filament || {
    id: crypto.randomUUID(),
    brand: '',
    model: 'PLA',
    color: '#000000',
    colorName: '',
    nozzleTemp: 200,
    bedTemp: 60,
    flowRate: 1.0,
    pressureAdvance: 0.02,
    weightNew: 1000,
    weightCurrent: 1000,
  });

  const handleAiSuggest = async () => {
    if (!formData.brand || !formData.model) {
      alert("Inserisci marca e materiale per i suggerimenti AI");
      return;
    }
    setIsAiLoading(true);
    const suggestion = await suggestSettings(formData.model, formData.brand);
    setIsAiLoading(false);
    if (suggestion) {
      setFormData(prev => ({
        ...prev,
        nozzleTemp: suggestion.nozzleTemp,
        bedTemp: suggestion.bedTemp,
        flowRate: suggestion.flowRate,
        pressureAdvance: suggestion.pressureAdvance
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.colorName) {
      alert("Compila i campi obbligatori!");
      return;
    }
    onSave(formData as Filament);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-indigo-50/50">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{filament ? 'Modifica' : 'Aggiungi'} Filamento</h3>
            <p className="text-sm text-slate-500 font-medium">Configura le proprietà del tuo materiale</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Dati Base</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Marca</label>
                <input 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="es. Bambu Lab, Prusa"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Modello/Materiale</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                >
                  <option>PLA</option>
                  <option>PLA+</option>
                  <option>PETG</option>
                  <option>ABS</option>
                  <option>ASA</option>
                  <option>TPU</option>
                  <option>Nylon</option>
                  <option>CPE</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Estetica e Peso</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Nome Colore</label>
                  <input 
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.colorName}
                    onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                    placeholder="es. Rosso Ciliegia"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Selettore</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer overflow-hidden"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Peso Nuovo (g)</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    value={formData.weightNew}
                    onChange={(e) => setFormData({ ...formData, weightNew: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Attuale (g)</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-indigo-600"
                    value={formData.weightCurrent}
                    onChange={(e) => setFormData({ ...formData, weightCurrent: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 relative">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Impostazioni Stampa</h4>
              <button 
                type="button"
                onClick={handleAiSuggest}
                disabled={isAiLoading}
                className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-all border border-indigo-200"
              >
                <Sparkles size={14} className={isAiLoading ? 'animate-spin' : ''} />
                {isAiLoading ? 'Ottimizzazione...' : 'Ottimizza con AI'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Ugello (°C)</label>
                <input 
                  type="number"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.nozzleTemp}
                  onChange={(e) => setFormData({ ...formData, nozzleTemp: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Piatto (°C)</label>
                <input 
                  type="number"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.bedTemp}
                  onChange={(e) => setFormData({ ...formData, bedTemp: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Flow Rate</label>
                <input 
                  type="number" step="0.01"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.flowRate}
                  onChange={(e) => setFormData({ ...formData, flowRate: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Pres. Adv.</label>
                <input 
                  type="number" step="0.001"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.pressureAdvance}
                  onChange={(e) => setFormData({ ...formData, pressureAdvance: Number(e.target.value) })}
                />
              </div>
            </div>
          </section>
        </form>

        <div className="p-8 bg-slate-50 border-t flex gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold transition-all"
          >
            Annulla
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-100"
          >
            {filament ? 'Aggiorna Filamento' : 'Salva Filamento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
