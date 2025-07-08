import { useResponsive } from '@/hooks';
import { useUIStore } from '@/stores/ui-store';
import { Box } from '@mui/material';
import React from 'react';
import { ActivitiesEditor } from './editors/ActivitiesEditor';
import { CertificationsEditor } from './editors/CertificationsEditor';
import { EducationEditor } from './editors/EducationEditor';
import { ExperienceEditor } from './editors/ExperienceEditor';
import { InterestsEditor } from './editors/InterestsEditor';
import { LanguagesEditor } from './editors/LanguagesEditor';
import { PersonalInfoEditor } from './editors/PersonalInfoEditor';
import { ProjectsEditor } from './editors/ProjectsEditor';
import { SkillsEditor } from './editors/SkillsEditor';
import { StrengthsEditor } from './editors/StrengthsEditor';
import { SummaryEditor } from './editors/SummaryEditor';
import { TemplateSwitcher } from './TemplateSwitcher';

export const ResumeEditor: React.FC = () => {
    const { activeSection } = useUIStore();
    const { deviceType } = useResponsive();

    const renderEditor = () => {
        switch (activeSection) {
            case 'personal':
                return <PersonalInfoEditor />;
            case 'summary':
                return <SummaryEditor />;
            case 'experience':
                return <ExperienceEditor />;
            case 'education':
                return <EducationEditor />;
            case 'skills':
                return <SkillsEditor />;
            case 'strengths':
                return <StrengthsEditor />;
            case 'languages':
                return <LanguagesEditor />;
            case 'certifications':
                return <CertificationsEditor />;
            case 'projects':
                return <ProjectsEditor />;
            case 'interests':
                return <InterestsEditor />;
            case 'activities':
                return <ActivitiesEditor />;
            default:
                return <PersonalInfoEditor />;
        }
    };

    return (
        <Box
            sx={{
                height: '100%',
                overflow: 'auto',
                backgroundColor: 'background.default',
                p: 2,
            }}
        >
            {deviceType === 'mobile' && <TemplateSwitcher size="medium" />}
            {renderEditor()}
        </Box>
    );
};
