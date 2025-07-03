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
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((dot) => (
                    <div
                        key={dot}
                        className={`w-3 h-3 rounded-full ${dot <= level ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className={`bg-white w-[595px] min-h-[842px] mx-auto font-sans text-gray-900 ${className}`}>
            {/* Header Section */}
            <div className="bg-gray-50 px-8 py-6 flex items-start justify-between">
                <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        {data.personalInfo.name || 'YOUR NAME'}
                    </h1>
                    <h2 className="text-xl font-medium text-blue-600 mb-4">
                        {data.personalInfo.title || 'SOFTWARE ENGINEER'}
                    </h2>

                    <div className="space-y-2">
                        {data.personalInfo.showPhone && data.personalInfo.phone && (
                            <div className="flex items-center text-sm text-gray-700">
                                <Phone className="w-4 h-4 mr-2" />
                                {data.personalInfo.phone}
                            </div>
                        )}
                        {data.personalInfo.showEmail && data.personalInfo.email && (
                            <div className="flex items-center text-sm text-gray-700">
                                <Mail className="w-4 h-4 mr-2" />
                                {data.personalInfo.email}
                            </div>
                        )}
                        {data.personalInfo.showLocation && data.personalInfo.location && (
                            <div className="flex items-center text-sm text-gray-700">
                                <MapPin className="w-4 h-4 mr-2" />
                                {data.personalInfo.location}
                            </div>
                        )}
                        {data.personalInfo.showLinkedIn && data.personalInfo.linkedIn && (
                            <div className="flex items-center text-sm text-gray-700">
                                <Linkedin className="w-4 h-4 mr-2" />
                                {data.personalInfo.linkedIn}
                            </div>
                        )}
                        {data.personalInfo.showWebsite && data.personalInfo.website && (
                            <div className="flex items-center text-sm text-gray-700">
                                <Globe className="w-4 h-4 mr-2" />
                                {data.personalInfo.website}
                            </div>
                        )}
                    </div>
                </div>

                {data.personalInfo.showPhoto && data.personalInfo.photo && (
                    <div className="ml-6">
                        <Image
                            src={data.personalInfo.photo}
                            alt={data.personalInfo.name}
                            width={96}
                            height={96}
                            className="w-24 h-24 rounded-full object-cover"
                        />
                    </div>
                )}
            </div>

            <div className="flex">
                {/* Left Column */}
                <div className="w-2/3 px-8 py-6">
                    {/* Summary Section */}
                    {data.showSummary && data.summary && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide border-b-2 border-gray-300 pb-1">
                                Summary
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {data.summary}
                            </p>
                        </div>
                    )}

                    {/* Experience Section */}
                    {data.workExperience.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide border-b-2 border-gray-300 pb-1">
                                Experience
                            </h3>
                            <div className="space-y-4">
                                {data.workExperience.map((exp) => (
                                    <div key={exp.id}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="text-base font-bold text-gray-900">
                                                    {exp.position}
                                                </h4>
                                                <p className="text-sm font-medium text-blue-600">
                                                    {exp.company}
                                                </p>
                                                {exp.showLocation && exp.location && (
                                                    <p className="text-sm text-gray-600">
                                                        {exp.location}
                                                    </p>
                                                )}
                                            </div>
                                            {exp.showDateRange && (
                                                <div className="text-sm text-gray-600 text-right">
                                                    {formatDateRange(exp.dateRange)}
                                                </div>
                                            )}
                                        </div>
                                        {exp.showDescription && exp.description && (
                                            <p className="text-sm text-gray-700 mb-2">
                                                {exp.description}
                                            </p>
                                        )}
                                        {exp.showBullets && exp.bullets.length > 0 && (
                                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                                {exp.bullets.map((bullet, index) => (
                                                    <li key={index}>{bullet}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education Section */}
                    {data.education.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide border-b-2 border-gray-300 pb-1">
                                Education
                            </h3>
                            <div className="space-y-3">
                                {data.education.map((edu) => (
                                    <div key={edu.id}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-base font-bold text-gray-900">
                                                    {edu.degree}
                                                </h4>
                                                <p className="text-sm font-medium text-blue-600">
                                                    {edu.institution}
                                                </p>
                                                {edu.showLocation && edu.location && (
                                                    <p className="text-sm text-gray-600">
                                                        {edu.location}
                                                    </p>
                                                )}
                                                {edu.showGpa && edu.gpa && (
                                                    <p className="text-sm text-gray-600">
                                                        GPA: {edu.gpa}
                                                    </p>
                                                )}
                                            </div>
                                            {edu.showDateRange && (
                                                <div className="text-sm text-gray-600">
                                                    {formatDateRange(edu.dateRange)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="w-1/3 bg-gray-50 px-6 py-6">
                    {/* Skills Section */}
                    {data.skills.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">
                                Skills
                            </h3>
                            <div className="space-y-3">
                                {data.skills.map((skill, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-gray-900">
                                                {skill.name}
                                            </span>
                                        </div>
                                        {renderSkillLevel(skill.level)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Languages Section */}
                    {data.languages.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">
                                Languages
                            </h3>
                            <div className="space-y-3">
                                {data.languages.map((language, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-gray-900">
                                                {language.name}
                                            </span>
                                            <span className="text-xs text-gray-600">
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
                    {data.projects.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">
                                Projects
                            </h3>
                            <div className="space-y-4">
                                {data.projects.map((project) => (
                                    <div key={project.id}>
                                        <h4 className="text-sm font-bold text-gray-900">
                                            {project.title}
                                        </h4>
                                        {project.showDateRange && project.dateRange && (
                                            <p className="text-xs text-gray-600 mb-1">
                                                {formatDateRange(project.dateRange)}
                                            </p>
                                        )}
                                        {project.showDescription && project.description && (
                                            <p className="text-xs text-gray-700 mb-2">
                                                {project.description}
                                            </p>
                                        )}
                                        {project.showLink && project.link && (
                                            <a
                                                href={project.link}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {project.link}
                                            </a>
                                        )}
                                        {project.technologies.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {project.technologies.map((tech, techIndex) => (
                                                    <span
                                                        key={techIndex}
                                                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
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

                    {/* Activities Section */}
                    {data.activities.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">
                                Activities
                            </h3>
                            <div className="space-y-4">
                                {data.activities.map((activity) => (
                                    <div key={activity.id}>
                                        <h4 className="text-sm font-bold text-gray-900">
                                            {activity.title}
                                        </h4>
                                        {activity.showLocation && activity.location && (
                                            <p className="text-xs text-gray-600">
                                                {activity.location}
                                            </p>
                                        )}
                                        {activity.showDateRange && activity.dateRange && (
                                            <p className="text-xs text-gray-600 mb-1">
                                                {formatDateRange(activity.dateRange)}
                                            </p>
                                        )}
                                        {activity.showDescription && activity.description && (
                                            <p className="text-xs text-gray-700">
                                                {activity.description}
                                            </p>
                                        )}
                                        {activity.showLink && activity.link && (
                                            <a
                                                href={activity.link}
                                                className="text-xs text-blue-600 hover:text-blue-800"
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
