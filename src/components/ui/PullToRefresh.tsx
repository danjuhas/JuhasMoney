import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const stateRef = useRef({
    startY: 0,
    pulling: false,
    refreshing: false,
    distance: 0
  });

  stateRef.current.refreshing = refreshing;
  stateRef.current.distance = distance;

  const MAX_DISTANCE = 80;
  const THRESHOLD = 60;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      const touch = e.touches[0];
      if (touch) {
        stateRef.current.startY = touch.clientY;
        stateRef.current.pulling = true;
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const state = stateRef.current;
    if (!state.pulling || state.refreshing || window.scrollY > 0) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    
    const currentY = touch.clientY;
    const diff = currentY - state.startY;

    if (diff > 0) {
      if (e.cancelable) e.preventDefault();
      const newDistance = Math.min(diff * 0.4, MAX_DISTANCE);
      state.distance = newDistance;
      setDistance(newDistance);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    const state = stateRef.current;
    if (!state.pulling) return;
    state.pulling = false;

    if (state.distance >= THRESHOLD && !state.refreshing) {
      setRefreshing(true);
      setDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setDistance(0);
        stateRef.current.distance = 0;
      }
    } else {
      setDistance(0);
      stateRef.current.distance = 0;
    }
  }, [onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center items-end overflow-hidden transition-all duration-200"
        style={{ 
          height: distance > 0 ? `${distance}px` : 0,
          opacity: distance > 0 ? Math.min(distance / THRESHOLD, 1) : 0
        }}
      >
        <div className="pb-4">
          <Loader2 
            className={`w-6 h-6 text-emerald-500 ${refreshing ? 'animate-spin' : ''}`} 
            style={{ transform: !refreshing ? `rotate(${distance * 3}deg)` : undefined }} 
          />
        </div>
      </div>
      <div 
        className="transition-transform duration-200 ease-out h-full"
        style={{ transform: `translate3d(0, ${distance}px, 0)` }}
      >
        {children}
      </div>
    </div>
  );
}
