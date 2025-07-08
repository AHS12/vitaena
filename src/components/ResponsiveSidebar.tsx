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
import { SECTION_NAMES, SectionId } from '@/lib/template-configs';

const homeSection = { id: 'home', label: 'Back to Home', icon: Home };

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

interface ResponsiveSidebarProps {
    isPreviewMode?: boolean;
}

export const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({ isPreviewMode = false }) => {
    const { sidebarOpen, activeSection, setActiveSection, toggleSidebar, initializeSidebarState, visibleSections } = useUIStore();
    const { isDesktop } = useResponsive();
    const { navigate } = useOfflineNavigation();

    // Initialize sidebar state based on screen size
    useEffect(() => {
        initializeSidebarState(isDesktop);
    }, [isDesktop, initializeSidebarState]);

    const handleSectionClick = (sectionId: SectionId | 'home') => {
        if (sectionId === 'home') {
            navigate('/');
        } else {
            setActiveSection(sectionId);
            // Close sidebar on mobile/tablet after selection
            if (!isDesktop && sidebarOpen) {
                toggleSidebar();
            }
        }
    };

    const renderSectionList = (sectionsToRender: (SectionId | 'home')[], title?: string) => (
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
                {sectionsToRender && sectionsToRender.map((sectionId) => {
                    const Icon = sectionId === 'home' ? Home : sectionIcons[sectionId as SectionId];
                    const isActive = activeSection === sectionId;

                    return (
                        <ListItem key={sectionId} disablePadding sx={{ mb: 0.5, px: 2 }}>
                            <ListItemButton
                                onClick={() => handleSectionClick(sectionId)}
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
                                    primary={sectionId === 'home' ? homeSection.label : SECTION_NAMES[sectionId as SectionId]}
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
                        {renderSectionList(['home'])}
                        <Divider sx={{ my: 2, mx: 2 }} />
                        {renderSectionList(visibleSections, 'Resume Sections')}
                    </>
                )}

                {/* Desktop: Show only resume sections */}
                {isDesktop && renderSectionList(visibleSections)}
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
