import html2canvas from "html2canvas-pro";
import { toast } from "sonner";

interface ScreenshotOptions {
  successMessage: string;
  failureMessage: string;
  processingMessage: string;
  fileName?: string;
}

/**
 * Detects if the current device is a mobile device
 * @returns boolean indicating if the device is mobile
 */
const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  
  // Check for common mobile user agent patterns
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()));
};

/**
 * Takes a screenshot of a DOM element and copies it to clipboard or downloads it
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
    // Check if we're on a mobile device
    const isMobile = isMobileDevice();
    
    // Prepare the element for screenshot by adding data attributes
    const prepareForScreenshot = () => {
      // Add a reference attribute to the element itself for styling
      element.setAttribute("data-ref", "card");
      
      // Add data attributes to buttons and dividers for targeting
      const buttons = element.querySelectorAll("button");
      buttons?.forEach((btn, i) => btn.setAttribute("data-screenshot-btn", `btn-${i}`));
      
      // Add attributes to dividers
      const dividers = element.querySelectorAll("hr");
      dividers?.forEach((div, i) => div.setAttribute("data-screenshot-divider", `div-${i}`));
      
      // Add attributes to SVG icons
      const svgs = element.querySelectorAll("svg");
      svgs?.forEach((svg, i) => svg.setAttribute("data-screenshot-svg", `svg-${i}`));
    };
    
    // Run preparation
    prepareForScreenshot();
    
    // Determine if the user is in light or dark mode
    const isLightMode = document.documentElement.classList.contains("light");
    
    // Set a solid background color based on theme
    // Using a darker black (#000000) for dark mode
    const solidBgColor = isLightMode ? "#ffffff" : "#000000";
    
    // Create a new style element to inject into the clone
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      /* Ensure the card has a solid background with no transparency */
      [data-ref="card"] {
        background-color: #000000 !important; /* Pure black background for dark mode */
        color: #ffffff !important;
      }
      
      /* Light mode styles */
      .light [data-ref="card"] {
        background-color: #ffffff !important;
        color: #18181b !important;
      }
      
      /* Fix alignment of part of speech and attributes with vertical divider */
      .flex.gap-2 {
        align-items: center !important;
        display: flex !important;
      }
      
      /* Fix vertical divider styling */
      [orientation="vertical"].bg-primary {
        height: 16px !important;
        width: 2px !important;
        align-self: center !important;
        margin-top: 0 !important;
        margin-bottom: 0 !important;
        display: block !important;
        background-color: #ef4444 !important;
        position: relative !important;
        top: 1px !important;
      }
      
      /* Fix text alignment */
      .flex.gap-2 p {
        margin: auto 0 !important;
        display: flex !important;
        align-items: center !important;
        line-height: 16px !important;
      }
      
      /* Fix horizontal dividers */
      [data-screenshot-divider] {
        display: block !important;
        width: 100% !important;
        border-top: 1px solid rgba(127, 127, 127, 0.5) !important;
        margin: 0.5rem 0 !important;
        height: 1px !important;
        opacity: 1 !important;
      }
      
      /* Fix button positioning */
      [data-screenshot-btn] {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        position: relative !important;
      }
      
      /* Fix SVG icon display */
      [data-screenshot-svg] {
        display: block !important;
        width: 20px !important;
        height: 20px !important;
      }
      
      /* Fix header layout */
      .card-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        width: 100% !important;
      }
      
      /* Fix header buttons container */
      .card-header-buttons {
        display: flex !important;
        gap: 0.5rem !important;
      }
    `;
    
    // Simplified approach for mobile devices
    if (isMobile) {
      // For mobile, use minimal options to improve performance
      const canvas = await html2canvas(element, {
        useCORS: true,
        logging: false,
        backgroundColor: solidBgColor,
        scale: 1, // Lower scale for better performance on mobile
        allowTaint: true,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Add our custom styles to the cloned document
          clonedDoc.head.appendChild(styleElement);
        }
      });
      
      // For mobile, skip clipboard and go straight to download
      try {
        // Create download link
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png", 0.8);
        link.download = options.fileName || "screenshot.png";
        link.click();
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
        toast.success(options.successMessage);
      } catch (err) {
        console.error("Failed to download screenshot:", err);
        toast.error(options.failureMessage);
      }
      
      // Clean up and dismiss toast
      element.removeAttribute("data-ref");
      const buttons = element.querySelectorAll("[data-screenshot-btn]");
      buttons?.forEach((btn) => btn.removeAttribute("data-screenshot-btn"));
      const dividers = element.querySelectorAll("[data-screenshot-divider]");
      dividers?.forEach((div) => div.removeAttribute("data-screenshot-divider"));
      const svgs = element.querySelectorAll("[data-screenshot-svg]");
      svgs?.forEach((svg) => svg.removeAttribute("data-screenshot-svg"));
      
      toast.dismiss(pendingToast);
      return;
    }
    
    // Desktop approach with full styling and clipboard support
    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: false,
      backgroundColor: solidBgColor,
      scale: window.devicePixelRatio * 2, // Higher scale for better quality on desktop
      allowTaint: true,
      imageTimeout: 0,
      onclone: (clonedDoc, clonedElement) => {
        // Add our custom styles to the cloned document
        clonedDoc.head.appendChild(styleElement);
        
        // Force all dividers to be visible
        const dividers = clonedElement.querySelectorAll("[data-screenshot-divider]");
        dividers.forEach((div) => {
          if (div instanceof HTMLElement) {
            div.style.display = "block";
            div.style.width = "100%";
            div.style.borderTop = "1px solid rgba(127, 127, 127, 0.5)";
            div.style.margin = "0.5rem 0";
            div.style.height = "1px";
            div.style.opacity = "1";
          }
        });
        
        // Force all buttons to be positioned correctly
        const buttons = clonedElement.querySelectorAll("[data-screenshot-btn]");
        buttons.forEach((btn) => {
          if (btn instanceof HTMLElement) {
            btn.style.display = "flex";
            btn.style.alignItems = "center";
            btn.style.justifyContent = "center";
            btn.style.position = "relative";
          }
        });
        
        // Force all SVG icons to be visible
        const svgs = clonedElement.querySelectorAll("[data-screenshot-svg]");
        svgs.forEach((svg) => {
          if (svg instanceof HTMLElement) {
            svg.style.display = "block";
            svg.style.width = "20px";
            svg.style.height = "20px";
          }
        });
      }
    });
    
    // Remove the data attributes we added
    element.removeAttribute("data-ref");
    const buttons = element.querySelectorAll("[data-screenshot-btn]");
    buttons?.forEach((btn) => btn.removeAttribute("data-screenshot-btn"));
    const dividers = element.querySelectorAll("[data-screenshot-divider]");
    dividers?.forEach((div) => div.removeAttribute("data-screenshot-divider"));
    const svgs = element.querySelectorAll("[data-screenshot-svg]");
    svgs?.forEach((svg) => svg.removeAttribute("data-screenshot-svg"));
    
    // Try to copy to clipboard (desktop only)
    try {
      // Check if the Clipboard API is fully supported
      if (navigator.clipboard && navigator.clipboard.write) {
        canvas.toBlob(
          async (blob) => {
            if (blob) {
              try {
                await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                toast.success(options.successMessage);
              } catch (err) {
                console.error("Failed to copy to clipboard:", err);
                
                // Fall back to download if clipboard fails
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = options.fileName || "screenshot.png";
                link.click();
                
                // Clean up
                setTimeout(() => URL.revokeObjectURL(link.href), 100);
                toast.success(options.successMessage);
              }
            } else {
              toast.error(options.failureMessage);
            }
            toast.dismiss(pendingToast);
          },
          "image/png",
          1.0
        );
      } else {
        // Fall back to download if clipboard API not available
        canvas.toBlob(
          (blob) => {
            if (blob) {
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
            toast.dismiss(pendingToast);
          },
          "image/png",
          1.0
        );
      }
    } catch (error) {
      console.error("Error handling screenshot:", error);
      toast.error(options.failureMessage);
      toast.dismiss(pendingToast);
    }
  } catch (error) {
    console.error("Error generating screenshot:", error);
    toast.error(options.failureMessage);
    toast.dismiss(pendingToast);
  }
};
