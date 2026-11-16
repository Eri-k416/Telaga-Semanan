/**
 * High-fidelity deterministic SVG data-URI illustrations for ponds, fish species,
 * hero lake scenery, and membership cards. Guarantees 100% offline/sandbox resilience
 * with zero broken images.
 */

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const HERO_LAKE_IMAGE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#07192F"/>
      <stop offset="48%" stop-color="#0D3B56"/>
      <stop offset="100%" stop-color="#146B78"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0F5C6E"/>
      <stop offset="45%" stop-color="#0A3A4E"/>
      <stop offset="100%" stop-color="#061A2B"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.72" cy="0.32" r="0.28">
      <stop offset="0%" stop-color="#FF9E6D" stop-opacity="0.9"/>
      <stop offset="45%" stop-color="#F97316" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#146B78" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="360" fill="url(#sky)"/>
  <rect width="1200" height="360" fill="url(#sun)"/>
  <circle cx="860" cy="210" r="56" fill="#FF8C5A" opacity="0.85"/>
  <!-- Distant Mist Hills -->
  <path d="M0 320 Q180 240 390 295 T820 275 T1200 310 L1200 360 L0 360 Z" fill="#0B2E46" opacity="0.75"/>
  <path d="M0 340 Q260 280 540 325 T1020 300 L1200 335 L1200 360 L0 360 Z" fill="#072136"/>
  <!-- Water Surface -->
  <rect y="355" width="1200" height="320" fill="url(#water)"/>
  <!-- Sun Reflection on Water -->
  <ellipse cx="860" cy="390" rx="95" ry="8" fill="#FF9E6D" opacity="0.45"/>
  <ellipse cx="860" cy="415" rx="70" ry="6" fill="#FF9E6D" opacity="0.35"/>
  <ellipse cx="860" cy="440" rx="50" ry="5" fill="#FF9E6D" opacity="0.25"/>
  <!-- Timber Fishing Pavilion Left -->
  <polygon points="90,260 230,210 370,260" fill="#1E293B" stroke="#38BDF8" stroke-width="1.5" stroke-opacity="0.35"/>
  <rect x="120" y="260" width="10" height="125" fill="#334155"/>
  <rect x="225" y="260" width="10" height="125" fill="#334155"/>
  <rect x="330" y="260" width="10" height="125" fill="#334155"/>
  <rect x="70" y="375" width="360" height="14" rx="3" fill="#475569"/>
  <rect x="105" y="389" width="8" height="55" fill="#1E293B"/>
  <rect x="205" y="389" width="8" height="55" fill="#1E293B"/>
  <rect x="305" y="389" width="8" height="55" fill="#1E293B"/>
  <rect x="405" y="389" width="8" height="55" fill="#1E293B"/>
  <!-- Subtle Water Ripples -->
  <path d="M120 490 Q240 482 360 490 T600 495" stroke="#22D3EE" stroke-width="1.5" fill="none" opacity="0.3"/>
  <path d="M480 545 Q640 535 800 545 T1080 540" stroke="#38BDF8" stroke-width="1.5" fill="none" opacity="0.25"/>
  <!-- Jumping Golden Carp Silhouette -->
  <path d="M630 430 Q665 390 705 415 Q685 435 630 430 Z" fill="#FB923C" opacity="0.85"/>
  <polygon points="615,436 632,428 628,444" fill="#F97316" opacity="0.85"/>
</svg>
`);

export const POND_IMAGES: Record<string, string> = {
  'pond-1': svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="p1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0B2545"/>
          <stop offset="55%" stop-color="#0D6E7A"/>
          <stop offset="100%" stop-color="#134E5E"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#p1)"/>
      <circle cx="660" cy="110" r="65" fill="#22D3EE" opacity="0.18"/>
      <path d="M0 240 Q200 190 420 230 T800 215 L800 500 L0 500 Z" fill="#083344" opacity="0.75"/>
      <rect x="60" y="290" width="240" height="12" rx="4" fill="#94A3B8" opacity="0.45"/>
      <polygon points="80,220 180,175 280,220" fill="#0F172A" opacity="0.7"/>
      <path d="M120 390 Q280 375 440 390 T720 385" stroke="#67E8F9" stroke-width="2" fill="none" opacity="0.4"/>
    </svg>
  `),
  'pond-2': svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="p2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0F172A"/>
          <stop offset="50%" stop-color="#1E3A5F"/>
          <stop offset="100%" stop-color="#0F766E"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#p2)"/>
      <circle cx="160" cy="120" r="55" fill="#FB923C" opacity="0.25"/>
      <path d="M0 250 Q260 205 510 245 T800 225 L800 500 L0 500 Z" fill="#0B2942" opacity="0.85"/>
      <rect x="440" y="310" width="290" height="12" rx="4" fill="#CBD5E1" opacity="0.35"/>
      <path d="M90 410 Q290 395 490 410" stroke="#38BDF8" stroke-width="2" fill="none" opacity="0.4"/>
    </svg>
  `),
  'pond-3': svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="p3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#07192F"/>
          <stop offset="60%" stop-color="#0E4D64"/>
          <stop offset="100%" stop-color="#0A2E46"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#p3)"/>
      <rect x="80" y="260" width="640" height="10" fill="#38BDF8" opacity="0.3"/>
      <path d="M0 280 L800 280 L800 500 L0 500 Z" fill="#062033" opacity="0.8"/>
      <path d="M160 360 L640 360" stroke="#22D3EE" stroke-width="2" stroke-dasharray="14 10" opacity="0.45"/>
      <path d="M160 420 L640 420" stroke="#FB923C" stroke-width="2" stroke-dasharray="14 10" opacity="0.45"/>
    </svg>
  `),
  'pond-4': svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="p4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1E293B"/>
          <stop offset="55%" stop-color="#0F4C5C"/>
          <stop offset="100%" stop-color="#092327"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#p4)"/>
      <path d="M0 230 Q190 180 410 230 T800 210 L800 500 L0 500 Z" fill="#0B2B36" opacity="0.85"/>
      <circle cx="400" cy="150" r="45" fill="#F59E0B" opacity="0.22"/>
      <path d="M140 380 Q400 355 660 380" stroke="#94A3B8" stroke-width="2" fill="none" opacity="0.35"/>
    </svg>
  `),
  'pond-5': svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="p5" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#091526"/>
          <stop offset="50%" stop-color="#134E5E"/>
          <stop offset="100%" stop-color="#0B3848"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#p5)"/>
      <circle cx="620" cy="130" r="70" fill="#F59E0B" opacity="0.3"/>
      <polygon points="180,220 330,155 480,220" fill="#F59E0B" opacity="0.35"/>
      <rect x="210" y="220" width="240" height="65" fill="#0F172A" opacity="0.65"/>
      <path d="M0 285 L800 285 L800 500 L0 500 Z" fill="#062330" opacity="0.85"/>
      <path d="M180 375 Q400 355 620 375" stroke="#FBBF24" stroke-width="2" fill="none" opacity="0.45"/>
    </svg>
  `),
};

export function getFishImage(speciesName: string): string {
  const palette: Record<string, { bg1: string; bg2: string; body: string; fin: string; accent: string }> = {
    'Ikan Mas Kumpay': { bg1: '#0A2540', bg2: '#0F5257', body: '#F97316', fin: '#FDBA74', accent: '#FEF08A' },
    'Ikan Gurame Soang': { bg1: '#0F172A', bg2: '#134E4A', body: '#38BDF8', fin: '#0284C7', accent: '#E0F2FE' },
    'Ikan Patin Siam': { bg1: '#0B1D33', bg2: '#1E3A5F', body: '#94A3B8', fin: '#64748B', accent: '#E2E8F0' },
    'Ikan Bawal Bintang': { bg1: '#091E32', bg2: '#0E5A6D', body: '#CBD5E1', fin: '#FB7185', accent: '#FFF1F2' },
    'Ikan Nila Merah': { bg1: '#1A1829', bg2: '#0F4C5C', body: '#F43F5E', fin: '#FDA4AF', accent: '#FFE4E6' },
    'Ikan Tombro Agung': { bg1: '#071E26', bg2: '#0D5C63', body: '#EAB308', fin: '#FDE047', accent: '#FEF9C3' },
    'Ikan Lele Sangkuriang': { bg1: '#0F172A', bg2: '#1E293B', body: '#475569', fin: '#334155', accent: '#94A3B8' },
    'Ikan Gabus Toman': { bg1: '#061A23', bg2: '#0F4C5C', body: '#10B981', fin: '#059669', accent: '#A7F3D0' },
  };
  const colors = palette[speciesName] || palette['Ikan Mas Kumpay'];

  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
      <defs>
        <linearGradient id="fbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${colors.bg1}"/>
          <stop offset="100%" stop-color="${colors.bg2}"/>
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#fbg)"/>
      <!-- Underwater light rays -->
      <polygon points="80,0 180,0 320,400 180,400" fill="#38BDF8" opacity="0.07"/>
      <polygon points="280,0 410,0 540,400 390,400" fill="#22D3EE" opacity="0.06"/>
      <!-- Dorsal & Ventral Fins -->
      <path d="M230 140 Q290 85 350 135 Z" fill="${colors.fin}" opacity="0.88"/>
      <path d="M250 260 Q295 305 340 255 Z" fill="${colors.fin}" opacity="0.85"/>
      <!-- Tail Fin -->
      <polygon points="155,200 85,135 110,200 85,265" fill="${colors.fin}"/>
      <!-- Fish Body -->
      <path d="M145 200 C195 115, 385 115, 475 200 C385 285, 195 285, 145 200 Z" fill="${colors.body}"/>
      <!-- Scale Shimmer Pattern -->
      <path d="M235 175 Q255 200 235 225" stroke="${colors.accent}" stroke-width="2.5" fill="none" opacity="0.45"/>
      <path d="M285 168 Q305 200 285 232" stroke="${colors.accent}" stroke-width="2.5" fill="none" opacity="0.45"/>
      <path d="M335 172 Q355 200 335 228" stroke="${colors.accent}" stroke-width="2.5" fill="none" opacity="0.45"/>
      <!-- Gill & Eye -->
      <path d="M395 162 Q380 200 395 238" stroke="${colors.bg1}" stroke-width="3" fill="none" opacity="0.5"/>
      <circle cx="430" cy="188" r="9" fill="#FFFFFF"/>
      <circle cx="432" cy="188" r="4.5" fill="#0F172A"/>
      <!-- Subtle Water Bubbles -->
      <circle cx="495" cy="155" r="5" fill="#E0F2FE" opacity="0.4"/>
      <circle cx="515" cy="125" r="8" fill="#E0F2FE" opacity="0.3"/>
      <circle cx="505" cy="92" r="4" fill="#E0F2FE" opacity="0.25"/>
    </svg>
  `);
}
