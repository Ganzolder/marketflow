
"use client"

import React, { useEffect, useRef } from 'react';

export function MapsLogo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const gradRef = useRef<SVGLinearGradientElement>(null);
  const altRef = useRef(false);

  useEffect(() => {
    const svg = svgRef.current;
    const grad = gradRef.current;
    if (!svg || !grad) return;

    const onMove = (e: MouseEvent) => {
      const r = svg.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * 100;
      const y = (e.clientY - r.top) / r.height * 100;
      grad.setAttribute('x1', x.toFixed(1) + '%');
      grad.setAttribute('y1', y.toFixed(1) + '%');
      grad.setAttribute('x2', (100 - x).toFixed(1) + '%');
      grad.setAttribute('y2', (100 - y).toFixed(1) + '%');
    };

    const onClick = () => {
      altRef.current = !altRef.current;
      const stops = grad.querySelectorAll('stop');
      stops[0].setAttribute('stop-color', '#3B82F6');
      stops[1].setAttribute('stop-color', altRef.current ? '#22C55E' : '#06B6D4');
    };

    svg.addEventListener('mousemove', onMove, { passive: true });
    svg.addEventListener('click', onClick);

    return () => {
      svg.removeEventListener('mousemove', onMove);
      svg.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <div className="flex items-center">
      <svg ref={svgRef} width="160" height="40" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MAPS — interactive logo">
        <defs>
          <linearGradient ref={gradRef} id="gInteractive" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6"/>
            <stop offset="100%" stopColor="#06B6D4"/>
          </linearGradient>
          <filter id="softInteractive" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b"/>
            <feOffset dx="0" dy="1" result="o"/>
            <feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <g transform="translate(0, 4)" filter="url(#softInteractive)">
          <circle cx="28" cy="28" r="25" fill="currentColor" opacity=".08"/>
          <g stroke="url(#gInteractive)" strokeWidth="2" strokeLinecap="round">
            <line x1="14" y1="42" x2="28" y2="28"/>
            <line x1="46" y1="38" x2="28" y2="28"/>
            <line x1="20" y1="14" x2="28" y2="28"/>
            <line x1="40" y1="16" x2="28" y2="28"/>
          </g>
          <g>
            <circle className="pulse" cx="28" cy="28" r="4" fill="#06B6D4"/>
            <circle className="pulse" cx="14" cy="42" r="3" fill="#3B82F6"/>
            <circle className="pulse" cx="46" cy="38" r="3" fill="#3B82F6"/>
            <circle className="pulse" cx="20" cy="14" r="3" fill="#22C55E"/>
            <circle className="pulse" cx="40" cy="16" r="3" fill="#22C55E"/>
          </g>
        </g>
        <g transform="translate(64, 10)" fill="var(--ink)">
          <text x="0" y="32" fontFamily="Inter, Manrope, system-ui, sans-serif" fontWeight="900" fontSize="38" letterSpacing="1" fill="url(#gInteractive)">
            MAPS
          </text>
        </g>
      </svg>
    </div>
  );
}
