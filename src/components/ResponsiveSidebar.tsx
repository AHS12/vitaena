'use client';

import { useOfflineNavigation } from '@/components/OfflineNavigation';
import { useResponsive } from '@/hooks';
import { useUIStore } from '@/stores/ui-store';
import {
    Build,
    Close,
    Description,
    EmojiEvents,
    FitnessCenter,
    Folder,
    Home,
    Language,
    LocalActivity,
    Person,
    School,
    Work,
    WorkspacePremium,
} from '@mui/icons-material';
import {
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Typography,
} from '@mui/material';
import React, { useEffect } from 'react';

const homeSection = { id: 'home', label: 'Back to Home', icon: Home };

const resumeSections = [
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
];

interface ResponsiveSidebarProps {
    isPreviewMode?: boolean;
}

export const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({ isPreviewMode = false }) => {
    const { sidebarOpen, activeSection, setActiveSection, toggleSidebar, initializeSidebarState } = useUIStore();
    const { isDesktop } = useResponsive();
    const { navigate } = useOfflineNavigation();

    // Initialize sidebar state based on screen size
    useEffect(() => {
        initializeSidebarState(isDesktop);
    }, [isDesktop, initializeSidebarState]);

    const handleSectionClick = (section: typeof resumeSections[0] | typeof homeSection) => {
        if (section.id === 'home') {
            navigate('/');
        } else {
            setActiveSection(section.id);
            // Close sidebar on mobile/tablet after selection
            if (!isDesktop && sidebarOpen) {
                toggleSidebar();
            }
        }
    };

    const renderSectionList = (sections: typeof resumeSections, title?: string) => (
        <Box sx={{ mb: title ? 3 : 0 }}>
            {title && (
                <Typography
                    variant="overline"
                    sx={{
                        px: 2,
                        py: 1,
                        fontWeight: 600,
                        color: 'text.secondary',
                        display: 'block'
                    }}
                >
                    {title}
                </Typography>
            )}
            <List sx={{ p: 0 }}>
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = section.id !== 'home' && activeSection === section.id;

                    return (
                        <ListItem key={section.id} disablePadding sx={{ mb: 0.5, px: 2 }}>
                            <ListItemButton
                                onClick={() => handleSectionClick(section)}
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
    );

    const renderSidebarContent = () => (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with close button for mobile/tablet */}
            {!isDesktop && (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Navigation
                    </Typography>
                    <IconButton onClick={toggleSidebar} size="small">
                        <Close />
                    </IconButton>
                </Box>
            )}

            {/* Desktop header */}
            {isDesktop && (
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Resume Sections
                    </Typography>
                </Box>
            )}

            {/* Navigation content */}
            <Box sx={{ flex: 1, py: 1, overflow: 'auto' }}>
                {/* Mobile/Tablet: Show Home section first */}
                {!isDesktop && (
                    <>
                        {renderSectionList([homeSection])}
                        <Divider sx={{ my: 2, mx: 2 }} />
                        {renderSectionList(resumeSections, 'Resume Sections')}
                    </>
                )}

                {/* Desktop: Show only resume sections */}
                {isDesktop && renderSectionList(resumeSections)}
            </Box>
        </Box>
    );

    // Don't render sidebar in preview mode
    if (isPreviewMode) {
        return null;
    }

    return (
        <>
            {/* Desktop: Persistent drawer */}
            {isDesktop && (
                <Drawer
                    variant="persistent"
                    open={sidebarOpen}
                    sx={{
                        width: sidebarOpen ? 320 : 0,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: 320,
                            boxSizing: 'border-box',
                            position: 'relative',
                            borderRadius: 0,
                            borderRight: '1px solid',
                            borderColor: 'divider',
                        },
                    }}
                >
                    <Paper sx={{ height: '100%', borderRadius: 0 }}>
                        {renderSidebarContent()}
                    </Paper>
                </Drawer>
            )}

            {/* Mobile/Tablet: Temporary drawer with overlay */}
            {!isDesktop && (
                <Drawer
                    variant="temporary"
                    anchor="left"
                    open={sidebarOpen}
                    onClose={toggleSidebar}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile
                    }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: 320,
                            boxSizing: 'border-box',
                        },
                    }}
                >
                    <Paper sx={{ height: '100%', borderRadius: 0 }}>
                        {renderSidebarContent()}
                    </Paper>
                </Drawer>
            )}
        </>
    );
};
