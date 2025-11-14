let apiPromise: Promise<void> | null = null;

/**
 * Ensures the YouTube IFrame API script is loaded only once and returns a promise
 * that resolves when the API is ready.
 */
export function loadYouTubeAPI(): Promise<void> {
  if (apiPromise) {
    return apiPromise;
  }

  apiPromise = new Promise((resolve, reject) => {
    // Check if the API is already loaded by a previous call
    // FIX: Cast window to any to access YT property for YouTube IFrame API
    if ((window as any).YT && (window as any).YT.Player) {
      resolve();
      return;
    }

    // Assign the resolve function to the global callback that the YouTube API script will call
    (window as any).onYouTubeIframeAPIReady = () => {
      resolve();
    };

    // Create and inject the script tag into the document
    const script = document.createElement('script');
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
        reject(new Error('Failed to load YouTube IFrame API'));
        apiPromise = null; // Reset promise on failure to allow retries
    };
    document.body.appendChild(script);
  });

  return apiPromise;
}