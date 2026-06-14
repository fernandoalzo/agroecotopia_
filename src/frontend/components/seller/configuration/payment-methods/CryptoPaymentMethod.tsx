import React, { useState } from "react";
import { Control, Controller, useFieldArray } from "react-hook-form";
import { StoreConfigFormValues } from "../../schemas/store-config.schema";
import { motion, AnimatePresence } from "framer-motion";
import { Bitcoin, Settings2, ChevronDown, Plus, Trash2, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CryptoPaymentMethodProps {
  control: Control<StoreConfigFormValues>;
  isEnabled: boolean;
  availableCryptos: any[];
}

export function CryptoPaymentMethod({ control, isEnabled, availableCryptos }: CryptoPaymentMethodProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "paymentMethods.crypto.currencies",
  });

  const handleAddCrypto = () => {
    // Si no hay criptos disponibles, agregamos una genérica
    const defaultCrypto = availableCryptos[0];
    append({
      id: defaultCrypto?.id || "",
      name: defaultCrypto?.name || "Bitcoin",
      logo: defaultCrypto?.logo || "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
      addresses: [""],
    });
  };

  return (
    <motion.div 
      initial={false}
      animate={{ 
        borderColor: isEnabled ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border))",
        backgroundColor: isEnabled ? "hsl(var(--primary) / 0.02)" : "hsl(var(--card))"
      }}
      className="overflow-hidden border-2 rounded-2xl transition-colors duration-300 shadow-sm hover:shadow-md"
    >
      <div 
        className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300",
            isEnabled ? "bg-orange-500/10 text-orange-600" : "bg-muted text-muted-foreground"
          )}>
            <Bitcoin className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
              Criptomonedas
              {isEnabled && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                  Activo
                </span>
              )}
            </h4>
            <p className="text-sm text-muted-foreground font-medium">
              Acepta pagos en criptomonedas (Bitcoin, etc.).
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <Controller
            control={control}
            name="paymentMethods.crypto.enabled"
            render={({ field }) => (
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={field.value || false} 
                  onChange={(e) => {
                    field.onChange(e);
                    if (e.target.checked) setIsExpanded(true);
                  }} 
                />
                <div className="w-14 h-7 bg-muted/80 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500 shadow-inner"></div>
              </label>
            )}
          />
          <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2">
              <div className="p-5 rounded-xl bg-background/50 border border-border/50 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-foreground/80">
                    <Settings2 className="w-4 h-4 text-orange-500" />
                    <h5 className="font-semibold text-sm">Carteras configuradas</h5>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddCrypto}
                    className="text-xs font-semibold bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir Criptomoneda
                  </button>
                </div>
                
                {fields.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-xl">
                    No tienes ninguna billetera de criptomonedas configurada.
                  </div>
                )}

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border border-border rounded-xl p-4 space-y-4 bg-card/50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 w-1/2">
                          <Controller
                            control={control}
                            name={`paymentMethods.crypto.currencies.${index}.id`}
                            render={({ field: selectField }) => (
                              <CryptoSelect
                                value={selectField.value}
                                onChange={(newId) => {
                                  selectField.onChange(newId);
                                  const selected = availableCryptos.find(c => c.id === newId);
                                  if (selected) {
                                    update(index, {
                                      ...fields[index],
                                      id: selected.id,
                                      name: selected.name,
                                      logo: selected.logo || "",
                                      addresses: fields[index].addresses || [""]
                                    });
                                  }
                                }}
                                availableCryptos={availableCryptos}
                              />
                            )}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-destructive/70 hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-foreground">Direcciones de Billetera</label>
                        <CryptoAddressesList control={control} currencyIndex={index} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CryptoAddressesList({ control, currencyIndex }: { control: Control<StoreConfigFormValues>, currencyIndex: number }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `paymentMethods.crypto.currencies.${currencyIndex}.addresses` as any, // Cast to any to bypass TS inference limit on nested array
  });

  return (
    <div className="space-y-2">
      {fields.map((field, idx) => (
        <div key={field.id} className="flex gap-2">
          <Controller
            control={control}
            name={`paymentMethods.crypto.currencies.${currencyIndex}.addresses.${idx}` as any}
            render={({ field: inputField }) => (
              <input
                {...inputField}
                type="text"
                placeholder="Ej. bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                className="flex-1 bg-background border border-border/50 rounded-xl px-4 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-sm"
              />
            )}
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            className="text-muted-foreground hover:text-destructive transition-colors p-2 border border-border/50 rounded-xl bg-background"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append("")}
        className="text-xs text-orange-600 hover:text-orange-700 font-medium pt-1 inline-flex items-center gap-1"
      >
        <Plus className="w-3 h-3" /> Añadir otra dirección
      </button>
    </div>
  );
}

function CryptoSelect({ value = "", onChange, availableCryptos }: { value?: string, onChange: (id: string) => void, availableCryptos: any[] }) {
  const [isFocused, setIsFocused] = useState(false);
  const [search, setSearch] = useState("");
  
  const selectedCrypto = availableCryptos.find(c => c.id === value);
  const displayValue = isFocused ? search : (selectedCrypto ? `${selectedCrypto.name} (${selectedCrypto.symbol})` : "");

  const filtered = search.trim() === "" 
    ? availableCryptos 
    : availableCryptos.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3 text-muted-foreground/50">
          {selectedCrypto && !isFocused && selectedCrypto.logo ? (
            <img src={selectedCrypto.logo} alt="" className="w-4 h-4 object-contain" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        <input
          value={displayValue}
          onChange={(e) => {
            if (!isFocused) setIsFocused(true);
            setSearch(e.target.value);
          }}
          onFocus={() => { setIsFocused(true); setSearch(""); }}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className={`w-full bg-background pl-9 pr-4 py-2 text-sm font-medium focus:outline-none transition-all placeholder:text-muted-foreground/40
            ${isFocused
              ? 'rounded-t-xl border-border border-b-transparent focus:ring-0 shadow-[0_4px_20px_-10px_rgba(var(--orange-500),0.3)]'
              : 'rounded-xl border border-border/50 focus:ring-2 focus:ring-orange-500/30 shadow-sm'
            }`}
          placeholder="Buscar moneda..."
        />
      </div>
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute z-20 w-full top-full bg-card border border-border/50 border-t-0 rounded-b-xl shadow-[0_15px_30px_-15px_rgba(var(--orange-500),0.2)] max-h-48 overflow-y-auto custom-scrollbar p-1"
          >
            {filtered.length > 0 ? (
              filtered.map(c => {
                const isSelected = c.id === value;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur before click fires
                    onClick={() => {
                      onChange(c.id);
                      setIsFocused(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group text-left ${
                      isSelected
                        ? 'bg-orange-500/10 text-orange-600'
                        : 'hover:bg-secondary/70 text-foreground/90'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {c.logo ? <img src={c.logo} alt="" className="w-4 h-4 object-contain" /> : <div className="w-4 h-4" />}
                      {c.name} <span className="text-muted-foreground text-xs">{c.symbol}</span>
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-orange-600" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-sm text-muted-foreground">
                No se encontraron monedas.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
