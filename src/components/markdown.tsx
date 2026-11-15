import { Fragment } from "react";

/**
 * Markdown simples e seguro para comunicados: parágrafos, quebras de linha,
 * listas (- ou 1.), **negrito**, *itálico* e links http(s). Gera elementos React
 * (nunca HTML cru), então não há como injetar script.
 */
const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<]+)/g;

function inline(texto: string) {
  return texto.split(INLINE).map((parte, i) => {
    if (!parte) return null;
    if (parte.startsWith("**") && parte.endsWith("**")) return <strong key={i}>{parte.slice(2, -2)}</strong>;
    if (parte.startsWith("*") && parte.endsWith("*") && parte.length > 2) return <em key={i}>{parte.slice(1, -1)}</em>;
    const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(parte);
    const url = link ? link[2] : /^https?:\/\//.test(parte) ? parte : null;
    if (url) {
      return (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-primary underline underline-offset-4">
          {link ? link[1] : parte}
        </a>
      );
    }
    return <Fragment key={i}>{parte}</Fragment>;
  });
}

export function Markdown({ texto }: { texto: string }) {
  const blocos = texto.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-3 leading-relaxed">
      {blocos.map((bloco, i) => {
        const linhas = bloco.split("\n");
        if (linhas.every((l) => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc pl-5">
              {linhas.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        if (linhas.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return (
            <ol key={i} className="list-decimal pl-5">
              {linhas.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i}>
            {linhas.map((l, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** Texto sem marcação, para o resumo na lista. */
export function textoPuro(md: string, max = 160) {
  const t = md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#>`-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}
