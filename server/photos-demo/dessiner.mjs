// Illustrations des soins de démonstration, aux couleurs d'El Ghanja (rose poudré, mauve taupe, nude).
//   node photos-demo/dessiner.mjs   (nécessite « sharp » : npm i -D sharp)
// Les images .jpg produites sont ajoutées aux soins par seed.js. Safa peut les remplacer par ses vraies photos (« Modifier »).
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const M = '#6e5359';      // mauve foncé (traits)
const T = '#9b7a80';      // mauve taupe
const R = '#e8a5ae';      // rose
const N = '#d9b8a0';      // nude
const B = '#fff8f6';      // blanc chaud
const trait = `fill="none" stroke="${M}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`;
const fin = (c = M, w = 4) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const plein = c => `fill="${c}" stroke="${M}" stroke-width="7" stroke-linejoin="round"`;

// Petite étoile scintillante
const eclat = (x, y, t = 1, c = T) => `<path transform="translate(${x} ${y}) scale(${t})" fill="${c}" d="M0-22C3-6 6-3 22 0 6 3 3 6 0 22-3 6-6 3-22 0-6-3-3-6 0-22z"/>`;

const cadre = contenu => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="fond" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fcd8da"/><stop offset="1" stop-color="#f6e2d6"/></linearGradient>
    <linearGradient id="fard" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#9c5f86"/><stop offset=".55" stop-color="#c98fa0"/><stop offset="1" stop-color="#e8a5ae" stop-opacity=".15"/></linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#fond)"/>
  <circle cx="400" cy="300" r="225" fill="#fff" opacity=".5"/>
  <circle cx="650" cy="110" r="70" fill="#fff" opacity=".35"/>
  <circle cx="140" cy="500" r="90" fill="#fff" opacity=".3"/>
  ${contenu}
</svg>`;

const DESSINS = {
  // Rouge à lèvres + poudrier + pinceau
  'maquillage-jour': `
    <g transform="rotate(-12 330 360)">
      <rect x="290" y="330" width="80" height="150" rx="10" ${plein(N)}/>
      <rect x="298" y="300" width="64" height="38" rx="6" ${plein('#c9a58c')}/>
      <path d="M306 300V230l48-32v102z" ${plein(R)}/>
    </g>
    <ellipse cx="510" cy="300" rx="95" ry="30" ${plein('#f3dccf')}/>
    <path d="M415 300v70c0 18 42 32 95 32s95-14 95-32v-70" ${plein(N)}/>
    <ellipse cx="510" cy="300" rx="95" ry="30" ${plein('#f3dccf')}/>
    <ellipse cx="510" cy="300" rx="62" ry="18" fill="#e7bfae"/>
    <path d="M565 170l-80 110" ${trait}/>
    <path d="M585 140c18-14 36-6 34 12-2 14-18 26-34 26-12 0-16-14-8-24z" ${plein(T)}/>
    ${eclat(250, 200, 1)}${eclat(640, 420, .8, R)}${eclat(205, 420, .6)}`,

  // Œil maquillé, fard dégradé, paillettes
  'maquillage-soiree': `
    <path d="M196 332c20-170 388-170 408 0-60-60-348-60-408 0z" fill="url(#fard)"/>
    <path d="M200 330c80-90 320-90 400 0-80 80-320 80-400 0z" ${plein(B)}/>
    <circle cx="400" cy="330" r="58" ${plein(T)}/>
    <circle cx="400" cy="330" r="26" fill="${M}"/>
    <circle cx="416" cy="314" r="10" fill="#fff"/>
    <path d="M200 330c80-90 320-90 400 0" ${trait}/>
    <path d="M250 286l-22-32M300 262l-14-38M350 250l-6-40M400 246v-40M450 250l6-40M500 262l14-38M550 286l22-32" ${trait}/>
    <path d="M232 214c60-70 276-70 336 0" ${fin()} opacity=".6"/>
    ${eclat(170, 210, 1.1)}${eclat(630, 200, .9)}${eclat(610, 450, .7, R)}${eclat(250, 460, .6, R)}${eclat(560, 140, .5)}`,

  // Mariée : visage, chignon, diadème, voile
  'maquillage-mariee': `
    <path d="M360 150c-90 40-140 170-130 330l60 30c-10-120 20-230 110-290 90 60 120 170 110 290l60-30c10-160-40-290-130-330z" fill="#fff" opacity=".8" stroke="${T}" stroke-width="4"/>
    <path d="M380 400h40l6 40h-52z" ${plein('#f6dfd2')}/>
    <path d="M270 600c0-110 50-160 130-160s130 50 130 160z" ${plein(B)}/>
    <path d="M340 450c20 30 100 30 120 0" ${fin(T)}/>
    <g fill="#fff" stroke="${T}" stroke-width="2"><circle cx="370" cy="478" r="5"/><circle cx="400" cy="484" r="5"/><circle cx="430" cy="478" r="5"/></g>
    <circle cx="400" cy="140" r="44" ${plein('#8b6b62')}/>
    <ellipse cx="400" cy="290" rx="100" ry="125" ${plein('#f6dfd2')}/>
    <path d="M300 270c-6-90 44-140 100-140s106 50 100 140c-30-50-70-74-100-74s-70 24-100 74z" ${plein('#8b6b62')}/>
    <path d="M338 200l14-34 16 26 16-36 16 36 16-36 16 26 14-34" ${fin(N, 6)}/>
    <circle cx="400" cy="160" r="7" fill="${R}"/>
    <path d="M345 290c12 10 28 10 40 0M415 290c12 10 28 10 40 0" ${fin()}/>
    <path d="M345 292l-8 8M352 296l-4 10M448 296l4 10M455 292l8 8" ${fin()}/>
    <path d="M372 350c16 14 40 14 56 0-8 18-48 18-56 0z" fill="${R}" stroke="${M}" stroke-width="4"/>
    <circle cx="335" cy="325" r="16" fill="${R}" opacity=".45"/><circle cx="465" cy="325" r="16" fill="${R}" opacity=".45"/>
    <path d="M330 415c20 30 120 30 140 0" ${fin()} opacity=".5"/>
    ${eclat(190, 170, 1)}${eclat(615, 200, .8)}${eclat(640, 470, .7, R)}`,

  // Khomsa au henné, fleurs et points (fiançailles / outia)
  'maquillage-outia': `
    <path d="M330 470c-40-30-60-90-50-160l6-120c2-22 32-22 34 0l4 100 6-150c2-24 36-24 38 0l2 140 2-150c2-24 36-24 38 0l6 150 4-100c2-22 32-22 34 0l6 120c10 70-10 130-50 160z" ${plein('#f3d6c6')}/>
    <g transform="translate(400 380)" fill="none" stroke="#a0603f" stroke-width="4">
      ${[0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="0" cy="-30" rx="13" ry="26" transform="rotate(${a})"/>`).join('')}
    </g>
    <circle cx="400" cy="380" r="12" fill="#a0603f"/>
    <path d="M318 250c10 10 10 22 0 32M482 250c-10 10-10 22 0 32" ${fin('#a0603f')}/>
    <g fill="#a0603f">
      <circle cx="303" cy="210" r="5"/><circle cx="303" cy="232" r="4"/><circle cx="361" cy="170" r="5"/><circle cx="361" cy="195" r="4"/>
      <circle cx="439" cy="170" r="5"/><circle cx="439" cy="195" r="4"/><circle cx="497" cy="210" r="5"/><circle cx="497" cy="232" r="4"/>
      <circle cx="400" cy="160" r="5"/><circle cx="400" cy="185" r="4"/>
    </g>
    <path d="M360 455c26 12 54 12 80 0" ${fin('#a0603f')}/>
    ${eclat(210, 190, 1)}${eclat(600, 180, .8, R)}${eclat(610, 440, .9)}${eclat(200, 440, .6, R)}`,

  // Œil fermé, longs cils + pince qui pose une bande de cils
  'faux-cils': `
    <path d="M220 300c70 70 290 70 360 0" ${trait}/>
    <path d="M250 330l-18 50M290 350l-10 56M330 362l-6 60M370 368l-2 62M410 368l2 62M450 362l6 60M490 350l10 56M530 330l18 50" ${trait}/>
    <path d="M220 300c-14-8-22-14-30-26M580 300c14-8 22-14 30-26" ${trait}/>
    <path d="M300 230c60-40 140-40 200 0" ${fin()} opacity=".55"/>
    <path d="M470 130l150 -40M470 150l150 -10" ${plein('#c9a58c')}/>
    <path d="M470 130l-30 8 30 12" ${plein(N)}/>
    <path d="M440 138c-30 10-60 22-80 38" ${fin()}/>
    <path d="M372 170l-6 16M388 160l-4 18M404 150l-2 18M420 144v18" ${fin()}/>
    ${eclat(180, 170, .9)}${eclat(640, 420, 1, R)}${eclat(230, 470, .6)}`,

  // Flacon de vernis + ongles
  'vernis': `
    <rect x="300" y="250" width="150" height="190" rx="34" ${plein(R)}/>
    <rect x="335" y="190" width="80" height="66" rx="8" ${plein(T)}/>
    <rect x="345" y="120" width="60" height="76" rx="10" ${plein(M)}/>
    <path d="M330 290c10-14 26-20 40-20" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".7"/>
    <g transform="translate(470 250)">
      <path d="M20 200V70c0-26 46-26 46 0v130" ${plein('#f6dfd2')}/>
      <path d="M26 92c0-34 34-34 34 0v14c0 10-34 10-34 0z" ${plein(R)}/>
      <path d="M80 200V40c0-26 46-26 46 0v160" ${plein('#f6dfd2')}/>
      <path d="M86 62c0-34 34-34 34 0v14c0 10-34 10-34 0z" ${plein(R)}/>
      <path d="M140 200V80c0-24 42-24 42 0v120" ${plein('#f6dfd2')}/>
      <path d="M146 100c0-30 30-30 30 0v12c0 10-30 10-30 0z" ${plein(R)}/>
    </g>
    ${eclat(220, 180, 1)}${eclat(250, 430, .7, R)}${eclat(640, 160, .8)}`,

  // Visage avec turban, masque et rondelles de concombre
  'soin-visage': `
    <ellipse cx="400" cy="320" rx="115" ry="140" ${plein('#f2f0e6')}/>
    <path d="M285 300c-20-120 60-180 115-180s135 60 115 180c-30-60-70-80-115-80s-85 20-115 80z" ${plein(B)}/>
    <path d="M300 240c40-30 160-30 200 0M310 200c30-30 150-30 180 0" ${fin()} opacity=".6"/>
    <circle cx="355" cy="320" r="34" ${plein('#cfe3c4')}/><circle cx="355" cy="320" r="18" fill="none" stroke="#8fb487" stroke-width="4"/>
    <circle cx="445" cy="320" r="34" ${plein('#cfe3c4')}/><circle cx="445" cy="320" r="18" fill="none" stroke="#8fb487" stroke-width="4"/>
    <path d="M378 405c14 10 30 10 44 0" ${fin()}/>
    <circle cx="330" cy="385" r="5" fill="${T}"/><circle cx="470" cy="385" r="5" fill="${T}"/><circle cx="400" cy="440" r="5" fill="${T}"/>
    <path d="M560 400c0-30 40-30 40 0v60h-40z" ${plein(N)}/><rect x="566" y="370" width="28" height="22" rx="4" ${plein(T)}/>
    ${eclat(210, 200, 1)}${eclat(620, 220, .8, R)}${eclat(200, 450, .6)}`,

  // Sourcil arqué + œil + pince à épiler
  'sourcils': `
    <path d="M240 260c60-70 200-90 300-40 20 10 30 22 36 34-80-40-210-30-330 20z" ${plein('#7a5c52')}/>
    <path d="M260 360c60-60 240-60 300 0-60 60-240 60-300 0z" ${plein(B)}/>
    <circle cx="410" cy="360" r="40" ${plein(T)}/><circle cx="410" cy="360" r="18" fill="${M}"/><circle cx="422" cy="348" r="7" fill="#fff"/>
    <path d="M260 360c60-60 240-60 300 0" ${trait}/>
    <g transform="rotate(30 560 170)">
      <path d="M520 60l26 190 14 0-6-190z" ${plein('#c9a58c')}/>
      <path d="M560 60l10 190 14 0 6-190z" ${plein(N)}/>
    </g>
    ${eclat(200, 180, .9)}${eclat(620, 460, .9, R)}${eclat(230, 470, .6)}`,

  // Sèche-cheveux + brosse ronde + souffle
  'brushing': `
    <path d="M250 230h200c50 0 80 30 80 70s-30 70-80 70H250z" ${plein(T)}/>
    <rect x="200" y="240" width="60" height="120" rx="14" ${plein(M)}/>
    <path d="M360 370l-20 130c-2 16 50 16 54 0l16-130" ${plein(N)}/>
    <circle cx="455" cy="300" r="30" fill="none" stroke="#fff" stroke-width="6" opacity=".7"/>
    <path d="M560 270c20-10 40 10 60 0M560 300c20-10 40 10 60 0M560 330c20-10 40 10 60 0" ${fin()}/>
    <g transform="rotate(-35 560 470)">
      <rect x="520" y="430" width="160" height="56" rx="26" ${plein(R)}/>
      <path d="M535 430v-14M560 430v-14M585 430v-14M610 430v-14M635 430v-14M660 430v-14M535 486v14M560 486v14M585 486v14M610 486v14M635 486v14M660 486v14" ${fin()}/>
      <rect x="680" y="446" width="90" height="24" rx="12" ${plein(N)}/>
    </g>
    ${eclat(200, 160, .9)}${eclat(650, 170, .8, R)}`,

  // Tête de dos, chignon, épingle à perles et fleur
  'chignon': `
    <path d="M360 470c0-40-20-60-20-90h120c0 30-20 50-20 90" ${plein('#f6dfd2')}/>
    <path d="M300 520c20-60 180-60 200 0" ${plein(N)}/>
    <ellipse cx="400" cy="300" rx="120" ry="130" ${plein('#8b6b62')}/>
    <circle cx="400" cy="185" r="72" ${plein('#8b6b62')}/>
    <path d="M345 180c20-40 90-40 110 0M355 205c30-30 70-30 90 0M380 150c10-12 30-12 40 0" ${fin('#5a4038')}/>
    <path d="M320 260c30 40 130 40 160 0M300 320c40 50 160 50 200 0" ${fin('#5a4038')} opacity=".7"/>
    <g transform="translate(470 170)">
      <circle r="18" fill="${R}" stroke="${M}" stroke-width="4"/><circle cx="-22" cy="-10" r="14" fill="${R}" stroke="${M}" stroke-width="4"/>
      <circle cx="16" cy="-24" r="14" fill="${R}" stroke="${M}" stroke-width="4"/><circle r="7" fill="${N}"/>
    </g>
    <g fill="#fff" stroke="${M}" stroke-width="3"><circle cx="330" cy="210" r="8"/><circle cx="322" cy="232" r="7"/><circle cx="318" cy="254" r="6"/></g>
    ${eclat(200, 170, 1)}${eclat(620, 300, .8, R)}${eclat(610, 470, .6)}`
};

// ================= ROBES, TENUES, BIJOUX, ACCESSOIRES (location / vente) =================
const OR = '#d4a94c';
const ARGENT = '#b8b8c4';
const cintre = `<path d="M400 60c0-16 20-16 20-2 0 9-20 12-20 28" ${fin()}/><path d="M290 128l110-42 110 42" ${trait}/>`;
const points = (liste, c, r = 5) => liste.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');
// Points pseudo-aléatoires (toujours les mêmes) dans une zone
const semis = (n, x0, y0, l, h, graine = 1) => Array.from({ length: n }, (_, i) => {
  const a = Math.sin(i * 12.9898 + graine * 78.233) * 43758.5453, b = Math.sin(i * 39.346 + graine * 11.135) * 24634.6345;
  return [x0 + (a - Math.floor(a)) * l, y0 + (b - Math.floor(b)) * h];
});

const JUPES = {
  princesse: 'M342 205Q400 222 458 205L575 545Q400 580 225 545Z',
  sirene: 'M342 205Q400 222 458 205L448 410Q500 470 575 548Q400 578 225 548Q300 470 352 410Z',
  courte: 'M342 205Q400 222 458 205L510 395Q400 418 290 395Z'
};
function robe(c, forme, deco = '', manches = false) {
  const jupe = JUPES[forme];
  const bas = forme === 'courte' ? 380 : 520;
  let d = '';
  if (deco === 'dentelle') d = semis(26, 290, 260, 220, bas - 270, 3).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${T}" stroke-width="2.5"/>`).join('');
  if (deco === 'perles') d = semis(34, 290, 230, 220, bas - 230, 5).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#fff" stroke="${N}" stroke-width="2.5"/>`).join('');
  if (deco === 'paillettes') d = points(semis(60, 290, 140, 220, bas - 140, 7), '#fff6dc', 4) + eclat(330, 300, .5, '#fff') + eclat(460, 420, .6, '#fff');
  if (deco === 'plis') d = [300, 340, 380, 420, 460, 500].map((x, i) => `<path d="M${370 + i * 12} 225L${x} ${bas + 10}" ${fin(M, 2.5)} opacity=".35"/>`).join('');
  return `${cintre}
    ${manches ? `<path d="M356 124L292 300l26 10 50-150M444 124l64 176-26 10-50-150" fill="${c}" stroke="${M}" stroke-width="5" opacity=".9"/>` : ''}
    <path d="${jupe}" ${plein(c)}/>
    <g clip-path="url(#clip-${forme})">${d}</g>
    <clipPath id="clip-${forme}"><path d="${jupe}"/></clipPath>
    <path d="M356 122L342 205Q400 222 458 205L444 122Q400 150 356 122z" ${plein(c)}/>
    <path d="M342 205Q400 222 458 205" fill="none" stroke="${deco === 'paillettes' ? '#fff6dc' : T}" stroke-width="9" stroke-linecap="round"/>
    ${eclat(220, 170, .9)}${eclat(610, 250, .7, R)}`;
}
function keswa(c, o = OR) {
  return `${cintre}
    <path d="M330 118L470 118L575 205L535 250L478 215L488 545L312 545L322 215L265 250L225 205Z" ${plein(c)}/>
    <path d="M365 118L400 250L435 118" fill="${o}" stroke="${M}" stroke-width="4"/>
    ${points([[400, 280], [400, 320], [400, 360], [400, 400], [400, 440]], o, 9)}
    ${points([[380, 300], [420, 300], [380, 380], [420, 380], [380, 460], [420, 460]], o, 5)}
    <path d="M318 512L482 512" stroke="${o}" stroke-width="16"/>
    <path d="M538 245L578 202M262 245L222 202" stroke="${o}" stroke-width="12" stroke-linecap="round"/>
    ${eclat(200, 380, .8)}${eclat(620, 400, .7, R)}`;
}
function jebba(c, o = OR) {
  return `${cintre}
    <path d="M338 118L462 118L480 180L470 545L330 545L320 180Z" ${plein(c)}/>
    <path d="M362 118Q400 190 438 118" fill="none" stroke="${o}" stroke-width="12"/>
    <path d="M352 200L352 530M448 200L448 530" stroke="${o}" stroke-width="7" stroke-dasharray="14 8"/>
    ${points(semis(14, 365, 220, 70, 290, 9), o, 6)}
    <path d="M334 515L466 515" stroke="${o}" stroke-width="14"/>
    ${eclat(220, 300, .8)}${eclat(600, 230, .7, R)}`;
}
function caftan(c, o = OR) {
  return `${cintre}
    <path d="M335 118L465 118L560 300L520 318L470 232L492 548L308 548L330 232L280 318L240 300Z" ${plein(c)}/>
    <rect x="388" y="125" width="24" height="420" fill="${o}" opacity=".95"/>
    ${points([170, 210, 250, 330, 370, 410, 450, 490].map(y => [400, y]), '#fff', 6)}
    <rect x="328" y="268" width="144" height="30" rx="8" fill="${o}" stroke="${M}" stroke-width="4"/>
    <circle cx="400" cy="283" r="12" fill="${R}" stroke="${M}" stroke-width="3"/>
    <path d="M522 316L562 298M278 316L238 298" stroke="${o}" stroke-width="10" stroke-linecap="round"/>
    ${eclat(200, 200, .8)}${eclat(620, 450, .8, R)}`;
}
function fouta(c) {
  return `${cintre}
    <path d="M330 290L470 290L525 548L275 548Z" fill="${c}" stroke="${M}" stroke-width="7" stroke-linejoin="round"/>
    ${[300, 340, 380, 420, 460, 500].map(x => `<path d="M${x - (x - 400) * .25} 295L${x} 545" stroke="#fff" stroke-width="7" opacity=".85"/>`).join('')}
    <path d="M335 118L465 118L492 178L470 292L330 292L308 178Z" ${plein('#fffaf3')}/>
    <path d="M365 118Q400 165 435 118" fill="none" stroke="${OR}" stroke-width="9"/>
    ${points(semis(10, 345, 175, 110, 100, 4), R, 5)}
    ${eclat(210, 220, .8)}${eclat(610, 330, .7, R)}`;
}
const PLATEAU = `<ellipse cx="400" cy="470" rx="230" ry="46" fill="${N}" opacity=".55"/>`;
const BIJOUX = {
  parure: `${PLATEAU}
    <path d="M280 170Q400 400 520 170" fill="none" stroke="${OR}" stroke-width="9"/>
    ${[[300, 222], [328, 268], [362, 300], [438, 300], [472, 268], [500, 222]].map(([x, y]) => `<path d="M${x} ${y}l0 22" stroke="${OR}" stroke-width="4"/><circle cx="${x}" cy="${y + 30}" r="10" fill="#fff" stroke="${OR}" stroke-width="4"/>`).join('')}
    <path d="M400 318l-26 40 26 46 26-46z" fill="${R}" stroke="${OR}" stroke-width="6"/>
    <path d="M200 260c0-20 22-20 22 0M578 260c0-20 22-20 22 0" ${fin(OR, 5)}/>
    <path d="M211 266l-14 30 14 34 14-34zM589 266l-14 30 14 34 14-34z" fill="${R}" stroke="${OR}" stroke-width="4"/>
    ${eclat(250, 140, .9)}${eclat(560, 120, .7, R)}`,
  diademe: `${PLATEAU}
    <path d="M250 400Q400 330 550 400" fill="none" stroke="${OR}" stroke-width="14" stroke-linecap="round"/>
    <path d="M262 392L295 300L330 372L365 230L400 345L435 230L470 372L505 300L538 392" fill="none" stroke="${OR}" stroke-width="7" stroke-linejoin="round"/>
    ${points([[295, 300], [365, 230], [435, 230], [505, 300]], '#fff', 12)}
    <circle cx="400" cy="300" r="20" fill="${R}" stroke="${OR}" stroke-width="5"/>
    ${points([[300, 385], [350, 372], [450, 372], [500, 385]], '#fff', 7)}
    ${eclat(220, 230, 1)}${eclat(590, 210, .8, R)}${eclat(400, 160, .7)}`,
  boucles: `${PLATEAU}
    ${[310, 490].map(x => `<path d="M${x - 10} 120c0-22 24-22 24 0" ${fin(OR, 5)}/>
      <circle cx="${x}" cy="150" r="16" fill="${R}" stroke="${OR}" stroke-width="5"/>
      <path d="M${x - 60} 210Q${x} 270 ${x + 60} 210" fill="none" stroke="${OR}" stroke-width="7"/>
      <path d="M${x} 166L${x - 60} 210M${x} 166L${x + 60} 210" stroke="${OR}" stroke-width="4"/>
      ${[-60, -30, 0, 30, 60].map(d => `<path d="M${x + d} ${222 + (30 - Math.abs(d)) * .9}l0 ${40 + (60 - Math.abs(d))}" stroke="${OR}" stroke-width="3"/><path d="M${x + d} ${268 + (30 - Math.abs(d)) * .9 + (60 - Math.abs(d))}l-9 16 9 18 9-18z" fill="#fff" stroke="${OR}" stroke-width="3"/>`).join('')}`).join('')}
    ${eclat(200, 380, .8)}${eclat(610, 380, .7, R)}`,
  khlel: `${PLATEAU}
    ${[290, 510].map(x => `<circle cx="${x}" cy="180" r="44" fill="none" stroke="${ARGENT}" stroke-width="10"/>
      <path d="M${x - 60} 150L${x + 40} 220" stroke="${ARGENT}" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x - 50} 230L${x + 50} 230L${x} 330Z" fill="${ARGENT}" stroke="${M}" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="${x}" cy="262" r="12" fill="${R}" stroke="${M}" stroke-width="3"/>
      ${points([[x - 26, 240], [x + 26, 240], [x, 300]], '#6fa58f', 6)}`).join('')}
    <path d="M300 330Q400 440 500 330" fill="none" stroke="${ARGENT}" stroke-width="6" stroke-dasharray="10 6"/>
    ${[[335, 372], [368, 392], [400, 398], [432, 392], [465, 372]].map(([x, y]) => `<circle cx="${x}" cy="${y + 18}" r="11" fill="${ARGENT}" stroke="${M}" stroke-width="3"/>`).join('')}
    ${eclat(400, 160, .8)}${eclat(640, 300, .7, R)}`,
  bracelets: `${PLATEAU}
    ${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="400" cy="${210 + i * 38}" rx="125" ry="42" fill="none" stroke="${i % 2 ? '#e4c27a' : OR}" stroke-width="12"/>`).join('')}
    ${points([[275, 248], [525, 324], [275, 400]], R, 8)}
    ${eclat(220, 170, .9)}${eclat(600, 160, .8, R)}${eclat(610, 420, .6)}`
};
const ACCESSOIRES = {
  voile: `<path d="M345 140Q240 350 225 560L575 560Q560 350 455 140Z" fill="#fff" opacity=".85" stroke="${T}" stroke-width="4"/>
    ${points(semis(20, 260, 300, 280, 240, 2), T, 3)}
    <path d="M232 540Q260 560 290 540T350 540T410 540T470 540T530 540T570 540" fill="none" stroke="${T}" stroke-width="4"/>
    <rect x="330" y="110" width="140" height="34" rx="10" ${plein(OR)}/>
    ${points([[355, 127], [385, 127], [415, 127], [445, 127]], '#fff', 6)}
    ${eclat(200, 160, .9)}${eclat(610, 180, .8, R)}`,
  sac: c => `<path d="M290 250Q400 110 510 250" fill="none" stroke="${OR}" stroke-width="6" stroke-dasharray="12 7"/>
    <rect x="250" y="240" width="300" height="190" rx="30" ${plein(c)}/>
    <path d="M250 268Q400 380 550 268L550 262Q550 240 520 240L280 240Q250 240 250 262Z" ${plein(c)} opacity=".95"/>
    <circle cx="400" cy="318" r="18" fill="${OR}" stroke="${M}" stroke-width="5"/>
    ${points(semis(18, 270, 340, 260, 80, 6), '#fff', 3)}
    ${eclat(210, 190, .9)}${eclat(610, 420, .8, R)}`,
  escarpins: c => `<path d="M220 430Q290 418 360 438L520 452Q565 454 566 420L548 328Q528 296 485 318L360 398Q300 380 240 395Q214 410 220 430Z" ${plein(c)}/>
    <path d="M520 452L528 545L548 545L556 430" ${plein(c)}/>
    <path d="M240 420Q330 410 380 430L520 440" fill="none" stroke="#fff" stroke-width="5" opacity=".6"/>
    <path d="M330 392l-24-22 4 34zM330 392l26-18-2 34z" fill="${R}" stroke="${M}" stroke-width="4"/>
    ${eclat(240, 230, 1)}${eclat(600, 230, .8, R)}`,
  ceinture: `<path d="M170 290Q400 360 630 290L630 336Q400 406 170 336Z" ${plein('#e7c98a')}/>
    ${points(semis(24, 190, 300, 420, 40, 8).map(([x, y]) => [x, y + (x - 400) * (x - 400) / -9000 + 20]), '#fff', 4)}
    <ellipse cx="400" cy="340" rx="64" ry="50" ${plein(OR)}/>
    <ellipse cx="400" cy="340" rx="30" ry="24" fill="${R}" stroke="${M}" stroke-width="4"/>
    ${points([[330, 336], [470, 336], [400, 286], [400, 394]], '#fff', 7)}
    ${eclat(220, 200, .9)}${eclat(600, 200, .8, R)}${eclat(610, 470, .6)}`
};

export const ARTICLES = {
  'robe-mariee-princesse': robe('#ffffff', 'princesse', 'dentelle'),
  'robe-mariee-sirene': robe('#fffaf0', 'sirene', 'perles'),
  'robe-mariee-boheme': robe('#fff4ea', 'princesse', 'dentelle', true),
  'robe-mariee-manches': robe('#ffffff', 'sirene', 'plis', true),
  'keswa-tounsia': keswa('#8a1f3d'),
  'keswa-gabsia': keswa('#1f4e7a'),
  'jebba-fergani': jebba('#f4ecd8'),
  'fouta-blouza': fouta('#c0394f'),
  'caftan-bordeaux': caftan('#6d1b2e'),
  'takchita-emeraude': caftan('#1d6b55'),
  'caftan-rose': caftan('#e8b4b8', '#fff6ee'),
  'soiree-bordeaux': robe('#7a1e33', 'princesse', 'plis'),
  'soiree-paillettes': robe('#e6cfa0', 'sirene', 'paillettes'),
  'soiree-emeraude': robe('#1f6b57', 'sirene'),
  'petite-robe-noire': robe('#2b2326', 'courte', 'plis'),
  'parure-mariee': BIJOUX.parure,
  'diademe-strass': BIJOUX.diademe,
  'boucles-chandelier': BIJOUX.boucles,
  'khlel-argent': BIJOUX.khlel,
  'bracelets-dores': BIJOUX.bracelets,
  'voile-cathedrale': ACCESSOIRES.voile,
  'pochette-soiree': ACCESSOIRES.sac('#d9b8a0'),
  'escarpins-dores': ACCESSOIRES.escarpins('#d9b062'),
  'ceinture-bijou': ACCESSOIRES.ceinture
};

const dossier = fileURLToPath(new URL('.', import.meta.url));
for (const [nom, contenu] of Object.entries(DESSINS))
  await sharp(Buffer.from(cadre(contenu))).jpeg({ quality: 88 }).toFile(`${dossier}${nom}.jpg`);
mkdirSync(`${dossier}articles`, { recursive: true });
for (const [nom, contenu] of Object.entries(ARTICLES))
  await sharp(Buffer.from(cadre(contenu))).jpeg({ quality: 88 }).toFile(`${dossier}articles/${nom}.jpg`);
console.log(`✔ ${Object.keys(DESSINS).length + Object.keys(ARTICLES).length} illustrations dans ${dossier}`);
