/**
 * Logo "Claude" — burst de 11 rayos + wordmark con serif.
 * Tamaño controlado por la prop `height` (px). El wordmark escala automáticamente.
 */
export default function ClaudeLogo({ height = 36, className = "" }) {
  const markSize = Math.round(height * 1.05);
  const fontSize = Math.round(height * 0.9);

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      style={{ height }}
      aria-label="Claude"
    >
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <g transform="translate(50,50)" fill="#D97757">
          <ellipse cx="0" cy="-30" rx="3.2" ry="22" />
          <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(32.727)" />
          <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(65.455)" />
          <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(98.182)" />
          <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(130.909)" />
          <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(163.636)" />
          <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(196.364)" />
          <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(229.091)" />
          <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(261.818)" />
          <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(294.545)" />
          <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(327.273)" />
        </g>
      </svg>
      <span
        className="font-claude-serif font-bold leading-none text-[#181818] tracking-tight"
        style={{ fontSize }}
      >
        Claude
      </span>
    </span>
  );
}
