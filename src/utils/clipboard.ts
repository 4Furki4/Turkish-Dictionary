import { toast } from "sonner";

interface CopyToClipboardOptions {
  successMessage: string;
  errorMessage?: string;
}

/**
 * Copies the current page URL to the clipboard
 * @param options Configuration options including success and error messages
 * @returns Promise that resolves when the copy operation is complete
 */
export const copyPageUrl = async (options: CopyToClipboardOptions): Promise<void> => {
  if (typeof window === "undefined") return;
  
  try {
    const baseUrl = window.location.origin;
    const pathname = window.location.pathname;
    const fullUrl = `${baseUrl}${pathname}`;

    await navigator.clipboard.writeText(fullUrl);
    toast.success(options.successMessage);
  } catch (error) {
    console.error("Failed to copy URL:", error);
    if (options.errorMessage) {
      toast.error(options.errorMessage);
    }
  }
};

/**
 * Copies any text to the clipboard
 * @param text The text to copy
 * @param options Configuration options including success and error messages
 * @returns Promise that resolves when the copy operation is complete
 */
export const copyToClipboard = async (
  text: string,
  options: CopyToClipboardOptions
): Promise<void> => {
  if (typeof window === "undefined") return;
  
  try {
    await navigator.clipboard.writeText(text);
    toast.success(options.successMessage);
  } catch (error) {
    console.error("Failed to copy text:", error);
    if (options.errorMessage) {
      toast.error(options.errorMessage);
    }
  }
};
