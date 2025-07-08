import { formatDateRange } from '@/lib/utils';
import { PersonalInfo, ResumeData } from '@/types/resume';
import { Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import React, { useMemo } from 'react';

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
        if (visibleItems <= 3) return '11px'; // Standard size for 1-3 items
        if (visibleItems === 4) return '10.5px'; // Slightly smaller for 4 items
        return '10px'; // Minimum readable size for 5 items
    };

    const fontSize = calculateFontSize();

    // Style for the contact items
    const contactItemStyle = {
        display: 'flex',
        alignItems: 'center',
        minWidth: 0 // Important for flex children to allow proper shrinking
    };

    // Determine spacing and alignment based on number of visible items
    // For fewer items, align from the left with appropriate gaps
    // For all 5 items, use space-between to distribute them evenly
    let justifyContent: 'flex-start' | 'space-between' = 'flex-start';
    let gap: string;

    if (visibleItems === 1) {
        gap = '0px';
    } else if (visibleItems === 2) {
        gap = '32px'; // Wider gap for just 2 items
    } else if (visibleItems === 3) {
        gap = '24px'; // Medium gap for 3 items
    } else if (visibleItems === 4) {
        gap = '20px'; // Narrower gap for 4 items
    } else {
        gap = '16px'; // Minimum gap for all 5 items
        justifyContent = 'space-between'; // Distribute all items evenly
    }

    // Style for the entire contact row
    const contactRowStyle = {
        display: 'flex',
        width: availableWidth,
        justifyContent,
        gap,
        fontSize,
        color: '#374151'
    };

    // Style for links
    const linkStyle = {
        color: '#000000',
        textDecoration: 'none',
        cursor: 'pointer',
        minWidth: 0 // Important for text shrinking properly
    };

    // Style for icons
    const iconStyle = {
        width: '12px',
        height: '12px',
        marginRight: '4px',
        flexShrink: 0 // Ensure icons don't shrink
    };

    // Style for text content that needs to shrink if needed
    const textStyle = {
        minWidth: 0,
        flexShrink: 1
    };

    return (
        <div style={contactRowStyle}>
            {personalInfo.showPhone && personalInfo.phone && (
                <div style={contactItemStyle}>
                    <Phone style={iconStyle} />
                    <span style={textStyle}>
                        {personalInfo.phone}
                    </span>
                </div>
            )}

            {personalInfo.showEmail && personalInfo.email && (
                <div style={contactItemStyle}>
                    <Mail style={iconStyle} />
                    <a
                        href={`mailto:${personalInfo.email}`}
                        style={linkStyle}
                        onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                        onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
                    >
                        {personalInfo.email}
                    </a>
                </div>
            )}

            {personalInfo.showLocation && personalInfo.location && (
                <div style={contactItemStyle}>
                    <MapPin style={iconStyle} />
                    <span style={textStyle}>
                        {personalInfo.location}
                    </span>
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
                        onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                        onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
                    >
                        {personalInfo.linkedIn.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
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
                        onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                        onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
                    >
                        {personalInfo.website.replace(/https?:\/\/(www\.)?/, '')}
                    </a>
                </div>
            )}
        </div>
    );
};

interface ModernClassicBlackTemplateProps {
    data: ResumeData;
    className?: string;
    scale?: number; // Scale factor for preview (e.g., 0.5 for 50% size)
    isPreview?: boolean; // Whether this is preview mode or export mode
}

export const ModernClassicBlackTemplate: React.FC<ModernClassicBlackTemplateProps> = ({
    data,
    className = '',
    scale = 1,
    isPreview = false
}) => {
    const renderSkillLevel = (level: number) => {
        return (
            <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                {[1, 2, 3, 4, 5].map((dot) => (
                    <div
                        key={dot}
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: dot <= level ? '#000000' : '#e5e7eb'
                        }}
                    />
                ))}
            </div>
        );
    };

    const templateStyles: React.CSSProperties = {
        backgroundColor: '#ffffff',
        width: '210mm',
        maxWidth: '210mm',
        height: '297mm',
        maxHeight: '297mm',
        margin: '0',
        padding: '0',
        fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
        color: '#111827',
        fontSize: '11px', // Lowered from 12px
        lineHeight: '1.4',
        overflow: 'hidden',
        pageBreakInside: 'avoid',
        pageBreakAfter: 'auto',
        pageBreakBefore: 'auto',
        boxSizing: 'border-box',
        position: 'relative',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        WebkitPrintColorAdjust: 'exact',
        colorAdjust: 'exact',
        printColorAdjust: 'exact',
        display: 'flex',
        flexDirection: 'column',
        // Apply scaling for preview mode to the template itself for proper rendering
        transform: isPreview ? `scale(${scale})` : 'none',
        transformOrigin: 'top left',
        // Ensure the template fits in container when scaled
        ...(isPreview && {
            position: 'absolute',
            top: 0,
            left: 0
        })
    };

    // Container styles for both preview and export to ensure consistency
    const containerStyles: React.CSSProperties = isPreview ? {
        width: `${210 * scale}mm`,
        height: `${297 * scale}mm`,
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    } : {
        width: '210mm',
        height: '297mm',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box'
    };

    return (
        <div style={containerStyles}>
            <div style={templateStyles} className={className} data-resume-template>
                <style>{`
                @page {
                    size: A4 portrait;
                    margin: 0;
                }
                [data-resume-template] {
                    margin: 0;
                    padding: 0;
                    max-height: 297mm;
                    height: 297mm;
                    overflow: hidden;
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
                [data-resume-template] .resume-black {
                    color: #000000 !important;
                }
                [data-resume-template] h1 {
                    font-size: 28px !important;
                    font-weight: bold !important;
                    color: #111827 !important;
                }
                [data-resume-template] h2 {
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    color: #000000 !important;
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
                    color: #000000 !important;
                    text-decoration: none !important;
                }
                [data-resume-template] a:hover {
                    opacity: 0.8;
                }
                @media print {
                    [data-resume-template] {
                        height: 297mm;
                        overflow: hidden;
                    }
                    [data-resume-template] a {
                        color: #000000 !important;
                        text-decoration: none !important;
                    }
                }
            `}</style>
                {/* Header Section */}
                <div style={{
                    padding: '10mm 15mm 6mm 15mm',
                    display: 'flex',
                    flexDirection: 'column',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    {/* Name, Title and Photo in one row */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px'
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: '28px',
                                fontWeight: 'bold',
                                color: '#111827',
                                margin: '0 0 5px 0',
                                letterSpacing: '0.5px'
                            }}>
                                {data.personalInfo.name || 'YOUR NAME'}
                            </h1>
                            <h2 style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#000000',
                                margin: '0',
                                textTransform: 'uppercase'
                            }}>
                                {data.personalInfo.title || 'SOFTWARE ENGINEER'}
                            </h2>
                        </div>

                        {data.personalInfo.showPhoto && data.personalInfo.photo && (
                            <div>
                                <Image
                                    src={data.personalInfo.photo}
                                    alt={data.personalInfo.name}
                                    width={60}
                                    height={60}
                                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Contact information on full width */}
                    <ContactInfoRow
                        personalInfo={data.personalInfo}
                        availableWidth="100%"
                    />
                </div>

                <div style={{
                    display: 'flex',
                    paddingBottom: '10mm',
                    height: 'calc(297mm - 10mm - 6mm - 60px)', // Exact height: A4 height minus header padding and height
                    maxHeight: 'calc(297mm - 10mm - 6mm - 60px)', // Added more pixel space for header (60px)
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                }}>
                    {/* Left Column */}
                    <div style={{
                        width: '65%',
                        padding: '6mm 10mm 6mm 15mm',
                        overflow: 'hidden',
                        height: '100%'
                    }}>
                        {/* Summary Section */}
                        {data.showSummary && data.summary && (
                            <div style={{ marginBottom: '8mm' }}> {/* Reduced from 10mm */}
                                <h3 style={{
                                    fontSize: '13px', // Increased from 12px
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '4px', // Reduced from 5px
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderBottom: '1px solid #111827',
                                    paddingBottom: '2px'
                                }}>
                                    SUMMARY
                                </h3>
                                <p style={{
                                    fontSize: '11px', // Increased from 10px
                                    color: '#374151',
                                    lineHeight: '1.4', // Reduced from 1.5
                                    margin: '0',
                                    textAlign: 'justify'
                                }}>
                                    {data.summary}
                                </p>
                            </div>
                        )}

                        {/* Experience Section */}
                        {data.showWorkExperience && data.workExperience.filter(exp => exp.show).length > 0 && (
                            <div style={{ marginBottom: '8mm' }}>
                                <h3 style={{
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '5px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderBottom: '1px solid #111827',
                                    paddingBottom: '2px'
                                }}>
                                    EXPERIENCE
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {data.workExperience.filter(exp => exp.show).map((exp) => (
                                        <div key={exp.id}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                                                <div>
                                                    <h4 style={{
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        color: '#111827',
                                                        margin: '0 0 1px 0'
                                                    }}>
                                                        {exp.position}
                                                    </h4>
                                                    <p className="resume-black" style={{
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        margin: '0 0 1px 0'
                                                    }}>
                                                        {exp.company}
                                                    </p>
                                                    {exp.showLocation && exp.location && (
                                                        <p style={{
                                                            fontSize: '10px',
                                                            color: '#6b7280',
                                                            margin: '0'
                                                        }}>
                                                            {exp.location}
                                                        </p>
                                                    )}
                                                </div>
                                                {exp.showDateRange && (
                                                    <div style={{
                                                        fontSize: '10px',
                                                        color: '#6b7280',
                                                        textAlign: 'right',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {formatDateRange(exp.dateRange)}
                                                    </div>
                                                )}
                                            </div>
                                            {exp.showDescription && exp.description && (
                                                <p style={{
                                                    fontSize: '11px',
                                                    color: '#374151',
                                                    marginBottom: '2px',
                                                    lineHeight: '1.3'
                                                }}>
                                                    {exp.description}
                                                </p>
                                            )}
                                            {exp.showBullets && exp.bullets.length > 0 && (
                                                <div style={{
                                                    fontSize: '11px',
                                                    color: '#374151',
                                                    margin: '0',
                                                    lineHeight: '1.3'
                                                }}>
                                                    {exp.bullets.map((bullet, index) => (
                                                        <div key={index} style={{
                                                            marginBottom: '2px',
                                                            display: 'flex',
                                                            alignItems: 'flex-start'
                                                        }}>
                                                            <span style={{
                                                                marginRight: '6px',
                                                                marginTop: '2px',
                                                                fontSize: '9px',
                                                                lineHeight: '1'
                                                            }}>•</span>
                                                            <span style={{ flex: 1 }}>{bullet}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education Section */}
                        {data.showEducation && data.education.filter(edu => edu.show).length > 0 && (
                            <div style={{ marginBottom: '7mm' }}>
                                <h3 style={{
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '5px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderBottom: '1px solid #111827',
                                    paddingBottom: '2px'
                                }}>
                                    EDUCATION
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {data.education.filter(edu => edu.show).map((edu) => (
                                        <div key={edu.id}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h4 style={{
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        color: '#111827',
                                                        margin: '0 0 1px 0'
                                                    }}>
                                                        {edu.degree}
                                                    </h4>
                                                    <p className="resume-black" style={{
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        margin: '0 0 1px 0'
                                                    }}>
                                                        {edu.institution}
                                                    </p>
                                                    {edu.showLocation && edu.location && (
                                                        <p style={{
                                                            fontSize: '10px',
                                                            color: '#6b7280',
                                                            margin: '0'
                                                        }}>
                                                            {edu.location}
                                                        </p>
                                                    )}
                                                    {edu.showGpa && edu.gpa && (
                                                        <p style={{
                                                            fontSize: '10px',
                                                            color: '#6b7280',
                                                            margin: '0'
                                                        }}>
                                                            GPA: {edu.gpa}
                                                        </p>
                                                    )}
                                                </div>
                                                {edu.showDateRange && (
                                                    <div style={{
                                                        fontSize: '10px',
                                                        color: '#6b7280'
                                                    }}>
                                                        {formatDateRange(edu.dateRange)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Certifications Section */}
                        {data.showCertifications && Array.isArray(data.certifications) && data.certifications.filter(cert => cert.show).length > 0 && (
                            <div style={{ marginBottom: '7mm' }}>
                                <h3 style={{
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '5px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderBottom: '1px solid #111827',
                                    paddingBottom: '2px'
                                }}>
                                    CERTIFICATIONS
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {data.certifications.filter(cert => cert.show).map((cert) => (
                                        <div key={cert.id}>
                                            <h4 style={{
                                                fontSize: '13px',
                                                fontWeight: 'bold',
                                                color: '#111827',
                                                margin: '0 0 2px 0'
                                            }}>
                                                {cert.name}
                                            </h4>
                                            <p className="resume-black" style={{
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                margin: '0 0 2px 0'
                                            }}>
                                                {cert.issuingOrganization}
                                            </p>
                                            {cert.showIssueDate && (
                                                <p style={{
                                                    fontSize: '11px',
                                                    color: '#6b7280',
                                                    margin: '0 0 2px 0'
                                                }}>
                                                    Issued: {cert.issueDate.month.toString().padStart(2, '0')}/{cert.issueDate.year}
                                                    {cert.showExpirationDate && cert.expirationDate && (
                                                        <span> • Expires: {cert.expirationDate.month.toString().padStart(2, '0')}/{cert.expirationDate.year}</span>
                                                    )}
                                                </p>
                                            )}
                                            {cert.showCredentialId && cert.credentialId && (
                                                <p style={{
                                                    fontSize: '11px',
                                                    color: '#374151',
                                                    margin: '0 0 2px 0',
                                                    wordBreak: 'break-all',
                                                    overflowWrap: 'anywhere'
                                                }}>
                                                    ID: {cert.credentialId}
                                                </p>
                                            )}
                                            {cert.showCredentialUrl && cert.credentialUrl && (
                                                <a
                                                    href={cert.credentialUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        fontSize: '11px',
                                                        color: '#000000',
                                                        textDecoration: 'none',
                                                        cursor: 'pointer',
                                                        display: 'inline-block'
                                                    }}
                                                    onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                                                    onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
                                                >
                                                    View Certificate
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div style={{
                        width: '35%',
                        backgroundColor: '#ffffff',
                        padding: '6mm 15mm 6mm 6mm',
                        borderLeft: '1px solid #e5e7eb',
                        overflow: 'hidden', // Changed from auto to hidden
                        height: '100%',
                        fontSize: '11px' // Lowered from 12px for right column
                    }}>
                        {/* Skills Section */}
                        {data.showSkills && data.skills.filter(skill => skill.show).length > 0 && (
                            <div style={{ marginBottom: '7mm' }}>
                                <h3 style={{
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '7px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    SKILLS
                                </h3>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '7px 7px',
                                        boxSizing: 'border-box',
                                        width: '100%',
                                        alignItems: 'flex-start',
                                        padding: 0,
                                        margin: 0
                                    }}
                                >
                                    {data.skills.filter(skill => skill.show).map((skill, index) => (
                                        <span
                                            key={index}
                                            style={{
                                                padding: '3px 7px',
                                                backgroundColor: '#ffffff',
                                                color: '#374151',
                                                fontSize: '10px',
                                                borderRadius: '3px',
                                                fontWeight: '500',
                                                border: '1px solid #d1d5db',
                                                letterSpacing: '0.1px',
                                                maxWidth: '100%',
                                                boxSizing: 'border-box',
                                                display: 'inline-block',
                                                overflow: 'hidden',
                                                // No whiteSpace or textOverflow, allow wrapping
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strengths Section */}
                        {data.showStrengths && Array.isArray(data.strengths) && data.strengths.filter(strength => strength.show).length > 0 && (
                            <div style={{ marginBottom: '7mm' }}>
                                <h3 style={{
                                    fontSize: '13px', // Increased from 12px
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '5px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    STRENGTHS
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {data.strengths.filter(strength => strength.show).map((strength) => (
                                        <div key={strength.id}>
                                            <h4 style={{
                                                fontSize: '11px', // Increased from 10px
                                                fontWeight: 'bold',
                                                color: '#111827',
                                                margin: '0 0 2px 0'
                                            }}>
                                                {strength.title}
                                            </h4>
                                            {strength.description && (
                                                <p style={{
                                                    fontSize: '10px', // Increased from 9px
                                                    color: '#374151',
                                                    lineHeight: '1.4', // Increased from 1.3
                                                    margin: '0'
                                                }}>
                                                    {strength.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Languages Section */}
                        {data.showLanguages && data.languages.filter(lang => lang.show).length > 0 && (
                            <div style={{ marginBottom: '7mm' }}>
                                <h3 style={{
                                    fontSize: '13px', // Increased from 12px
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '5px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    LANGUAGES
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {data.languages.filter(lang => lang.show).map((language, index) => (
                                        <div key={index}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '2px'
                                            }}>
                                                <span style={{
                                                    fontSize: '11px', // Increased from 10px
                                                    fontWeight: '600',
                                                    color: '#111827'
                                                }}>
                                                    {language.name}
                                                </span>
                                                <span style={{
                                                    fontSize: '9px', // Increased from 8px
                                                    color: '#6b7280'
                                                }}>
                                                    {language.levelText}
                                                </span>
                                            </div>
                                            {renderSkillLevel(language.level)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Projects Section */}
                        {data.showProjects && data.projects.filter(project => project.show).length > 0 && (
                            <div style={{ marginBottom: '7mm' }}>
                                <h3 style={{
                                    fontSize: '13px', // Increased from 12px
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '5px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    PROJECTS
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {data.projects.filter(project => project.show).map((project) => (
                                        <div key={project.id}>
                                            <h4 style={{
                                                fontSize: '11px', // Increased from 10px
                                                fontWeight: 'bold',
                                                color: '#111827',
                                                margin: '0 0 2px 0'
                                            }}>
                                                {project.title}
                                            </h4>
                                            {project.showDateRange && project.dateRange && (
                                                <p style={{
                                                    fontSize: '9px', // Increased from 8px
                                                    color: '#6b7280',
                                                    margin: '0 0 2px 0'
                                                }}>
                                                    {formatDateRange(project.dateRange)}
                                                </p>
                                            )}
                                            {project.showDescription && project.description && (
                                                <p style={{
                                                    fontSize: '10px', // Increased from 9px
                                                    color: '#374151',
                                                    marginBottom: '3px',
                                                    lineHeight: '1.4' // Increased from 1.3
                                                }}>
                                                    {project.description}
                                                </p>
                                            )}
                                            {project.showLink && project.link && (
                                                <div style={{ marginBottom: '3px' }}>
                                                    <a
                                                        href={project.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            fontSize: '9px', // Increased from 8px
                                                            color: '#000000',
                                                            textDecoration: 'none',
                                                            cursor: 'pointer',
                                                            display: 'block',
                                                            wordBreak: 'break-all'
                                                        }}
                                                        onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                                                        onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
                                                    >
                                                        {project.link.replace(/https?:\/\/(www\.)?/, '')}
                                                    </a>
                                                </div>
                                            )}
                                            {project.technologies.length > 0 && (
                                                <div style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '2px',
                                                    marginTop: '3px'
                                                }}>
                                                    {project.technologies.map((tech, techIndex) => (
                                                        <span
                                                            key={techIndex}
                                                            style={{
                                                                padding: '2px 4px',
                                                                backgroundColor: '#e5e7eb',
                                                                color: '#111827',
                                                                fontSize: '8px', // Increased from 7px
                                                                borderRadius: '2px',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Interests Section */}
                        {data.showInterests && Array.isArray(data.interests) && data.interests.filter(interest => interest.show).length > 0 && (
                            <div style={{ marginBottom: '7mm' }}>
                                <h3 style={{
                                    fontSize: '12px', // Increased from 11px
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    INTERESTS
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {data.interests.filter(interest => interest.show).map((interest) => (
                                        <div key={interest.id}>
                                            <h4 style={{
                                                fontSize: '10px', // Increased from 9px
                                                fontWeight: 'bold',
                                                color: '#111827',
                                                margin: '0 0 1px 0'
                                            }}>
                                                {interest.title}
                                            </h4>
                                            {interest.description && (
                                                <p style={{
                                                    fontSize: '9px', // Increased from 8px
                                                    color: '#374151',
                                                    lineHeight: '1.3', // Increased from 1.2
                                                    margin: '0'
                                                }}>
                                                    {interest.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Activities Section */}
                        {data.showActivities && data.activities.filter(activity => activity.show).length > 0 && (
                            <div style={{ marginBottom: '0' }}>
                                <h3 style={{
                                    fontSize: '12px', // Increased from 11px
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    ACTIVITIES
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {data.activities.filter(activity => activity.show).map((activity) => (
                                        <div key={activity.id}>
                                            <h4 style={{
                                                fontSize: '10px', // Increased from 9px
                                                fontWeight: 'bold',
                                                color: '#111827',
                                                margin: '0 0 1px 0'
                                            }}>
                                                {activity.title}
                                            </h4>
                                            {activity.showLocation && activity.location && (
                                                <p style={{
                                                    fontSize: '8px', // Increased from 7px
                                                    color: '#6b7280',
                                                    margin: '0 0 1px 0'
                                                }}>
                                                    {activity.location}
                                                </p>
                                            )}
                                            {activity.showDateRange && activity.dateRange && (
                                                <p style={{
                                                    fontSize: '8px', // Increased from 7px
                                                    color: '#6b7280',
                                                    margin: '0 0 1px 0'
                                                }}>
                                                    {formatDateRange(activity.dateRange)}
                                                </p>
                                            )}
                                            {activity.showDescription && activity.description && (
                                                <p style={{
                                                    fontSize: '9px', // Increased from 8px
                                                    color: '#374151',
                                                    lineHeight: '1.3' // Increased from 1.2
                                                }}>
                                                    {activity.description}
                                                </p>
                                            )}
                                            {activity.showLink && activity.link && (
                                                <a
                                                    href={activity.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        fontSize: '8px', // Increased from 7px
                                                        color: '#000000',
                                                        textDecoration: 'none',
                                                        cursor: 'pointer',
                                                        display: 'block',
                                                        wordBreak: 'break-all'
                                                    }}
                                                    onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                                                    onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
                                                >
                                                    {activity.link.replace(/https?:\/\/(www\.)?/, '')}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
