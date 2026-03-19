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
    id: 'putter',
    label: 'Putter',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><rect x="27" y="4" width="6" height="38" fill="#8B4513" rx="3"/><rect x="18" y="42" width="24" height="11" fill="#555" rx="3"/><rect x="18" y="42" width="24" height="4" fill="#444" rx="2"/></svg>'
  },
  {
    id: 'golf-cart',
    label: 'Golf Cart',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><rect x="4" y="26" width="42" height="18" fill="#3498db" rx="4"/><rect x="24" y="14" width="22" height="16" fill="#5dade2" rx="3"/><rect x="4" y="30" width="42" height="3" fill="#2980b9"/><circle cx="14" cy="47" r="7" fill="#2c3e50"/><circle cx="14" cy="47" r="3" fill="#95a5a6"/><circle cx="40" cy="47" r="7" fill="#2c3e50"/><circle cx="40" cy="47" r="3" fill="#95a5a6"/></svg>'
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
    id: 'shield',
    label: 'Shield',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><path d="M30 4 L52 12 L52 30 Q52 48 30 56 Q8 48 8 30 L8 12 Z" fill="#2980b9"/><path d="M30 11 L46 18 L46 30 Q46 43 30 50 Q14 43 14 30 L14 18 Z" fill="#3498db"/><text x="30" y="37" text-anchor="middle" fill="white" font-size="18" font-weight="bold" font-family="sans-serif">G</text></svg>'
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
    id: 'diamond',
    label: 'Diamond',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><polygon points="30,4 52,22 30,56 8,22" fill="#3498db"/><polygon points="30,4 52,22 30,26 8,22" fill="#5dade2"/><polygon points="30,26 52,22 30,56" fill="#2471a3"/><polygon points="30,26 8,22 30,56" fill="#1a5276"/><line x1="8" y1="22" x2="52" y2="22" stroke="#7fb3d3" stroke-width="1"/></svg>'
  },
  {
    id: 'target',
    label: 'Target',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><circle cx="30" cy="30" r="26" fill="#e74c3c"/><circle cx="30" cy="30" r="20" fill="white"/><circle cx="30" cy="30" r="14" fill="#e74c3c"/><circle cx="30" cy="30" r="8" fill="white"/><circle cx="30" cy="30" r="4" fill="#e74c3c"/></svg>'
  }
];
