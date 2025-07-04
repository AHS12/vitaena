import { useResumeStore } from '@/stores/resume-store';
import { Skill } from '@/types/resume';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Add, Close, DragIndicator, Visibility, VisibilityOff } from '@mui/icons-material';
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
import React, { useState } from 'react';

interface SortableSkillItemProps {
    skill: Skill;
    index: number;
    updateSkillLevel: (index: number, level: number) => void;
    removeSkill: (index: number) => void;
    toggleSkillVisibility: (index: number) => void;
    getLevelText: (level: number) => string;
    getLevelColor: (level: number) => 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const SortableSkillItem: React.FC<SortableSkillItemProps> = ({
    skill,
    index,
    updateSkillLevel,
    removeSkill,
    toggleSkillVisibility,
    getLevelText,
    getLevelColor,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `skill-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid',
                borderColor: 'divider',
                cursor: isDragging ? 'grabbing' : 'grab',
                opacity: skill.show ? 1 : 0.5,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <IconButton
                    size="small"
                    sx={{ cursor: 'grab' }}
                    {...attributes}
                    {...listeners}
                >
                    <DragIndicator />
                </IconButton>
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
                    onClick={() => toggleSkillVisibility(index)}
                    color={skill.show ? 'primary' : 'default'}
                    title={skill.show ? 'Hide skill' : 'Show skill'}
                >
                    {skill.show ? <Visibility /> : <VisibilityOff />}
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => removeSkill(index)}
                    color="error"
                >
                    <Close />
                </IconButton>
            </Box>
        </Paper>
    );
};

export const SkillsEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillLevel, setNewSkillLevel] = useState<number>(3);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!currentResume) return null;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = currentResume.skills.findIndex((_, index) => `skill-${index}` === active.id);
            const newIndex = currentResume.skills.findIndex((_, index) => `skill-${index}` === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const updatedSkills = arrayMove(currentResume.skills, oldIndex, newIndex);
                updateResumeField('skills', updatedSkills);
            }
        }
    };

    const addSkill = () => {
        if (newSkillName.trim()) {
            const newSkill: Skill = {
                name: newSkillName.trim(),
                level: newSkillLevel,
                show: true,
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

    const toggleSkillVisibility = (skillIndex: number) => {
        const updatedSkills = currentResume.skills.map((skill, index) =>
            index === skillIndex ? { ...skill, show: !skill.show } : skill
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

    const handleToggleShow = () => {
        updateResumeField('showSkills', !currentResume.showSkills);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Card>
                <CardHeader
                    title="Skills"
                    subheader="Add your technical and professional skills with proficiency levels."
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
                                    <Typography variant="body2">
                                        Show Skills
                                    </Typography>
                                </Box>
                            }
                        />
                    }
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
                                Current Skills ({currentResume.skills.length}) - Drag to reorder
                            </Typography>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={currentResume.skills.map((_, index) => `skill-${index}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {currentResume.skills.map((skill, index) => (
                                            <SortableSkillItem
                                                key={`skill-${index}`}
                                                skill={skill}
                                                index={index}
                                                updateSkillLevel={updateSkillLevel}
                                                removeSkill={removeSkill}
                                                toggleSkillVisibility={toggleSkillVisibility}
                                                getLevelText={getLevelText}
                                                getLevelColor={getLevelColor}
                                            />
                                        ))}
                                    </Box>
                                </SortableContext>
                            </DndContext>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};
