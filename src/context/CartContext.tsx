"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, CartContextType, Product } from "@/types";
import { toast } from "sonner";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("agroecotopia_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Error parsing cart from localStorage:", error);
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("agroecotopia_cart", JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existingProductIndex = prev.findIndex((item) => item.product.slug === product.slug);
      
      if (existingProductIndex >= 0) {
        // Update existing item
        const updatedCart = [...prev];
        updatedCart[existingProductIndex].quantity += quantity;
        toast.success(`Se agregaron ${quantity} unidades más de ${product.name} al carrito`);
        return updatedCart;
      } else {
        // Add new item
        toast.success(`${product.name} agregado al carrito`);
        return [...prev, { product, quantity }];
      }
    });
  };

  const removeFromCart = (productSlug: string) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.product.slug !== productSlug);
      toast.info("Producto eliminado del carrito");
      return newCart;
    });
  };

  const updateQuantity = (productSlug: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productSlug);
      return;
    }
    setCart((prev) => 
      prev.map((item) => 
        item.product.slug === productSlug ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    toast.info("Carrito vaciado");
  };

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  
  const totalPrice = cart.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
