import { useResumeStore } from '@/stores/resume-store';
import { People, Visibility, VisibilityOff } from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    FormControlLabel,
    IconButton,
    Paper,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import React from 'react';

export const ReferencesEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();

    if (!currentResume) return null;

    const handleReferencesChange = (value: string) => {
        updateResumeField('references', value);
    };

    const handleShowReferencesChange = (show: boolean) => {
        updateResumeField('showReferences', show);
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Card>
                <CardHeader
                    title="References"
                    action={
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentResume.showReferences}
                                    onChange={(e) => handleShowReferencesChange(e.target.checked)}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton size="small" color={currentResume.showReferences ? 'primary' : 'default'}>
                                        {currentResume.showReferences ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        Show References
                                    </Typography>
                                </Box>
                            }
                        />
                    }
                    sx={{ pb: { xs: 1, sm: 2 } }}
                />
                <Box sx={{ px: { xs: 2, sm: 2 }, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        List your professional references or state &quot;References available upon request&quot;.
                    </Typography>
                </Box>
                <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
                    {/* References Text Area */}
                    <TextField
                        fullWidth
                        label="References"
                        multiline
                        rows={6}
                        value={currentResume.references || ''}
                        onChange={(e) => handleReferencesChange(e.target.value)}
                        placeholder="John Doe, Manager at Company X, john@example.com..."
                        disabled={!currentResume.showReferences}
                        size="small"
                        InputProps={{
                            startAdornment: <People sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                        sx={{ mb: 2 }}
                    />

                    <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
                        {(currentResume.references || '').length} characters
                    </Typography>

                    {/* Tips */}
                    <Paper
                        sx={{
                            p: { xs: 2, sm: 3 },
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
                                <li>Include name, title, company, and contact info</li>
                                <li>Make sure you have permission from your references</li>
                                <li>You can also just write &quot;Available upon request&quot; if saving space</li>
                            </Box>
                        </Typography>
                    </Paper>
                </CardContent>
            </Card>
        </Box>
    );
};
