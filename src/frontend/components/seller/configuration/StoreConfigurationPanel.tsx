import React, { useState } from "react";
import { Store as StoreType } from "@/types/store";
import { StoreTaxesSection } from "./StoreTaxesSection";
import { StoreShippingSection } from "./StoreShippingSection";
import { StoreBodegasSection } from "./StoreBodegasSection";
import { StorePaymentSection } from "./StorePaymentSection";

interface StoreConfigurationPanelProps {
  store: StoreType;
  actions: any;
}

const TABS = [
  { id: "payment" as const, label: "Métodos de Pago" },
  { id: "taxes" as const, label: "Impuestos" },
  { id: "shipping" as const, label: "Envíos" },
  { id: "bodegas" as const, label: "Bodegas" },
];

export function StoreConfigurationPanel({ store, actions }: StoreConfigurationPanelProps) {
  const [activeTab, setActiveTab] = useState<"payment" | "taxes" | "shipping" | "bodegas">("payment");

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 relative">
      <div className="border-b border-border shrink-0">
        <nav className="-mb-px flex space-x-6" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-6 flex-1 min-h-0 flex flex-col">
        {activeTab === "taxes" && (
          <StoreTaxesSection store={store} actions={actions} />
        )}
        {activeTab === "shipping" && (
          <StoreShippingSection store={store} actions={actions} />
        )}
        {activeTab === "bodegas" && (
          <StoreBodegasSection store={store} actions={actions} />
        )}
        {activeTab === "payment" && (
          <StorePaymentSection store={store} actions={actions} />
        )}
      </div>
    </div>
  );
}
