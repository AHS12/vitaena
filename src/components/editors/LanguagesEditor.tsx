import { SortableItem } from '@/components/ui/SortableItem';
import { SortableWrapper } from '@/components/ui/SortableWrapper';
import { useResumeStore } from '@/stores/resume-store';
import { Language } from '@/types/resume';
import { Add, Close, Visibility, VisibilityOff } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
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

export const LanguagesEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();
    const [newLanguageName, setNewLanguageName] = useState('');
    const [newLanguageLevel, setNewLanguageLevel] = useState<number>(3);

    if (!currentResume) return null;

    const levelLabels = {
        1: 'Beginner',
        2: 'Elementary',
        3: 'Intermediate',
        4: 'Advanced',
        5: 'Native/Fluent'
    };

    const addLanguage = () => {
        if (newLanguageName.trim()) {
            const newLanguage: Language = {
                name: newLanguageName.trim(),
                level: newLanguageLevel,
                levelText: levelLabels[newLanguageLevel as keyof typeof levelLabels],
                show: true,
            };
            const updatedLanguages = [...currentResume.languages, newLanguage];
            updateResumeField('languages', updatedLanguages);
            setNewLanguageName('');
            setNewLanguageLevel(3);
        }
    };

    const reorderLanguages = (reorderedItems: Language[]) => {
        updateResumeField('languages', reorderedItems);
    };

    const removeLanguage = (languageIndex: number) => {
        const updatedLanguages = currentResume.languages.filter((_, index) => index !== languageIndex);
        updateResumeField('languages', updatedLanguages);
    };

    const updateLanguageLevel = (languageIndex: number, level: number) => {
        const updatedLanguages = currentResume.languages.map((language, index) =>
            index === languageIndex ? {
                ...language,
                level,
                levelText: levelLabels[level as keyof typeof levelLabels]
            } : language
        );
        updateResumeField('languages', updatedLanguages);
    };

    const toggleLanguageVisibility = (languageIndex: number) => {
        const updatedLanguages = currentResume.languages.map((language, index) =>
            index === languageIndex ? { ...language, show: !language.show } : language
        );
        updateResumeField('languages', updatedLanguages);
    };

    const renderSkillLevel = (level: number) => {
        return (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((dot) => (
                    <div
                        key={dot}
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: dot <= level ? '#2563eb' : '#e5e7eb'
                        }}
                    />
                ))}
            </div>
        );
    };

    const handleToggleShow = () => {
        updateResumeField('showLanguages', !currentResume.showLanguages);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Card>
                <CardHeader
                    title="Languages"
                    subheader="Add languages you speak with proficiency levels. Drag to reorder."
                    action={
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentResume.showLanguages}
                                    onChange={handleToggleShow}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton size="small" color={currentResume.showLanguages ? 'primary' : 'default'}>
                                        {currentResume.showLanguages ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                    <Typography variant="body2">
                                        Show Languages
                                    </Typography>
                                </Box>
                            }
                        />
                    }
                />
                <CardContent>
                    {/* Current Languages */}
                    <SortableWrapper
                        items={currentResume.languages}
                        onReorder={reorderLanguages}
                        idPrefix="language"
                    >
                        <Stack spacing={2} sx={{ mb: 3 }}>
                            {currentResume.languages.map((language, index) => (
                                <SortableItem key={index} id={`language-${index}`}>
                                    <Paper sx={{ p: 2, border: 1, borderColor: 'divider', opacity: language.show ? 1 : 0.5 }}>
                                        <Stack spacing={2}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography variant="h6">{language.name}</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => toggleLanguageVisibility(index)}
                                                        color={language.show ? 'primary' : 'default'}
                                                        title={language.show ? 'Hide language' : 'Show language'}
                                                    >
                                                        {language.show ? <Visibility /> : <VisibilityOff />}
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => removeLanguage(index)}>
                                                        <Close />
                                                    </IconButton>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {language.levelText}
                                                </Typography>
                                                {renderSkillLevel(language.level)}
                                            </Box>

                                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                                <InputLabel>Proficiency Level</InputLabel>
                                                <Select
                                                    value={language.level}
                                                    label="Proficiency Level"
                                                    onChange={(e) => updateLanguageLevel(index, Number(e.target.value))}
                                                >
                                                    {Object.entries(levelLabels).map(([level, label]) => (
                                                        <MenuItem key={level} value={Number(level)}>
                                                            {label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Stack>
                                    </Paper>
                                </SortableItem>
                            ))}
                        </Stack>
                    </SortableWrapper>

                    {/* Add New Language */}
                    <Paper sx={{ p: 2, border: 1, borderColor: 'divider', backgroundColor: 'action.hover' }}>
                        <Stack spacing={2}>
                            <Typography variant="h6">Add New Language</Typography>
                            <TextField
                                label="Language"
                                value={newLanguageName}
                                onChange={(e) => setNewLanguageName(e.target.value)}
                                placeholder="e.g., English, Spanish, French"
                                fullWidth
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        addLanguage();
                                    }
                                }}
                            />
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Proficiency Level</InputLabel>
                                <Select
                                    value={newLanguageLevel}
                                    label="Proficiency Level"
                                    onChange={(e) => setNewLanguageLevel(Number(e.target.value))}
                                >
                                    {Object.entries(levelLabels).map(([level, label]) => (
                                        <MenuItem key={level} value={Number(level)}>
                                            {label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                onClick={addLanguage}
                                variant="contained"
                                startIcon={<Add />}
                                disabled={!newLanguageName.trim()}
                            >
                                Add Language
                            </Button>
                        </Stack>
                    </Paper>
                </CardContent>
            </Card>
        </Box>
    );
};
