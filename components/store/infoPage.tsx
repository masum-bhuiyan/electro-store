import type { ReactNode } from "react";

export type InfoSection = {
  heading: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
};

type Props = {
  title: string;
  intro?: string;
  top?: ReactNode;
  sections?: readonly InfoSection[];
  children?: ReactNode;
};

export default function InfoPage({
  title,
  intro,
  top,
  sections = [],
  children,
}: Props) {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="font-heading text-3xl font-bold text-brand-teal">
        {title}
      </h1>
      {intro && <p className="mt-3 text-base text-gray-700">{intro}</p>}

      {top && <div className="mt-6">{top}</div>}

      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-heading text-xl font-semibold text-brand-teal">
              {s.heading}
            </h2>
            {s.paragraphs?.map((p, i) => (
              <p key={i} className="mt-2 leading-relaxed text-gray-700">
                {p}
              </p>
            ))}
            {s.bullets && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                {s.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {children && <div className="mt-10">{children}</div>}
    </article>
  );
}