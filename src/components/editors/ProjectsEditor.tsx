import { useResumeStore } from '@/stores/resume-store';
import { Add } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
} from '@mui/material';
import React from 'react';

export const ProjectsEditor: React.FC = () => {
    const { currentResume } = useResumeStore();

    if (!currentResume) return null;

    return (
        <Box sx={{ p: 3 }}>
            <Card>
                <CardHeader
                    title="Projects"
                    subheader="Showcase your personal or professional projects."
                />
                <CardContent>
                    <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        startIcon={<Add />}
                        sx={{
                            py: 3,
                            borderStyle: 'dashed',
                            borderWidth: 2,
                            color: 'text.secondary',
                            borderColor: 'divider',
                            '&:hover': {
                                borderColor: 'primary.main',
                                color: 'primary.main',
                            },
                        }}
                    >
                        Add Project
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
};
