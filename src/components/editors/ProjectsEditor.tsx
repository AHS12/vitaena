import { generateId } from '@/lib/utils';
import { useResumeStore } from '@/stores/resume-store';
import { DateRange, Project } from '@/types/resume';
import { Add, Delete, ExpandLess, ExpandMore, Link, Title } from '@mui/icons-material';
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
        <Box sx={{ p: 3 }}>
            <Card>
                <CardHeader
                    title="Projects"
                    subheader="Showcase your personal or professional projects."
                />
                <CardContent>
                    {/* Project Items */}
                    <Stack spacing={2}>
                        {currentResume.projects.map((project, index) => {
                            const isExpanded = expandedItems.includes(project.id);

                            return (
                                <Card key={project.id} variant="outlined">
                                    {/* Header */}
                                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Title color="action" />
                                            <Box>
                                                <Typography variant="h6">
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Button
                                                size="small"
                                                onClick={() => toggleExpanded(project.id)}
                                                endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                                            >
                                                {isExpanded ? 'Collapse' : 'Expand'}
                                            </Button>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => deleteProject(project.id)}
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
                                                    label="Project Title"
                                                    value={project.title}
                                                    onChange={(e) => updateProject(project.id, 'title', e.target.value)}
                                                    placeholder="e.g., Personal Portfolio Website"
                                                    required
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
                                                    />
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={project.showDescription}
                                                                onChange={(e) => updateProject(project.id, 'showDescription', e.target.checked)}
                                                            />
                                                        }
                                                        label="Show description"
                                                    />
                                                </Box>

                                                {/* Link */}
                                                <Box>
                                                    <TextField
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
                                                    />
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={project.showLink}
                                                                onChange={(e) => updateProject(project.id, 'showLink', e.target.checked)}
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
                                                        />
                                                        <TextField
                                                            type="number"
                                                            label="End Year"
                                                            value={project.dateRange?.endYear || ''}
                                                            onChange={(e) => updateDateRange(project.id, 'endYear', parseInt(e.target.value))}
                                                            inputProps={{ min: 1950, max: 2030 }}
                                                            disabled={project.dateRange?.isOngoing}
                                                        />
                                                    </Stack>
                                                    <Stack sx={{ mt: 1 }}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={project.dateRange?.isOngoing || false}
                                                                    onChange={(e) => updateDateRange(project.id, 'isOngoing', e.target.checked)}
                                                                />
                                                            }
                                                            label="Currently working on this"
                                                        />
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={project.showDateRange}
                                                                    onChange={(e) => updateProject(project.id, 'showDateRange', e.target.checked)}
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
                                                        />
                                                        <Button
                                                            onClick={() => {
                                                                addTechnology(project.id, getNewTech(project.id));
                                                            }}
                                                            disabled={!getNewTech(project.id).trim()}
                                                        >
                                                            Add
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </Collapse>
                                </Card>
                            );
                        })}
                    </Stack>

                    {/* Add New Project Button */}
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
                        onClick={addProject}
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
