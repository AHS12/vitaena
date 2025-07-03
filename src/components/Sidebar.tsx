import { useUIStore } from '@/stores/ui-store';
import {
    Build,
    Description,
    Folder,
    Language,
    LocalActivity,
    Person,
    School,
    Work,
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
    { id: 'skills', label: 'Skills', icon: Build },
    { id: 'languages', label: 'Languages', icon: Language },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'activities', label: 'Activities', icon: LocalActivity },
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
                                    selected={isActive}
                                    onClick={() => setActiveSection(section.id)}
                                    sx={{
                                        borderRadius: 2,
                                        '&.Mui-selected': {
                                            backgroundColor: 'primary.main',
                                            color: 'primary.contrastText',
                                            '&:hover': {
                                                backgroundColor: 'primary.dark',
                                            },
                                        },
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            color: isActive ? 'inherit' : 'text.secondary',
                                            minWidth: 40,
                                        }}
                                    >
                                        <Icon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={section.label}
                                        primaryTypographyProps={{
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
