import html2canvas from "html2canvas-pro";
import { toast } from "sonner";

interface ScreenshotOptions {
  successMessage: string;
  failureMessage: string;
  processingMessage: string;
  fileName?: string;
}

/**
 * Takes a screenshot of a DOM element and downloads it
 * @param element The DOM element to capture
 * @param options Messages for toast notifications and optional filename for download
 * @returns Promise that resolves when the screenshot is taken
 */
export const captureElementScreenshot = async (
  element: HTMLElement,
  options: ScreenshotOptions
): Promise<void> => {
  if (!element) return;

  // Create a notification that screenshot is being taken
  const pendingToast = toast.loading(options.processingMessage);
  
  try {
    // Basic styling preparation - just add a data attribute for styling
    element.setAttribute("data-screenshot", "true");
    
    // Determine if the user is in light or dark mode
    const isLightMode = document.documentElement.classList.contains("light");
    const bgColor = isLightMode ? "#ffffff" : "#000000";
    
    // Create a simple style element with minimal styling
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      [data-screenshot="true"] {
        background-color: ${bgColor} !important;
        color: ${isLightMode ? "#18181b" : "#ffffff"} !important;
      }
      
      [orientation="vertical"].bg-primary {
        height: 16px !important;
        width: 2px !important;
        background-color: #ef4444 !important;
      }
    `;
    
    // Take the screenshot with minimal options
    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: false,
      backgroundColor: bgColor,
      scale: 1.5, // Moderate scale for balance of quality and performance
      allowTaint: true,
      onclone: (clonedDoc) => {
        // Add our minimal styles to the cloned document
        clonedDoc.head.appendChild(styleElement);
      }
    });
    
    // Clean up the attribute we added
    element.removeAttribute("data-screenshot");
    
    // Always download the image instead of trying to use clipboard
    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Create download link
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = options.fileName || "screenshot.png";
          link.click();
          
          // Clean up
          setTimeout(() => URL.revokeObjectURL(link.href), 100);
          toast.success(options.successMessage);
        } else {
          toast.error(options.failureMessage);
        }
        
        // Always dismiss the loading toast
        toast.dismiss(pendingToast);
      },
      "image/png",
      0.8 // Slightly lower quality for better performance
    );
  } catch (error) {
    console.error("Error generating screenshot:", error);
    toast.error(options.failureMessage);
    toast.dismiss(pendingToast);
    
    // Clean up in case of error
    element.removeAttribute("data-screenshot");
  }
};
