import { Delete, ExpandLess, ExpandMore, Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, Button, Card, Collapse, IconButton, Typography } from '@mui/material';
import React from 'react';

interface MobileItemCardProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    isExpanded: boolean;
    isVisible: boolean;
    onToggleExpanded: () => void;
    onToggleVisibility: () => void;
    onDelete: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}

export const MobileItemCard: React.FC<MobileItemCardProps> = ({
    title,
    subtitle,
    icon,
    isExpanded,
    isVisible,
    onToggleExpanded,
    onToggleVisibility,
    onDelete,
    disabled = false,
    children
}) => {
    return (
        <Card variant="outlined" sx={{ opacity: isVisible ? 1 : 0.5 }}>
            {/* Header */}
            <Box sx={{
                p: { xs: 1.5, sm: 2 },
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: { xs: 1.5, sm: 2 }
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {icon}
                    <Box>
                        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    justifyContent: { xs: 'space-between', sm: 'flex-end' }
                }}>
                    <Button
                        size="small"
                        onClick={onToggleExpanded}
                        endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                        disabled={disabled}
                    >
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </Button>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                            size="small"
                            onClick={onToggleVisibility}
                            color={isVisible ? 'primary' : 'default'}
                            title={isVisible ? 'Hide item' : 'Show item'}
                            disabled={disabled}
                        >
                            {isVisible ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                        <IconButton
                            size="small"
                            color="error"
                            onClick={onDelete}
                            disabled={disabled}
                        >
                            <Delete />
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            {/* Expanded Content */}
            <Collapse in={isExpanded}>
                <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 }, borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ pt: 3 }}>
                        {children}
                    </Box>
                </Box>
            </Collapse>
        </Card>
    );
};
