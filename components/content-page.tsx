export function ContentPage({ eyebrow, title, intro, children, draft = false }: { eyebrow: string; title: string; intro: string; children: React.ReactNode; draft?: boolean }) {
  return <main className="content-page"><header><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p>{draft && <aside className="draft-notice">Launch blocker: add the house number, town or city, and postcode to the Gordon Road address before live sales begin.</aside>}</header><article>{children}</article></main>;
}
