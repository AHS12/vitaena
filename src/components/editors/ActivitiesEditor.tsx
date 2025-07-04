import { SortableItem } from '@/components/ui/SortableItem';
import { SortableWrapper } from '@/components/ui/SortableWrapper';
import { generateId } from '@/lib/utils';
import { useResumeStore } from '@/stores/resume-store';
import { Activity, DateRange } from '@/types/resume';
import { Add, Delete, Event, ExpandLess, ExpandMore, Link, LocationOn, Visibility, VisibilityOff } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    Collapse,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';

export const ActivitiesEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    if (!currentResume) return null;

    const addActivity = () => {
        const newActivity: Activity = {
            id: generateId(),
            title: '',
            description: '',
            location: '',
            dateRange: {
                startYear: new Date().getFullYear(),
                endYear: new Date().getFullYear(),
                isOngoing: false,
            },
            link: '',
            showLocation: true,
            showDateRange: true,
            showDescription: true,
            showLink: false,
        };

        const updatedActivities = [...currentResume.activities, newActivity];
        updateResumeField('activities', updatedActivities);
        setExpandedItems([...expandedItems, newActivity.id]);
    };

    const updateActivity = (id: string, field: keyof Activity, value: unknown) => {
        const updatedActivities = currentResume.activities.map(activity =>
            activity.id === id ? { ...activity, [field]: value } : activity
        );
        updateResumeField('activities', updatedActivities);
    };

    const reorderActivities = (reorderedItems: Activity[]) => {
        updateResumeField('activities', reorderedItems);
    };

    const deleteActivity = (id: string) => {
        const updatedActivities = currentResume.activities.filter(activity => activity.id !== id);
        updateResumeField('activities', updatedActivities);
        setExpandedItems(expandedItems.filter(itemId => itemId !== id));
    };

    const toggleExpanded = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const updateDateRange = (activityId: string, field: keyof DateRange, value: unknown) => {
        const activity = currentResume.activities.find(a => a.id === activityId);
        if (activity) {
            const updatedDateRange = { ...activity.dateRange, [field]: value };
            updateActivity(activityId, 'dateRange', updatedDateRange);
        }
    };

    const handleToggleShow = () => {
        updateResumeField('showActivities', !currentResume.showActivities);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Card>
                <CardHeader
                    title="Activities"
                    subheader="Add extracurricular activities, volunteer work, and achievements. Drag to reorder."
                    action={
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentResume.showActivities}
                                    onChange={handleToggleShow}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton size="small" color={currentResume.showActivities ? 'primary' : 'default'}>
                                        {currentResume.showActivities ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                    <Typography variant="body2">
                                        Show Activities
                                    </Typography>
                                </Box>
                            }
                        />
                    }
                />
                <CardContent>
                    {/* Activity Items */}
                    <SortableWrapper
                        items={currentResume.activities}
                        onReorder={reorderActivities}
                        idPrefix="activity"
                    >
                        <Stack spacing={2}>
                            {currentResume.activities.map((activity, index) => {
                                const isExpanded = expandedItems.includes(activity.id);

                                return (
                                    <SortableItem key={activity.id} id={`activity-${index}`}>
                                        <Card variant="outlined">
                                            {/* Header */}
                                            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Event color="action" />
                                                    <Box>
                                                        <Typography variant="h6">
                                                            {activity.title || `Activity ${index + 1}`}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {activity.location && activity.description
                                                                ? `${activity.location} • ${activity.description.substring(0, 50)}${activity.description.length > 50 ? '...' : ''}`
                                                                : activity.location || activity.description?.substring(0, 50) || 'No details'
                                                            }
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        onClick={() => toggleExpanded(activity.id)}
                                                        endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                                                    >
                                                        {isExpanded ? 'Collapse' : 'Expand'}
                                                    </Button>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => deleteActivity(activity.id)}
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
                                                            label="Activity Title"
                                                            value={activity.title}
                                                            onChange={(e) => updateActivity(activity.id, 'title', e.target.value)}
                                                            placeholder="e.g., Volunteer at Local Food Bank"
                                                            required
                                                        />

                                                        {/* Location */}
                                                        <Box>
                                                            <TextField
                                                                fullWidth
                                                                label="Location"
                                                                value={activity.location}
                                                                onChange={(e) => updateActivity(activity.id, 'location', e.target.value)}
                                                                placeholder="City, State/Country or Organization"
                                                                InputProps={{
                                                                    startAdornment: (
                                                                        <InputAdornment position="start">
                                                                            <LocationOn />
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                            />
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={activity.showLocation}
                                                                        onChange={(e) => updateActivity(activity.id, 'showLocation', e.target.checked)}
                                                                    />
                                                                }
                                                                label="Show location"
                                                            />
                                                        </Box>

                                                        {/* Description */}
                                                        <Box>
                                                            <TextField
                                                                fullWidth
                                                                label="Description"
                                                                value={activity.description}
                                                                onChange={(e) => updateActivity(activity.id, 'description', e.target.value)}
                                                                placeholder="Describe your role and achievements in this activity"
                                                                multiline
                                                                rows={3}
                                                            />
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={activity.showDescription}
                                                                        onChange={(e) => updateActivity(activity.id, 'showDescription', e.target.checked)}
                                                                    />
                                                                }
                                                                label="Show description"
                                                            />
                                                        </Box>

                                                        {/* Link */}
                                                        <Box>
                                                            <TextField
                                                                fullWidth
                                                                label="Related Link"
                                                                value={activity.link}
                                                                onChange={(e) => updateActivity(activity.id, 'link', e.target.value)}
                                                                placeholder="https://organization.com or certificate link"
                                                                InputProps={{
                                                                    startAdornment: (
                                                                        <InputAdornment position="start">
                                                                            <Link />
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                            />
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={activity.showLink}
                                                                        onChange={(e) => updateActivity(activity.id, 'showLink', e.target.checked)}
                                                                    />
                                                                }
                                                                label="Show link"
                                                            />
                                                        </Box>

                                                        {/* Date Range */}
                                                        <Box>
                                                            <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                                Activity Period
                                                            </Typography>
                                                            <Stack direction="row" spacing={2}>
                                                                <TextField
                                                                    type="number"
                                                                    label="Start Year"
                                                                    value={activity.dateRange?.startYear || ''}
                                                                    onChange={(e) => updateDateRange(activity.id, 'startYear', parseInt(e.target.value))}
                                                                    inputProps={{ min: 1950, max: 2030 }}
                                                                />
                                                                <TextField
                                                                    type="number"
                                                                    label="End Year"
                                                                    value={activity.dateRange?.endYear || ''}
                                                                    onChange={(e) => updateDateRange(activity.id, 'endYear', parseInt(e.target.value))}
                                                                    inputProps={{ min: 1950, max: 2030 }}
                                                                    disabled={activity.dateRange?.isOngoing}
                                                                />
                                                            </Stack>
                                                            <Stack sx={{ mt: 1 }}>
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            checked={activity.dateRange?.isOngoing || false}
                                                                            onChange={(e) => updateDateRange(activity.id, 'isOngoing', e.target.checked)}
                                                                        />
                                                                    }
                                                                    label="Currently participating"
                                                                />
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            checked={activity.showDateRange}
                                                                            onChange={(e) => updateActivity(activity.id, 'showDateRange', e.target.checked)}
                                                                        />
                                                                    }
                                                                    label="Show dates"
                                                                />
                                                            </Stack>
                                                        </Box>
                                                    </Stack>
                                                </Box>
                                            </Collapse>
                                        </Card>
                                    </SortableItem>
                                );
                            })}
                        </Stack>
                    </SortableWrapper>

                    {/* Add New Activity Button */}
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
                        onClick={addActivity}
                    >
                        <Add sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                            Add Activity
                        </Typography>
                    </Paper>
                </CardContent>
            </Card>
        </Box>
    );
};
