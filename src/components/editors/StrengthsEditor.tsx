import { SortableItem } from '@/components/ui/SortableItem';
import { SortableWrapper } from '@/components/ui/SortableWrapper';
import { generateId } from '@/lib/utils';
import { useResumeStore } from '@/stores/resume-store';
import { StrengthItem } from '@/types/resume';
import { Add, Delete, ExpandLess, ExpandMore, FitnessCenter, Visibility, VisibilityOff } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Collapse,
    FormControlLabel,
    IconButton,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';

export const StrengthsEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    if (!currentResume) return null;

    const addStrength = () => {
        const newStrength: StrengthItem = {
            id: generateId(),
            title: '',
            description: '',
            show: true,
        };

        const updatedStrengths = [...currentResume.strengths, newStrength];
        updateResumeField('strengths', updatedStrengths);
        setExpandedItems([...expandedItems, newStrength.id]);
    };

    const updateStrength = (id: string, field: keyof StrengthItem, value: string | boolean) => {
        const updatedStrengths = currentResume.strengths.map(strength =>
            strength.id === id ? { ...strength, [field]: value } : strength
        );
        updateResumeField('strengths', updatedStrengths);
    };

    const toggleStrengthShow = (id: string) => {
        const updatedStrengths = currentResume.strengths.map(strength =>
            strength.id === id ? { ...strength, show: !strength.show } : strength
        );
        updateResumeField('strengths', updatedStrengths);
    };

    const deleteStrength = (id: string) => {
        const updatedStrengths = currentResume.strengths.filter(strength => strength.id !== id);
        updateResumeField('strengths', updatedStrengths);
        setExpandedItems(expandedItems.filter(itemId => itemId !== id));
    };

    const toggleExpanded = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const handleToggleShow = () => {
        updateResumeField('showStrengths', !currentResume.showStrengths);
    };

    const reorderStrengths = (reorderedStrengths: StrengthItem[]) => {
        updateResumeField('strengths', reorderedStrengths);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Card>
                <CardHeader
                    title="Professional Strengths"
                    action={
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentResume.showStrengths}
                                    onChange={handleToggleShow}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton size="small" color={currentResume.showStrengths ? 'primary' : 'default'}>
                                        {currentResume.showStrengths ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                    <Typography variant="body2">
                                        Show Strengths
                                    </Typography>
                                </Box>
                            }
                        />
                    }
                />
                <Box sx={{ px: 2, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Highlight your key professional strengths and qualities that make you stand out. Drag to reorder.
                    </Typography>
                </Box>
                <CardContent>
                    {/* Strength Items */}
                    <SortableWrapper
                        items={currentResume.strengths}
                        onReorder={reorderStrengths}
                        idPrefix="strength"
                    >
                        <Stack spacing={2}>
                            {currentResume.strengths.map((strength, index) => {
                                const isExpanded = expandedItems.includes(strength.id);

                                return (
                                    <SortableItem key={strength.id} id={`strength-${index}`}>
                                        <Card variant="outlined" sx={{ opacity: strength.show ? 1 : 0.5 }}>
                                            {/* Header */}
                                            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <FitnessCenter color="action" />
                                                    <Box>
                                                        <Typography variant="h6">
                                                            {strength.title || `Strength ${index + 1}`}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {strength.description ?
                                                                strength.description.substring(0, 80) + (strength.description.length > 80 ? '...' : '')
                                                                : 'No description'
                                                            }
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => toggleStrengthShow(strength.id)}
                                                        color={strength.show ? 'primary' : 'default'}
                                                        title={strength.show ? 'Hide item' : 'Show item'}
                                                    >
                                                        {strength.show ? <Visibility /> : <VisibilityOff />}
                                                    </IconButton>
                                                    <Button
                                                        size="small"
                                                        onClick={() => toggleExpanded(strength.id)}
                                                        endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                                                    >
                                                        {isExpanded ? 'Collapse' : 'Expand'}
                                                    </Button>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => deleteStrength(strength.id)}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Box>
                                            </Box>

                                            {/* Expanded Content */}
                                            <Collapse in={isExpanded}>
                                                <Box sx={{ px: 2, pb: 2, borderTop: 1, borderColor: 'divider' }}>
                                                    <Stack spacing={3} sx={{ pt: 3 }}>
                                                        {/* Title */}
                                                        <TextField
                                                            fullWidth
                                                            label="Strength Title"
                                                            value={strength.title}
                                                            onChange={(e) => updateStrength(strength.id, 'title', e.target.value)}
                                                            placeholder="e.g., Professional Skills, Critical Thinking, Team Collaboration"
                                                            required
                                                        />

                                                        {/* Description */}
                                                        <TextField
                                                            fullWidth
                                                            multiline
                                                            rows={3}
                                                            label="Description"
                                                            value={strength.description}
                                                            onChange={(e) => updateStrength(strength.id, 'description', e.target.value)}
                                                            placeholder="Describe this strength in detail. For example: Critical thinking, team collaboration, communication, time management, and leadership skills."
                                                        />
                                                    </Stack>
                                                </Box>
                                            </Collapse>
                                        </Card>
                                    </SortableItem>
                                );
                            })}
                        </Stack>
                    </SortableWrapper>

                    {/* Add New Strength Button */}
                    <Paper
                        sx={{
                            mt: 3,
                            p: 3,
                            textAlign: 'center',
                            border: '2px dashed',
                            borderColor: 'divider',
                            backgroundColor: 'action.hover',
                            cursor: 'pointer',
                            '&:hover': {
                                borderColor: 'primary.main',
                                backgroundColor: 'action.selected',
                            },
                        }}
                        onClick={addStrength}
                    >
                        <Add sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                            Add Strength
                        </Typography>
                    </Paper>
                </CardContent>
            </Card>
        </Box>
    );
};
