import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, Card, CardContent, CardHeader, FormControlLabel, IconButton, Switch, Typography } from '@mui/material';
import React from 'react';

interface EditorCardProps {
    title: string;
    description: string;
    showToggle: boolean;
    onToggleShow: () => void;
    toggleLabel: string;
    children: React.ReactNode;
}

export const EditorCard: React.FC<EditorCardProps> = ({
    title,
    description,
    showToggle,
    onToggleShow,
    toggleLabel,
    children
}) => {
    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Card>
                <CardHeader
                    title={title}
                    action={
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showToggle}
                                    onChange={onToggleShow}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton size="small" color={showToggle ? 'primary' : 'default'}>
                                        {showToggle ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        {toggleLabel}
                                    </Typography>
                                </Box>
                            }
                        />
                    }
                    sx={{ pb: { xs: 1, sm: 2 } }}
                />
                <Box sx={{ px: { xs: 2, sm: 2 }, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                </Box>
                <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
                    {children}
                </CardContent>
            </Card>
        </Box>
    );
};
