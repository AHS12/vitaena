import { formatDateRange } from "@/lib/utils";
import { PersonalInfo, ResumeData } from "@/types/resume";
import { Globe, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

// Component for contact info row with dynamic font sizing
const ContactInfoRow: React.FC<{
  personalInfo: PersonalInfo;
  availableWidth: string;
}> = ({ personalInfo, availableWidth }) => {
  // Count visible contact items to determine available space
  const visibleItems = useMemo(() => {
    let count = 0;
    if (personalInfo.showPhone && personalInfo.phone) count++;
    if (personalInfo.showEmail && personalInfo.email) count++;
    if (personalInfo.showLocation && personalInfo.location) count++;
    if (personalInfo.showLinkedIn && personalInfo.linkedIn) count++;
    if (personalInfo.showWebsite && personalInfo.website) count++;
    return count;
  }, [personalInfo]);

  // Calculate font size based on visible items - keep it more readable
  const calculateFontSize = () => {
    if (visibleItems <= 3) return "11px"; // Standard size for 1-3 items
    if (visibleItems === 4) return "10.5px"; // Slightly smaller for 4 items
    return "10px"; // Minimum readable size for 5 items
  };

  const fontSize = calculateFontSize();

  // Style for the contact items
  const contactItemStyle = {
    display: "flex",
    alignItems: "center",
    minWidth: 0, // Important for flex children to allow proper shrinking
  };

  // Determine spacing and alignment based on number of visible items
  // For fewer items, align from the left with appropriate gaps
  // For all 5 items, use space-between to distribute them evenly
  let justifyContent: "flex-start" | "space-between" = "flex-start";
  let gap: string;

  if (visibleItems === 1) {
    gap = "0px";
  } else if (visibleItems === 2) {
    gap = "32px"; // Wider gap for just 2 items
  } else if (visibleItems === 3) {
    gap = "24px"; // Medium gap for 3 items
  } else if (visibleItems === 4) {
    gap = "20px"; // Narrower gap for 4 items
  } else {
    gap = "16px"; // Minimum gap for all 5 items
    justifyContent = "space-between"; // Distribute all items evenly
  }

  // Style for the entire contact row
  const contactRowStyle = {
    display: "flex",
    width: availableWidth,
    justifyContent,
    gap,
    fontSize,
    color: "#374151",
  };

  // Style for links
  const linkStyle = {
    color: "#2563eb",
    textDecoration: "none",
    cursor: "pointer",
    minWidth: 0, // Important for text shrinking properly
  };

  // Style for icons
  const iconStyle = {
    width: "12px",
    height: "12px",
    marginRight: "4px",
    flexShrink: 0, // Ensure icons don't shrink
  };

  // Style for text content that needs to shrink if needed
  const textStyle = {
    minWidth: 0,
    flexShrink: 1,
  };

  return (
    <div style={contactRowStyle}>
      {personalInfo.showPhone && personalInfo.phone && (
        <div style={contactItemStyle}>
          <Phone style={iconStyle} />
          <span style={textStyle}>{personalInfo.phone}</span>
        </div>
      )}

      {personalInfo.showEmail && personalInfo.email && (
        <div style={contactItemStyle}>
          <Mail style={iconStyle} />
          <a
            href={`mailto:${personalInfo.email}`}
            style={linkStyle}
            onMouseEnter={(e) =>
              ((e.target as HTMLAnchorElement).style.textDecoration =
                "underline")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLAnchorElement).style.textDecoration = "none")
            }
          >
            {personalInfo.email}
          </a>
        </div>
      )}

      {personalInfo.showLocation && personalInfo.location && (
        <div style={contactItemStyle}>
          <MapPin style={iconStyle} />
          <span style={textStyle}>{personalInfo.location}</span>
        </div>
      )}

      {personalInfo.showLinkedIn && personalInfo.linkedIn && (
        <div style={contactItemStyle}>
          <Linkedin style={iconStyle} />
          <a
            href={personalInfo.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
            onMouseEnter={(e) =>
              ((e.target as HTMLAnchorElement).style.textDecoration =
                "underline")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLAnchorElement).style.textDecoration = "none")
            }
          >
            {personalInfo.linkedIn.replace(
              /https?:\/\/(www\.)?linkedin\.com\/in\//,
              ""
            )}
          </a>
        </div>
      )}

      {personalInfo.showWebsite && personalInfo.website && (
        <div style={contactItemStyle}>
          <Globe style={iconStyle} />
          <a
            href={personalInfo.website}
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
            onMouseEnter={(e) =>
              ((e.target as HTMLAnchorElement).style.textDecoration =
                "underline")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLAnchorElement).style.textDecoration = "none")
            }
          >
            {personalInfo.website.replace(/https?:\/\/(www\.)?/, "")}
          </a>
        </div>
      )}
    </div>
  );
};

// Component for personal info details (Date of Birth, Nationality, etc.)
const PersonalInfoDetails: React.FC<{
  personalInfo: PersonalInfo;
}> = ({ personalInfo }) => {
  // Count visible personal info details
  const visibleDetails = useMemo(() => {
    const details = [];
    if (personalInfo.showDateOfBirth && personalInfo.dateOfBirth) details.push({ label: "DOB", value: personalInfo.dateOfBirth });
    if (personalInfo.showNationality && personalInfo.nationality) details.push({ label: "Nationality", value: personalInfo.nationality });
    if (personalInfo.showPermanentAddress && personalInfo.permanentAddress) details.push({ label: "Address", value: personalInfo.permanentAddress });
    if (personalInfo.showMaritalStatus && personalInfo.maritalStatus) details.push({ label: "Marital Status", value: personalInfo.maritalStatus });
    if (personalInfo.showDrivingLicense && personalInfo.drivingLicense) details.push({ label: "License", value: personalInfo.drivingLicense });
    if (personalInfo.showId && personalInfo.idValue) details.push({ label: personalInfo.idLabel || "ID", value: personalInfo.idValue });
    return details;
  }, [personalInfo]);

  if (visibleDetails.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "6px",
        fontSize: "9px",
        color: "#6b7280",
      }}
    >
      {visibleDetails.map((detail, index) => (
        <div key={index} style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: "600", marginRight: "4px" }}>
            {detail.label}:
          </span>
          <span>{detail.value}</span>
        </div>
      ))}
    </div>
  );
};

interface ModernCVTemplateProps {
  data: ResumeData;
  className?: string;
  scale?: number; // Scale factor for preview (e.g., 0.5 for 50% size)
  isPreview?: boolean; // Whether this is preview mode or export mode
}

export const ModernCVTemplate: React.FC<ModernCVTemplateProps> = ({
  data,
  className = "",
  scale = 1,
  isPreview = false,
}) => {
  const templateRef = useRef<HTMLDivElement>(null);
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const [sectionMargins, setSectionMargins] = useState<Record<string, number>>({});

  useEffect(() => {
    // For preview mode, we calculate page breaks to show the page indicator
    if (isPreview && templateRef.current) {
      const calculateLayout = () => {
        const templateElement = templateRef.current;
        if (!templateElement) return;

        // Create a temporary element to measure content height without scaling
        const tempElement = templateElement.cloneNode(true) as HTMLElement;
        tempElement.style.transform = "none";
        tempElement.style.position = "absolute";
        tempElement.style.visibility = "hidden";
        tempElement.style.top = "-9999px";
        tempElement.style.left = "-9999px";
        tempElement.style.width = "210mm";
        
        // Reset all margins in the clone to get natural layout
        const sections = tempElement.querySelectorAll('[data-section-id]');
        sections.forEach((section) => {
          (section as HTMLElement).style.paddingTop = '0px';
          (section as HTMLElement).style.marginTop = '0px';
        });

        document.body.appendChild(tempElement);

        // Calculate A4 height in pixels
        const tempDiv = document.createElement("div");
        tempDiv.style.height = "297mm";
        tempDiv.style.position = "absolute";
        tempDiv.style.visibility = "hidden";
        document.body.appendChild(tempDiv);
        const A4_HEIGHT_PX = tempDiv.offsetHeight;
        document.body.removeChild(tempDiv);

        const A4_HEIGHT_MM = 297;
        const pxPerMm = A4_HEIGHT_PX / A4_HEIGHT_MM;

        const newMargins: Record<string, number> = {};
        let virtualShiftMm = 0;
        const PAGE_MARGIN_TOP_MM = 12;

        tempElement.querySelectorAll('[data-section-spacer]').forEach((spacer) => {
          spacer.remove();
        });

        sections.forEach((section) => {
          const el = section as HTMLElement;
          const id = el.getAttribute('data-section-id');
          if (!id) return;

          const rect = el.getBoundingClientRect();
          // Calculate top relative to the container
          const containerRect = tempElement.getBoundingClientRect();
          const naturalTopMm = (rect.top - containerRect.top) / pxPerMm;
          
          // Apply cumulative shift from previous sections
          const currentTopMm = naturalTopMm + virtualShiftMm;
          const heightMm = rect.height / pxPerMm;
          const bottomMm = currentTopMm + heightMm;

          const startPage = Math.floor(currentTopMm / A4_HEIGHT_MM);
          const endPage = Math.floor(bottomMm / A4_HEIGHT_MM);

          const offsetWithinPageMm = currentTopMm - startPage * A4_HEIGHT_MM;

          // If section crosses page boundary and isn't too large to fit on a page
          if (startPage !== endPage && heightMm < A4_HEIGHT_MM) {
             // Move to next page
             const nextPageStartMm = (startPage + 1) * A4_HEIGHT_MM;
             const shiftMm = nextPageStartMm - currentTopMm + PAGE_MARGIN_TOP_MM;
             
             newMargins[id] = shiftMm;
             virtualShiftMm += shiftMm;
          } else if (startPage > 0 && offsetWithinPageMm < PAGE_MARGIN_TOP_MM) {
             const shiftMm = PAGE_MARGIN_TOP_MM - offsetWithinPageMm;
             newMargins[id] = shiftMm;
             virtualShiftMm += shiftMm;
          }
        });

        // Get final content height with margins
        const contentHeightMm = tempElement.scrollHeight / pxPerMm + virtualShiftMm;
        document.body.removeChild(tempElement);

        // Calculate total pages needed
        const bufferMm = 20 / pxPerMm;
        const totalPages = Math.ceil((contentHeightMm + bufferMm) / A4_HEIGHT_MM);

        const breaks: number[] = [];
        for (let i = 1; i < totalPages; i++) {
          breaks.push(i * A4_HEIGHT_MM);
        }

        setPageBreaks(breaks);
        
        // Only update margins if they changed to avoid infinite loops
        // (JSON.stringify is cheap for small objects)
        setSectionMargins(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(newMargins)) {
                return newMargins;
            }
            return prev;
        });
      };

      // Add a small delay to ensure the template is fully rendered
      const timeoutId = setTimeout(calculateLayout, 100);

      // Recalculate on window resize or data change
      window.addEventListener("resize", calculateLayout);
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener("resize", calculateLayout);
      };
    } else {
      // For export mode, we ALSO need to calculate margins to ensure the PDF
      // has the correct spacing. The logic is identical, just without the preview wrappers.
      // We can reuse the same logic or trigger a one-off calculation.
      // However, since `useEffect` runs on mount, and export usually happens
      // from a fresh render or existing state, we might need to handle this carefully.
      
      // Ideally, the margins should be passed in or calculated before export.
      // For now, if we are in export mode (isPreview=false), we assume the margins
      // might have been calculated if we came from preview, OR we need to calc them now.
      
      // Let's run the calculation once for export mode too, to ensure correct layout.
      const calculateLayoutForExport = () => {
        // Logic duplicated for now to ensure safety, but simplified
        // In a real refactor, extract `calculateLayout` to a helper function
        const templateElement = templateRef.current;
        if (!templateElement) return;

        const tempElement = templateElement.cloneNode(true) as HTMLElement;
        tempElement.style.transform = "none";
        tempElement.style.position = "absolute";
        tempElement.style.visibility = "hidden";
        tempElement.style.top = "-9999px";
        tempElement.style.left = "-9999px";
        tempElement.style.width = "210mm";
        
        const sections = tempElement.querySelectorAll('[data-section-id]');
        sections.forEach((section) => {
          (section as HTMLElement).style.paddingTop = '0px';
          (section as HTMLElement).style.marginTop = '0px';
        });

        document.body.appendChild(tempElement);

        const tempDiv = document.createElement("div");
        tempDiv.style.height = "297mm";
        tempDiv.style.position = "absolute";
        tempDiv.style.visibility = "hidden";
        document.body.appendChild(tempDiv);
        const A4_HEIGHT_PX = tempDiv.offsetHeight;
        document.body.removeChild(tempDiv);

        const newMargins: Record<string, number> = {};
        let virtualShiftMm = 0;
        const A4_HEIGHT_MM = 297;
        const pxPerMm = A4_HEIGHT_PX / A4_HEIGHT_MM;
        const PAGE_MARGIN_TOP_MM = 12;

        tempElement.querySelectorAll('[data-section-spacer]').forEach((spacer) => {
          spacer.remove();
        });

        sections.forEach((section) => {
          const el = section as HTMLElement;
          const id = el.getAttribute('data-section-id');
          if (!id) return;

          const rect = el.getBoundingClientRect();
          const containerRect = tempElement.getBoundingClientRect();
          const naturalTopMm = (rect.top - containerRect.top) / pxPerMm;
          
          const currentTopMm = naturalTopMm + virtualShiftMm;
          const heightMm = rect.height / pxPerMm;
          const bottomMm = currentTopMm + heightMm;

          const startPage = Math.floor(currentTopMm / A4_HEIGHT_MM);
          const endPage = Math.floor(bottomMm / A4_HEIGHT_MM);

          const offsetWithinPageMm = currentTopMm - startPage * A4_HEIGHT_MM;

          if (startPage !== endPage && heightMm < A4_HEIGHT_MM) {
             const nextPageStartMm = (startPage + 1) * A4_HEIGHT_MM;
             const shiftMm = nextPageStartMm - currentTopMm + PAGE_MARGIN_TOP_MM;
             newMargins[id] = shiftMm;
             virtualShiftMm += shiftMm;
          } else if (startPage > 0 && offsetWithinPageMm < PAGE_MARGIN_TOP_MM) {
             const shiftMm = PAGE_MARGIN_TOP_MM - offsetWithinPageMm;
             newMargins[id] = shiftMm;
             virtualShiftMm += shiftMm;
          }
        });

        document.body.removeChild(tempElement);
        
        setSectionMargins(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(newMargins)) {
                return newMargins;
            }
            return prev;
        });
      };
      
      // Run calculation immediately for export
      const timeoutId = setTimeout(calculateLayoutForExport, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isPreview, data, scale]);
  const renderSkillLevel = (level: number) => {
    return (
      <div style={{ display: "flex", gap: "3px", marginTop: "2px" }}>
        {[1, 2, 3, 4, 5].map((dot) => (
          <div
            key={dot}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: dot <= level ? "#2563eb" : "#e5e7eb",
            }}
          />
        ))}
      </div>
    );
  };

  const templateStyles: React.CSSProperties = {
    backgroundColor: "#ffffff",
    width: "210mm",
    maxWidth: "210mm",
    margin: "0",
    padding: "0",
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    color: "#111827",
    fontSize: "11px", // Lowered from 12px
    lineHeight: "1.4",
    overflow: "visible", // Allow content to overflow for multiple pages
    boxSizing: "border-box",
    position: "relative",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    textRendering: "optimizeLegibility",
    WebkitPrintColorAdjust: "exact",
    colorAdjust: "exact",
    printColorAdjust: "exact",
    display: "flex",
    flexDirection: "column",
    // Apply scaling for preview mode to the template itself for proper rendering
    transform: isPreview ? `scale(${scale})` : "none",
    transformOrigin: "top left",
    // Ensure the template fits in container when scaled
    ...(isPreview && {
      position: "absolute",
      top: 0,
      left: 0,
    }),
  };

  // Calculate total pages needed
  const totalPages = pageBreaks.length + 1;

  // If sectionMargins is populated but not in preview mode, it means we calculated them
  // but aren't showing the preview wrapper. This is good for export.
  
  // Container styles for both preview and export to ensure consistency
  const containerStyles: React.CSSProperties = isPreview
    ? {
        width: `${210 * scale}mm`,
        minHeight: `${
          297 * scale * totalPages + 20 * scale * (totalPages - 1)
        }mm`, // Height for all pages plus gaps
        overflow: "visible",
        position: "relative",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: `${20 * scale}mm`, // Gap between pages
        padding: `${10 * scale}mm`, // Padding around all pages
        backgroundColor: "transparent", // Remove background to avoid white area behind pages
      }
    : {
        width: "210mm",
        // For export, we let it grow naturally. The PDF generator will handle pagination
        // thanks to our margin spacers pushing content to the next visual page.
        minHeight: "297mm", 
        overflow: "visible", // Allow content to overflow
        position: "relative",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      };

  // Individual page styles
  const pageStyles: React.CSSProperties = isPreview
    ? {
        width: `${210 * scale}mm`,
        height: `${297 * scale}mm`,
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }
    : {
        width: "210mm",
        height: "297mm",
        backgroundColor: "#ffffff",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      };

  // Render individual pages for preview mode
  if (isPreview) {
    return (
      <div style={containerStyles}>
        {[...Array(totalPages)].map((_, pageIndex) => (
          <div key={pageIndex} style={pageStyles}>
            <div
              style={{
                position: "absolute",
                top: `${2 * scale}mm`,
                left: "50%",
                transform: `translateX(-50%) scale(${1 / scale})`,
                zIndex: 10,
                backgroundColor: "#fff",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "10px",
                color: "#555",
              }}
            >
              Page {pageIndex + 1}
            </div>
            <div
              style={{
                ...templateStyles,
                // We DON'T shift here anymore, ResumeContent handles the viewport
                transform: `scale(${scale})`, 
                height: "297mm",
                position: "relative",
              }}
              className={className}
              data-resume-template
              ref={pageIndex === 0 ? templateRef : null}
            >
              {pageIndex === 0 && (
                <style>{`
                                @page {
                                    size: A4 portrait;
                                    margin: 0;
                                }
                                [data-resume-template] {
                                    margin: 0;
                                    padding: 0;
                                    min-height: 297mm;
                                    overflow: visible;
                                    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
                                    font-size: 11px !important;
                                    line-height: 1.4 !important;
                                    color: #111827 !important;
                                    -webkit-font-smoothing: antialiased !important;
                                    -moz-osx-font-smoothing: grayscale !important;
                                    text-rendering: optimizeLegibility !important;
                                }
                                [data-resume-template] * {
                                    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
                                    -webkit-font-smoothing: antialiased !important;
                                    -moz-osx-font-smoothing: grayscale !important;
                                    text-rendering: optimizeLegibility !important;
                                }
                                [data-resume-template] .resume-blue {
                                    color: #2563eb !important;
                                }
                                [data-resume-template] h1 {
                                    font-size: 28px !important;
                                    font-weight: bold !important;
                                    color: #111827 !important;
                                }
                                [data-resume-template] h2 {
                                    font-size: 14px !important;
                                    font-weight: 600 !important;
                                    color: #2563eb !important;
                                }
                                [data-resume-template] h3 {
                                    font-size: 13px !important;
                                    font-weight: bold !important;
                                    color: #111827 !important;
                                }
                                [data-resume-template] h4 {
                                    font-weight: bold !important;
                                    color: #111827 !important;
                                }
                                [data-resume-template] a {
                                    transition: all 0.2s ease;
                                    color: #2563eb !important;
                                    text-decoration: none !important;
                                }
                                [data-resume-template] a:hover {
                                    opacity: 0.8;
                                }
                                @media print {
                                    html, body {
                                        height: auto !important;
                                        overflow: visible !important;
                                    }
                                    @page {
                                        size: A4 portrait;
                                        margin: 0;
                                    }
                                    [data-resume-template] {
                                        height: auto !important;
                                        overflow: visible !important;
                                        page-break-after: auto;
                                    }
                                    [data-resume-template] .cv-section {
                                        page-break-inside: avoid;
                                        page-break-after: auto;
                                    }
                                    [data-resume-template] a {
                                        color: #2563eb !important;
                                        text-decoration: none !important;
                                    }
                                }
                            `}</style>
              )}
              {/* Template content will be rendered here */}
              <ResumeContent
                data={data}
                renderSkillLevel={renderSkillLevel}
                isPreview={isPreview}
                pageBreaks={pageBreaks}
                scale={scale}
                pageIndex={pageIndex}
                totalPages={totalPages}
                sectionMargins={sectionMargins}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render single template for export mode
  return (
    <div style={containerStyles}>
      <div
        style={templateStyles}
        className={className}
        data-resume-template
        ref={templateRef}
      >
        <style>{`
                @page {
                    size: A4 portrait;
                    margin: 0;
                }
                [data-resume-template] {
                    margin: 0;
                    padding: 0;
                    min-height: 297mm;
                    overflow: visible;
                    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
                    font-size: 11px !important;
                    line-height: 1.4 !important;
                    color: #111827 !important;
                    -webkit-font-smoothing: antialiased !important;
                    -moz-osx-font-smoothing: grayscale !important;
                    text-rendering: optimizeLegibility !important;
                }
                [data-resume-template] * {
                    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
                    -webkit-font-smoothing: antialiased !important;
                    -moz-osx-font-smoothing: grayscale !important;
                    text-rendering: optimizeLegibility !important;
                }
                [data-resume-template] .resume-blue {
                    color: #2563eb !important;
                }
                [data-resume-template] h1 {
                    font-size: 28px !important;
                    font-weight: bold !important;
                    color: #111827 !important;
                }
                [data-resume-template] h2 {
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    color: #2563eb !important;
                }
                [data-resume-template] h3 {
                    font-size: 13px !important;
                    font-weight: bold !important;
                    color: #111827 !important;
                }
                [data-resume-template] h4 {
                    font-weight: bold !important;
                    color: #111827 !important;
                }
                [data-resume-template] a {
                    transition: all 0.2s ease;
                    color: #2563eb !important;
                    text-decoration: none !important;
                }
                [data-resume-template] a:hover {
                    opacity: 0.8;
                }
                @media print {
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    [data-resume-template] {
                        height: auto !important;
                        overflow: visible !important;
                        page-break-after: auto;
                    }
                    [data-resume-template] .cv-section {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    [data-resume-template] a {
                        color: #2563eb !important;
                        text-decoration: none !important;
                    }
                }
            `}</style>
        <ResumeContent
          data={data}
          renderSkillLevel={renderSkillLevel}
          isPreview={isPreview}
          pageBreaks={pageBreaks}
          scale={scale}
          sectionMargins={sectionMargins}
        />
      </div>
    </div>
  );
};

// Component to render the resume content
const ResumeContent: React.FC<{
  data: ResumeData;
  renderSkillLevel: (level: number) => React.ReactNode;
  isPreview: boolean;
  pageBreaks: number[];
  scale: number;
  pageIndex?: number;
  totalPages?: number;
  sectionMargins?: Record<string, number>;
}> = ({
  data,
  renderSkillLevel,
  isPreview,
  pageIndex = 0,
  totalPages = 1,
  sectionMargins = {},
}) => {
  // For preview mode with multiple pages, we need to show only the content for the current page
  const isMultiPage = isPreview && totalPages > 1;

  if (isMultiPage) {
    // Calculate A4 height in pixels for proper positioning
    const A4_HEIGHT_MM = 297;
    const pageOffsetY = pageIndex * A4_HEIGHT_MM;

    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "297mm",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            transform: `translateY(-${pageOffsetY}mm)`,
            width: "100%",
            // Ensure the inner container has enough height to hold all content
            // Using a large number to ensure no clipping, or calculate exact height
            height: "auto", 
            minHeight: `${A4_HEIGHT_MM * totalPages}mm`,
          }}
        >
          {renderFullContent()}
        </div>
      </div>
    );
  }

  // Single page or export mode - render normally
  return renderFullContent();

  function renderFullContent() {
    const renderSectionSpacer = (sectionId: string) =>
      sectionMargins[sectionId] ? (
        <div
          data-section-spacer
          data-section-spacer-for={sectionId}
          style={{ height: `${sectionMargins[sectionId]}mm` }}
        />
      ) : null;

    return (
      <>
        {/* Header Section */}

        <div
          style={{
            display: "flex",
            paddingBottom: "10mm",
            boxSizing: "border-box",
            overflow: "visible",
          }}
        >
          {/* Main Content Column (single column for CV) */}
          <div
            style={{
              width: "100%",
              padding: "12mm 15mm 12mm 15mm",
              overflow: "visible",
              height: "auto",
            }}
          >
            {/* Header Section */}
            <div
              style={{
                padding: "0 15mm 6mm 15mm",
                display: "flex",
                flexDirection: "column",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              {/* Name, Title and Photo in one row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      color: "#111827",
                      margin: "0 0 5px 0",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {data.personalInfo.name || "YOUR NAME"}
                  </h1>
                  {data.personalInfo.showTitle !== false && data.personalInfo.title && (
                    <h2
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#2563eb",
                        margin: "0",
                        textTransform: "uppercase",
                      }}
                    >
                      {data.personalInfo.title}
                    </h2>
                  )}
                </div>

                {data.personalInfo.showPhoto && data.personalInfo.photo && (
                  <div>
                    <Image
                      src={data.personalInfo.photo}
                      alt={data.personalInfo.name}
                      width={data.personalInfo.photoSize || 80}
                      height={data.personalInfo.photoSize || 80}
                      style={{
                        width: (data.personalInfo.photoSize || 80) + "px",
                        height: (data.personalInfo.photoSize || 80) + "px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Contact information on full width */}
              <ContactInfoRow
                personalInfo={data.personalInfo}
                availableWidth="100%"
              />
              
              {/* Personal Info Details (Date of Birth, Nationality, etc.) */}
              {renderSectionSpacer("personalInfoDetails")}
              <div data-section-id="personalInfoDetails">
                <PersonalInfoDetails personalInfo={data.personalInfo} />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                paddingBottom: "10mm",
                boxSizing: "border-box",
                overflow: "visible",
              }}
            >
              {/* Main Content Column (single column for CV) */}
              <div
                style={{
                  width: "100%",
                  padding: "6mm 15mm 6mm 15mm",
                  overflow: "visible",
                  height: "auto",
                }}
              >
                {/* Summary Section */}
                {data.showSummary && data.summary && (
                  <>
                    {renderSectionSpacer("summary")}
                    <div 
                      className="cv-section" 
                      data-section-id="summary"
                      style={{ 
                        marginBottom: "8mm"
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "13px",
                          fontWeight: "bold",
                          color: "#111827",
                          marginBottom: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: "1px solid #111827",
                          paddingBottom: "2px",
                        }}
                      >
                        SUMMARY
                      </h3>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#374151",
                          lineHeight: "1.4",
                          margin: "0",
                          textAlign: "justify",
                        }}
                      >
                        {data.summary}
                      </p>
                    </div>
                  </>
                )}

                {/* Career Objective Section */}
                {data.showCareerObjective && data.careerObjective && (
                  <>
                    {renderSectionSpacer("careerObjective")}
                    <div 
                      className="cv-section" 
                      data-section-id="careerObjective"
                      style={{ 
                        marginBottom: "8mm"
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "13px",
                          fontWeight: "bold",
                          color: "#111827",
                          marginBottom: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: "1px solid #111827",
                          paddingBottom: "2px",
                        }}
                      >
                        CAREER OBJECTIVE
                      </h3>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#374151",
                          lineHeight: "1.4",
                          margin: "0",
                          textAlign: "justify",
                        }}
                      >
                        {data.careerObjective}
                      </p>
                    </div>
                  </>
                )}

                {/* Education Section */}
                {data.showEducation &&
                  data.education.filter((edu) => edu.show).length > 0 && (
                    <>
                      {renderSectionSpacer("education")}
                      <div 
                        className="cv-section" 
                        data-section-id="education"
                        style={{ 
                          marginBottom: "7mm"
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: "#111827",
                            marginBottom: "5px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            borderBottom: "1px solid #111827",
                            paddingBottom: "2px",
                          }}
                        >
                          EDUCATION
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          {data.education
                            .filter((edu) => edu.show)
                            .map((edu) => (
                              <div key={edu.id}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                  }}
                                >
                                  <div>
                                    <h4
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        color: "#111827",
                                        margin: "0 0 1px 0",
                                      }}
                                    >
                                      {edu.degree}
                                    </h4>
                                    <p
                                      className="resume-blue"
                                      style={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        margin: "0 0 1px 0",
                                      }}
                                    >
                                      {edu.institution}
                                    </p>
                                    {edu.showLocation && edu.location && (
                                      <p
                                        style={{
                                          fontSize: "10px",
                                          color: "#6b7280",
                                          margin: "0",
                                        }}
                                      >
                                        {edu.location}
                                      </p>
                                    )}
                                    {edu.showGpa && edu.gpa && (
                                      <p
                                        style={{
                                          fontSize: "10px",
                                          color: "#6b7280",
                                          margin: "0",
                                        }}
                                      >
                                        GPA: {edu.gpa}
                                      </p>
                                    )}
                                  </div>
                                  {edu.showDateRange && (
                                    <div
                                      style={{
                                        fontSize: "10px",
                                        color: "#6b7280",
                                      }}
                                    >
                                      {formatDateRange(edu.dateRange)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Experience Section */}
                {data.showWorkExperience &&
                  data.workExperience.filter((exp) => exp.show).length > 0 && (
                    <>
                      {renderSectionSpacer("workExperience")}
                      <div 
                        className="cv-section" 
                        data-section-id="workExperience"
                        style={{ 
                          marginBottom: "8mm"
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: "#111827",
                            marginBottom: "5px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            borderBottom: "1px solid #111827",
                            paddingBottom: "2px",
                          }}
                        >
                          EXPERIENCE
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                          }}
                        >
                          {data.workExperience
                            .filter((exp) => exp.show)
                            .map((exp) => (
                              <div key={exp.id}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "3px",
                                  }}
                                >
                                  <div>
                                    <h4
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        color: "#111827",
                                        margin: "0 0 1px 0",
                                      }}
                                    >
                                      {exp.position}
                                    </h4>
                                    <p
                                      className="resume-blue"
                                      style={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        margin: "0 0 1px 0",
                                      }}
                                    >
                                      {exp.company}
                                    </p>
                                    {exp.showLocation && exp.location && (
                                      <p
                                        style={{
                                          fontSize: "10px",
                                          color: "#6b7280",
                                          margin: "0",
                                        }}
                                      >
                                        {exp.location}
                                      </p>
                                    )}
                                  </div>
                                  {exp.showDateRange && (
                                    <div
                                      style={{
                                        fontSize: "10px",
                                        color: "#6b7280",
                                        textAlign: "right",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {formatDateRange(exp.dateRange)}
                                    </div>
                                  )}
                                </div>
                                {exp.showDescription && exp.description && (
                                  <p
                                    style={{
                                      fontSize: "11px",
                                      color: "#374151",
                                      marginBottom: "2px",
                                      lineHeight: "1.3",
                                    }}
                                  >
                                    {exp.description}
                                  </p>
                                )}
                                {exp.showBullets && exp.bullets.length > 0 && (
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#374151",
                                      margin: "0",
                                      lineHeight: "1.3",
                                    }}
                                  >
                                    {exp.bullets.map((bullet, index) => (
                                      <div
                                        key={index}
                                        style={{
                                          marginBottom: "2px",
                                          display: "flex",
                                          alignItems: "flex-start",
                                        }}
                                      >
                                        <span
                                          style={{
                                            marginRight: "6px",
                                            marginTop: "2px",
                                            fontSize: "9px",
                                            lineHeight: "1",
                                          }}
                                        >
                                          •
                                        </span>
                                        <span style={{ flex: 1 }}>{bullet}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Projects Section */}
                {data.showProjects &&
                  data.projects.filter((project) => project.show).length >
                    0 && (
                    <>
                      {renderSectionSpacer("projects")}
                      <div 
                        className="cv-section" 
                        data-section-id="projects"
                        style={{ 
                          marginBottom: "7mm"
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: "#111827",
                            marginBottom: "5px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            borderBottom: "1px solid #111827",
                            paddingBottom: "2px",
                          }}
                        >
                          PROJECTS
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                          }}
                        >
                          {data.projects
                            .filter((project) => project.show)
                            .map((project) => (
                              <div key={project.id}>
                                <h4
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                    color: "#111827",
                                    margin: "0 0 2px 0",
                                  }}
                                >
                                  {project.title}
                                </h4>
                                {project.showDateRange && project.dateRange && (
                                  <p
                                    style={{
                                      fontSize: "9px",
                                      color: "#6b7280",
                                      margin: "0 0 2px 0",
                                    }}
                                  >
                                    {formatDateRange(project.dateRange)}
                                  </p>
                                )}
                                {project.showDescription &&
                                  project.description && (
                                    <p
                                      style={{
                                        fontSize: "10px",
                                        color: "#374151",
                                        marginBottom: "3px",
                                        lineHeight: "1.4",
                                      }}
                                    >
                                      {project.description}
                                    </p>
                                  )}
                                {project.showLink && project.link && (
                                  <div style={{ marginBottom: "3px" }}>
                                    <a
                                      href={project.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: "9px",
                                        color: "#2563eb",
                                        textDecoration: "none",
                                        cursor: "pointer",
                                        display: "block",
                                        wordBreak: "break-all",
                                      }}
                                      onMouseEnter={(e) =>
                                        ((
                                          e.target as HTMLAnchorElement
                                        ).style.textDecoration = "underline")
                                      }
                                      onMouseLeave={(e) =>
                                        ((
                                          e.target as HTMLAnchorElement
                                        ).style.textDecoration = "none")
                                      }
                                    >
                                      {project.link.replace(
                                        /https?:\/\/(www\.)?/,
                                        ""
                                      )}
                                    </a>
                                  </div>
                                )}
                                {project.technologies.length > 0 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: "2px",
                                      marginTop: "3px",
                                    }}
                                  >
                                    {project.technologies.map(
                                      (tech, techIndex) => (
                                        <span
                                          key={techIndex}
                                          style={{
                                            padding: "2px 4px",
                                            backgroundColor: "#dbeafe",
                                            color: "#1e40af",
                                            fontSize: "8px",
                                            borderRadius: "2px",
                                            fontWeight: "500",
                                          }}
                                        >
                                          {tech}
                                        </span>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Certifications Section */}
                {data.showCertifications &&
                  Array.isArray(data.certifications) &&
                  data.certifications.filter((cert) => cert.show).length >
                    0 && (
                    <>
                      {renderSectionSpacer("certifications")}
                      <div 
                        className="cv-section" 
                        data-section-id="certifications"
                        style={{ 
                          marginBottom: "7mm"
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: "#111827",
                            marginBottom: "5px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            borderBottom: "1px solid #111827",
                            paddingBottom: "2px",
                          }}
                        >
                          CERTIFICATIONS
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                          }}
                        >
                          {data.certifications
                            .filter((cert) => cert.show)
                            .map((cert) => (
                              <div key={cert.id}>
                                <h4
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "bold",
                                    color: "#111827",
                                    margin: "0 0 2px 0",
                                  }}
                                >
                                  {cert.name}
                                </h4>
                                <p
                                  className="resume-blue"
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    margin: "0 0 2px 0",
                                  }}
                                >
                                  {cert.issuingOrganization}
                                </p>
                                {cert.showIssueDate && (
                                  <p
                                    style={{
                                      fontSize: "11px",
                                      color: "#6b7280",
                                      margin: "0 0 2px 0",
                                    }}
                                  >
                                    Issued:{" "}
                                    {cert.issueDate.month
                                      .toString()
                                      .padStart(2, "0")}
                                    /{cert.issueDate.year}
                                    {cert.showExpirationDate &&
                                      cert.expirationDate && (
                                        <span>
                                          {" "}
                                          • Expires:{" "}
                                          {cert.expirationDate.month
                                            .toString()
                                            .padStart(2, "0")}
                                          /{cert.expirationDate.year}
                                        </span>
                                      )}
                                  </p>
                                )}
                                {cert.showCredentialId && cert.credentialId && (
                                  <p
                                    style={{
                                      fontSize: "11px",
                                      color: "#374151",
                                      margin: "0 0 2px 0",
                                      wordBreak: "break-all",
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    ID: {cert.credentialId}
                                  </p>
                                )}
                                {cert.showCredentialUrl && cert.credentialUrl && (
                                  <a
                                    href={cert.credentialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: "11px",
                                      color: "#2563eb",
                                      textDecoration: "none",
                                      cursor: "pointer",
                                      display: "inline-block",
                                    }}
                                    onMouseEnter={(e) =>
                                      ((
                                        e.target as HTMLAnchorElement
                                      ).style.textDecoration = "underline")
                                    }
                                    onMouseLeave={(e) =>
                                      ((
                                        e.target as HTMLAnchorElement
                                      ).style.textDecoration = "none")
                                    }
                                  >
                                    View Certificate
                                  </a>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Skills Section */}
                {data.showSkills &&
                  data.skills.filter((skill) => skill.show).length > 0 && (
                    <>
                      {renderSectionSpacer("skills")}
                      <div 
                        className="cv-section" 
                        data-section-id="skills"
                        style={{ 
                          marginBottom: "7mm"
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: "#111827",
                            marginBottom: "7px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          SKILLS
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "7px 7px",
                            boxSizing: "border-box",
                            width: "100%",
                            alignItems: "flex-start",
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {data.skills
                            .filter((skill) => skill.show)
                            .map((skill, index) => (
                              <span
                                key={index}
                                style={{
                                  padding: "3px 7px",
                                  backgroundColor: "#ffffff",
                                  color: "#374151",
                                  fontSize: "10px",
                                  borderRadius: "3px",
                                  fontWeight: "500",
                                  border: "1px solid #d1d5db",
                                  letterSpacing: "0.1px",
                                  maxWidth: "100%",
                                  boxSizing: "border-box",
                                  display: "inline-block",
                                  overflow: "hidden",
                                  wordBreak: "break-word",
                                }}
                              >
                                {skill.name}
                              </span>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Languages Section */}
                {data.showLanguages &&
                  data.languages.filter((lang) => lang.show).length > 0 && (
                    <>
                      {renderSectionSpacer("languages")}
                      <div 
                        className="cv-section" 
                        data-section-id="languages"
                        style={{ 
                          marginBottom: "7mm"
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: "#111827",
                            marginBottom: "5px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          LANGUAGES
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                          }}
                        >
                          {data.languages
                            .filter((lang) => lang.show)
                            .map((language, index) => (
                              <div key={index}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "2px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      color: "#111827",
                                    }}
                                  >
                                    {language.name}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "9px",
                                      color: "#6b7280",
                                    }}
                                  >
                                    {language.levelText}
                                  </span>
                                </div>
                                {renderSkillLevel(language.level)}
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Strengths Section */}
                {data.showStrengths &&
                  Array.isArray(data.strengths) &&
                  data.strengths.filter((strength) => strength.show).length >
                    0 && (
                    <>
                      {renderSectionSpacer("strengths")}
                      <div 
                        className="cv-section" 
                        data-section-id="strengths"
                        style={{ 
                          marginBottom: "7mm"
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: "#111827",
                            marginBottom: "5px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          STRENGTHS
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                          }}
                        >
                          {data.strengths
                            .filter((strength) => strength.show)
                            .map((strength) => (
                              <div key={strength.id}>
                                <h4
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                    color: "#111827",
                                    margin: "0 0 2px 0",
                                  }}
                                >
                                  {strength.title}
                                </h4>
                                {strength.description && (
                                  <p
                                    style={{
                                      fontSize: "10px",
                                      color: "#374151",
                                      lineHeight: "1.4",
                                      margin: "0",
                                    }}
                                  >
                                    {strength.description}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Interests Section */}
                {data.showInterests &&
                  Array.isArray(data.interests) &&
                  data.interests.filter((interest) => interest.show).length >
                    0 && (
                    <>
                      {renderSectionSpacer("interests")}
                      <div 
                        className="cv-section" 
                        data-section-id="interests"
                        style={{ 
                          marginBottom: "7mm"
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#111827",
                            marginBottom: "4px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          INTERESTS
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          {data.interests
                            .filter((interest) => interest.show)
                            .map((interest) => (
                              <div key={interest.id}>
                                <h4
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                    color: "#111827",
                                    margin: "0 0 1px 0",
                                  }}
                                >
                                  {interest.title}
                                </h4>
                                {interest.description && (
                                  <p
                                    style={{
                                      fontSize: "9px",
                                      color: "#374151",
                                      lineHeight: "1.3",
                                      margin: "0",
                                    }}
                                  >
                                    {interest.description}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Activities Section */}
                {data.showActivities &&
                  data.activities.filter((activity) => activity.show).length >
                    0 && (
                    <>
                      {renderSectionSpacer("activities")}
                      <div 
                        className="cv-section" 
                        data-section-id="activities"
                        style={{ 
                          marginBottom: "0"
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#111827",
                            marginBottom: "4px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          ACTIVITIES
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          {data.activities
                            .filter((activity) => activity.show)
                            .map((activity) => (
                              <div key={activity.id}>
                                <h4
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                    color: "#111827",
                                    margin: "0 0 1px 0",
                                  }}
                                >
                                  {activity.title}
                                </h4>
                                {activity.showLocation && activity.location && (
                                  <p
                                    style={{
                                      fontSize: "8px",
                                      color: "#6b7280",
                                      margin: "0 0 1px 0",
                                    }}
                                  >
                                    {activity.location}
                                  </p>
                                )}
                                {activity.showDateRange && activity.dateRange && (
                                  <p
                                    style={{
                                      fontSize: "8px",
                                      color: "#6b7280",
                                      margin: "0 0 1px 0",
                                    }}
                                  >
                                    {formatDateRange(activity.dateRange)}
                                  </p>
                                )}
                                {activity.showDescription &&
                                  activity.description && (
                                    <p
                                      style={{
                                        fontSize: "9px",
                                        color: "#374151",
                                        lineHeight: "1.3",
                                      }}
                                    >
                                      {activity.description}
                                    </p>
                                  )}
                                {activity.showLink && activity.link && (
                                  <a
                                    href={activity.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: "8px",
                                      color: "#2563eb",
                                      textDecoration: "none",
                                      cursor: "pointer",
                                      display: "block",
                                      wordBreak: "break-all",
                                    }}
                                    onMouseEnter={(e) =>
                                      ((
                                        e.target as HTMLAnchorElement
                                      ).style.textDecoration = "underline")
                                    }
                                    onMouseLeave={(e) =>
                                      ((
                                        e.target as HTMLAnchorElement
                                      ).style.textDecoration = "none")
                                    }
                                  >
                                    {activity.link.replace(
                                      /https?:\/\/(www\.)?/,
                                      ""
                                    )}
                                  </a>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* References Section */}
                {data.showReferences && data.references && (
                  <>
                    {renderSectionSpacer("references")}
                    <div 
                      className="cv-section" 
                      data-section-id="references"
                      style={{ 
                        marginBottom: "0"
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "#111827",
                          marginBottom: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        REFERENCES
                      </h3>
                      <p
                        style={{
                          fontSize: "10px",
                          color: "#374151",
                          lineHeight: "1.3",
                          margin: "0",
                        }}
                      >
                        {data.references}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
};
