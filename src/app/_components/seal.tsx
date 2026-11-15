import { useId } from "react";

/**
 * A Chinese seal stamp (印章) drawn in SVG, with worn edges and uneven ink.
 *
 * - "intaglio" (白文): white characters cut out of a solid red block.
 * - "relief" (朱文): red characters inside a red border.
 *
 * Characters are laid out the traditional way: columns right to left,
 * top to bottom. 1 → centred, 2 → one column, 3–4 → two columns.
 */
export function Seal({
  text,
  variant = "intaglio",
  size = 56,
  rotate = 0,
  shape = "square",
  className,
  title,
}: {
  text: string;
  variant?: "intaglio" | "relief";
  size?: number;
  rotate?: number;
  shape?: "square" | "tall" | "round";
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  const chars = [...text];
  const w = 100;
  const h = shape === "tall" ? 150 : 100;
  const cells = layout(chars, w, h);
  const red = "var(--seal)";
  const isIntaglio = variant === "intaglio";
  const seed = [...text].reduce((n, c) => n + c.charCodeAt(0), 0) % 97;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={(size * h) / w}
      className={`seal ${className ?? ""}`}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        {/* Rough, slightly wobbly edges. */}
        <filter id={`rough-${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed={seed} result="wobble" />
          <feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" result="rough" />
          {/* Speckles where the ink didn't take. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed={seed + 7} result="speck" />
          <feColorMatrix
            in="speck"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -14 9.6"
            result="holes"
          />
          <feComposite in="rough" in2="holes" operator="in" />
        </filter>
        {isIntaglio && (
          <mask id={`cut-${id}`}>
            <rect width={w} height={h} fill="white" />
            {cells.map((c, i) => (
              <text key={i} {...textProps(c)} fill="black">
                {c.char}
              </text>
            ))}
          </mask>
        )}
      </defs>
      <g filter={`url(#rough-${id})`} opacity={0.92}>
        {isIntaglio ? (
          shape === "round" ? (
            <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 3} ry={h / 2 - 3} fill={red} mask={`url(#cut-${id})`} />
          ) : (
            <rect x="3" y="3" width={w - 6} height={h - 6} rx="4" fill={red} mask={`url(#cut-${id})`} />
          )
        ) : (
          <>
            {shape === "round" ? (
              <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 6} ry={h / 2 - 6} fill="none" stroke={red} strokeWidth="6" />
            ) : (
              <rect x="5" y="5" width={w - 10} height={h - 10} rx="3" fill="none" stroke={red} strokeWidth="6" />
            )}
            {cells.map((c, i) => (
              <text key={i} {...textProps(c)} fill={red}>
                {c.char}
              </text>
            ))}
          </>
        )}
      </g>
    </svg>
  );
}

type Cell = { char: string; x: number; y: number; size: number };

function layout(chars: string[], w: number, h: number): Cell[] {
  // Characters sit in a grid inside a margin, like a carved seal face.
  const pad = 13;
  const n = chars.length;
  if (n <= 1) return [{ char: chars[0] ?? "", x: w / 2, y: h / 2, size: (Math.min(w, h) - pad * 2) * 0.86 }];
  const cols = n === 2 ? 1 : 2;
  const rows = Math.ceil(n / cols);
  const cellW = (w - pad * 2) / cols;
  const cellH = (h - pad * 2) / rows;
  const size = Math.min(cellW, cellH) * 0.9;
  // Read the right column first, top to bottom.
  return chars.map((char, i) => {
    const col = Math.floor(i / rows); // 0 = rightmost
    const row = i % rows;
    return {
      char,
      x: w - pad - cellW * (col + 0.5),
      y: pad + cellH * (row + 0.5),
      size,
    };
  });
}

function textProps(c: Cell) {
  return {
    x: c.x,
    y: c.y,
    fontSize: c.size,
    fontWeight: 900,
    textAnchor: "middle" as const,
    dominantBaseline: "central" as const,
    fontFamily: "var(--font-noto-serif-hk), 'Songti TC', serif",
  };
}
