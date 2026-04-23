// Capture up to 20 recent error events from the console
const MAX_ERRORS = 20;
const capturedErrors: string[] = [];

// Utility function to bind and extract errors from the console
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  capturedErrors.push(args.map(String).join(" "));
  if (capturedErrors.length > MAX_ERRORS) capturedErrors.shift();
  originalConsoleError(...args);
};

// Listen for specific errors
window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason instanceof Error ? event.reason.message : String(event.reason);
  capturedErrors.push(`Unhandled rejection: ${msg}`);
  if (capturedErrors.length > MAX_ERRORS) capturedErrors.shift();
});

export const getRecentErrors = (): string[] => [...capturedErrors];
