import { useUIStore } from '@/stores/ui-store';
import { Box } from '@mui/material';
import React from 'react';
import { ActivitiesEditor } from './editors/ActivitiesEditor';
import { EducationEditor } from './editors/EducationEditor';
import { ExperienceEditor } from './editors/ExperienceEditor';
import { LanguagesEditor } from './editors/LanguagesEditor';
import { PersonalInfoEditor } from './editors/PersonalInfoEditor';
import { ProjectsEditor } from './editors/ProjectsEditor';
import { SkillsEditor } from './editors/SkillsEditor';
import { SummaryEditor } from './editors/SummaryEditor';

export const ResumeEditor: React.FC = () => {
    const { activeSection } = useUIStore();

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
            case 'languages':
                return <LanguagesEditor />;
            case 'projects':
                return <ProjectsEditor />;
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
            }}
        >
            {renderEditor()}
        </Box>
    );
};
