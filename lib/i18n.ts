export type Language = 'en' | 'pl';

export function isPolish(language: Language) {
  return language === 'pl';
}

export function translateCategory(category: string, language: Language) {
  if (language !== 'pl') return category;
  return ({
    'T-shirts': 'T-shirty',
    Hoodies: 'Bluzy z kapturem',
    Sweatshirts: 'Bluzy',
    'Long sleeves': 'Koszulki z długim rękawem',
    'Hats & caps': 'Czapki i kapelusze',
    Bags: 'Torby',
    Accessories: 'Akcesoria',
    Workwear: 'Odzież robocza',
    Mugs: 'Kubki',
  } as Record<string, string>)[category] ?? category;
}

export function translateSize(size: string, language: Language) {
  if (language !== 'pl') return size;
  return size === 'One size' ? 'Jeden rozmiar' : size;
}

export function translateColour(colour: string, language: Language) {
  if (language !== 'pl') return colour;
  return ({
    White: 'Biały',
    Black: 'Czarny',
    Blue: 'Niebieski',
    Yellow: 'Żółty',
    Red: 'Czerwony',
    Green: 'Zielony',
    Pink: 'Różowy',
    Orange: 'Pomarańczowy',
    Purple: 'Fioletowy',
    Brown: 'Brązowy',
    Beige: 'Beżowy',
    Grey: 'Szary',
    Gray: 'Szary',
    Navy: 'Granatowy',
  } as Record<string, string>)[colour] ?? colour;
}

export function translateProductDescription(description: string, language: Language) {
  if (language !== 'pl') return description;
  if (description.includes('Lightweight unisex T-shirt') && description.includes('100% polyester')) {
    return 'Lekka koszulka unisex o miękkim, bawełnianym wykończeniu, wykonana w 100% z poliestru. Dostępna w rozmiarach S, M, L i XL oraz w kolorach białym, czarnym, niebieskim i żółtym.';
  }
  if (description.includes('11oz') && description.toLowerCase().includes('ceramic')) {
    return 'Kubek ceramiczny o pojemności 11 oz, z kolorowym wnętrzem i uchwytem.';
  }
  return description;
}

export function translateProductDetail(detail: string, language: Language) {
  if (language !== 'pl') return detail;
  return ({
    'Comfortable everyday fit': 'Wygodny krój na co dzień',
    'Original Beata Shop product': 'Oryginalny produkt Beata Shop',
    'Relaxed unisex fit': 'Luźny krój unisex',
    'Soft cotton jersey': 'Miękka bawełniana dzianina',
    'Midweight cotton jersey': 'Bawełniana dzianina o średniej gramaturze',
  } as Record<string, string>)[detail] ?? detail;
}
