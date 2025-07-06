import { SortableItem } from '@/components/ui/SortableItem';
import { SortableWrapper } from '@/components/ui/SortableWrapper';
import { useIsTouchDevice } from '@/hooks';
import { generateId } from '@/lib/utils';
import { useResumeStore } from '@/stores/resume-store';
import { DateRange, WorkExperience } from '@/types/resume';
import { Add, Business, Delete, ExpandLess, ExpandMore, LocationOn, Visibility, VisibilityOff, Work } from '@mui/icons-material';
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

export const ExperienceEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const isTouchDevice = useIsTouchDevice();

    if (!currentResume) return null;

    const addExperience = () => {
        const newExperience: WorkExperience = {
            id: generateId(),
            company: '',
            position: '',
            location: '',
            dateRange: {
                startYear: new Date().getFullYear(),
                endYear: new Date().getFullYear(),
                isOngoing: false,
            },
            description: '',
            bullets: [],
            showBullets: true,
            showDescription: true,
            showLocation: true,
            showDateRange: true,
            show: true,
        };

        const updatedExperience = [...currentResume.workExperience, newExperience];
        updateResumeField('workExperience', updatedExperience);
        setExpandedItems([...expandedItems, newExperience.id]);
    };

    const updateExperience = (id: string, field: keyof WorkExperience, value: unknown) => {
        const updatedExperience = currentResume.workExperience.map(exp =>
            exp.id === id ? { ...exp, [field]: value } : exp
        );
        updateResumeField('workExperience', updatedExperience);
    };

    const reorderExperience = (reorderedItems: WorkExperience[]) => {
        updateResumeField('workExperience', reorderedItems);
    };

    const deleteExperience = (id: string) => {
        const updatedExperience = currentResume.workExperience.filter(exp => exp.id !== id);
        updateResumeField('workExperience', updatedExperience);
        setExpandedItems(expandedItems.filter(itemId => itemId !== id));
    };

    const toggleExpanded = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const addBullet = (experienceId: string) => {
        const experience = currentResume.workExperience.find(exp => exp.id === experienceId);
        if (experience) {
            const updatedBullets = [...experience.bullets, ''];
            updateExperience(experienceId, 'bullets', updatedBullets);
        }
    };

    const updateBullet = (experienceId: string, bulletIndex: number, value: string) => {
        const experience = currentResume.workExperience.find(exp => exp.id === experienceId);
        if (experience) {
            const updatedBullets = experience.bullets.map((bullet, index) =>
                index === bulletIndex ? value : bullet
            );
            updateExperience(experienceId, 'bullets', updatedBullets);
        }
    };

    const deleteBullet = (experienceId: string, bulletIndex: number) => {
        const experience = currentResume.workExperience.find(exp => exp.id === experienceId);
        if (experience) {
            const updatedBullets = experience.bullets.filter((_, index) => index !== bulletIndex);
            updateExperience(experienceId, 'bullets', updatedBullets);
        }
    };

    const updateDateRange = (experienceId: string, field: keyof DateRange, value: unknown) => {
        const experience = currentResume.workExperience.find(exp => exp.id === experienceId);
        if (experience) {
            const updatedDateRange = { ...experience.dateRange, [field]: value };
            updateExperience(experienceId, 'dateRange', updatedDateRange);
        }
    };

    const handleToggleShow = () => {
        updateResumeField('showWorkExperience', !currentResume.showWorkExperience);
    };

    const toggleExperienceVisibility = (experienceId: string) => {
        const updatedExperience = currentResume.workExperience.map(exp =>
            exp.id === experienceId ? { ...exp, show: !exp.show } : exp
        );
        updateResumeField('workExperience', updatedExperience);
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Card>
                <CardHeader
                    title="Work Experience"
                    action={
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentResume.showWorkExperience}
                                    onChange={handleToggleShow}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton size="small" color={currentResume.showWorkExperience ? 'primary' : 'default'}>
                                        {currentResume.showWorkExperience ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        Show Experience
                                    </Typography>
                                </Box>
                            }
                        />
                    }
                    sx={{ pb: { xs: 1, sm: 2 } }}
                />
                <Box sx={{ px: { xs: 2, sm: 2 }, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Add your professional work experience, including internships and freelance work. Drag to reorder.
                    </Typography>
                </Box>
                <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
                    {/* Touch Device Information */}
                    {isTouchDevice && currentResume.workExperience.length > 1 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                💡 Tip: On mobile devices, touch and hold an item to drag and reorder
                            </Typography>
                        </Box>
                    )}

                    {/* Experience Items */}
                    <SortableWrapper
                        items={currentResume.workExperience}
                        onReorder={reorderExperience}
                        idPrefix="experience"
                    >
                        <Stack spacing={2}>
                            {currentResume.workExperience.map((experience, index) => {
                                const isExpanded = expandedItems.includes(experience.id);

                                return (
                                    <SortableItem
                                        key={experience.id}
                                        id={`experience-${index}`}
                                        disabled={isExpanded}
                                    >
                                        <Card variant="outlined" sx={{ opacity: experience.show ? 1 : 0.5 }}>
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
                                                    <Work color="action" />
                                                    <Box>
                                                        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                                            {experience.position || `Experience ${index + 1}`}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {experience.company && experience.location
                                                                ? `${experience.company} • ${experience.location}`
                                                                : experience.company || experience.location || 'Company not specified'
                                                            }
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
                                                        onClick={() => toggleExpanded(experience.id)}
                                                        endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                                                    >
                                                        {isExpanded ? 'Collapse' : 'Expand'}
                                                    </Button>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => toggleExperienceVisibility(experience.id)}
                                                            color={experience.show ? 'primary' : 'default'}
                                                            title={experience.show ? 'Hide experience' : 'Show experience'}
                                                        >
                                                            {experience.show ? <Visibility /> : <VisibilityOff />}
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => deleteExperience(experience.id)}
                                                        >
                                                            <Delete />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            {/* Expanded Content */}
                                            <Collapse in={isExpanded}>
                                                <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 }, borderTop: 1, borderColor: 'divider' }}>
                                                    <Stack spacing={3} sx={{ pt: 3 }}>
                                                        {/* Position */}
                                                        <TextField
                                                            fullWidth
                                                            label="Position/Job Title"
                                                            value={experience.position}
                                                            onChange={(e) => updateExperience(experience.id, 'position', e.target.value)}
                                                            placeholder="e.g., Software Engineer, Product Manager"
                                                            required
                                                            size="small"
                                                        />

                                                        {/* Company */}
                                                        <TextField
                                                            fullWidth
                                                            label="Company"
                                                            value={experience.company}
                                                            onChange={(e) => updateExperience(experience.id, 'company', e.target.value)}
                                                            placeholder="Company name"
                                                            required
                                                            size="small"
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <Business />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />

                                                        {/* Location */}
                                                        <Box>
                                                            <TextField
                                                                fullWidth
                                                                label="Location"
                                                                value={experience.location}
                                                                onChange={(e) => updateExperience(experience.id, 'location', e.target.value)}
                                                                placeholder="City, State/Country"
                                                                size="small"
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
                                                                        checked={experience.showLocation}
                                                                        onChange={(e) => updateExperience(experience.id, 'showLocation', e.target.checked)}
                                                                    />
                                                                }
                                                                label="Show location"
                                                            />
                                                        </Box>

                                                        {/* Date Range */}
                                                        <Box>
                                                            <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                                Employment Period
                                                            </Typography>
                                                            <Stack direction="row" spacing={2}>
                                                                <TextField
                                                                    type="number"
                                                                    label="Start Year"
                                                                    value={experience.dateRange.startYear}
                                                                    onChange={(e) => updateDateRange(experience.id, 'startYear', parseInt(e.target.value))}
                                                                    inputProps={{ min: 1950, max: 2030 }}
                                                                />
                                                                <TextField
                                                                    type="number"
                                                                    label="End Year"
                                                                    value={experience.dateRange.endYear || ''}
                                                                    onChange={(e) => updateDateRange(experience.id, 'endYear', parseInt(e.target.value))}
                                                                    inputProps={{ min: 1950, max: 2030 }}
                                                                    disabled={experience.dateRange.isOngoing}
                                                                />
                                                            </Stack>
                                                            <Stack sx={{ mt: 1 }}>
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            checked={experience.dateRange.isOngoing}
                                                                            onChange={(e) => updateDateRange(experience.id, 'isOngoing', e.target.checked)}
                                                                        />
                                                                    }
                                                                    label="Currently working here"
                                                                />
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            checked={experience.showDateRange}
                                                                            onChange={(e) => updateExperience(experience.id, 'showDateRange', e.target.checked)}
                                                                        />
                                                                    }
                                                                    label="Show dates"
                                                                />
                                                            </Stack>
                                                        </Box>

                                                        {/* Description */}
                                                        <Box>
                                                            <TextField
                                                                fullWidth
                                                                multiline
                                                                rows={3}
                                                                label="Job Description"
                                                                value={experience.description}
                                                                onChange={(e) => updateExperience(experience.id, 'description', e.target.value)}
                                                                placeholder="Brief description of your role and responsibilities..."
                                                            />
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={experience.showDescription}
                                                                        onChange={(e) => updateExperience(experience.id, 'showDescription', e.target.checked)}
                                                                    />
                                                                }
                                                                label="Show description"
                                                            />
                                                        </Box>

                                                        {/* Achievements/Bullets */}
                                                        <Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                                <Typography variant="subtitle2">
                                                                    Key Achievements
                                                                </Typography>
                                                                <Button
                                                                    size="small"
                                                                    onClick={() => addBullet(experience.id)}
                                                                    startIcon={<Add />}
                                                                >
                                                                    Add Achievement
                                                                </Button>
                                                            </Box>

                                                            <Stack spacing={2}>
                                                                {experience.bullets.map((bullet, bulletIndex) => (
                                                                    <Box key={bulletIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Typography sx={{ color: 'text.secondary', lineHeight: 1, fontSize: '1.2rem' }}>•</Typography>
                                                                        <TextField
                                                                            fullWidth
                                                                            value={bullet}
                                                                            onChange={(e) => updateBullet(experience.id, bulletIndex, e.target.value)}
                                                                            placeholder="Describe your achievement or responsibility..."
                                                                            size="small"
                                                                            sx={{ flexGrow: 1 }}
                                                                        />
                                                                        <IconButton
                                                                            size="small"
                                                                            color="error"
                                                                            onClick={() => deleteBullet(experience.id, bulletIndex)}
                                                                        >
                                                                            <Delete />
                                                                        </IconButton>
                                                                    </Box>
                                                                ))}
                                                            </Stack>

                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={experience.showBullets}
                                                                        onChange={(e) => updateExperience(experience.id, 'showBullets', e.target.checked)}
                                                                    />
                                                                }
                                                                label="Show achievements"
                                                                sx={{ mt: 1 }}
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

                    {/* Add New Experience Button */}
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
                        onClick={addExperience}
                    >
                        <Add sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                            Add Work Experience
                        </Typography>
                    </Paper>
                </CardContent>
            </Card>
        </Box>
    );
};
