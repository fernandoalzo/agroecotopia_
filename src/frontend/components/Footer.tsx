"use client";

import { Leaf } from "lucide-react";
import { config } from "@/config/config";
import { useLanguage } from "@/context/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-card py-8 md:py-12">
      <div className="container mx-auto flex flex-col items-center gap-3 px-4 text-center md:gap-4 md:px-6">
        <a href="#hero" className="flex items-center gap-1.5 font-display text-base font-bold md:gap-2 md:text-lg">
          <Leaf className="h-4 w-4 text-primary md:h-5 md:w-5" />
          <span className="text-foreground">
            {config.app.name}
          </span>
        </a>
        <p className="max-w-sm font-body text-xs text-muted-foreground md:max-w-md md:text-sm">
          {t.common.footerCatchphrase}
        </p>
        <p className="font-body text-[10px] text-muted-foreground md:text-xs">
          © {new Date().getFullYear()} {config.app.name}. {t.common.copyright}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
