import { SortableItem } from '@/components/ui/SortableItem';
import { SortableWrapper } from '@/components/ui/SortableWrapper';
import { generateId } from '@/lib/utils';
import { useResumeStore } from '@/stores/resume-store';
import { InterestItem } from '@/types/resume';
import { Add, Delete, EmojiEvents, ExpandLess, ExpandMore, Visibility, VisibilityOff } from '@mui/icons-material';
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

export const InterestsEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    if (!currentResume) return null;

    const addInterest = () => {
        const newInterest: InterestItem = {
            id: generateId(),
            title: '',
            description: '',
        };

        const updatedInterests = [...currentResume.interests, newInterest];
        updateResumeField('interests', updatedInterests);
        setExpandedItems([...expandedItems, newInterest.id]);
    };

    const updateInterest = (id: string, field: keyof InterestItem, value: string) => {
        const updatedInterests = currentResume.interests.map(interest =>
            interest.id === id ? { ...interest, [field]: value } : interest
        );
        updateResumeField('interests', updatedInterests);
    };

    const deleteInterest = (id: string) => {
        const updatedInterests = currentResume.interests.filter(interest => interest.id !== id);
        updateResumeField('interests', updatedInterests);
        setExpandedItems(expandedItems.filter(itemId => itemId !== id));
    };

    const toggleExpanded = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const handleToggleShow = () => {
        updateResumeField('showInterests', !currentResume.showInterests);
    };

    const reorderInterests = (reorderedInterests: InterestItem[]) => {
        updateResumeField('interests', reorderedInterests);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Card>
                <CardHeader
                    title="Interests & Hobbies"
                    subheader="Share your personal interests, hobbies, and activities that showcase your personality. Drag to reorder."
                    action={
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentResume.showInterests}
                                    onChange={handleToggleShow}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton size="small" color={currentResume.showInterests ? 'primary' : 'default'}>
                                        {currentResume.showInterests ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                    <Typography variant="body2">
                                        Show Interests
                                    </Typography>
                                </Box>
                            }
                        />
                    }
                />
                <CardContent>
                    {/* Interest Items */}
                    <SortableWrapper
                        items={currentResume.interests}
                        onReorder={reorderInterests}
                        idPrefix="interest"
                    >
                        <Stack spacing={2}>
                            {currentResume.interests.map((interest, index) => {
                                const isExpanded = expandedItems.includes(interest.id);

                                return (
                                    <SortableItem key={interest.id} id={`interest-${index}`}>
                                        <Card variant="outlined">
                                            {/* Header */}
                                            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <EmojiEvents color="action" />
                                                    <Box>
                                                        <Typography variant="h6">
                                                            {interest.title || `Interest ${index + 1}`}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {interest.description ?
                                                                interest.description.substring(0, 80) + (interest.description.length > 80 ? '...' : '')
                                                                : 'No description'
                                                            }
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        onClick={() => toggleExpanded(interest.id)}
                                                        endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                                                    >
                                                        {isExpanded ? 'Collapse' : 'Expand'}
                                                    </Button>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => deleteInterest(interest.id)}
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
                                                            label="Interest Title"
                                                            value={interest.title}
                                                            onChange={(e) => updateInterest(interest.id, 'title', e.target.value)}
                                                            placeholder="e.g., Game Development, Reading, Sports, Music"
                                                            required
                                                        />

                                                        {/* Description */}
                                                        <TextField
                                                            fullWidth
                                                            multiline
                                                            rows={3}
                                                            label="Description"
                                                            value={interest.description}
                                                            onChange={(e) => updateInterest(interest.id, 'description', e.target.value)}
                                                            placeholder="Describe this interest in detail. For example: Game Development with Godot, Ebitengine, and Go programming."
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

                    {/* Add New Interest Button */}
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
                        onClick={addInterest}
                    >
                        <Add sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                            Add Interest
                        </Typography>
                    </Paper>
                </CardContent>
            </Card>
        </Box>
    );
};
