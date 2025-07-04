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
                            width: '10px',
                            height: '10px',
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
        width: '210mm', // A4 width
        maxWidth: '210mm',
        minHeight: '297mm', // A4 height
        maxHeight: '297mm',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        color: '#111827',
        fontSize: '11px',
        lineHeight: '1.3',
        overflow: 'hidden',
        pageBreakInside: 'avoid',
        boxSizing: 'border-box'
    };

    return (
        <div style={templateStyles} className={className}>
            {/* Header Section */}
            <div style={{
                padding: '15mm 15mm 8mm 15mm',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e5e7eb'
            }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: '#111827',
                        margin: '0 0 6px 0',
                        letterSpacing: '0.5px'
                    }}>
                        {data.personalInfo.name || 'YOUR NAME'}
                    </h1>
                    <h2 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#2563eb',
                        margin: '0 0 12px 0',
                        textTransform: 'uppercase'
                    }}>
                        {data.personalInfo.title || 'SOFTWARE ENGINEER'}
                    </h2>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: '10px', color: '#374151' }}>
                        {data.personalInfo.showPhone && data.personalInfo.phone && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Phone style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                {data.personalInfo.phone}
                            </div>
                        )}
                        {data.personalInfo.showEmail && data.personalInfo.email && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Mail style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                {data.personalInfo.email}
                            </div>
                        )}
                        {data.personalInfo.showLocation && data.personalInfo.location && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <MapPin style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                {data.personalInfo.location}
                            </div>
                        )}
                        {data.personalInfo.showLinkedIn && data.personalInfo.linkedIn && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Linkedin style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                {data.personalInfo.linkedIn}
                            </div>
                        )}
                        {data.personalInfo.showWebsite && data.personalInfo.website && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Globe style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                {data.personalInfo.website}
                            </div>
                        )}
                    </div>
                </div>

                {data.personalInfo.showPhoto && data.personalInfo.photo && (
                    <div style={{ marginLeft: '20px' }}>
                        <Image
                            src={data.personalInfo.photo}
                            alt={data.personalInfo.name}
                            width={70}
                            height={70}
                            style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', height: 'calc(297mm - 120px)' }}>
                {/* Left Column */}
                <div style={{ width: '65%', padding: '8mm 12mm 8mm 15mm' }}>
                    {/* Summary Section */}
                    {data.showSummary && data.summary && (
                        <div style={{ marginBottom: '12mm' }}>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderBottom: '2px solid #111827',
                                paddingBottom: '2px'
                            }}>
                                SUMMARY
                            </h3>
                            <p style={{
                                fontSize: '10px',
                                color: '#374151',
                                lineHeight: '1.4',
                                margin: '0',
                                textAlign: 'justify'
                            }}>
                                {data.summary}
                            </p>
                        </div>
                    )}

                    {/* Experience Section */}
                    {data.showWorkExperience && data.workExperience.filter(exp => exp.show).length > 0 && (
                        <div style={{ marginBottom: '12mm' }}>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderBottom: '2px solid #111827',
                                paddingBottom: '2px'
                            }}>
                                EXPERIENCE
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {data.workExperience.filter(exp => exp.show).map((exp) => (
                                    <div key={exp.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                            <div>
                                                <h4 style={{
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    color: '#111827',
                                                    margin: '0 0 2px 0'
                                                }}>
                                                    {exp.position}
                                                </h4>
                                                <p style={{
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    color: '#2563eb',
                                                    margin: '0 0 2px 0'
                                                }}>
                                                    {exp.company}
                                                </p>
                                                {exp.showLocation && exp.location && (
                                                    <p style={{
                                                        fontSize: '9px',
                                                        color: '#6b7280',
                                                        margin: '0'
                                                    }}>
                                                        {exp.location}
                                                    </p>
                                                )}
                                            </div>
                                            {exp.showDateRange && (
                                                <div style={{
                                                    fontSize: '9px',
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
                                                fontSize: '10px',
                                                color: '#374151',
                                                marginBottom: '4px',
                                                lineHeight: '1.3'
                                            }}>
                                                {exp.description}
                                            </p>
                                        )}
                                        {exp.showBullets && exp.bullets.length > 0 && (
                                            <ul style={{
                                                fontSize: '10px',
                                                color: '#374151',
                                                paddingLeft: '12px',
                                                margin: '0',
                                                lineHeight: '1.3'
                                            }}>
                                                {exp.bullets.map((bullet, index) => (
                                                    <li key={index} style={{ marginBottom: '2px' }}>{bullet}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education Section */}
                    {data.showEducation && data.education.filter(edu => edu.show).length > 0 && (
                        <div style={{ marginBottom: '12mm' }}>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderBottom: '2px solid #111827',
                                paddingBottom: '2px'
                            }}>
                                EDUCATION
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {data.education.filter(edu => edu.show).map((edu) => (
                                    <div key={edu.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h4 style={{
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    color: '#111827',
                                                    margin: '0 0 2px 0'
                                                }}>
                                                    {edu.degree}
                                                </h4>
                                                <p style={{
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    color: '#2563eb',
                                                    margin: '0 0 2px 0'
                                                }}>
                                                    {edu.institution}
                                                </p>
                                                {edu.showLocation && edu.location && (
                                                    <p style={{
                                                        fontSize: '9px',
                                                        color: '#6b7280',
                                                        margin: '0'
                                                    }}>
                                                        {edu.location}
                                                    </p>
                                                )}
                                                {edu.showGpa && edu.gpa && (
                                                    <p style={{
                                                        fontSize: '9px',
                                                        color: '#6b7280',
                                                        margin: '0'
                                                    }}>
                                                        GPA: {edu.gpa}
                                                    </p>
                                                )}
                                            </div>
                                            {edu.showDateRange && (
                                                <div style={{
                                                    fontSize: '9px',
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
                        <div style={{ marginBottom: '12mm' }}>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderBottom: '2px solid #111827',
                                paddingBottom: '2px'
                            }}>
                                CERTIFICATIONS
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {data.certifications.filter(cert => cert.show).map((cert) => (
                                    <div key={cert.id}>
                                        <h4 style={{
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            color: '#111827',
                                            margin: '0 0 2px 0'
                                        }}>
                                            {cert.name}
                                        </h4>
                                        <p style={{
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            color: '#2563eb',
                                            margin: '0 0 2px 0'
                                        }}>
                                            {cert.issuingOrganization}
                                        </p>
                                        {cert.showIssueDate && (
                                            <p style={{
                                                fontSize: '9px',
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
                                                fontSize: '9px',
                                                color: '#374151',
                                                margin: '0 0 2px 0'
                                            }}>
                                                ID: {cert.credentialId}
                                            </p>
                                        )}
                                        {cert.showCredentialUrl && cert.credentialUrl && (
                                            <a
                                                href={cert.credentialUrl}
                                                style={{
                                                    fontSize: '9px',
                                                    color: '#2563eb',
                                                    textDecoration: 'none'
                                                }}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Verify Certificate
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div style={{ width: '35%', backgroundColor: '#ffffff', padding: '8mm 12mm 8mm 8mm', borderLeft: '1px solid #e5e7eb' }}>
                    {/* Skills Section */}
                    {data.showSkills && data.skills.filter(skill => skill.show).length > 0 && (
                        <div style={{ marginBottom: '8mm' }}>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                SKILLS
                            </h3>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '4px 6px',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start'
                            }}>
                                {data.skills.filter(skill => skill.show).map((skill, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            padding: '3px 8px',
                                            backgroundColor: '#ffffff',
                                            color: '#374151',
                                            fontSize: '9px',
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
                        <div style={{ marginBottom: '8mm' }}>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                STRENGTHS
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {data.strengths.filter(strength => strength.show).map((strength) => (
                                    <div key={strength.id}>
                                        <h4 style={{
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            color: '#111827',
                                            margin: '0 0 2px 0'
                                        }}>
                                            {strength.title}
                                        </h4>
                                        {strength.description && (
                                            <p style={{
                                                fontSize: '9px',
                                                color: '#374151',
                                                lineHeight: '1.2',
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
                        <div style={{ marginBottom: '8mm' }}>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                LANGUAGES
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {data.languages.filter(lang => lang.show).map((language, index) => (
                                    <div key={index}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '2px'
                                        }}>
                                            <span style={{
                                                fontSize: '10px',
                                                fontWeight: '600',
                                                color: '#111827'
                                            }}>
                                                {language.name}
                                            </span>
                                            <span style={{
                                                fontSize: '8px',
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
                        <div style={{ marginBottom: '8mm' }}>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                PROJECTS
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {data.projects.filter(project => project.show).map((project) => (
                                    <div key={project.id}>
                                        <h4 style={{
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            color: '#111827',
                                            margin: '0 0 2px 0'
                                        }}>
                                            {project.title}
                                        </h4>
                                        {project.showDateRange && project.dateRange && (
                                            <p style={{
                                                fontSize: '8px',
                                                color: '#6b7280',
                                                margin: '0 0 2px 0'
                                            }}>
                                                {formatDateRange(project.dateRange)}
                                            </p>
                                        )}
                                        {project.showDescription && project.description && (
                                            <p style={{
                                                fontSize: '9px',
                                                color: '#374151',
                                                marginBottom: '4px',
                                                lineHeight: '1.2'
                                            }}>
                                                {project.description}
                                            </p>
                                        )}
                                        {project.showLink && project.link && (
                                            <a
                                                href={project.link}
                                                style={{
                                                    fontSize: '8px',
                                                    color: '#2563eb',
                                                    textDecoration: 'none'
                                                }}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {project.link}
                                            </a>
                                        )}
                                        {project.technologies.length > 0 && (
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '2px',
                                                marginTop: '4px'
                                            }}>
                                                {project.technologies.map((tech, techIndex) => (
                                                    <span
                                                        key={techIndex}
                                                        style={{
                                                            padding: '1px 4px',
                                                            backgroundColor: '#dbeafe',
                                                            color: '#1e40af',
                                                            fontSize: '7px',
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
                        <div style={{ marginBottom: '8mm' }}>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                INTERESTS
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {data.interests.filter(interest => interest.show).map((interest) => (
                                    <div key={interest.id}>
                                        <h4 style={{
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            color: '#111827',
                                            margin: '0 0 2px 0'
                                        }}>
                                            {interest.title}
                                        </h4>
                                        {interest.description && (
                                            <p style={{
                                                fontSize: '9px',
                                                color: '#374151',
                                                lineHeight: '1.2',
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
                        <div style={{ marginBottom: '8mm' }}>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                ACTIVITIES
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {data.activities.filter(activity => activity.show).map((activity) => (
                                    <div key={activity.id}>
                                        <h4 style={{
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            color: '#111827',
                                            margin: '0 0 2px 0'
                                        }}>
                                            {activity.title}
                                        </h4>
                                        {activity.showLocation && activity.location && (
                                            <p style={{
                                                fontSize: '8px',
                                                color: '#6b7280',
                                                margin: '0 0 2px 0'
                                            }}>
                                                {activity.location}
                                            </p>
                                        )}
                                        {activity.showDateRange && activity.dateRange && (
                                            <p style={{
                                                fontSize: '8px',
                                                color: '#6b7280',
                                                margin: '0 0 2px 0'
                                            }}>
                                                {formatDateRange(activity.dateRange)}
                                            </p>
                                        )}
                                        {activity.showDescription && activity.description && (
                                            <p style={{
                                                fontSize: '9px',
                                                color: '#374151',
                                                lineHeight: '1.2'
                                            }}>
                                                {activity.description}
                                            </p>
                                        )}
                                        {activity.showLink && activity.link && (
                                            <a
                                                href={activity.link}
                                                style={{
                                                    fontSize: '8px',
                                                    color: '#2563eb',
                                                    textDecoration: 'none'
                                                }}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {activity.link}
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
