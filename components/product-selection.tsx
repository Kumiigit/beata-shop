'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

const ProductSelection = createContext<{ image: string; setImage: (image: string) => void } | null>(null);

export function ProductSelectionProvider({ initialImage, children }: { initialImage: string; children: ReactNode }) {
  const [image, setImage] = useState(initialImage);
  return <ProductSelection.Provider value={{ image, setImage }}>{children}</ProductSelection.Provider>;
}

export function useProductSelection() { return useContext(ProductSelection); }
