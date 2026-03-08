import { useState, useEffect } from "react";
import { WifiOff, Wifi, CloudOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowBanner(true);
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SYNC_OFFLINE_QUEUE' });
        }
        setTimeout(() => setShowBanner(false), 4000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowBanner(true);
    };

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'QUEUED_OFFLINE') {
        setQueuedCount(event.data.count);
      }
      if (event.data?.type === 'QUEUE_PROCESSED') {
        setQueuedCount(event.data.remaining);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [wasOffline]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        isOnline
          ? "bg-green-500 text-white"
          : "bg-yellow-500 text-black"
      }`}
      data-testid="offline-indicator"
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>You are back online</span>
            {queuedCount > 0 && (
              <span className="text-xs opacity-80">({queuedCount} actions syncing...)</span>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You are offline — browsing cached content</span>
            {queuedCount > 0 && (
              <span className="flex items-center gap-1 text-xs opacity-80">
                <CloudOff className="w-3 h-3" />
                {queuedCount} action(s) queued
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
