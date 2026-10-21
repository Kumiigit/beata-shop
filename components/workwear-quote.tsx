'use client';

import { useEffect, useState, type SubmitEvent } from 'react';
import Image from 'next/image';
import { ArrowRight, Check, Download, Mail, Upload, X } from 'lucide-react';
import { useLanguage } from './language-provider';
import { STORE } from '@/lib/store-config';
import { WORKWEAR_PRODUCTS, type WorkwearId } from '@/lib/workwear';
import './workwear.css';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image unavailable'));
    image.src = src;
  });
}

export function WorkwearQuote() {
  const pl = useLanguage() === 'pl';
  const [selected, setSelected] = useState<WorkwearId[]>([]);
  const [quantities, setQuantities] = useState<Record<WorkwearId, string>>({ cap: '25', jacket: '25', polo: '25', vest: '25', gilet: '25' });
  const [file, setFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [downloading, setDownloading] = useState(false);
  const chosen = WORKWEAR_PRODUCTS.filter(product => selected.includes(product.id));
  const name = (product: typeof WORKWEAR_PRODUCTS[number]) => pl ? product.namePl : product.name;

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    let active = true;
    loadImage(url).then(image => {
      if (!active) return;
      if (image.naturalWidth * image.naturalHeight > 25_000_000) {
        setFileError(pl ? 'Wybierz obraz o rozdzielczości do 25 megapikseli.' : 'Choose an image no larger than 25 megapixels.');
        setFile(null);
      } else setLogoUrl(url);
    }).catch(() => {
      if (!active) return;
      setFileError(pl ? 'Nie można odczytać obrazu. Wybierz inny plik.' : 'This image could not be read. Choose another file.');
      setFile(null);
    });
    return () => { active = false; URL.revokeObjectURL(url); };
  }, [file, pl]);

  function chooseFile(next: File | undefined) {
    if (!next) return;
    setFileError('');
    setStatus('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(next.type) || next.size > 10 * 1024 * 1024) {
      setFileError(pl ? 'Wybierz PNG, JPG lub WebP o rozmiarze do 10 MB.' : 'Choose a PNG, JPG or WebP image up to 10 MB.');
      return;
    }
    setLogoUrl('');
    setFile(next);
  }

  function enquiryText() {
    return [
      pl ? 'Dzień dobry, proszę o wycenę odzieży roboczej z logo.' : 'Hello, I would like a quote for workwear with our logo.',
      company.trim() ? `${pl ? 'Firma' : 'Company'}: ${company.trim()}` : '',
      ...chosen.map(product => `${name(product)} — ${pl ? 'ilość' : 'quantity'}: ${quantities[product.id]}; ${product.id === 'cap' ? (pl ? 'logo z przodu czapki' : 'logo on cap front') : (pl ? 'logo na lewej piersi' : 'logo on left chest')}`),
      file ? `${pl ? 'Plik logo do załączenia' : 'Logo file to attach'}: ${file.name}` : (pl ? 'Logo: do uzgodnienia.' : 'Logo: to be discussed.'),
      notes.trim() ? `${pl ? 'Rozmiary, kolory i dodatkowe informacje' : 'Sizes, colours and additional details'}: ${notes.trim()}` : '',
      pl ? 'Proszę o potwierdzenie dostępnych modeli, rozmiarów, kolorów, znakowania HTV lub haftem, ceny i terminu realizacji.' : 'Please confirm available garments, sizes, colours, HTV or embroidery options, pricing and lead time.',
    ].filter(Boolean).join('\n\n');
  }

  function startEnquiry(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chosen.length) {
      setStatus(pl ? 'Wybierz co najmniej jeden produkt.' : 'Select at least one product.');
      return;
    }
    const subject = pl ? 'Zapytanie o odzież roboczą z logo' : 'Branded workwear enquiry';
    window.location.href = `mailto:${STORE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(enquiryText())}`;
    setStatus(pl ? 'Otwarto program pocztowy. Załącz logo i pobrany podgląd, a następnie wyślij wiadomość. Jeśli program się nie otworzył, skopiuj zapytanie i wyślij je na podany adres.' : 'Your email app has been requested. Attach your logo and downloaded mockup, then send the email. If it did not open, copy the enquiry and email it to the address below.');
  }

  async function copyEnquiry() {
    try {
      await navigator.clipboard.writeText(enquiryText());
      setStatus(pl ? 'Zapytanie skopiowane. Wklej je do wiadomości i załącz logo.' : 'Enquiry copied. Paste it into your email and attach your logo.');
    } catch {
      setStatus(pl ? 'Nie udało się skopiować. Napisz do nas na adres poniżej i podaj wybrane produkty oraz ilości.' : 'Copying was unavailable. Email us below with your selected products and quantities.');
    }
  }

  async function downloadMockup() {
    setDownloading(true);
    setStatus('');
    try {
      const logo = logoUrl ? await loadImage(logoUrl) : null;
      const canvas = document.createElement('canvas');
      canvas.width = 700 * chosen.length;
      canvas.height = 850;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.fillStyle = '#fffaf5';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#24130d';
      context.font = 'bold 26px Arial';
      context.fillText(pl ? 'BEATA SHOP · ODZIEŻ ROBOCZA' : 'BEATA SHOP · WORKWEAR', 30, 45);
      for (const [index, product] of chosen.entries()) {
        const image = await loadImage(product.image);
        const x = index * 700 + 30;
        const y = 80;
        const size = 640;
        context.drawImage(image, x, y, size, size);
        if (logo) {
          const scale = Math.min(size * product.logoWidth / 100 / logo.naturalWidth, size * product.logoHeight / 100 / logo.naturalHeight);
          const width = logo.naturalWidth * scale;
          const height = logo.naturalHeight * scale;
          context.drawImage(logo, x + size * product.logoX / 100 - width / 2, y + size * product.logoY / 100 - height / 2, width, height);
        }
        context.fillStyle = '#24130d';
        context.font = 'bold 23px Arial';
        context.fillText(name(product), x, 755);
        context.font = '20px Arial';
        context.fillText(`${pl ? 'Ilość' : 'Quantity'}: ${quantities[product.id] || '—'}`, x, 788);
      }
      context.font = '16px Arial';
      context.fillText(pl ? 'Podgląd orientacyjny. Szczegóły i wycenę potwierdzimy w wiadomości.' : 'Illustrative mockup. Final garments and pricing confirmed by email.', 30, 825);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Export failed')), 'image/png'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'beata-workwear-mockup.png';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setStatus(pl ? 'Nie udało się pobrać podglądu. Spróbuj ponownie lub wyślij nam logo e-mailem.' : 'The mockup could not be downloaded. Try again or email us your logo.');
    } finally { setDownloading(false); }
  }

  return <div className="workwear-page">
    <header className="workwear-heading">
      <p className="store-kicker">{pl ? 'TWÓJ ZESPÓŁ. TWOJA MARKA.' : 'YOUR TEAM. YOUR BRAND.'}</p>
      <h1>{pl ? <>Gotowi do pracy.<br /><em>Z Twoim logo.</em></> : <>Ready for work.<br /><em>Made yours.</em></>}</h1>
      <p>{pl ? 'Czapki, kurtki i kamizelki odblaskowe, koszulki polo oraz ocieplane bezrękawniki dla Twojego zespołu. Wybierz produkty, zobacz swoje logo i porozmawiajmy o ilości oraz wycenie.' : 'Work caps, hi-vis jackets and vests, polo shirts and padded gilets for your team. Choose your garments, see your logo, then talk to us about quantities and a personal quote.'}</p>
      <p className="workwear-branding">{pl ? 'Twoje logo: nadruk HTV (folia termotransferowa) lub haft.' : 'Your logo: HTV (heat-transfer vinyl) or embroidery.'}</p>
      <ol className="workwear-steps"><li><span>01</span>{pl ? 'Wybierz produkty' : 'Choose your workwear'}</li><li><span>02</span>{pl ? 'Dodaj swoje logo' : 'Add your logo'}</li><li><span>03</span>{pl ? 'Zapytaj o wycenę' : 'Let’s talk quantities'}</li></ol>
    </header>
    <form onSubmit={startEnquiry} className="workwear-form">
      <section aria-labelledby="workwear-range-title">
        <div className="workwear-section-title"><div><p className="store-kicker">01 · {pl ? 'WYBIERZ' : 'THE RANGE'}</p><h2 id="workwear-range-title">{pl ? 'Ubierz swój zespół.' : 'Build your team kit.'}</h2></div><p>{pl ? 'Wybierz jeden lub kilka produktów do wyceny.' : 'Select one or more garments for your quote.'}</p></div>
        <div className="workwear-grid">{WORKWEAR_PRODUCTS.map(product => {
          const active = selected.includes(product.id);
          return <article className={`workwear-card${active ? ' is-selected' : ''}`} key={product.id}>
            <div className="workwear-product-image">
              <Image src={product.image} alt={name(product)} width={1254} height={1254} sizes="(max-width: 680px) 100vw, 33vw" />
              <div className="workwear-logo" style={{ left: `${product.logoX}%`, top: `${product.logoY}%`, width: `${product.logoWidth}%`, height: `${product.logoHeight}%` }}>{logoUrl ? <Image src={logoUrl} fill unoptimized alt={pl ? 'Podgląd Twojego logo' : 'Your logo preview'} /> : <span>{pl ? 'TWOJE\nLOGO' : 'YOUR\nLOGO'}</span>}</div>
              {active && <span className="workwear-selected"><Check size={14} />{pl ? 'Wybrano' : 'Selected'}</span>}
            </div>
            <div className="workwear-card-body"><h3>{name(product)}</h3><p>{pl ? product.descriptionPl : product.description}</p><label className="workwear-select"><input type="checkbox" checked={active} onChange={() => { setSelected(current => active ? current.filter(id => id !== product.id) : [...current, product.id]); setStatus(''); }} /><span>{pl ? 'Dodaj do zapytania' : 'Include in my quote'}</span></label>
              {active && <label className="workwear-quantity">{pl ? 'Orientacyjna ilość' : 'Estimated quantity'}<input type="number" inputMode="numeric" min="1" max="100000" step="1" required value={quantities[product.id]} aria-label={`${pl ? 'Ilość' : 'Quantity'} — ${name(product)}`} onChange={event => { setQuantities(current => ({ ...current, [product.id]: event.target.value })); setStatus(''); }} /></label>}
            </div>
          </article>;
        })}</div>
        <p className="workwear-note">{pl ? 'Wizualizacje są orientacyjne. Dostępne modele, kolory, rozmiary i sposób znakowania potwierdzimy przy wycenie.' : 'Illustrative mockups. We’ll confirm garment options, colours, sizes and branding method with your quote.'}</p>
      </section>
      <div className="workwear-details">
        <section className="workwear-logo-section" aria-labelledby="workwear-logo-title"><p className="store-kicker">02 · {pl ? 'TWOJA MARKA' : 'MAKE IT YOURS'}</p><h2 id="workwear-logo-title">{pl ? 'Zobacz swoje logo.' : 'Picture your logo.'}</h2><p>{pl ? 'Wybierz logo, aby zobaczyć je na produktach. PNG z przezroczystym tłem daje najlepszy efekt.' : 'Choose your logo to preview it on the garments. A PNG with a transparent background works best.'}</p>
          <label className="workwear-upload"><Upload aria-hidden="true" /><strong>{file ? file.name : (pl ? 'Wybierz plik logo' : 'Choose your logo file')}</strong><span>PNG, JPG, WebP · {pl ? 'do 10 MB' : 'up to 10 MB'}</span><input type="file" accept="image/png,image/jpeg,image/webp" aria-label={pl ? 'Wybierz plik logo' : 'Choose your logo file'} onChange={event => { chooseFile(event.target.files?.[0]); event.target.value = ''; }} /></label>
          {file && <button className="workwear-text-button" type="button" onClick={() => { setFile(null); setLogoUrl(''); setFileError(''); }}><X size={16} />{pl ? 'Usuń logo' : 'Remove logo'}</button>}
          {fileError && <p className="workwear-error" role="alert">{fileError}</p>}
          <p className="workwear-note">{pl ? 'Logo służy tutaj tylko do podglądu. Załącz je do wiadomości e-mail, abyśmy mogli przygotować wycenę.' : 'Your logo stays in this browser for the preview. Attach it to your email so we can prepare your quote.'}</p>
          <button className="workwear-secondary" type="button" disabled={!chosen.length || !logoUrl || downloading} onClick={downloadMockup}><Download size={17} />{downloading ? (pl ? 'Przygotowywanie…' : 'Preparing…') : (pl ? 'Pobierz wizualizację' : 'Download your mockup')}</button>
        </section>
        <section className="workwear-enquiry" aria-labelledby="workwear-enquiry-title"><p className="store-kicker">03 · {pl ? 'POROZMAWIAJMY' : 'LET’S TALK'}</p><h2 id="workwear-enquiry-title">{pl ? 'Wycena dla Twojego zespołu.' : 'A quote for your team.'}</h2><p>{pl ? 'Powiedz nam, czego potrzebujesz. Potwierdzimy szczegóły i przygotujemy indywidualną ofertę.' : 'Tell us what you have in mind. We’ll confirm the details and put together a quote for you.'}</p>
          <label>{pl ? 'Nazwa firmy (opcjonalnie)' : 'Company name (optional)'}<input type="text" autoComplete="organization" maxLength={80} value={company} onChange={event => setCompany(event.target.value)} /></label>
          <label>{pl ? 'Rozmiary, kolory, termin i inne informacje' : 'Sizes, colours, deadline and anything else'}<textarea rows={4} maxLength={600} value={notes} onChange={event => setNotes(event.target.value)} placeholder={pl ? 'Np. 10 × M, 15 × L, granatowe koszulki…' : 'For example: 10 × M, 15 × L, navy polos…'} /></label>
          {!!chosen.length && <ul className="workwear-summary">{chosen.map(product => <li key={product.id}><span>{name(product)}</span><strong>{quantities[product.id] || '—'} ×</strong></li>)}</ul>}
          <p className="workwear-note">{pl ? 'Przycisk otwiera wiadomość w Twoim programie pocztowym. Przed wysłaniem załącz logo oraz pobraną wizualizację.' : 'The button opens a message in your email app. Attach your logo and downloaded mockup before sending.'}</p>
          <button className="store-button" type="submit"><Mail size={17} />{pl ? 'Napisz w sprawie wyceny' : 'Email us for a quote'}<ArrowRight size={16} /></button>
          <button className="workwear-text-button" type="button" disabled={!chosen.length} onClick={copyEnquiry}>{pl ? 'Skopiuj treść zapytania' : 'Copy enquiry text'}</button>
          <output className="workwear-status">{status}</output>
          <div className="workwear-contact"><a href={`mailto:${STORE.email}`}>{STORE.email}</a><a href={`tel:${STORE.phoneHref}`}>{STORE.phoneDisplay}</a></div>
        </section>
      </div>
    </form>
  </div>;
}
