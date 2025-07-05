import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(request: NextRequest) {
  try {
    const { html, filename } = await request.json();

    if (!html) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    // Launch puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
    });

    const page = await browser.newPage();

    // Set viewport to ensure consistent rendering
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Create a complete HTML document with proper styling
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
                    }
                    
                    body {
                        font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                        text-rendering: optimizeLegibility;
                        background: #ffffff;
                        margin: 0;
                        padding: 0;
                        width: 210mm;
                        height: 297mm;
                        overflow: hidden;
                    }
                    
                    @page {
                        size: A4;
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
                        width: 210mm;
                        height: 297mm;
                        max-width: 210mm;
                        max-height: 297mm;
                        overflow: hidden;
                        background: #ffffff;
                        page-break-inside: avoid;
                        page-break-after: auto;
                        page-break-before: auto;
                    }
                </style>
            </head>
            <body>
                <div class="resume-container">
                    ${html}
                </div>
            </body>
            </html>
        `;

    // Set content with proper encoding
    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait for any images to load
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

    // Generate PDF with exact A4 dimensions
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
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      scale: 1,
    });

    await browser.close();

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
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
