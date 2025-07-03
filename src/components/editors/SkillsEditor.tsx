import { useResumeStore } from '@/stores/resume-store';
import { Skill } from '@/types/resume';
import { Add, Close } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';

export const SkillsEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillLevel, setNewSkillLevel] = useState<number>(3);

    if (!currentResume) return null;

    const addSkill = () => {
        if (newSkillName.trim()) {
            const newSkill: Skill = {
                name: newSkillName.trim(),
                level: newSkillLevel,
            };
            const updatedSkills = [...currentResume.skills, newSkill];
            updateResumeField('skills', updatedSkills);
            setNewSkillName('');
            setNewSkillLevel(3);
        }
    };

    const removeSkill = (skillIndex: number) => {
        const updatedSkills = currentResume.skills.filter((_, index) => index !== skillIndex);
        updateResumeField('skills', updatedSkills);
    };

    const updateSkillLevel = (skillIndex: number, level: number) => {
        const updatedSkills = currentResume.skills.map((skill, index) =>
            index === skillIndex ? { ...skill, level } : skill
        );
        updateResumeField('skills', updatedSkills);
    };

    const getLevelText = (level: number) => {
        switch (level) {
            case 1: return 'Beginner';
            case 2: return 'Basic';
            case 3: return 'Intermediate';
            case 4: return 'Advanced';
            case 5: return 'Expert';
            default: return 'Intermediate';
        }
    };

    const getLevelColor = (level: number): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
        switch (level) {
            case 1: return 'error';
            case 2: return 'warning';
            case 3: return 'info';
            case 4: return 'primary';
            case 5: return 'success';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Card>
                <CardHeader
                    title="Skills"
                    subheader="Add your technical and professional skills with proficiency levels."
                />
                <CardContent>
                    {/* Add New Skill */}
                    <Paper
                        sx={{
                            p: 3,
                            mb: 3,
                            border: '2px dashed',
                            borderColor: 'divider',
                            backgroundColor: 'action.hover',
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                            Add New Skill
                        </Typography>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
                            <Box sx={{ flex: { xs: 1, md: 2 } }}>
                                <TextField
                                    fullWidth
                                    label="Skill Name"
                                    value={newSkillName}
                                    onChange={(e) => setNewSkillName(e.target.value)}
                                    placeholder="e.g., JavaScript, Project Management"
                                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                />
                            </Box>
                            <Box sx={{ flex: { xs: 1, md: 1 } }}>
                                <FormControl fullWidth>
                                    <InputLabel>Proficiency Level</InputLabel>
                                    <Select
                                        value={newSkillLevel}
                                        label="Proficiency Level"
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
                        >
                            Add Skill
                        </Button>
                    </Paper>

                    {/* Current Skills */}
                    {currentResume.skills.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                Current Skills ({currentResume.skills.length})
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {currentResume.skills.map((skill, index) => (
                                    <Paper
                                        key={`skill-${index}`}
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {skill.name}
                                            </Typography>
                                            <Chip
                                                label={getLevelText(skill.level)}
                                                color={getLevelColor(skill.level)}
                                                size="small"
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                                <Select
                                                    value={skill.level}
                                                    onChange={(e) => updateSkillLevel(index, e.target.value as number)}
                                                >
                                                    <MenuItem value={1}>Beginner</MenuItem>
                                                    <MenuItem value={2}>Basic</MenuItem>
                                                    <MenuItem value={3}>Intermediate</MenuItem>
                                                    <MenuItem value={4}>Advanced</MenuItem>
                                                    <MenuItem value={5}>Expert</MenuItem>
                                                </Select>
                                            </FormControl>
                                            <IconButton
                                                size="small"
                                                onClick={() => removeSkill(index)}
                                                color="error"
                                            >
                                                <Close />
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};
