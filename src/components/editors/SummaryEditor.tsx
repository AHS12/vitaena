import { useResumeStore } from '@/stores/resume-store';
import { Description } from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    FormControlLabel,
    Paper,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import React from 'react';

export const SummaryEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();

    if (!currentResume) return null;

    const handleSummaryChange = (value: string) => {
        updateResumeField('summary', value);
    };

    const handleShowSummaryChange = (show: boolean) => {
        updateResumeField('showSummary', show);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Card>
                <CardHeader
                    title="Professional Summary"
                />
                <Box sx={{ px: 2, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Write a brief overview of your professional background, key skills, and career objectives.
                    </Typography>
                </Box>
                <CardContent sx={{ space: 3 }}>
                    {/* Show Summary Toggle */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={currentResume.showSummary}
                                onChange={(e) => handleShowSummaryChange(e.target.checked)}
                            />
                        }
                        label="Include summary section"
                        sx={{ mb: 3 }}
                    />

                    {/* Summary Text Area */}
                    <TextField
                        fullWidth
                        label="Summary"
                        multiline
                        rows={6}
                        value={currentResume.summary}
                        onChange={(e) => handleSummaryChange(e.target.value)}
                        placeholder="Write a compelling professional summary that highlights your experience, skills, and career goals. Keep it concise and impactful..."
                        disabled={!currentResume.showSummary}
                        InputProps={{
                            startAdornment: <Description sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                        sx={{ mb: 2 }}
                    />

                    <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
                        {currentResume.summary.length} characters
                    </Typography>

                    {/* Tips */}
                    <Paper
                        sx={{
                            p: 3,
                            backgroundColor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            💡 Writing Tips
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="div">
                            <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                <li>Keep it between 2-4 sentences or 50-150 words</li>
                                <li>Highlight your most relevant experience and achievements</li>
                                <li>Use action words and quantify your impact when possible</li>
                                <li>Tailor it to the specific role or industry you&apos;re targeting</li>
                                <li>Avoid clichés and generic statements</li>
                            </Box>
                        </Typography>
                    </Paper>
                </CardContent>
            </Card>
        </Box>
    );
};
