export function ContentPage({ eyebrow, title, intro, children, draft = false }: { eyebrow: string; title: string; intro: string; children: React.ReactNode; draft?: boolean }) {
  return <main className="content-page"><header><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p>{draft && <aside className="draft-notice">Draft store policy — business details and final wording must be confirmed before live payments are enabled.</aside>}</header><article>{children}</article></main>;
}
