import Link from 'next/link';
import type { Metadata } from 'next';
import { ContentPage } from '@/components/content-page';
import { ADDRESS_REQUIRED, STORE } from '@/lib/store-config';
import { getLanguage } from '@/lib/server-language';

export async function generateMetadata(): Promise<Metadata> { return { title: (await getLanguage()) === 'pl' ? 'Zwroty' : 'Returns' }; }

export default async function Page() {
  const pl = (await getLanguage()) === 'pl';
  if (pl) return <ContentPage eyebrow="Zwroty" title="Proste zasady zwrotów." intro="Dla kwalifikujących się produktów standardowych oferujemy 30-dniowy termin zwrotu. Nie narusza to Twoich praw ustawowych.">
    <h2>Nasza 30-dniowa polityka zwrotów</h2>
    <p>Poinformuj nas o chęci zwrotu kwalifikującego się produktu standardowego w ciągu 30 dni od jego otrzymania. Produkt powinien być nienoszony, nieprany oraz, w miarę możliwości, zwrócony z oryginalnymi metkami i opakowaniem. Możesz go obejrzeć i przymierzyć tak jak w sklepie, ale możemy pomniejszyć zwrot pieniędzy, jeśli używanie wykraczające poza rozsądnie konieczne czynności obniżyło jego wartość.</p>
    <h2>Ustawowe prawo do odstąpienia</h2>
    <p>W przypadku większości standardowych towarów kupionych online masz prawo odstąpić od umowy bez podawania przyczyny. Musisz poinformować nas w ciągu 14 dni od dnia otrzymania towaru, a następnie masz kolejne 14 dni na jego odesłanie.</p>
    <p>Możesz powiadomić nas e-mailem lub użyć <Link prefetch={false} href="/cancellation-form">wzoru formularza odstąpienia</Link>, choć nie jest to obowiązkowe.</p>
    <h2>Produkty wyłączone ze zwrotu z powodu zmiany zdania</h2>
    <p>Towary wykonane według Twojej specyfikacji lub wyraźnie spersonalizowane, w tym produkty z nadrukiem przesłanej przez Ciebie grafiki, zwykle nie podlegają zwrotowi z powodu zmiany zdania. Zapieczętowane towary, których po otwarciu nie można zwrócić ze względów zdrowotnych lub higienicznych, również mogą być wyłączone.</p>
    <p>Wyłączenia te nie mają zastosowania, jeśli produkt jest wadliwy, uszkodzony, nieprawidłowy lub niezgodny z opisem.</p>
    <h2>Jak rozpocząć zwrot</h2>
    <p>Przed wysłaniem produktu napisz na <a href={`mailto:${STORE.email}`}>{STORE.email}</a>, podając numer zamówienia i produkty, które chcesz zwrócić.</p>
    <p><strong>Adres zwrotu:</strong> {STORE.returnsAddress || ADDRESS_REQUIRED}.</p>
    <p>Pokrywasz koszt przesyłki zwrotnej w przypadku zmiany zdania. Pokryjemy rozsądne koszty zwrotu, jeśli produkt jest wadliwy, uszkodzony, nieprawidłowy lub niezgodny z opisem.</p>
    <h2>Zwrot pieniędzy</h2>
    <p>W przypadku ważnego odstąpienia zwrócimy cenę produktu oraz koszt najtańszej oferowanej przez nas standardowej dostawy. Dopłata do droższej formy dostawy nie podlega zwrotowi.</p>
    <p>Zwrot na pierwotną metodę płatności wykonamy w ciągu 14 dni od otrzymania towaru lub dowodu jego odesłania — zależnie od tego, co nastąpi wcześniej. Możemy wstrzymać zwrot do czasu otrzymania towaru lub takiego dowodu.</p>
    <h2>Towary wadliwe lub niezgodne z opisem</h2>
    <p>W przypadku towaru wadliwego, niezgodnego z opisem lub nieprzydatnego do określonego celu przysługują Ci odrębne prawa. Niniejsza polityka w żaden sposób ich nie ogranicza.</p>
  </ContentPage>;

  return <ContentPage eyebrow="Returns" title="Returns made straightforward." intro="We offer a 30-day returns policy for eligible standard items. This is in addition to your statutory rights.">
    <h2>Our 30-day returns policy</h2><p>Tell us that you wish to return an eligible standard item within 30 days of receiving it. Items should be unworn, unwashed and returned with their original labels and packaging where possible. You may inspect and try an item as you would in a shop, but we may reduce the refund if handling beyond what is reasonably necessary has reduced its value.</p>
    <h2>Your statutory cancellation right</h2><p>For most standard goods bought online, you have the legal right to cancel without giving a reason. You must tell us within 14 days after the day you receive the goods. You then have a further 14 days to send the goods back.</p><p>You may notify us by email or use our <Link prefetch={false} href="/cancellation-form">model cancellation form</Link>, although use of the form is not required.</p>
    <h2>Items excluded from change-of-mind returns</h2><p>Goods made to your specification or clearly personalised, including products printed with artwork supplied by you, cannot normally be returned for a change of mind. Sealed goods that are not suitable for return for health or hygiene reasons may also be excluded once unsealed.</p><p>These exclusions do not apply when an item is faulty, damaged, incorrect or not as described.</p>
    <h2>Starting a return</h2><p>Email <a href={`mailto:${STORE.email}`}>{STORE.email}</a> with your order reference and the items you wish to return before sending anything.</p><p><strong>Returns address:</strong> {STORE.returnsAddress || ADDRESS_REQUIRED}.</p><p>You are responsible for return postage on change-of-mind returns. We will cover reasonable return costs when an item is faulty, damaged, incorrect or not as described.</p>
    <h2>Refunds</h2><p>For a valid cancellation, we will refund the item price and the cost of our least-expensive standard delivery option. Any additional amount paid for an enhanced delivery option is not refundable.</p><p>We will issue the refund to the original payment method within 14 days after we receive the goods back, or within 14 days after you provide evidence that they were sent back, whichever happens first. We may withhold the refund until we receive the goods or that evidence.</p>
    <h2>Faulty or misdescribed goods</h2><p>You have separate legal rights when goods are faulty, not as described or not fit for purpose. Nothing in this policy limits those rights.</p>
  </ContentPage>;
}
