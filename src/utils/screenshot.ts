import html2canvas from "html2canvas-pro";
import { toast } from "sonner";

interface ScreenshotOptions {
  successMessage: string; // For successful clipboard copy
  failureMessage: string; // For general screenshot creation failure (e.g., blob is null, html2canvas error)
  processingMessage: string;
  clipboardCopyFailureMessage: string; // For when clipboard.write fails and fallback to download occurs
  fileName?: string;
}

/**
 * Takes a screenshot of a DOM element and copies it to the clipboard
 * @param element The DOM element to capture
 * @param options Messages for toast notifications and optional filename for download
 * @returns Promise that resolves when the screenshot is taken
 */
export const captureElementScreenshot = async (
  element: HTMLElement,
  options: ScreenshotOptions
): Promise<void> => {
  if (!element) return;

  try {
    // Create a notification that screenshot is being taken
    const pendingToast = toast.loading(options.processingMessage);

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

        /* For light theme if needed */
        .light [data-ref="card"] {
          background-color: #ffffff !important;
          color: #18181b !important;
        }
        
        /* Fix vertical alignment of part of speech with divider */
        .flex.gap-2 {
          align-items: center !important;
          display: flex !important;
        }
        
        /* Ensure vertical divider has consistent height and position */
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
        
        /* Ensure text is properly aligned with divider */
        .flex.gap-2 p {
          margin: auto 0 !important;
          display: flex !important;
          align-items: center !important;
          line-height: 16px !important;
        }
        
        /* Fix the header buttons container */
        .flex.w-full.items-center.gap-4 {
          display: flex !important;
          width: 100% !important;
          align-items: center !important;
        }
        
        /* Fix the first button (volume) */
        .flex.w-full.items-center.gap-4 > button:first-of-type {
          margin-right: auto !important;
        }
        
        /* Fix all buttons in the header */
        .flex.w-full.items-center.gap-4 > button {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          background-color: transparent !important;
        }
        
        [data-screenshot-divider] {
          display: block !important;
          width: 100% !important;
          border-top: 1px solid rgba(127, 127, 127, 0.5) !important;
          margin: 0.5rem 0 !important;
          height: 1px !important;
          opacity: 1 !important;
        }
        
        [data-screenshot-btn] {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          position: relative !important;
        }
        
        [data-screenshot-svg] {
        display: none !important;
      }
      [data-screenshot-watermark] {
        display: block !important;
      }
        
        .card-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 100% !important;
        }
        
        .card-header-buttons {
          display: flex !important;
          gap: 0.5rem !important;
        }
      `;

    // Capture with specific settings to preserve layout
    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: false,
      backgroundColor: solidBgColor, // Use a solid background color with no transparency
      scale: window.devicePixelRatio * 2, // Higher scale for better quality
      allowTaint: true,
      imageTimeout: 0, // No timeout for images
      ignoreElements: (el) =>
        el.nodeName.toLowerCase() === 'canvas' ||
        el.getAttribute('loading') === 'lazy',
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

        // Fix the header buttons container specifically
        const headerButtonsContainer = clonedElement.querySelector(".flex.w-full.items-center.gap-4");
        if (headerButtonsContainer instanceof HTMLElement) {
          headerButtonsContainer.style.display = "flex";
          headerButtonsContainer.style.width = "100%";
          headerButtonsContainer.style.alignItems = "center";

          // Fix each button in the header
          const headerButtons = headerButtonsContainer.querySelectorAll("button");
          headerButtons.forEach((btn, index) => {
            if (btn instanceof HTMLElement) {
              btn.style.display = "inline-flex";
              btn.style.alignItems = "center";
              btn.style.justifyContent = "center";
              btn.style.backgroundColor = "transparent";

              // First button (volume) should have margin-right: auto
              if (index === 0) {
                btn.style.marginRight = "auto";
              }
            }
          });
        }

        // Add missing dividers between meanings
        const listItems = clonedElement.querySelectorAll("li");
        listItems.forEach((item, index, array) => {
          if (index < array.length - 1) {
            // Check if there's already a divider at the end of this item
            const existingDivider = item.querySelector("hr");
            if (!existingDivider) {
              // Create and add a divider
              const divider = document.createElement("hr");
              divider.setAttribute("data-screenshot-divider", `added-div-${index}`);
              divider.style.display = "block";
              divider.style.width = "100%";
              divider.style.borderTop = "1px solid rgba(127, 127, 127, 0.5)";
              divider.style.margin = "0.5rem 0";
              divider.style.height = "1px";
              divider.style.opacity = "1";
              item.appendChild(divider);
            }
          }
        });
      },
    });

    // Remove the data attributes we added
    const cleanupScreenshotAttributes = () => {
      const buttons = element.querySelectorAll("[data-screenshot-btn]");
      buttons?.forEach((btn) => btn.removeAttribute("data-screenshot-btn"));

      const dividers = element.querySelectorAll("[data-screenshot-divider]");
      dividers?.forEach((div) => div.removeAttribute("data-screenshot-divider"));

      const svgs = element.querySelectorAll("[data-screenshot-svg]");
      svgs?.forEach((svg) => svg.removeAttribute("data-screenshot-svg"));

      // Remove the data-ref attribute
      element.removeAttribute("data-ref");
    };

    // Clean up
    cleanupScreenshotAttributes();

    // Dismiss the loading toast
    toast.dismiss(pendingToast);

    // Create a new canvas with solid background to avoid transparency issues
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const ctx = finalCanvas.getContext("2d");

    if (ctx) {
      // Fill with solid background color first
      ctx.fillStyle = solidBgColor;
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw the original canvas on top
      ctx.drawImage(canvas, 0, 0);

      // Convert to blob with no transparency
      finalCanvas.toBlob(
        async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
              toast.success(options.successMessage);
            } catch (err) {
              console.error("Failed to copy image to clipboard:", err);
              toast.info(options.clipboardCopyFailureMessage);

              // Fallback: offer download if clipboard write fails
              const objectUrl = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = objectUrl;
              link.download = options.fileName || "screenshot.png";
              link.click();
              URL.revokeObjectURL(objectUrl); // Clean up the object URL
            }
          } else {
            toast.error(options.failureMessage);
          }
        },
        "image/png",
        1.0
      ); // Use highest quality
    } else {
      // Fallback to original canvas if context creation fails
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
              toast.success(options.successMessage);
            } catch (err) {
              console.error("Failed to copy image to clipboard:", err);
              toast.info(options.clipboardCopyFailureMessage);

              // Fallback: offer download if clipboard write fails
              const objectUrl = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = objectUrl;
              link.download = options.fileName || "screenshot.png";
              link.click();
              URL.revokeObjectURL(objectUrl); // Clean up the object URL
            }
          } else {
            toast.error(options.failureMessage);
          }
        },
        "image/png",
        1.0
      );
    }
  } catch (error) {
    console.error("Error generating screenshot:", error);
    toast.error(options.failureMessage);
  }
};
