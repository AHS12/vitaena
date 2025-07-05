import { SortableItem } from '@/components/ui/SortableItem';
import { SortableWrapper } from '@/components/ui/SortableWrapper';
import { useIsTouchDevice } from '@/hooks';
import { generateId } from '@/lib/utils';
import { useResumeStore } from '@/stores/resume-store';
import { Skill } from '@/types/resume';
import { Add, Close, Visibility, VisibilityOff } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import React, { useCallback, useState } from 'react';

export const SkillsEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillLevel, setNewSkillLevel] = useState<number>(3);
    const isTouchDevice = useIsTouchDevice();

    const reorderSkills = useCallback((reorderedSkills: Skill[]) => {
        updateResumeField('skills', reorderedSkills);
    }, [updateResumeField]);

    const addSkill = useCallback(() => {
        if (newSkillName.trim() && currentResume) {
            const newSkill: Skill = {
                id: generateId(),
                name: newSkillName.trim(),
                level: newSkillLevel,
                show: true,
            };
            const updatedSkills = [...currentResume.skills, newSkill];
            updateResumeField('skills', updatedSkills);
            setNewSkillName('');
            setNewSkillLevel(3);
        }
    }, [newSkillName, newSkillLevel, currentResume, updateResumeField]);

    const removeSkill = useCallback((skillId: string) => {
        if (currentResume) {
            const updatedSkills = currentResume.skills.filter(skill => skill.id !== skillId);
            updateResumeField('skills', updatedSkills);
        }
    }, [currentResume, updateResumeField]);

    const updateSkillLevel = useCallback((skillId: string, level: number) => {
        if (currentResume) {
            const updatedSkills = currentResume.skills.map(skill =>
                skill.id === skillId ? { ...skill, level } : skill
            );
            updateResumeField('skills', updatedSkills);
        }
    }, [currentResume, updateResumeField]);

    const toggleSkillVisibility = useCallback((skillId: string) => {
        if (currentResume) {
            const updatedSkills = currentResume.skills.map(skill =>
                skill.id === skillId ? { ...skill, show: !skill.show } : skill
            );
            updateResumeField('skills', updatedSkills);
        }
    }, [currentResume, updateResumeField]);

    const getLevelText = useCallback((level: number) => {
        switch (level) {
            case 1: return 'Beginner';
            case 2: return 'Basic';
            case 3: return 'Intermediate';
            case 4: return 'Advanced';
            case 5: return 'Expert';
            default: return 'Intermediate';
        }
    }, []);

    const getLevelColor = useCallback((level: number): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
        switch (level) {
            case 1: return 'error';
            case 2: return 'warning';
            case 3: return 'info';
            case 4: return 'primary';
            case 5: return 'success';
            default: return 'default';
        }
    }, []);

    const handleToggleShow = useCallback(() => {
        if (currentResume) {
            updateResumeField('showSkills', !currentResume.showSkills);
        }
    }, [currentResume, updateResumeField]);

    if (!currentResume) return null;

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Card>
                <CardHeader
                    title="Skills"
                    action={
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentResume.showSkills}
                                    onChange={handleToggleShow}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton size="small" color={currentResume.showSkills ? 'primary' : 'default'}>
                                        {currentResume.showSkills ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        Show Skills
                                    </Typography>
                                </Box>
                            }
                        />
                    }
                    sx={{ pb: { xs: 1, sm: 2 } }}
                />
                <Box sx={{ px: { xs: 2, sm: 2 }, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Add your technical and professional skills with proficiency levels.
                    </Typography>
                </Box>
                <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
                    {/* Add New Skill */}
                    <Paper
                        sx={{
                            p: { xs: 2, sm: 3 },
                            mb: { xs: 2, sm: 3 },
                            border: '2px dashed',
                            borderColor: 'divider',
                            backgroundColor: 'action.hover',
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                            Add New Skill
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Skill Name"
                                    value={newSkillName}
                                    onChange={(e) => setNewSkillName(e.target.value)}
                                    placeholder="e.g., JavaScript, Project Management"
                                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                    size="small"
                                />
                            </Box>
                            <Box sx={{ flex: { xs: 1, sm: 0.8 } }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Level</InputLabel>
                                    <Select
                                        value={newSkillLevel}
                                        label="Level"
                                        onChange={(e) => setNewSkillLevel(e.target.value as number)}
                                    >
                                        <MenuItem value={1}>Beginner</MenuItem>
                                        <MenuItem value={2}>Basic</MenuItem>
                                        <MenuItem value={3}>Intermediate</MenuItem>
                                        <MenuItem value={4}>Advanced</MenuItem>
                                        <MenuItem value={5}>Expert</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Stack>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={addSkill}
                            disabled={!newSkillName.trim()}
                            startIcon={<Add />}
                            size="small"
                        >
                            Add Skill
                        </Button>
                    </Paper>

                    {/* Current Skills */}
                    {currentResume.skills.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                Current Skills ({currentResume.skills.length}) - Drag to reorder
                            </Typography>

                            {/* Touch Device Information */}
                            {isTouchDevice && currentResume.skills.length > 1 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        💡 Tip: Hold an item for a moment to start dragging and reorder
                                    </Typography>
                                </Box>
                            )}
                            <SortableWrapper
                                items={currentResume.skills}
                                onReorder={reorderSkills}
                                idPrefix="skill"
                            >
                                <Stack spacing={2}>
                                    {currentResume.skills.map((skill, index) => (
                                        <SortableItem key={skill.id} id={`skill-${index}`}>
                                            <Paper
                                                sx={{
                                                    p: { xs: 1.5, sm: 2 },
                                                    display: 'flex',
                                                    flexDirection: { xs: 'column', sm: 'row' },
                                                    alignItems: { xs: 'stretch', sm: 'center' },
                                                    justifyContent: 'space-between',
                                                    gap: { xs: 1.5, sm: 2 },
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    opacity: skill.show ? 1 : 0.5,
                                                    transition: 'opacity 0.2s ease-in-out',
                                                }}
                                            >
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: { xs: 1, sm: 2 },
                                                    flex: 1,
                                                    flexWrap: 'wrap'
                                                }}>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            fontWeight: 500,
                                                            fontSize: { xs: '0.875rem', sm: '1rem' }
                                                        }}
                                                    >
                                                        {skill.name}
                                                    </Typography>
                                                    <Chip
                                                        label={getLevelText(skill.level)}
                                                        color={getLevelColor(skill.level)}
                                                        size="small"
                                                    />
                                                </Box>
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: { xs: 1, sm: 1 },
                                                    flexDirection: { xs: 'row', sm: 'row' },
                                                    justifyContent: { xs: 'space-between', sm: 'flex-end' }
                                                }}>
                                                    <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 120 } }}>
                                                        <Select
                                                            value={skill.level}
                                                            onChange={(e) => updateSkillLevel(skill.id, e.target.value as number)}
                                                        >
                                                            <MenuItem value={1}>Beginner</MenuItem>
                                                            <MenuItem value={2}>Basic</MenuItem>
                                                            <MenuItem value={3}>Intermediate</MenuItem>
                                                            <MenuItem value={4}>Advanced</MenuItem>
                                                            <MenuItem value={5}>Expert</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => toggleSkillVisibility(skill.id)}
                                                            color={skill.show ? 'primary' : 'default'}
                                                            title={skill.show ? 'Hide skill' : 'Show skill'}
                                                        >
                                                            {skill.show ? <Visibility /> : <VisibilityOff />}
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => removeSkill(skill.id)}
                                                            color="error"
                                                        >
                                                            <Close />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </SortableItem>
                                    ))}
                                </Stack>
                            </SortableWrapper>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};
