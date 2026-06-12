import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class PerformanceTrackerService {
  private platformId = inject(PLATFORM_ID);
  private observers: PerformanceObserver[] = [];

  startTracking(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // 1. Track Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`⏱️ [LCP]: ${lastEntry.startTime.toFixed(2)}ms`, lastEntry);
      });
      
      // buffered: true captures entries that happened before the observer attached
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP observation not supported by this browser.', e);
    }

    // 2. Track Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as any[]) {
          // Only count shifts without recent user input
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            console.log(`📐 [CLS Update]: Current cumulative score = ${clsValue.toFixed(4)}`, entry);
          }
        }
      });

      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS observation not supported by this browser.', e);
    }
  }

  stopTracking(): void {
    // Disconnect observers to prevent memory leaks when leaving the route
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    console.log('🛑 [Performance Tracker]: Stopped monitoring.');
  }
}