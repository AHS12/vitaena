/**
 * Utility function to export resume as PDF using Puppeteer
 * This provides a clean API for PDF export functionality
 */

interface ExportPDFOptions {
  resumeElement: HTMLElement;
  filename?: string;
  type?: string; // Add type parameter for CV/Resume distinction
  onProgress?: (status: string) => void;
}

export const exportToPDF = async ({
  resumeElement,
  filename = "resume.pdf",
  type = "resume", // Default to resume
  onProgress,
}: ExportPDFOptions): Promise<void> => {
  try {
    onProgress?.("Preparing export...");

    // Get the HTML content of the resume template
    const resumeHTML = resumeElement.outerHTML;

    onProgress?.("Generating PDF...");

    // Send request to API route for PDF generation
    const response = await fetch("/api/export-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: resumeHTML,
        filename: filename,
        type: type, // Pass type to API
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate PDF");
    }

    onProgress?.("Downloading PDF...");

    // Get the PDF blob and create download
    const pdfBlob = await response.blob();
    const url = URL.createObjectURL(pdfBlob);

    // Create download link
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onProgress?.("PDF exported successfully!");
  } catch (error) {
    console.error("PDF export error:", error);
    throw error;
  }
};

/**
 * Utility function to generate filename from resume data
 */
export const generatePDFFilename = (resumeName?: string): string => {
  const cleanName = resumeName?.replace(/\s+/g, "_") || "resume";
  const date = new Date().toISOString().split("T")[0];
  return `${cleanName}_${date}.pdf`;
};
