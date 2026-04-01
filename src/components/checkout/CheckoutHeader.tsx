"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Truck } from "lucide-react";
import { Translations } from "@/architecture/languages/types";

interface CheckoutHeaderProps {
  t: Translations;
}

export const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({ t }) => {
  return (
    <div className="mb-10">
      <Link 
        href="/cart" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-all mb-4 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        {t.checkout.backToCart}
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-display text-4xl font-black md:text-5xl lg:text-6xl text-foreground tracking-tight"
          >
            {t.checkout.title.split(' ')[0]} <span className="text-primary italic">{t.checkout.title.split(' ').slice(1).join(' ')}</span>
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mt-4"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary/70 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.cart.securePayment}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Truck className="w-3.5 h-3.5" />
              {t.cart.shipping}: {t.cart.toCalculate}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
