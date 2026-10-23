"use client";
import { useConnectionStore } from "@/lib/socket";
export function SocketInitializer() {
  const status = useConnectionStore((s) => s.status);
  return (
    <div
      role="status"
      className="fixed bottom-0 left-0 z-50 bg-white text-gray-900 text-xs p-1"
    >
      {status}
    </div>
  );
}
