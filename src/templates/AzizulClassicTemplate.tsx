import { formatDateRange } from '@/lib/utils';
import { ResumeData } from '@/types/resume';
import { Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

interface AzizulClassicTemplateProps {
    data: ResumeData;
    className?: string;
}

export const AzizulClassicTemplate: React.FC<AzizulClassicTemplateProps> = ({
    data,
    className = ''
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
                            backgroundColor: dot <= level ? '#2563eb' : '#e5e7eb'
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
        fontSize: '12px', // Increased from 11px
        lineHeight: '1.4', // Slightly increased for better readability
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
        flexDirection: 'column'
    };

    return (
        <div style={templateStyles} className={className} data-resume-template>
            <style>{`
                [data-resume-template] a {
                    transition: all 0.2s ease;
                }
                [data-resume-template] a:hover {
                    opacity: 0.8;
                }
                @media print {
                    [data-resume-template] a {
                        color: #2563eb !important;
                        text-decoration: none !important;
                    }
                }
            `}</style>
            {/* Header Section */}
            <div style={{
                padding: '10mm 15mm 6mm 15mm',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e5e7eb'
            }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{
                        fontSize: '28px', // Increased from 26px
                        fontWeight: 'bold',
                        color: '#111827',
                        margin: '0 0 5px 0',
                        letterSpacing: '0.5px'
                    }}>
                        {data.personalInfo.name || 'YOUR NAME'}
                    </h1>
                    <h2 style={{
                        fontSize: '14px', // Increased from 13px
                        fontWeight: '600',
                        color: '#2563eb',
                        margin: '0 0 10px 0',
                        textTransform: 'uppercase'
                    }}>
                        {data.personalInfo.title || 'SOFTWARE ENGINEER'}
                    </h2>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', fontSize: '11px', color: '#374151' }}> {/* Increased from 10px */}
                        {data.personalInfo.showPhone && data.personalInfo.phone && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Phone style={{ width: '12px', height: '12px', marginRight: '4px' }} /> {/* Increased from 11px */}
                                {data.personalInfo.phone}
                            </div>
                        )}
                        {data.personalInfo.showEmail && data.personalInfo.email && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Mail style={{ width: '12px', height: '12px', marginRight: '4px' }} /> {/* Increased from 11px */}
                                <a
                                    href={`mailto:${data.personalInfo.email}`}
                                    style={{
                                        color: '#2563eb',
                                        textDecoration: 'none',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                                    onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
                                >
                                    {data.personalInfo.email}
                                </a>
                            </div>
                        )}
                        {data.personalInfo.showLocation && data.personalInfo.location && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <MapPin style={{ width: '12px', height: '12px', marginRight: '4px' }} /> {/* Increased from 11px */}
                                {data.personalInfo.location}
                            </div>
                        )}
                        {data.personalInfo.showLinkedIn && data.personalInfo.linkedIn && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Linkedin style={{ width: '12px', height: '12px', marginRight: '4px' }} /> {/* Increased from 11px */}
                                <a
                                    href={data.personalInfo.linkedIn}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: '#2563eb',
                                        textDecoration: 'none',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                                    onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
                                >
                                    {data.personalInfo.linkedIn.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
                                </a>
                            </div>
                        )}
                        {data.personalInfo.showWebsite && data.personalInfo.website && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Globe style={{ width: '12px', height: '12px', marginRight: '4px' }} /> {/* Increased from 11px */}
                                <a
                                    href={data.personalInfo.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: '#2563eb',
                                        textDecoration: 'none',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                                    onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
                                >
                                    {data.personalInfo.website.replace(/https?:\/\/(www\.)?/, '')}
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {data.personalInfo.showPhoto && data.personalInfo.photo && (
                    <div style={{ marginLeft: '15px' }}>
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

            <div style={{ display: 'flex', flex: 1 }}>
                {/* Left Column */}
                <div style={{ width: '65%', padding: '6mm 10mm 6mm 15mm', overflow: 'hidden' }}>
                    {/* Summary Section */}
                    {data.showSummary && data.summary && (
                        <div style={{ marginBottom: '8mm' }}> {/* Reduced from 10mm */}
                            <h3 style={{
                                fontSize: '12px', // Reduced from 13px
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
                                fontSize: '10px', // Reduced from 11px
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
                        <div style={{ marginBottom: '8mm' }}> {/* Reduced from 10mm */}
                            <h3 style={{
                                fontSize: '12px', // Reduced from 13px
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '5px', // Reduced from 7px
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderBottom: '1px solid #111827',
                                paddingBottom: '2px'
                            }}>
                                EXPERIENCE
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}> {/* Reduced from 7px */}
                                {data.workExperience.filter(exp => exp.show).map((exp) => (
                                    <div key={exp.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                                            <div>
                                                <h4 style={{
                                                    fontSize: '11px', // Reduced from 12px
                                                    fontWeight: 'bold',
                                                    color: '#111827',
                                                    margin: '0 0 1px 0' // Reduced from 2px
                                                }}>
                                                    {exp.position}
                                                </h4>
                                                <p style={{
                                                    fontSize: '10px', // Reduced from 11px
                                                    fontWeight: '600',
                                                    color: '#2563eb',
                                                    margin: '0 0 1px 0' // Reduced from 2px
                                                }}>
                                                    {exp.company}
                                                </p>
                                                {exp.showLocation && exp.location && (
                                                    <p style={{
                                                        fontSize: '9px', // Reduced from 10px
                                                        color: '#6b7280',
                                                        margin: '0'
                                                    }}>
                                                        {exp.location}
                                                    </p>
                                                )}
                                            </div>
                                            {exp.showDateRange && (
                                                <div style={{
                                                    fontSize: '9px', // Reduced from 10px
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
                                                fontSize: '10px', // Reduced from 11px
                                                color: '#374151',
                                                marginBottom: '2px', // Reduced from 3px
                                                lineHeight: '1.3' // Reduced from 1.4
                                            }}>
                                                {exp.description}
                                            </p>
                                        )}
                                        {exp.showBullets && exp.bullets.length > 0 && (
                                            <div style={{
                                                fontSize: '10px', // Reduced from 11px
                                                color: '#374151',
                                                margin: '0',
                                                lineHeight: '1.3' // Reduced from 1.4
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
                                                            fontSize: '9px', // Increased from 8px
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
                        <div style={{ marginBottom: '7mm' }}> {/* Reduced from 10mm */}
                            <h3 style={{
                                fontSize: '12px', // Reduced from 13px
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '5px', // Reduced from 7px
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderBottom: '1px solid #111827',
                                paddingBottom: '2px'
                            }}>
                                EDUCATION
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}> {/* Reduced from 5px */}
                                {data.education.filter(edu => edu.show).map((edu) => (
                                    <div key={edu.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h4 style={{
                                                    fontSize: '11px', // Reduced from 12px
                                                    fontWeight: 'bold',
                                                    color: '#111827',
                                                    margin: '0 0 1px 0' // Reduced from 2px
                                                }}>
                                                    {edu.degree}
                                                </h4>
                                                <p style={{
                                                    fontSize: '10px', // Reduced from 11px
                                                    fontWeight: '600',
                                                    color: '#2563eb',
                                                    margin: '0 0 1px 0' // Reduced from 2px
                                                }}>
                                                    {edu.institution}
                                                </p>
                                                {edu.showLocation && edu.location && (
                                                    <p style={{
                                                        fontSize: '10px', // Increased from 9px
                                                        color: '#6b7280',
                                                        margin: '0'
                                                    }}>
                                                        {edu.location}
                                                    </p>
                                                )}
                                                {edu.showGpa && edu.gpa && (
                                                    <p style={{
                                                        fontSize: '10px', // Increased from 9px
                                                        color: '#6b7280',
                                                        margin: '0'
                                                    }}>
                                                        GPA: {edu.gpa}
                                                    </p>
                                                )}
                                            </div>
                                            {edu.showDateRange && (
                                                <div style={{
                                                    fontSize: '10px', // Increased from 9px
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
                        <div style={{ marginBottom: '7mm' }}> {/* Reduced from 10mm */}
                            <h3 style={{
                                fontSize: '12px', // Reduced from 13px
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '5px', // Reduced from 7px
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderBottom: '1px solid #111827',
                                paddingBottom: '2px'
                            }}>
                                CERTIFICATIONS
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}> {/* Reduced from 7px */}
                                {data.certifications.filter(cert => cert.show).map((cert) => (
                                    <div key={cert.id}>
                                        <h4 style={{
                                            fontSize: '12px', // Increased from 11px
                                            fontWeight: 'bold',
                                            color: '#111827',
                                            margin: '0 0 2px 0'
                                        }}>
                                            {cert.name}
                                        </h4>
                                        <p style={{
                                            fontSize: '11px', // Increased from 10px
                                            fontWeight: '600',
                                            color: '#2563eb',
                                            margin: '0 0 2px 0'
                                        }}>
                                            {cert.issuingOrganization}
                                        </p>
                                        {cert.showIssueDate && (
                                            <p style={{
                                                fontSize: '10px', // Increased from 9px
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
                                                fontSize: '10px', // Increased from 9px
                                                color: '#374151',
                                                margin: '0 0 2px 0'
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
                                                    fontSize: '10px', // Increased from 9px
                                                    color: '#2563eb',
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
                <div style={{ width: '35%', backgroundColor: '#ffffff', padding: '6mm 10mm 6mm 6mm', borderLeft: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    {/* Skills Section */}
                    {data.showSkills && data.skills.filter(skill => skill.show).length > 0 && (
                        <div style={{ marginBottom: '7mm' }}>
                            <h3 style={{
                                fontSize: '13px', // Increased from 12px
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '7px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                SKILLS
                            </h3>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '4px 5px',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start'
                            }}>
                                {data.skills.filter(skill => skill.show).map((skill, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            padding: '3px 7px',
                                            backgroundColor: '#ffffff',
                                            color: '#374151',
                                            fontSize: '10px', // Increased from 9px
                                            borderRadius: '3px',
                                            fontWeight: '500',
                                            border: '1px solid #d1d5db',
                                            letterSpacing: '0.1px',
                                            whiteSpace: 'nowrap',
                                            display: 'inline-block',
                                            minWidth: 'fit-content'
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
                                                        color: '#2563eb',
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
                                                            backgroundColor: '#dbeafe',
                                                            color: '#1e40af',
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
                        <div style={{ marginBottom: '6mm' }}>
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
                        <div style={{ marginBottom: '6mm' }}>
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
                                                    color: '#2563eb',
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
    );
};
