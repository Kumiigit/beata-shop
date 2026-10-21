import type { Metadata } from 'next';
import { ContentPage } from '@/components/content-page';
import { ADDRESS_REQUIRED, STORE } from '@/lib/store-config';
import { getLanguage } from '@/lib/server-language';

export async function generateMetadata(): Promise<Metadata> { return { title: (await getLanguage()) === 'pl' ? 'Prywatność i pliki cookie' : 'Privacy & cookies' }; }

export default async function Page() {
  const pl = (await getLanguage()) === 'pl';
  if (pl) return <ContentPage eyebrow="Prywatność i pliki cookie" title="Dbamy o Twoje dane." intro={`${STORE.legalName}, prowadząca działalność jako ${STORE.tradingName}, jest administratorem danych osobowych opisanych w tej informacji.`}>
    <h2>Dane kontaktowe</h2><p>Napisz na <a href={`mailto:${STORE.email}`}>{STORE.email}</a>, zadzwoń pod <a href={`tel:${STORE.phoneHref}`}>{STORE.phoneDisplay}</a> lub napisz na adres: {STORE.businessAddress || ADDRESS_REQUIRED}.</p>
    <h2>Jakie dane zbieramy</h2><p>Możemy zbierać imię i nazwisko, adres e-mail, numer telefonu, adres rozliczeniowy i dostawy, szczegóły zamówienia, wybór produktów, identyfikatory płatności, korespondencję, informacje o zwrotach, urządzeniu, bezpieczeństwie i zapobieganiu oszustwom.</p><p>W przypadku zamówień z własnym nadrukiem zbieramy również przesłane grafiki, nazwy plików, wybrane miejsca nadruku, projekty do akceptacji i odpowiedź dotyczącą akceptacji. Stripe obsługuje dane karty płatniczej; Beata Shop nie otrzymuje ani nie przechowuje pełnych danych karty.</p><p>Większość danych otrzymujemy bezpośrednio od Ciebie. Otrzymujemy również potwierdzenia płatności i realizacji transakcji od Stripe oraz, gdy jest to konieczne, informacje o dostawie od przewoźników.</p>
    <h2>Dlaczego wykorzystujemy dane i na jakiej podstawie</h2><ul><li><strong>Umowa:</strong> aby obsłużyć płatność, przygotować i dostarczyć zamówienie, przekazać projekt do akceptacji, obsługiwać anulowania i zwroty oraz zapewnić zamówioną pomoc.</li><li><strong>Obowiązek prawny:</strong> aby prowadzić dokumentację podatkową i księgową, odpowiadać na zgodne z prawem żądania oraz spełniać wymogi ochrony konsumentów.</li><li><strong>Uzasadniony interes:</strong> aby bezpiecznie prowadzić sklep, zapobiegać oszustwom i nadużyciom, rozwiązywać spory, usprawniać administrację oraz ustalać lub bronić roszczeń prawnych. Przed skorzystaniem z tej podstawy oceniamy jej wpływ na klientów.</li></ul><p>Nie wykorzystujemy danych klientów do marketingu e-mailowego ani nie sprzedajemy danych osobowych.</p>
    <h2>Grafiki do własnego nadruku</h2><p>Grafiki wykorzystujemy wyłącznie do sprawdzenia, przygotowania, przedstawienia do akceptacji, wykonania i obsługi Twojego zamówienia. Planujemy je usunąć 30 dni po oznaczeniu zamówienia jako zrealizowane. Porzucone pliki usuwamy zwykle w ciągu 30 dni. Kopię możemy zachować dłużej tylko wtedy, gdy jest to rozsądnie konieczne do rozwiązania sporu, ustalenia lub obrony roszczenia albo spełnienia wymogów prawa.</p>
    <h2>Komu przekazujemy dane</h2><p>Udostępniamy tylko niezbędne dane usługodawcom wspierającym sklep, w tym Netlify (hosting strony i przechowywanie), Supabase (baza danych), Stripe (realizacja płatności) oraz InPost lub innemu wskazanemu przewoźnikowi (dostawa). Doradcy zawodowi, ubezpieczyciele, organy regulacyjne lub organy ścigania mogą otrzymać dane, gdy jest to rozsądnie konieczne lub wymagane prawem.</p>
    <h2>Przekazywanie danych za granicę</h2><p>Niektórzy usługodawcy mogą przechowywać dane lub uzyskiwać do nich dostęp poza Zjednoczonym Królestwem. Gdy brytyjskie prawo ochrony danych wymaga zabezpieczeń, korzystamy z odpowiedniej decyzji o adekwatności lub zatwierdzonych zabezpieczeń umownych, takich jak UK International Data Transfer Agreement lub UK Addendum. Skontaktuj się z nami, jeśli chcesz uzyskać informacje o zabezpieczeniu stosowanym przez konkretnego dostawcę.</p>
    <h2>Jak długo przechowujemy dane</h2><ul><li>Dane zamówień, identyfikatory płatności, zwroty i dokumentacja księgowa: zwykle przez sześć lat od końca odpowiedniego roku finansowego.</li><li>Grafiki do własnego nadruku: zwykle 30 dni po realizacji zamówienia.</li><li>Porzucone przesłane grafiki: zwykle nie dłużej niż 30 dni.</li><li>Ogólna korespondencja z obsługą klienta: zwykle do dwóch lat od zamknięcia sprawy, chyba że jest potrzebna w związku z zamówieniem, sporem lub obowiązkiem prawnym.</li></ul>
    <h2>Pliki cookie i pamięć przeglądarki</h2><p>Używamy pamięci potrzebnej do działania i zabezpieczenia sklepu: podpisanego pliku cookie dla panelu właściciela, pamięci koszyka oraz pliku cookie preferencji języka. Zapisujemy także plik cookie z Twoją decyzją o analityce, aby ją zapamiętać.</p><p>Jeżeli zaakceptujesz analitykę, zapisujemy losowy identyfikator przeglądarki w pliku cookie na 180 dni. Mierzymy odwiedzane ścieżki stron, liczbę odsłon oraz czas aktywnego przeglądania, gdy strona jest widoczna i aktywna. Dane przechowujemy w bazie Supabase i pokazujemy właścicielowi sklepu w zestawieniach. Nie zapisujemy w analityce adresów IP, zapytań wyszukiwania ani danych zamówień. Nie uruchamiamy analityki przed zgodą. Możesz odmówić lub zmienić decyzję przez „Ustawienia analityki” w stopce; wycofanie zgody zatrzymuje przyszłe zbieranie danych i usuwa identyfikator z przeglądarki. Możesz też usunąć dane przeglądarki w jej ustawieniach.</p>
    <h2>Twoje prawa</h2><p>W zależności od okoliczności i podstawy prawnej możesz zażądać dostępu do danych, ich poprawienia, usunięcia, ograniczenia przetwarzania lub przenośnej kopii, albo sprzeciwić się ich wykorzystywaniu. Prawa te nie są bezwzględne w każdej sytuacji. Wyślij wniosek na <a href={`mailto:${STORE.email}`}>{STORE.email}</a>.</p><p>Nie wykorzystujemy danych osobowych do podejmowania wyłącznie zautomatyzowanych decyzji wywołujących skutki prawne lub podobnie istotne.</p>
    <h2>Skargi</h2><p>Najpierw skontaktuj się z nami, abyśmy mogli spróbować rozwiązać problem. Masz również prawo złożyć skargę do <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">Information Commissioner’s Office</a>.</p>
  </ContentPage>;
  return <ContentPage eyebrow="Privacy & cookies" title="Your information, treated with care." intro={`${STORE.legalName}, trading as ${STORE.tradingName}, is the data controller responsible for the personal information described in this notice.`}>
    <h2>Contact details</h2>
    <p>Email <a href={`mailto:${STORE.email}`}>{STORE.email}</a>, call <a href={`tel:${STORE.phoneHref}`}>{STORE.phoneDisplay}</a>, or write to: {STORE.businessAddress || ADDRESS_REQUIRED}.</p>

    <h2>Information we collect</h2>
    <p>We may collect your name, email address, telephone number, billing and delivery addresses, order details, product choices, payment references, correspondence, return information, device and security information, and fraud-prevention information.</p>
    <p>For custom-print orders, we also collect uploaded artwork, filenames, requested print positions, proofs and your approval response. Stripe handles your payment-card information; Beata Shop does not receive or store complete card details.</p>
    <p>Most information comes directly from you. We also receive payment and checkout confirmation from Stripe and delivery information from delivery providers where necessary.</p>

    <h2>Why we use information and our lawful bases</h2>
    <ul>
      <li><strong>Contract:</strong> to process payment, fulfil and deliver orders, provide proofs, handle cancellations and returns, and provide requested customer support.</li>
      <li><strong>Legal obligation:</strong> to keep tax and accounting records, respond to lawful requests, and meet consumer-protection obligations.</li>
      <li><strong>Legitimate interests:</strong> to secure and operate the shop, prevent fraud and misuse, resolve disputes, improve administration, and establish or defend legal claims. We consider the impact on customers before relying on this basis.</li>
    </ul>
    <p>We do not use customer information for email marketing and do not sell personal information.</p>

    <h2>Custom-print artwork</h2>
    <p>Artwork is used only to review, prepare, proof, produce and support your custom order. Uploaded artwork is scheduled for deletion 30 days after the order is marked complete. Abandoned uploads are normally deleted within 30 days. A copy may be retained longer only when reasonably required to resolve a dispute, establish or defend a legal claim, or comply with law.</p>

    <h2>Who receives information</h2>
    <p>We share only the information necessary with providers supporting the shop, including Netlify for website hosting and storage, Supabase for database hosting, Stripe for checkout and payments, and InPost or another disclosed carrier for delivery. Professional advisers, insurers, regulators or law-enforcement bodies may receive information where reasonably necessary or legally required.</p>

    <h2>International transfers</h2>
    <p>Some service providers may store or access information outside the United Kingdom. Where UK data-protection law requires safeguards, we rely on an applicable UK adequacy regulation or approved contractual safeguards, such as the UK International Data Transfer Agreement or UK Addendum. Contact us if you would like further information about the safeguard used for a particular provider.</p>

    <h2>How long we keep information</h2>
    <ul>
      <li>Order, payment-reference, refund and accounting records: normally six years after the end of the relevant financial year.</li>
      <li>Custom-print artwork: normally 30 days after order completion.</li>
      <li>Abandoned artwork uploads: normally no longer than 30 days.</li>
      <li>General customer-service correspondence: normally up to two years after the enquiry is closed, unless needed for an order, dispute or legal obligation.</li>
    </ul>

    <h2>Cookies and browser storage</h2>
    <p>We use storage needed to provide and secure the shop: an essential signed cookie for the private owner area, browser storage for the shopping bag, and a language-preference cookie. We also store your analytics choice in a cookie so we can remember it.</p>
    <p>If you accept analytics, we set a random browser identifier cookie for 180 days. We measure page paths, views, and active time while a page is visible and focused. These records are stored in Supabase and shown to the shop owner in summary reports. We do not store IP addresses, search queries, or order information in analytics. Analytics do not run before consent. You can decline or change your choice through “Analytics settings” in the footer; withdrawing consent stops future collection and removes the browser identifier. You can also clear browser data in your browser settings.</p>

    <h2>Your rights</h2>
    <p>Depending on the circumstances and lawful basis, you may ask for access to your information, correction, deletion, restriction, or a portable copy, or object to our use of it. These rights are not absolute in every situation. Send a request to <a href={`mailto:${STORE.email}`}>{STORE.email}</a>.</p>
    <p>We do not use personal information to make solely automated decisions that have legal or similarly significant effects.</p>

    <h2>Complaints</h2>
    <p>Please contact us first so we can try to resolve your concern. You also have the right to complain to the <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">Information Commissioner’s Office</a>.</p>
  </ContentPage>;
}
