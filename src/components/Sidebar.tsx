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
import { SECTION_NAMES, SectionId } from '@/lib/template-configs';

const sectionIcons: Record<SectionId, React.ElementType> = {
    personal: Person,
    summary: Description,
    experience: Work,
    education: School,
    certifications: WorkspacePremium,
    skills: Build,
    strengths: FitnessCenter,
    languages: Language,
    projects: Folder,
    interests: EmojiEvents,
    activities: LocalActivity,
    // Add new section icons here as they are introduced
    "publications": Description, // Placeholder icon
    "awards": EmojiEvents, // Placeholder icon
    "family-details": Person, // Placeholder icon
    "physical-attributes": FitnessCenter, // Placeholder icon
    "hobbies": EmojiEvents, // Placeholder icon
};

export const Sidebar: React.FC = () => {
    const { activeSection, setActiveSection, visibleSections } = useUIStore();

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
                    {visibleSections.map((sectionId) => {
                        const Icon = sectionIcons[sectionId];
                        const isActive = activeSection === sectionId;

                        return (
                            <ListItem key={sectionId} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton
                                    onClick={() => setActiveSection(sectionId)}
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
                                        primary={SECTION_NAMES[sectionId]}
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
