import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sprout, ArrowLeft, Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    // Utilizamos 'fixed inset-0 z-[9999]' para cubrir por completo el Navbar global y cualquier otro elemento
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="text-center space-y-6 max-w-2xl mx-auto my-auto py-12">
        {/* Animated Sprout Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute -inset-4 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full relative shadow-sm border border-green-200 dark:border-green-800">
              <Sprout className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-7xl font-extrabold tracking-tighter text-foreground">404</h1>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Página no encontrada</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto mt-4">
            Parece que te has perdido en el campo. La página que buscas no existe o ha sido movida a otro cultivo.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button asChild size="lg" className="w-full sm:w-auto gap-2 group">
            <Link href="/">
              <Home className="w-4 h-4 transition-transform group-hover:scale-110" />
              Volver al inicio
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto gap-2 group">
            <Link href="/products">
              <Search className="w-4 h-4 transition-transform group-hover:scale-110" />
              Explorar productos
            </Link>
          </Button>
        </div>
        
        {/* Help Links */}
        <div className="pt-12 text-sm text-muted-foreground flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/contacto" className="hover:text-primary hover:underline transition-colors">
            Soporte
          </Link>
          <Link href="/comunidad" className="hover:text-primary hover:underline transition-colors">
            Comunidad
          </Link>
          <Link href="/nosotros" className="hover:text-primary hover:underline transition-colors">
            Sobre nosotros
          </Link>
        </div>
      </div>
    </div>
  );
}
