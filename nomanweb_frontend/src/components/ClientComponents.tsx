"use client";

import dynamic from "next/dynamic";

// Lazy load performance monitor for development
const PerformanceMonitor = dynamic(
  () => import("@/components/performance/PerformanceMonitor"),
  { ssr: false }
);

// Lazy load service worker provider
const ServiceWorkerProvider = dynamic(
  () => import("@/components/providers/ServiceWorkerProvider"),
  { ssr: false }
);

export default function ClientComponents() {
  return (
    <>
      <PerformanceMonitor />
      <ServiceWorkerProvider />
    </>
  );
}
