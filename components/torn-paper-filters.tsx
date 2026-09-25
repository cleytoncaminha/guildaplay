/**
 * Filtros SVG adaptados da técnica do TornPaper.js, de Wakana Y.K.
 * Projeto original: https://github.com/happy358/TornPaper (MIT).
 */
export function TornPaperFilters() {
  return (
    <svg
      aria-hidden="true"
      className="torn-paper-filters"
      focusable="false"
      width="0"
      height="0"
    >
      <defs>
        <filter
          id="torn-paper-surface"
          x="-2%"
          y="-2%"
          width="104%"
          height="104%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.045"
            numOctaves="5"
            seed="73"
            result="edgeNoise"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" result="softSource" />
          <feMorphology in="softSource" operator="erode" radius="3.2" result="erodedSource" />
          <feDisplacementMap
            in="erodedSource"
            in2="edgeNoise"
            scale="13"
            xChannelSelector="R"
            yChannelSelector="G"
            result="tornMask"
          />
          <feComposite in="SourceGraphic" in2="tornMask" operator="atop" />
        </filter>

        <filter
          id="torn-paper-seam"
          x="-3%"
          y="-45%"
          width="106%"
          height="190%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="turbulence"
            baseFrequency="0.026 0.16"
            numOctaves="6"
            seed="41"
            result="seamNoise"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" result="softSeam" />
          <feMorphology in="softSeam" operator="erode" radius="2.2" result="erodedSeam" />
          <feDisplacementMap
            in="erodedSeam"
            in2="seamNoise"
            scale="20"
            xChannelSelector="R"
            yChannelSelector="G"
            result="tornSeam"
          />
          <feComposite in="SourceGraphic" in2="tornSeam" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}
