import { SortableItem } from '@/components/ui/SortableItem';
import { SortableWrapper } from '@/components/ui/SortableWrapper';
import { generateId } from '@/lib/utils';
import { useResumeStore } from '@/stores/resume-store';
import { DateRange, Project } from '@/types/resume';
import { Add, Delete, ExpandLess, ExpandMore, Link, Title, Visibility, VisibilityOff } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    Chip,
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

export const ProjectsEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [newTechInputs, setNewTechInputs] = useState<Record<string, string>>({});

    if (!currentResume) return null;

    const setNewTech = (projectId: string, value: string) => {
        setNewTechInputs(prev => ({ ...prev, [projectId]: value }));
    };

    const getNewTech = (projectId: string) => {
        return newTechInputs[projectId] || '';
    };

    const addProject = () => {
        const newProject: Project = {
            id: generateId(),
            title: '',
            description: '',
            link: '',
            dateRange: {
                startYear: new Date().getFullYear(),
                endYear: new Date().getFullYear(),
                isOngoing: false,
            },
            technologies: [],
            showLink: false,
            showDateRange: true,
            showDescription: true,
            show: true,
        };

        const updatedProjects = [...currentResume.projects, newProject];
        updateResumeField('projects', updatedProjects);
        setExpandedItems([...expandedItems, newProject.id]);
    };

    const updateProject = (id: string, field: keyof Project, value: unknown) => {
        const updatedProjects = currentResume.projects.map(project =>
            project.id === id ? { ...project, [field]: value } : project
        );
        updateResumeField('projects', updatedProjects);
    };

    const reorderProjects = (reorderedItems: Project[]) => {
        updateResumeField('projects', reorderedItems);
    };

    const deleteProject = (id: string) => {
        const updatedProjects = currentResume.projects.filter(project => project.id !== id);
        updateResumeField('projects', updatedProjects);
        setExpandedItems(expandedItems.filter(itemId => itemId !== id));
    };

    const toggleExpanded = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const updateDateRange = (projectId: string, field: keyof DateRange, value: unknown) => {
        const project = currentResume.projects.find(p => p.id === projectId);
        if (project) {
            const updatedDateRange = { ...project.dateRange, [field]: value };
            updateProject(projectId, 'dateRange', updatedDateRange);
        }
    };

    const handleToggleShow = () => {
        updateResumeField('showProjects', !currentResume.showProjects);
    };

    const toggleProjectVisibility = (projectId: string) => {
        const updatedProjects = currentResume.projects.map(project =>
            project.id === projectId ? { ...project, show: !project.show } : project
        );
        updateResumeField('projects', updatedProjects);
    };

    const addTechnology = (projectId: string, technology: string) => {
        const project = currentResume.projects.find(p => p.id === projectId);
        if (project && technology.trim()) {
            const updatedTechnologies = [...project.technologies, technology.trim()];
            updateProject(projectId, 'technologies', updatedTechnologies);
            setNewTechInputs(prev => ({ ...prev, [projectId]: '' }));
        }
    };

    const removeTechnology = (projectId: string, techIndex: number) => {
        const project = currentResume.projects.find(p => p.id === projectId);
        if (project) {
            const updatedTechnologies = project.technologies.filter((_, index) => index !== techIndex);
            updateProject(projectId, 'technologies', updatedTechnologies);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Card>
                <CardHeader
                    title="Projects"
                    action={
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentResume.showProjects}
                                    onChange={handleToggleShow}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton size="small" color={currentResume.showProjects ? 'primary' : 'default'}>
                                        {currentResume.showProjects ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        Show Projects
                                    </Typography>
                                </Box>
                            }
                        />
                    }
                    sx={{ pb: { xs: 1, sm: 2 } }}
                />
                <Box sx={{ px: { xs: 2, sm: 2 }, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Showcase your personal or professional projects. Drag to reorder.
                    </Typography>
                </Box>
                <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
                    {/* Project Items */}
                    <SortableWrapper
                        items={currentResume.projects}
                        onReorder={reorderProjects}
                        idPrefix="project"
                    >
                        <Stack spacing={2}>
                            {currentResume.projects.map((project, index) => {
                                const isExpanded = expandedItems.includes(project.id);

                                return (
                                    <SortableItem key={project.id} id={`project-${index}`}>
                                        <Card variant="outlined" sx={{ opacity: project.show ? 1 : 0.5 }}>
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
                                                    <Title color="action" />
                                                    <Box>
                                                        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                                            {project.title || `Project ${index + 1}`}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {project.description ?
                                                                project.description.substring(0, 100) + (project.description.length > 100 ? '...' : '')
                                                                : 'No description'
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
                                                        onClick={() => toggleExpanded(project.id)}
                                                        endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                                                        disabled={!currentResume.showProjects}
                                                    >
                                                        {isExpanded ? 'Collapse' : 'Expand'}
                                                    </Button>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => toggleProjectVisibility(project.id)}
                                                            color={project.show ? 'primary' : 'default'}
                                                            title={project.show ? 'Hide project' : 'Show project'}
                                                            disabled={!currentResume.showProjects}
                                                        >
                                                            {project.show ? <Visibility /> : <VisibilityOff />}
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => deleteProject(project.id)}
                                                            disabled={!currentResume.showProjects}
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
                                                        {/* Title */}
                                                        <TextField
                                                            fullWidth
                                                            label="Project Title"
                                                            value={project.title}
                                                            onChange={(e) => updateProject(project.id, 'title', e.target.value)}
                                                            placeholder="e.g., Personal Portfolio Website"
                                                            required
                                                            disabled={!currentResume.showProjects}
                                                            size="small"
                                                        />

                                                        {/* Description */}
                                                        <Box>
                                                            <TextField
                                                                fullWidth
                                                                label="Description"
                                                                value={project.description}
                                                                onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                                                                placeholder="Describe what this project does and your role in it"
                                                                multiline
                                                                rows={3}
                                                                disabled={!currentResume.showProjects}
                                                                size="small"
                                                            />
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={project.showDescription}
                                                                        onChange={(e) => updateProject(project.id, 'showDescription', e.target.checked)}
                                                                        disabled={!currentResume.showProjects}
                                                                    />
                                                                }
                                                                label="Show description"
                                                            />
                                                        </Box>

                                                        {/* Link */}
                                                        <Box>
                                                            <TextField
                                                                size="small"
                                                                fullWidth
                                                                label="Project Link"
                                                                value={project.link}
                                                                onChange={(e) => updateProject(project.id, 'link', e.target.value)}
                                                                placeholder="https://github.com/username/project"
                                                                InputProps={{
                                                                    startAdornment: (
                                                                        <InputAdornment position="start">
                                                                            <Link />
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                                disabled={!currentResume.showProjects}
                                                            />
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={project.showLink}
                                                                        onChange={(e) => updateProject(project.id, 'showLink', e.target.checked)}
                                                                        disabled={!currentResume.showProjects}
                                                                    />
                                                                }
                                                                label="Show link"
                                                            />
                                                        </Box>

                                                        {/* Date Range */}
                                                        <Box>
                                                            <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                                Project Timeline
                                                            </Typography>
                                                            <Stack direction="row" spacing={2}>
                                                                <TextField
                                                                    type="number"
                                                                    label="Start Year"
                                                                    value={project.dateRange?.startYear || ''}
                                                                    onChange={(e) => updateDateRange(project.id, 'startYear', parseInt(e.target.value))}
                                                                    inputProps={{ min: 1950, max: 2030 }}
                                                                    disabled={!currentResume.showProjects}
                                                                />
                                                                <TextField
                                                                    type="number"
                                                                    label="End Year"
                                                                    value={project.dateRange?.endYear || ''}
                                                                    onChange={(e) => updateDateRange(project.id, 'endYear', parseInt(e.target.value))}
                                                                    inputProps={{ min: 1950, max: 2030 }}
                                                                    disabled={project.dateRange?.isOngoing || !currentResume.showProjects}
                                                                />
                                                            </Stack>
                                                            <Stack sx={{ mt: 1 }}>
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            checked={project.dateRange?.isOngoing || false}
                                                                            onChange={(e) => updateDateRange(project.id, 'isOngoing', e.target.checked)}
                                                                            disabled={!currentResume.showProjects}
                                                                        />
                                                                    }
                                                                    label="Currently working on this"
                                                                />
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            checked={project.showDateRange}
                                                                            onChange={(e) => updateProject(project.id, 'showDateRange', e.target.checked)}
                                                                            disabled={!currentResume.showProjects}
                                                                        />
                                                                    }
                                                                    label="Show dates"
                                                                />
                                                            </Stack>
                                                        </Box>

                                                        {/* Technologies */}
                                                        <Box>
                                                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                                Technologies Used
                                                            </Typography>
                                                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                                                {project.technologies.map((tech, techIndex) => (
                                                                    <Chip
                                                                        key={techIndex}
                                                                        label={tech}
                                                                        onDelete={() => removeTechnology(project.id, techIndex)}
                                                                        size="small"
                                                                        disabled={!currentResume.showProjects}
                                                                    />
                                                                ))}
                                                            </Stack>
                                                            <Stack direction="row" spacing={1}>
                                                                <TextField
                                                                    size="small"
                                                                    label="Add Technology"
                                                                    value={getNewTech(project.id)}
                                                                    onChange={(e) => setNewTech(project.id, e.target.value)}
                                                                    placeholder="e.g., React, Node.js, Python"
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            addTechnology(project.id, getNewTech(project.id));
                                                                        }
                                                                    }}
                                                                    disabled={!currentResume.showProjects}
                                                                />
                                                                <Button
                                                                    onClick={() => {
                                                                        addTechnology(project.id, getNewTech(project.id));
                                                                    }}
                                                                    disabled={!getNewTech(project.id).trim() || !currentResume.showProjects}
                                                                >
                                                                    Add
                                                                </Button>
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

                    {/* Add New Project Button */}
                    <Paper
                        sx={{
                            mt: 3,
                            p: 3,
                            textAlign: 'center',
                            border: '2px dashed',
                            borderColor: 'divider',
                            backgroundColor: 'action.hover',
                            cursor: currentResume.showProjects ? 'pointer' : 'not-allowed',
                            opacity: currentResume.showProjects ? 1 : 0.5,
                            '&:hover': {
                                borderColor: currentResume.showProjects ? 'primary.main' : 'divider',
                                backgroundColor: currentResume.showProjects ? 'action.selected' : 'action.hover',
                            },
                        }}
                        onClick={currentResume.showProjects ? addProject : undefined}
                    >
                        <Add sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                            Add Project
                        </Typography>
                    </Paper>
                </CardContent>
            </Card>
        </Box>
    );
};
