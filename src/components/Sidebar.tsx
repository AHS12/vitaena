import { useUIStore } from '@/stores/ui-store';
import {
    Build,
    Description,
    EmojiEvents,
    FitnessCenter,
    Folder,
    Language,
    LocalActivity,
    Person,
    School,
    Work,
    WorkspacePremium,
} from '@mui/icons-material';
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Typography,
} from '@mui/material';
import React from 'react';

const sections = [
    { id: 'personal', label: 'Personal Info', icon: Person },
    { id: 'summary', label: 'Summary', icon: Description },
    { id: 'experience', label: 'Experience', icon: Work },
    { id: 'education', label: 'Education', icon: School },
    { id: 'certifications', label: 'Certifications', icon: WorkspacePremium },
    { id: 'skills', label: 'Skills', icon: Build },
    { id: 'strengths', label: 'Strengths', icon: FitnessCenter },
    { id: 'languages', label: 'Languages', icon: Language },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'interests', label: 'Interests', icon: EmojiEvents },
    { id: 'activities', label: 'Activities', icon: LocalActivity },
    { id: 'activities', label: 'Test menu(will be removed)', icon: LocalActivity },
];

export const Sidebar: React.FC = () => {
    const { activeSection, setActiveSection } = useUIStore();

    return (
        <Paper
            sx={{
                height: '100%',
                borderRadius: 0,
                borderRight: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Resume Sections
                </Typography>

                <List sx={{ p: 0 }}>
                    {sections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;

                        return (
                            <ListItem key={section.id} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton
                                    onClick={() => setActiveSection(section.id)}
                                    selected={isActive}
                                    sx={{
                                        borderRadius: 1,
                                        '&.Mui-selected': {
                                            backgroundColor: 'primary.main',
                                            color: 'primary.contrastText',
                                            '&:hover': {
                                                backgroundColor: 'primary.dark',
                                            },
                                            '& .MuiListItemIcon-root': {
                                                color: 'primary.contrastText',
                                            },
                                        },
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Icon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={section.label}
                                        primaryTypographyProps={{
                                            fontSize: '0.875rem',
                                            fontWeight: isActive ? 600 : 400,
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
        </Paper>
    );
};
