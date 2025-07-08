import * as fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import * as os from "os";
import * as path from "path";
import puppeteer, { Browser, Page } from "puppeteer";

// Create debug log function
const debug = (...args: unknown[]) => {
  console.log("[PDF Export Debug]", ...args);
};

// Parse Puppeteer arguments from environment variable or use defaults
function getPuppeteerArgs(): string[] {
  try {
    if (process.env.PUPPETEER_ARGS) {
      return process.env.PUPPETEER_ARGS.split(" ");
    }
  } catch (e) {
    debug("Error parsing PUPPETEER_ARGS:", e);
  }

  // Default arguments optimized for consistent font rendering
  return [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--font-render-hinting=none",
    "--disable-extensions",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-breakpad",
    "--disable-component-extensions-with-background-pages",
    "--disable-features=TranslateUI,BlinkGenPropertyTrees",
    "--disable-ipc-flooding-protection",
    "--disable-renderer-backgrounding",
    "--enable-surface-synchronization",
    "--run-all-compositor-stages-before-draw",
    "--disable-hang-monitor",
    "--disable-sync",
    "--hide-scrollbars",
    "--metrics-recording-only",
    "--mute-audio",
    "--no-default-browser-check",
    "--no-experiments",
    "--no-first-run",
    "--no-zygote",
    // Font rendering optimization
    "--force-device-scale-factor=1",
    "--disable-font-subpixel-positioning",
    "--disable-lcd-text",
    // Ensure consistent text rendering
    "--use-gl=swiftshader",
    "--disable-accelerated-2d-canvas",
  ];
}

export async function POST(request: NextRequest) {
  // Store any cleanup functions to ensure they run even in case of errors
  const cleanupTasks: Array<() => Promise<void>> = [];
  let browser: Browser | null = null;
  let page: Page | null = null;
  let tempHtmlPath: string | null = null;

  try {
    debug("Starting PDF export process");
    const { html, filename } = await request.json();

    if (!html) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    // For debugging Docker environment
    debug("Environment:", {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      nodeEnv: process.env.NODE_ENV,
      tmpdir: os.tmpdir(),
      platform: os.platform(),
    });

    // Create temporary HTML file (can help with complex HTML rendering)
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-export-"));
    tempHtmlPath = path.join(tempDir, "resume.html");

    // Add cleanup task for temp directory
    cleanupTasks.push(async () => {
      try {
        if (tempHtmlPath && fs.existsSync(path.dirname(tempHtmlPath))) {
          fs.rmSync(path.dirname(tempHtmlPath), {
            recursive: true,
            force: true,
          });
          debug("Cleaned up temp directory");
        }
      } catch (err) {
        console.error("Error cleaning up temp directory:", err);
      }
    });

    // Get Puppeteer configuration from environment variables
    const puppeteerArgs = getPuppeteerArgs();

    debug("Launching browser with args:", puppeteerArgs);
    // Launch puppeteer browser with robust Docker configuration
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: puppeteerArgs,
      ignoreDefaultArgs: ["--disable-extensions"],
      timeout: 120000, // Increased timeout for Docker environments
      dumpio: process.env.NODE_ENV !== "production", // Log browser console in non-prod
    });

    // Add browser cleanup task
    cleanupTasks.push(async () => {
      try {
        if (browser) {
          await browser.close();
          debug("Browser closed");
        }
      } catch (err) {
        console.error("Error closing browser:", err);
      }
    });

    // Complete HTML template with exact same font rendering as preview
    const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vitaena - Resume PDF Export</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
                text-rendering: optimizeLegibility !important;
            }
            
            body {
                font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
                text-rendering: optimizeLegibility !important;
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                overflow: hidden !important;
                /* Ensure exact font size consistency */
                font-size: 12px !important;
                line-height: 1.4 !important;
                color: #111827 !important;
            }
            
            @page {
                size: A4 portrait;
                margin: 0;
            }
            
            @media print {
                body {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            }
            
            .resume-container {
                width: 210mm !important;
                height: 297mm !important;
                max-width: 210mm !important;
                max-height: 297mm !important;
                overflow: hidden !important;
                background: #ffffff !important;
                page-break-inside: avoid;
                page-break-after: auto;
                page-break-before: auto;
                /* Ensure no additional spacing or transformations */
                margin: 0 !important;
                padding: 0 !important;
                transform: none !important;
                border: none !important;
                box-shadow: none !important;
                font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
            }
            
            /* Ensure exact font rendering matches preview */
            .resume-container * {
                font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
                text-rendering: optimizeLegibility !important;
            }
            
            /* Force specific element styles to ensure consistency */
            h1 { font-size: 28px !important; font-weight: bold !important; color: #111827 !important; }
            h2 { font-size: 14px !important; font-weight: 600 !important; color: #2563eb !important; }
            h3 { font-size: 13px !important; font-weight: bold !important; color: #111827 !important; }
            h4 { font-weight: bold !important; color: #111827 !important; }
            p { color: #374151 !important; }
            a { color: #2563eb !important; text-decoration: none !important; }
        </style>
    </head>
    <body>
        <div class="resume-container">
            ${html}
        </div>
    </body>
    </html>
    `;

    if (!tempHtmlPath) {
      throw new Error("Failed to create temporary HTML file path");
    }

    // Save HTML to temp file for more reliable loading
    fs.writeFileSync(tempHtmlPath, fullHtml);
    debug("HTML content saved to temp file");

    // Create a page with retry logic
    debug("Creating new browser page...");
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        if (browser === null) {
          debug("Browser is null, relaunching...");
          browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: puppeteerArgs,
            timeout: 120000,
          });
        }

        if (browser === null) {
          throw new Error("Failed to create browser instance");
        }

        page = await browser.newPage();
        debug("Page created successfully");
        break;
      } catch (err) {
        retries++;
        debug(`Failed to create page, attempt ${retries}/${maxRetries}`, err);
        if (retries >= maxRetries) throw err;

        // Try to restart browser
        if (browser !== null) {
          try {
            await browser.close();
          } catch (closeErr) {
            debug("Error closing browser during retry", closeErr);
          }
          browser = null;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Increased wait time
      }
    }

    if (!page) {
      throw new Error("Failed to create browser page after multiple attempts");
    }

    // Add page to cleanup tasks
    cleanupTasks.push(async () => {
      try {
        if (page) {
          await page.close();
          debug("Page closed");
        }
      } catch (err) {
        console.error("Error closing page:", err);
      }
    });

    try {
      // Set viewport to exactly match the A4 dimensions for consistent rendering
      await page.setViewport({
        width: 794, // 210mm in pixels at 96 DPI (210 * 96 / 25.4)
        height: 1123, // 297mm in pixels at 96 DPI (297 * 96 / 25.4)
        deviceScaleFactor: 1,
      });

      // Disable font smoothing to match browser rendering exactly
      await page.evaluateOnNewDocument(() => {
        const style = document.createElement("style");
        style.textContent = `
          * {
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            text-rendering: optimizeLegibility !important;
            font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
          }
        `;
        document.head.appendChild(style);
      });

      // Load from file instead of direct content setting
      debug("Loading HTML from file...");
      if (!tempHtmlPath) {
        throw new Error("Temporary HTML file path is not defined");
      }

      await page.goto(`file://${tempHtmlPath}`, {
        waitUntil: "networkidle0",
        timeout: 60000, // Increased timeout for complex documents
      });

      // Wait for any images to load and fonts to be rendered
      await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll("img"));
        return Promise.all(
          images.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          })
        );
      });

      // Wait a bit more for font rendering to stabilize and force a repaint
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Force a repaint to ensure all styles are applied
      await page.evaluate(() => {
        document.body.style.display = "none";
        // Trigger reflow
        void document.body.offsetHeight;
        document.body.style.display = "block";
      });

      debug("Generating PDF...");
      // Generate PDF with exact A4 dimensions and consistent settings
      const pdf = await page.pdf({
        format: "A4",
        width: "210mm",
        height: "297mm",
        printBackground: true,
        margin: {
          top: "0mm",
          right: "0mm",
          bottom: "0mm",
          left: "0mm",
        },
        preferCSSPageSize: true, // Honor @page CSS rules
        displayHeaderFooter: false,
        scale: 1, // Ensure no scaling
        timeout: 60000, // Extended timeout
        // Ensure exact font rendering
        omitBackground: false,
      });

      debug("PDF generation successful, size:", pdf.length);

      // Return the PDF as a response
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${
            filename || "resume.pdf"
          }"`,
          "Content-Length": pdf.length.toString(),
        },
      });
    } catch (innerError) {
      console.error("Error during PDF generation:", innerError);
      throw innerError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error("PDF export error:", error);

    // Run all cleanup tasks
    debug("Running cleanup tasks after error");
    for (const cleanup of cleanupTasks) {
      try {
        await cleanup();
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    // Final cleanup - ensure browser and page are closed
    debug("Running final cleanup");
    try {
      if (page) {
        await page.close();
      }
    } catch (e) {
      console.error("Error closing page in finally block:", e);
    }

    try {
      if (browser) {
        await browser.close();
      }
    } catch (e) {
      console.error("Error closing browser in finally block:", e);
    }
  }
}
