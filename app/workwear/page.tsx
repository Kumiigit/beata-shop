import type { Metadata } from 'next';
import { WorkwearQuote } from '@/components/workwear-quote';
import { getLanguage } from '@/lib/server-language';

export async function generateMetadata(): Promise<Metadata> {
  const pl = (await getLanguage()) === 'pl';
  return {
    title: pl ? 'Odzież robocza z Twoim logo' : 'Workwear with your logo',
    description: pl ? 'Czapki, kurtki i kamizelki odblaskowe, koszulki polo oraz bezrękawniki z logo HTV lub haftem. Zapytaj o wycenę dla swojego zespołu.' : 'Work caps, hi-vis jackets and vests, polos and gilets with your logo in HTV or embroidery. Request a quote for your team.',
  };
}

export default function WorkwearPage() {
  return <main><WorkwearQuote /></main>;
}
