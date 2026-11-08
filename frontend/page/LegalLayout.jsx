import { LEGAL } from "./legalConfig";

/**
 * Shared page shell for Terms and Privacy.
 * sections: [{ id, title, content: JSX }]
 */
export default function LegalLayout({ title, intro, sections, otherLink }) {
  return (
    <div className="legal">
      <style>{css}</style>

      <header className="legal__top">
        <a href="/" className="legal__brand">
          {LEGAL.appName}
        </a>
        <a
          href="#"
          className="legal__back"
          onClick={(e) => {
            e.preventDefault();
            window.history.back();
          }}
        >
          Back to previous page
        </a>
      </header>

      <div className="legal__wrap">
        <aside className="legal__toc" aria-label="On this page">
          <p className="legal__toc-title">On this page</p>
          <ol>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </aside>

        <main className="legal__main">
          <h1>{title}</h1>
          <p className="legal__updated">Last updated {LEGAL.lastUpdated}</p>
          <p className="legal__intro">{intro}</p>

          {sections.map((s, i) => (
            <section key={s.id} id={s.id}>
              <h2>
                {i + 1}. {s.title}
              </h2>
              {s.content}
            </section>
          ))}

          <p className="legal__other">
            Also see our <a href={otherLink.href}>{otherLink.label}</a>.
          </p>
        </main>
      </div>
    </div>
  );
}

const css = `
.legal {
  --theme: #4F46E5;
  --theme-dark: #4338CA;
  --theme-soft: rgba(79, 70, 229, 0.12);
  --ink: #1F2937;
  --muted: #6B7280;
  --line: #E5E7EB;
  min-height: 100vh;
  background: #FAFAFC;
  color: var(--ink);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.7;
}

.legal__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem clamp(1rem, 4vw, 2.5rem);
  background: var(--theme);
}
.legal__brand { color: #fff; font-weight: 700; font-size: 1.125rem; text-decoration: none; }
.legal__back { color: rgba(255,255,255,.85); font-size: .875rem; text-decoration: none; }
.legal__back:hover { color: #fff; text-decoration: underline; }

.legal__wrap {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 3rem;
  max-width: 62rem;
  margin: 0 auto;
  padding: 3rem clamp(1rem, 4vw, 2.5rem) 5rem;
}

.legal__toc { position: sticky; top: 2rem; align-self: start; font-size: .875rem; }
.legal__toc-title { margin: 0 0 .75rem; font-weight: 600; color: var(--ink); }
.legal__toc ol { list-style: none; margin: 0; padding: 0; border-left: 2px solid var(--line); }
.legal__toc li a {
  display: block;
  padding: .3rem 0 .3rem .9rem;
  margin-left: -2px;
  border-left: 2px solid transparent;
  color: var(--muted);
  text-decoration: none;
}
.legal__toc li a:hover { color: var(--theme); border-left-color: var(--theme); }

.legal__main { max-width: 42rem; }
.legal__main h1 { margin: 0; font-size: clamp(2rem, 4vw, 2.5rem); line-height: 1.2; letter-spacing: -0.02em; }
.legal__updated { margin: .5rem 0 0; color: var(--muted); font-size: .875rem; }
.legal__intro { margin-top: 1.5rem; font-size: 1.0625rem; }

.legal__main section { margin-top: 2.5rem; scroll-margin-top: 1.5rem; }
.legal__main h2 { margin: 0 0 .75rem; font-size: 1.25rem; letter-spacing: -0.01em; }
.legal__main p { margin: 0 0 1rem; }
.legal__main ul { margin: 0 0 1rem; padding-left: 1.25rem; }
.legal__main li { margin-bottom: .4rem; }
.legal__main li::marker { color: var(--theme); }

.legal__main a { color: var(--theme); text-underline-offset: 3px; }
.legal__main a:hover { color: var(--theme-dark); }
.legal__main a:focus-visible, .legal__toc a:focus-visible {
  outline: 2px solid var(--theme); outline-offset: 2px; border-radius: 2px;
}

.legal__other {
  margin-top: 3rem !important;
  padding: 1rem 1.25rem;
  background: var(--theme-soft);
  border-radius: .75rem;
  font-size: .9375rem;
}

@media (max-width: 52rem) {
  .legal__wrap { grid-template-columns: 1fr; gap: 1.5rem; padding-top: 2rem; }
  .legal__toc { display: none; }
}
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
`;
