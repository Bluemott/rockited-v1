/**
 * Share utility functions for social media platforms
 */

export type SharePlatform =
  | "pinterest"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "whatsapp"
  | "email"
  | "copy";

export interface ShareData {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

/**
 * Generate Pinterest share URL
 */
export function getPinterestShareUrl(data: ShareData): string {
  const params = new URLSearchParams({
    url: data.url,
    description: data.description || data.title,
  });

  if (data.image) {
    params.append("media", data.image);
  }

  return `https://pinterest.com/pin/create/button/?${params.toString()}`;
}

/**
 * Generate Facebook share URL
 */
export function getFacebookShareUrl(data: ShareData): string {
  const params = new URLSearchParams({
    u: data.url,
  });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Generate Twitter/X share URL
 */
export function getTwitterShareUrl(data: ShareData): string {
  const text = data.description ? `${data.title} - ${data.description}` : data.title;
  const params = new URLSearchParams({
    url: data.url,
    text: text.substring(0, 280), // Twitter character limit
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Generate LinkedIn share URL
 */
export function getLinkedInShareUrl(data: ShareData): string {
  const params = new URLSearchParams({
    url: data.url,
    summary: data.description || data.title,
  });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/**
 * Generate WhatsApp share URL
 */
export function getWhatsAppShareUrl(data: ShareData): string {
  const text = data.description
    ? `${data.title}\n\n${data.description}\n\n${data.url}`
    : `${data.title}\n\n${data.url}`;
  const params = new URLSearchParams({
    text: text,
  });
  return `https://wa.me/?${params.toString()}`;
}

/**
 * Generate Email share URL
 */
export function getEmailShareUrl(data: ShareData): string {
  const subject = encodeURIComponent(data.title);
  const body = data.description
    ? encodeURIComponent(`${data.description}\n\n${data.url}`)
    : encodeURIComponent(data.url);
  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Copy URL to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Get share URL for a specific platform
 */
export function getShareUrl(platform: SharePlatform, data: ShareData): string | null {
  switch (platform) {
    case "pinterest":
      return getPinterestShareUrl(data);
    case "facebook":
      return getFacebookShareUrl(data);
    case "twitter":
      return getTwitterShareUrl(data);
    case "linkedin":
      return getLinkedInShareUrl(data);
    case "whatsapp":
      return getWhatsAppShareUrl(data);
    case "email":
      return getEmailShareUrl(data);
    case "copy":
      return null; // Copy is handled separately
    default:
      return null;
  }
}

/**
 * Open share dialog for a platform
 */
export async function shareOnPlatform(platform: SharePlatform, data: ShareData): Promise<void> {
  if (platform === "copy") {
    await copyToClipboard(data.url);
    return;
  }

  const shareUrl = getShareUrl(platform, data);
  if (shareUrl) {
    window.open(shareUrl, "_blank", "width=600,height=400,scrollbars=yes,resizable=yes");
  }
}
