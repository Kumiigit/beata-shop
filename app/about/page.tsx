import Image from 'next/image';
import logo from '@/public/beata-logo.png';
import type { Metadata } from 'next';
import { ContentPage } from '@/components/content-page';
import { getLanguage } from '@/lib/server-language';

export async function generateMetadata(): Promise<Metadata> { return { title: (await getLanguage()) === 'pl' ? 'O nas' : 'Our story' }; }

export default async function Page() {
  const pl = (await getLanguage()) === 'pl';
  return <ContentPage eyebrow={pl ? 'Punkt widzenia Beata Shop' : 'The Beata point of view'} title={pl ? 'Dobre ubrania powinny mieć coś do powiedzenia.' : 'Good clothes should have something to say.'} intro={pl ? 'Beata Shop tworzy wygodne ubrania na co dzień z zabawnymi, szczerymi tekstami — dla osób, które lubią komfort i humor trafiający trochę zbyt celnie.' : 'Beata Shop makes relaxed everyday clothing with funny, honest text for people who like their wardrobe comfortable and their humour slightly too accurate.'}>
    <figure style={{ margin: 0 }} className="about-wordmark"  aria-label="Beata Shop logo and original text-design placeholder">
      <Image src={logo} sizes="260px" alt="Beata Shop" />
      <strong>WEAR WHAT<br />YOU MEAN</strong>
    </figure>
    <h2>{pl ? 'Oryginalne słowa. Ubrania na co dzień.' : 'Original words. Everyday pieces.'}</h2>
    <p>{pl ? 'Umieszczamy celne hasła i znajome nastroje na miękkich T-shirtach, bluzach, koszulkach z długim rękawem i dodatkach. Powstają proste ubrania z charakterem — wystarczającym, by rozpocząć rozmowę albo ją zakończyć.' : 'We put sharp one-liners and familiar moods on soft T-shirts, hoodies, sweatshirts, long sleeves and accessories. The result is simple clothing with just enough personality to start a conversation—or end one.'}</p>
    <h2>{pl ? 'Stworzone do noszenia, nie do odkładania na później.' : 'Made to be worn, not saved for later.'}</h2>
    <p>{pl ? 'Wygodne kroje unisex, praktyczne detale i czysta typografia sprawiają, że każdy wzór łatwo nosić. Niezależnie od tego, czy przekaz jest suchy, dramatyczny czy bardzo prawdziwy, ubranie nadal powinno być Twoim ulubionym.' : 'Comfortable unisex fits, useful details and clean typography keep every design easy to style. Whether the message is dry, dramatic or deeply relatable, it should still feel like your favourite piece of clothing.'}</p>
    <blockquote>{pl ? 'Mniej zwyczajnie. Bardziej po Twojemu.' : 'Less basic. More you.'}</blockquote>
  </ContentPage>;
}
