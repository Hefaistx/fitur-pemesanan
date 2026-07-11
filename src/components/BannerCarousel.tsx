'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface BannerCarouselProps {
  images: string[];
  alt: string;
  height?: number;
  dotBottom?: number; // px dari bawah, default 68 (menu page), 12 untuk dashboard
  showGradient?: boolean;
}

export default function BannerCarousel({ images, alt, height = 240, dotBottom = 68, showGradient = true }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isScrolling = useRef<boolean | null>(null); // null = belum tahu arah scroll

  const clearAuto = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  const goTo = useCallback((idx: number) => {
    setCurrent((idx + images.length) % images.length);
  }, [images.length]);

  // Auto-play
  useEffect(() => {
    if (images.length <= 1) return;
    clearAuto();
    autoPlayRef.current = setInterval(() => setCurrent((c) => (c + 1) % images.length), 4000);
    return clearAuto;
  }, [current, images.length]);

  // ── Pointer events (mouse + touch unified) ──
  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    isScrolling.current = null;
    setIsDragging(false);
    clearAuto();
    // capture untuk mouse
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null || startY.current === null) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    // Tentukan arah scroll sekali saja di awal gerakan
    if (isScrolling.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isScrolling.current = Math.abs(dy) > Math.abs(dx);
    }

    // Jika user scroll vertikal, jangan intercept
    if (isScrolling.current) return;

    e.preventDefault();
    setIsDragging(true);
    setDragOffset(dx);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null || isScrolling.current) {
      startX.current = null;
      startY.current = null;
      setDragOffset(0);
      setIsDragging(false);
      return;
    }

    const dx = e.clientX - startX.current;
    const containerW = containerRef.current?.offsetWidth ?? 300;
    const threshold = containerW * 0.2; // 20% lebar container

    if (Math.abs(dx) > threshold) {
      goTo(dx < 0 ? current + 1 : current - 1);
    }

    startX.current = null;
    startY.current = null;
    isScrolling.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  if (images.length === 0) return null;

  const containerW = containerRef.current?.offsetWidth ?? 0;
  const translateX = -(current * containerW) + dragOffset;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-grey select-none touch-pan-y"
      style={{ height, cursor: isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Track */}
      <div
        className="flex h-full"
        style={{
          width: `${images.length * 100}%`,
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
        }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="relative h-full shrink-0"
            style={{ width: `${100 / images.length}%` }}
          >
            <Image
              src={src}
              alt={`${alt} ${i + 1}`}
              fill
              className="object-cover pointer-events-none"
              priority={i === 0}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Gradient bawah */}
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute left-0 right-0 flex justify-center gap-1.5 pointer-events-none" style={{ bottom: dotBottom }}>
          {images.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 18 : 6,
                height: 6,
                backgroundColor: i === current ? '#ffffff' : 'rgba(255,255,255,0.45)',
              }}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-14 right-4 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 pointer-events-none">
          <span className="text-white text-[11px] font-medium">{current + 1}/{images.length}</span>
        </div>
      )}
    </div>
  );
}
