import React, { useState } from "react";
import { Store as StoreType } from "@/types/store";
import { StoreTaxesSection } from "./StoreTaxesSection";

interface StoreConfigurationPanelProps {
  store: StoreType;
  actions: any;
}

export function StoreConfigurationPanel({ store, actions }: StoreConfigurationPanelProps) {
  const [activeTab, setActiveTab] = useState<"taxes" | "general">("taxes");

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab("taxes")}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "taxes"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            Impuestos
          </button>
          {/* Add more tabs here in the future if needed */}
        </nav>
      </div>

      <div className="pt-2">
        {activeTab === "taxes" && (
          <StoreTaxesSection store={store} actions={actions} />
        )}
      </div>
    </div>
  );
}
