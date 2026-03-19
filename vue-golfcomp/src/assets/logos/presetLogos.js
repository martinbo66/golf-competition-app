export function svgToDataUri(svg) {
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

export const presetLogos = [
  {
    id: 'golf-ball',
    label: 'Golf Ball',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><circle cx="30" cy="30" r="26" fill="white" stroke="#ccc" stroke-width="2"/><path d="M20 24 Q30 19 40 24" fill="none" stroke="#aaa" stroke-width="1.5"/><path d="M17 31 Q30 26 43 31" fill="none" stroke="#aaa" stroke-width="1.5"/><path d="M20 38 Q30 33 40 38" fill="none" stroke="#aaa" stroke-width="1.5"/></svg>'
  },
  {
    id: 'flag-pin',
    label: 'Flag Pin',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><rect x="27" y="6" width="3" height="46" fill="#888" rx="1"/><polygon points="30,6 30,27 50,16" fill="#e74c3c"/><ellipse cx="30" cy="53" rx="14" ry="4" fill="#7a5c28" opacity="0.5"/></svg>'
  },
  {
    id: 'radio',
    label: 'Radio',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><line x1="38" y1="4" x2="50" y2="16" stroke="#888" stroke-width="2" stroke-linecap="round"/><rect x="6" y="16" width="48" height="36" fill="#e74c3c" rx="5"/><rect x="10" y="21" width="22" height="20" fill="#2c3e50" rx="3"/><circle cx="11" cy="22" r="1.5" fill="#555"/><circle cx="11" cy="26" r="1.5" fill="#555"/><circle cx="11" cy="30" r="1.5" fill="#555"/><circle cx="11" cy="34" r="1.5" fill="#555"/><circle cx="11" cy="38" r="1.5" fill="#555"/><circle cx="15" cy="22" r="1.5" fill="#555"/><circle cx="15" cy="26" r="1.5" fill="#555"/><circle cx="15" cy="30" r="1.5" fill="#555"/><circle cx="15" cy="34" r="1.5" fill="#555"/><circle cx="15" cy="38" r="1.5" fill="#555"/><circle cx="19" cy="22" r="1.5" fill="#555"/><circle cx="19" cy="26" r="1.5" fill="#555"/><circle cx="19" cy="30" r="1.5" fill="#555"/><circle cx="19" cy="34" r="1.5" fill="#555"/><circle cx="19" cy="38" r="1.5" fill="#555"/><circle cx="23" cy="22" r="1.5" fill="#555"/><circle cx="23" cy="26" r="1.5" fill="#555"/><circle cx="23" cy="30" r="1.5" fill="#555"/><circle cx="23" cy="34" r="1.5" fill="#555"/><circle cx="23" cy="38" r="1.5" fill="#555"/><circle cx="27" cy="22" r="1.5" fill="#555"/><circle cx="27" cy="26" r="1.5" fill="#555"/><circle cx="27" cy="30" r="1.5" fill="#555"/><circle cx="27" cy="34" r="1.5" fill="#555"/><circle cx="27" cy="38" r="1.5" fill="#555"/><circle cx="40" cy="28" r="8" fill="#f39c12" stroke="#e67e22" stroke-width="1.5"/><circle cx="40" cy="28" r="3" fill="#e67e22"/><rect x="36" y="38" width="8" height="4" fill="#c0392b" rx="2"/><rect x="8" y="44" width="8" height="4" fill="#c0392b" rx="2"/></svg>'
  },
  {
    id: 'jolly-roger',
    label: 'Jolly Roger',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><circle cx="30" cy="30" r="28" fill="#1a1a2e"/><line x1="10" y1="52" x2="50" y2="44" stroke="white" stroke-width="5" stroke-linecap="round"/><line x1="10" y1="44" x2="50" y2="52" stroke="white" stroke-width="5" stroke-linecap="round"/><circle cx="10" cy="52" r="4.5" fill="white"/><circle cx="50" cy="44" r="4.5" fill="white"/><circle cx="10" cy="44" r="4.5" fill="white"/><circle cx="50" cy="52" r="4.5" fill="white"/><ellipse cx="30" cy="21" rx="15" ry="13" fill="white"/><rect x="21" y="28" width="18" height="9" fill="white" rx="2"/><ellipse cx="24" cy="19" rx="4" ry="4.5" fill="#1a1a2e"/><ellipse cx="36" cy="19" rx="4" ry="4.5" fill="#1a1a2e"/><ellipse cx="30" cy="25" rx="2" ry="2.5" fill="#1a1a2e"/><line x1="25" y1="29" x2="25" y2="37" stroke="#1a1a2e" stroke-width="2"/><line x1="30" y1="29" x2="30" y2="37" stroke="#1a1a2e" stroke-width="2"/><line x1="35" y1="29" x2="35" y2="37" stroke="#1a1a2e" stroke-width="2"/></svg>'
  },
  {
    id: 'trophy',
    label: 'Trophy',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><path d="M16 7 L16 34 Q16 44 30 44 Q44 44 44 34 L44 7 Z" fill="#FFD700"/><path d="M16 11 Q9 11 9 19 Q9 30 19 33" fill="none" stroke="#FFD700" stroke-width="6" stroke-linecap="round"/><path d="M44 11 Q51 11 51 19 Q51 30 41 33" fill="none" stroke="#FFD700" stroke-width="6" stroke-linecap="round"/><rect x="24" y="44" width="12" height="8" fill="#DAA520"/><rect x="18" y="52" width="24" height="5" fill="#B8860B" rx="2"/><rect x="16" y="7" width="28" height="3" fill="#B8860B"/></svg>'
  },
  {
    id: 'star',
    label: 'Star',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><polygon points="30,4 37,22 56,22 42,33 47,52 30,41 13,52 18,33 4,22 23,22" fill="#FFD700" stroke="#DAA520" stroke-width="1.5"/></svg>'
  },
  {
    id: 'cocktail',
    label: 'Cocktail',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><polygon points="8,7 52,7 30,35" fill="#a8d8ea" opacity="0.8"/><polygon points="8,7 52,7 30,35" fill="none" stroke="#5dade2" stroke-width="2"/><line x1="30" y1="35" x2="30" y2="50" stroke="#5dade2" stroke-width="2.5"/><line x1="19" y1="50" x2="41" y2="50" stroke="#5dade2" stroke-width="3" stroke-linecap="round"/><line x1="15" y1="20" x2="45" y2="13" stroke="#a0522d" stroke-width="1.5"/><ellipse cx="43" cy="13" rx="5" ry="4" fill="#27ae60"/><circle cx="43" cy="13" r="2" fill="#c0392b"/></svg>'
  },
  {
    id: 'lightning',
    label: 'Lightning',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><polygon points="36,3 20,33 31,33 24,57 42,25 30,25" fill="#f1c40f" stroke="#e67e22" stroke-width="1.5"/></svg>'
  },
  {
    id: 'crown',
    label: 'Crown',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><polygon points="8,44 8,18 20,32 30,8 40,32 52,18 52,44" fill="#FFD700" stroke="#DAA520" stroke-width="1.5"/><rect x="8" y="44" width="44" height="9" fill="#DAA520" rx="2"/><circle cx="30" cy="14" r="4" fill="#e74c3c"/><circle cx="11" cy="26" r="3" fill="#e74c3c"/><circle cx="49" cy="26" r="3" fill="#e74c3c"/></svg>'
  },
  {
    id: 'fire',
    label: 'Fire',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><path d="M30 4 C32 10 40 18 40 28 C40 36 36 40 32 38 C35 33 32 28 28 26 C29 31 28 36 26 40 C22 38 18 32 18 24 C18 16 24 10 24 10 C23 17 26 20 28 22 C27 16 28 8 30 4 Z" fill="#e74c3c"/><path d="M30 18 C31 22 36 28 34 35 C32 41 27 43 26 41 C28 37 27 33 25 30 C24 34 24 39 26 41 C22 39 20 33 22 27 C23 23 27 21 28 22 C28 24 29 26 30 26 C30 22 30 18 30 18 Z" fill="#f39c12"/></svg>'
  },
  {
    id: 'hundreds',
    label: '$100 Bills',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><rect x="12" y="10" width="44" height="27" fill="#1a7a3c" rx="2"/><rect x="10" y="13" width="44" height="27" fill="#1e8449" rx="2"/><rect x="8" y="16" width="44" height="27" fill="#27ae60" rx="2"/><rect x="6" y="19" width="44" height="27" fill="#2ecc71" rx="2"/><rect x="4" y="22" width="44" height="27" fill="#2ecc71" rx="2"/><rect x="6" y="24" width="40" height="23" fill="none" stroke="#1a7a3c" stroke-width="1"/><ellipse cx="26" cy="36" rx="7" ry="8" fill="#27ae60" stroke="#1a7a3c" stroke-width="1"/><text x="36" y="33" fill="#1a5e36" font-size="7" font-weight="bold" font-family="sans-serif">100</text><text x="36" y="43" fill="#1a5e36" font-size="7" font-weight="bold" font-family="sans-serif">100</text><text x="8" y="33" fill="#1a5e36" font-size="7" font-weight="bold" font-family="sans-serif">$</text><text x="8" y="43" fill="#1a5e36" font-size="7" font-weight="bold" font-family="sans-serif">$</text></svg>'
  },
  {
    id: 'target',
    label: 'Target',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><circle cx="30" cy="30" r="26" fill="#e74c3c"/><circle cx="30" cy="30" r="20" fill="white"/><circle cx="30" cy="30" r="14" fill="#e74c3c"/><circle cx="30" cy="30" r="8" fill="white"/><circle cx="30" cy="30" r="4" fill="#e74c3c"/></svg>'
  }
];
