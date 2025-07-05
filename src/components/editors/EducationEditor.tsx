import { SortableItem } from '@/components/ui/SortableItem';
import { SortableWrapper } from '@/components/ui/SortableWrapper';
import { useIsTouchDevice } from '@/hooks';
import { generateId } from '@/lib/utils';
import { useResumeStore } from '@/stores/resume-store';
import { DateRange, Education } from '@/types/resume';
import { Add, Delete, ExpandLess, ExpandMore, LocationOn, School, Visibility, VisibilityOff } from '@mui/icons-material';
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

export const EducationEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const isTouchDevice = useIsTouchDevice();

    if (!currentResume) return null;

    const addEducation = () => {
        const newEducation: Education = {
            id: generateId(),
            institution: '',
            degree: '',
            location: '',
            dateRange: {
                startYear: new Date().getFullYear(),
                endYear: new Date().getFullYear(),
                isOngoing: false,
            },
            gpa: '',
            showGpa: false,
            showLocation: true,
            showDateRange: true,
            show: true,
        };

        const updatedEducation = [...currentResume.education, newEducation];
        updateResumeField('education', updatedEducation);
        setExpandedItems([...expandedItems, newEducation.id]);
    };

    const updateEducation = (id: string, field: keyof Education, value: unknown) => {
        const updatedEducation = currentResume.education.map(edu =>
            edu.id === id ? { ...edu, [field]: value } : edu
        );
        updateResumeField('education', updatedEducation);
    };

    const reorderEducation = (reorderedItems: Education[]) => {
        updateResumeField('education', reorderedItems);
    };

    const deleteEducation = (id: string) => {
        const updatedEducation = currentResume.education.filter(edu => edu.id !== id);
        updateResumeField('education', updatedEducation);
        setExpandedItems(expandedItems.filter(itemId => itemId !== id));
    };

    const toggleExpanded = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const updateDateRange = (educationId: string, field: keyof DateRange, value: unknown) => {
        const education = currentResume.education.find(edu => edu.id === educationId);
        if (education) {
            const updatedDateRange = { ...education.dateRange, [field]: value };
            updateEducation(educationId, 'dateRange', updatedDateRange);
        }
    };

    const handleToggleShow = () => {
        updateResumeField('showEducation', !currentResume.showEducation);
    };

    const toggleEducationVisibility = (educationId: string) => {
        const updatedEducation = currentResume.education.map(edu =>
            edu.id === educationId ? { ...edu, show: !edu.show } : edu
        );
        updateResumeField('education', updatedEducation);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Card>
                <CardHeader
                    title="Education"
                    action={
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentResume.showEducation}
                                    onChange={handleToggleShow}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton size="small" color={currentResume.showEducation ? 'primary' : 'default'}>
                                        {currentResume.showEducation ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                    <Typography variant="body2">
                                        Show Education
                                    </Typography>
                                </Box>
                            }
                        />
                    }
                />
                <Box sx={{ px: 2, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Add your educational background, including degrees, certifications, and relevant coursework. Drag to reorder.
                    </Typography>
                </Box>
                <CardContent>
                    {/* Touch Device Information */}
                    {isTouchDevice && currentResume.education.length > 1 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                💡 Tip: On mobile devices, touch and hold an item to drag and reorder
                            </Typography>
                        </Box>
                    )}

                    {/* Education Items */}
                    <SortableWrapper
                        items={currentResume.education}
                        onReorder={reorderEducation}
                        idPrefix="education"
                    >
                        <Stack spacing={2}>
                            {currentResume.education.map((education, index) => {
                                const isExpanded = expandedItems.includes(education.id);

                                return (
                                    <SortableItem key={education.id} id={`education-${index}`}>
                                        <Card variant="outlined" sx={{ opacity: education.show ? 1 : 0.5 }}>
                                            {/* Header */}
                                            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <School color="action" />
                                                    <Box>
                                                        <Typography variant="h6">
                                                            {education.degree || `Education ${index + 1}`}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {education.institution && education.location
                                                                ? `${education.institution} • ${education.location}`
                                                                : education.institution || education.location || 'Institution not specified'
                                                            }
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        onClick={() => toggleExpanded(education.id)}
                                                        endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                                                    >
                                                        {isExpanded ? 'Collapse' : 'Expand'}
                                                    </Button>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => toggleEducationVisibility(education.id)}
                                                        color={education.show ? 'primary' : 'default'}
                                                        title={education.show ? 'Hide education' : 'Show education'}
                                                    >
                                                        {education.show ? <Visibility /> : <VisibilityOff />}
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => deleteEducation(education.id)}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Box>
                                            </Box>

                                            {/* Expanded Content */}
                                            <Collapse in={isExpanded}>
                                                <Box sx={{ px: 2, pb: 2, borderTop: 1, borderColor: 'divider' }}>
                                                    <Stack spacing={3} sx={{ pt: 3 }}>
                                                        {/* Degree */}
                                                        <TextField
                                                            fullWidth
                                                            label="Degree/Program"
                                                            value={education.degree}
                                                            onChange={(e) => updateEducation(education.id, 'degree', e.target.value)}
                                                            placeholder="e.g., B.Sc. in Computer Science, MBA, High School Diploma"
                                                            required
                                                        />

                                                        {/* Institution */}
                                                        <TextField
                                                            fullWidth
                                                            label="Institution"
                                                            value={education.institution}
                                                            onChange={(e) => updateEducation(education.id, 'institution', e.target.value)}
                                                            placeholder="University or school name"
                                                            required
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <School />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />

                                                        {/* Location */}
                                                        <Box>
                                                            <TextField
                                                                fullWidth
                                                                label="Location"
                                                                value={education.location}
                                                                onChange={(e) => updateEducation(education.id, 'location', e.target.value)}
                                                                placeholder="City, State/Country"
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
                                                                        checked={education.showLocation}
                                                                        onChange={(e) => updateEducation(education.id, 'showLocation', e.target.checked)}
                                                                    />
                                                                }
                                                                label="Show location"
                                                            />
                                                        </Box>

                                                        {/* Date Range */}
                                                        <Box>
                                                            <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                                Study Period
                                                            </Typography>
                                                            <Stack direction="row" spacing={2}>
                                                                <TextField
                                                                    type="number"
                                                                    label="Start Year"
                                                                    value={education.dateRange.startYear}
                                                                    onChange={(e) => updateDateRange(education.id, 'startYear', parseInt(e.target.value))}
                                                                    inputProps={{ min: 1950, max: 2030 }}
                                                                />
                                                                <TextField
                                                                    type="number"
                                                                    label="End Year"
                                                                    value={education.dateRange.endYear || ''}
                                                                    onChange={(e) => updateDateRange(education.id, 'endYear', parseInt(e.target.value))}
                                                                    inputProps={{ min: 1950, max: 2030 }}
                                                                    disabled={education.dateRange.isOngoing}
                                                                />
                                                            </Stack>
                                                            <Stack sx={{ mt: 1 }}>
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            checked={education.dateRange.isOngoing}
                                                                            onChange={(e) => updateDateRange(education.id, 'isOngoing', e.target.checked)}
                                                                        />
                                                                    }
                                                                    label="Currently studying here"
                                                                />
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            checked={education.showDateRange}
                                                                            onChange={(e) => updateEducation(education.id, 'showDateRange', e.target.checked)}
                                                                        />
                                                                    }
                                                                    label="Show dates"
                                                                />
                                                            </Stack>
                                                        </Box>

                                                        {/* GPA */}
                                                        <Box>
                                                            <TextField
                                                                fullWidth
                                                                label="GPA/Grade"
                                                                value={education.gpa}
                                                                onChange={(e) => updateEducation(education.id, 'gpa', e.target.value)}
                                                                placeholder="e.g., 3.8/4.0, First Class, 85%"
                                                            />
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={education.showGpa}
                                                                        onChange={(e) => updateEducation(education.id, 'showGpa', e.target.checked)}
                                                                    />
                                                                }
                                                                label="Show GPA/Grade"
                                                            />
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

                    {/* Add New Education Button */}
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
                        onClick={addEducation}
                    >
                        <Add sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                            Add Education
                        </Typography>
                    </Paper>
                </CardContent>
            </Card>
        </Box>
    );
};
