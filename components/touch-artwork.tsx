'use client';

import { useRef } from 'react';

export type ArtworkTransform = { scale: number; offsetX: number; offsetY: number };

export function TouchArtwork({ src, selected, onSelect, transform, onChange, pl }: { src: string; selected: boolean; onSelect: () => void; transform: ArtworkTransform; onChange: (value: ArtworkTransform) => void; pl: boolean }) {
  const gesture = useRef<{ pointer: number; mode: 'move' | 'resize'; x: number; y: number; width: number; height: number; start: ArtworkTransform } | null>(null);
  return <div className={`touch-artwork${selected ? ' is-selected' : ''}`} onPointerDown={(event) => {
    event.preventDefault(); onSelect();
    const rect = event.currentTarget.getBoundingClientRect();
    gesture.current = { pointer: event.pointerId, mode: (event.target as HTMLElement).closest('.artwork-resize-handle') ? 'resize' : 'move', x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, start: transform };
    event.currentTarget.setPointerCapture(event.pointerId);
  }} onPointerMove={(event) => {
    const current = gesture.current; if (!current || current.pointer !== event.pointerId) return;
    const dx = (event.clientX - current.x) / current.width;
    const dy = (event.clientY - current.y) / current.height;
    if (current.mode === 'resize') onChange({ ...current.start, scale: Math.max(.1, Math.min(1, current.start.scale + dx + dy)) });
    else onChange({ ...current.start, offsetX: Math.max(-.5, Math.min(.5, current.start.offsetX + dx)), offsetY: Math.max(-.5, Math.min(.5, current.start.offsetY + dy)) });
  }} onPointerUp={(event) => { if (gesture.current?.pointer === event.pointerId) gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }} onLostPointerCapture={() => { gesture.current = null; }}>
    <div className="touch-artwork-image" style={{ width: `${transform.scale * 100}%`, height: `${transform.scale * 100}%`, left: `${50 + transform.offsetX * 100}%`, top: `${50 + transform.offsetY * 100}%` }}>
      {/* Local upload URLs retain their alpha channel. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={pl ? 'Twój projekt' : 'Your artwork'} draggable={false} />
      {selected && <button type="button" className="artwork-resize-handle" aria-label={pl ? 'Zmień rozmiar grafiki' : 'Resize artwork'} onKeyDown={(event) => { if (event.key === 'ArrowUp' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowLeft') { event.preventDefault(); onChange({ ...transform, scale: Math.max(.1, Math.min(1, transform.scale + (event.key === 'ArrowUp' || event.key === 'ArrowRight' ? .05 : -.05))) }); } }}>↘</button>}
    </div>
  </div>;
}
