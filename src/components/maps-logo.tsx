
"use client"

import React, { useEffect, useRef } from 'react';

export function MapsLogo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const gradRef = useRef<SVGLinearGradientElement>(null);
  const turboRef = useRef(false);

  useEffect(() => {
    const svg = svgRef.current;
    const grad = gradRef.current;

    if (!svg || !grad) return;

    const updateGradient = (e: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const a = (x * 100).toFixed(2) + '%';
      const b = (y * 100).toFixed(2) + '%';
      grad.setAttribute('x1', a);
      grad.setAttribute('y1', b);
      grad.setAttribute('x2', (100 - x * 100).toFixed(2) + '%');
      grad.setAttribute('y2', (100 - y * 100).toFixed(2) + '%');
    };

    const toggleTurbo = () => {
      turboRef.current = !turboRef.current;
      const stops = grad.querySelectorAll('stop');
      if (turboRef.current) {
        stops[0].setAttribute('stop-color', '#3B82F6');
        stops[1].setAttribute('stop-color', '#22C55E');
      } else {
        stops[0].setAttribute('stop-color', '#3B82F6');
        stops[1].setAttribute('stop-color', '#06B6D4');
      }
    };

    svg.addEventListener('mousemove', updateGradient);
    svg.addEventListener('click', toggleTurbo);

    return () => {
      svg.removeEventListener('mousemove', updateGradient);
      svg.removeEventListener('click', toggleTurbo);
    };
  }, []);

  return (
    <div className="flex items-center justify-center p-2 group-data-[collapsible=icon]:p-0">
        <svg ref={svgRef} width="100" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MAPS — interactive logo">
            <defs>
                <linearGradient ref={gradRef} id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6"/>
                    <stop offset="100%" stopColor="#06B6D4"/>
                </linearGradient>
                <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
                    <feOffset dx="0" dy="1" result="offset"/>
                    <feMerge>
                    <feMergeNode in="offset"/>
                    <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <g id="emblem" transform="translate(10,10)" filter="url(#soft)">
                <circle cx="40" cy="40" r="36" fill="var(--ink)" opacity=".08"/>
                <g id="net" stroke="url(#g)" strokeWidth="2" strokeLinecap="round">
                    <line x1="24" y1="58" x2="40" y2="40"/>
                    <line x1="64" y1="52" x2="40" y2="40"/>
                    <line x1="30" y1="24" x2="40" y2="40"/>
                    <line x1="58" y1="26" x2="40" y2="40"/>
                </g>
                <g id="nodes">
                    <circle className="pulse" cx="40" cy="40" r="5" fill="#06B6D4"/>
                    <circle className="pulse" cx="24" cy="58" r="4" fill="#3B82F6"/>
                    <circle className="pulse" cx="64" cy="52" r="4" fill="#3B82F6"/>
                    <circle className="pulse" cx="30" cy="24" r="4" fill="#22C55E"/>
                    <circle className="pulse" cx="58" cy="26" r="4" fill="#22C55E"/>
                </g>
            </g>
        </svg>
        <span className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-cyan-500 group-data-[collapsible=icon]:hidden">
            MAPS
        </span>
    </div>
  );
}
