/**
 * Helper to construct full URL for static uploads & profile pictures.
 * Automatically resolves server IP/hostname when accessed from other network devices.
 */
export const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  
  const apiEnv = process.env.NEXT_PUBLIC_API_URL;
  if (apiEnv) {
    const cleanBase = apiEnv.replace(/\/$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }
  
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${protocol}//${hostname}:8000${cleanPath}`;
  }
  
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `http://localhost:8000${cleanPath}`;
};
