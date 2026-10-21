'use client';

import Image from 'next/image';
import logo from '@/public/beata-logo.png';
import { useLanguage } from './language-provider';

export function LogoPlaceholder({
  label,
  className = '',
}: {
  label: string;
  className?: string;
}) {
  const pl = useLanguage() === 'pl';
  return (
    <figure style={{ margin: 0 }}
      className={`logo-placeholder ${className}`}
      aria-label={`${label} — ${pl ? 'zdjęcie wkrótce' : 'image coming soon'}`}
    >
      <Image src={logo} sizes="260px" alt="" />
      <span>{pl ? 'Zdjęcia kolekcji pojawią się wkrótce' : 'Collection imagery coming soon'}</span>
    </figure>
  );
}
