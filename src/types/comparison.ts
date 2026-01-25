// types/index.ts

import { Cat } from "lucide-react";

export interface Product {
  int_id_producto: number;
  txt_nombre: string;
  fk_categoria: number;
  categoria?: {
      id_categoria: number;
      txt_nombre: string;
  };
}

export interface  SimpleProduct {
  int_id_producto: number;
  txt_nombre: string;
  fk_categoria: number;
}

export interface Category {
  id: number;
  nombre: string;
}

export interface Chain {
  id_cadena: number;
  txt_nombre: string;
}

export interface Comparison {
  id_comparacion: number;
  txt_nombre_comparacion: string;
  // ... otros campos
}

export interface ProductChainPayload {
  idProducto: number;
  idCadena: number;
  nombreProducto: string; // El nombre específico en la cadena
  idComparacion: number;
  flags?: string; // "flag1, flag2"
}

// Para el Dashboard
export interface PriceHistoryItem {
  cadena: string;
  url: string;
  precio: number;
  fecha_registro: string;
  tiene_descuento: boolean;
}

export interface ComparisonDashboardItem {
  id_comparacion: number;
  nombre_comparacion: string;
  nombre_generalizado: string;
  categoria: string;
  precios: PriceHistoryItem[];
}