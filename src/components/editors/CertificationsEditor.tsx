import { SortableItem } from '@/components/ui/SortableItem';
import { SortableWrapper } from '@/components/ui/SortableWrapper';
import { generateId } from '@/lib/utils';
import { useResumeStore } from '@/stores/resume-store';
import { Certification } from '@/types/resume';
import { Add, Delete, ExpandLess, ExpandMore, Link, Visibility, VisibilityOff, WorkspacePremium } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    Collapse,
    FormControl,
    FormControlLabel,
    IconButton,
    InputAdornment,
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

export const CertificationsEditor: React.FC = () => {
    const { currentResume, updateResumeField } = useResumeStore();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    if (!currentResume) return null;

    // Ensure certifications array exists
    if (!currentResume.certifications) {
        updateResumeField('certifications', []);
    }
    if (currentResume.showCertifications === undefined) {
        updateResumeField('showCertifications', false);
    }

    const certifications = currentResume.certifications || [];
    const showCertifications = currentResume.showCertifications || false;

    const currentYear = new Date().getFullYear();
    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    const addCertification = () => {
        const newCertification: Certification = {
            id: generateId(),
            name: '',
            issuingOrganization: '',
            issueDate: {
                month: new Date().getMonth() + 1,
                year: currentYear,
            },
            credentialId: '',
            credentialUrl: '',
            showIssueDate: true,
            showExpirationDate: false,
            showCredentialId: false,
            showCredentialUrl: false,
            show: true,
        };

        const updatedCertifications = [...certifications, newCertification];
        updateResumeField('certifications', updatedCertifications);
        setExpandedItems([...expandedItems, newCertification.id]);
    };

    const updateCertification = (id: string, field: keyof Certification, value: unknown) => {
        const updatedCertifications = certifications.map(cert =>
            cert.id === id ? { ...cert, [field]: value } : cert
        );
        updateResumeField('certifications', updatedCertifications);
    };

    const toggleCertificationShow = (id: string) => {
        const updatedCertifications = certifications.map(cert =>
            cert.id === id ? { ...cert, show: !cert.show } : cert
        );
        updateResumeField('certifications', updatedCertifications);
    };

    const reorderCertifications = (reorderedCertifications: Certification[]) => {
        updateResumeField('certifications', reorderedCertifications);
    };

    const deleteCertification = (id: string) => {
        const updatedCertifications = certifications.filter(cert => cert.id !== id);
        updateResumeField('certifications', updatedCertifications);
        setExpandedItems(expandedItems.filter(itemId => itemId !== id));
    };

    const toggleExpanded = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const updateIssueDate = (certId: string, field: 'month' | 'year', value: number) => {
        const cert = certifications.find(c => c.id === certId);
        if (cert) {
            const updatedIssueDate = { ...cert.issueDate, [field]: value };
            updateCertification(certId, 'issueDate', updatedIssueDate);
        }
    };

    const updateExpirationDate = (certId: string, field: 'month' | 'year', value: number) => {
        const cert = certifications.find(c => c.id === certId);
        if (cert) {
            const updatedExpirationDate = { ...cert.expirationDate, [field]: value };
            updateCertification(certId, 'expirationDate', updatedExpirationDate);
        }
    };

    const handleToggleShow = () => {
        updateResumeField('showCertifications', !showCertifications);
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Card>
                <CardHeader
                    title="Licenses & Certifications"
                    action={
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showCertifications}
                                    onChange={handleToggleShow}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton size="small" color={showCertifications ? 'primary' : 'default'}>
                                        {showCertifications ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        Show Certifications
                                    </Typography>
                                </Box>
                            }
                        />
                    }
                    sx={{ pb: { xs: 1, sm: 2 } }}
                />
                <Box sx={{ px: { xs: 2, sm: 2 }, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Add professional certifications, licenses, and achievements. Drag to reorder.
                    </Typography>
                </Box>
                <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
                    {/* Certification Items */}
                    <SortableWrapper
                        items={certifications}
                        onReorder={reorderCertifications}
                        idPrefix="certification"
                    >
                        <Stack spacing={2}>
                            {certifications.map((certification, index) => {
                                const isExpanded = expandedItems.includes(certification.id);

                                return (
                                    <SortableItem key={certification.id} id={`certification-${index}`}>
                                        <Card variant="outlined" sx={{ opacity: certification.show ? 1 : 0.5 }}>
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
                                                    <WorkspacePremium color="action" />
                                                    <Box>
                                                        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                                            {certification.name || `Certification ${index + 1}`}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {certification.issuingOrganization || 'No organization specified'}
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
                                                        onClick={() => toggleExpanded(certification.id)}
                                                        endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                                                    >
                                                        {isExpanded ? 'Collapse' : 'Expand'}
                                                    </Button>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => toggleCertificationShow(certification.id)}
                                                            color={certification.show ? 'primary' : 'default'}
                                                            title={certification.show ? 'Hide item' : 'Show item'}
                                                        >
                                                            {certification.show ? <Visibility /> : <VisibilityOff />}
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => deleteCertification(certification.id)}
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
                                                        {/* Certification Name */}
                                                        <TextField
                                                            fullWidth
                                                            label="Certification Name"
                                                            value={certification.name}
                                                            onChange={(e) => updateCertification(certification.id, 'name', e.target.value)}
                                                            placeholder="e.g., Microsoft certified network associate security"
                                                            required
                                                            size="small"
                                                        />

                                                        {/* Issuing Organization */}
                                                        <TextField
                                                            fullWidth
                                                            label="Issuing Organization"
                                                            value={certification.issuingOrganization}
                                                            onChange={(e) => updateCertification(certification.id, 'issuingOrganization', e.target.value)}
                                                            placeholder="e.g., Microsoft"
                                                            required
                                                            size="small"
                                                        />

                                                        {/* Issue Date */}
                                                        <Box>
                                                            <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                                Issue Date
                                                            </Typography>
                                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                                                <FormControl fullWidth size="small">
                                                                    <InputLabel>Month</InputLabel>
                                                                    <Select
                                                                        value={certification.issueDate.month}
                                                                        label="Month"
                                                                        onChange={(e) => updateIssueDate(certification.id, 'month', e.target.value as number)}
                                                                    >
                                                                        {months.map((month) => (
                                                                            <MenuItem key={month.value} value={month.value}>
                                                                                {month.label}
                                                                            </MenuItem>
                                                                        ))}
                                                                    </Select>
                                                                </FormControl>
                                                                <TextField
                                                                    type="number"
                                                                    size="small"
                                                                    label="Year"
                                                                    value={certification.issueDate.year}
                                                                    onChange={(e) => updateIssueDate(certification.id, 'year', parseInt(e.target.value))}
                                                                    inputProps={{ min: 1950, max: currentYear + 10 }}
                                                                    fullWidth
                                                                />
                                                            </Stack>
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={certification.showIssueDate}
                                                                        onChange={(e) => updateCertification(certification.id, 'showIssueDate', e.target.checked)}
                                                                    />
                                                                }
                                                                label="Show issue date"
                                                            />
                                                        </Box>

                                                        {/* Expiration Date */}
                                                        <Box>
                                                            <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                                Expiration Date (Optional)
                                                            </Typography>
                                                            <Stack direction="row" spacing={2}>
                                                                <FormControl fullWidth>
                                                                    <InputLabel>Month</InputLabel>
                                                                    <Select
                                                                        value={certification.expirationDate?.month || ''}
                                                                        label="Month"
                                                                        onChange={(e) => updateExpirationDate(certification.id, 'month', e.target.value as number)}
                                                                    >
                                                                        {months.map((month) => (
                                                                            <MenuItem key={month.value} value={month.value}>
                                                                                {month.label}
                                                                            </MenuItem>
                                                                        ))}
                                                                    </Select>
                                                                </FormControl>
                                                                <TextField
                                                                    type="number"
                                                                    label="Year"
                                                                    value={certification.expirationDate?.year || ''}
                                                                    onChange={(e) => updateExpirationDate(certification.id, 'year', parseInt(e.target.value))}
                                                                    inputProps={{ min: 1950, max: currentYear + 50 }}
                                                                    fullWidth
                                                                />
                                                            </Stack>
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={certification.showExpirationDate}
                                                                        onChange={(e) => updateCertification(certification.id, 'showExpirationDate', e.target.checked)}
                                                                    />
                                                                }
                                                                label="Show expiration date"
                                                            />
                                                        </Box>

                                                        {/* Credential ID */}
                                                        <Box>
                                                            <TextField
                                                                fullWidth
                                                                label="Credential ID"
                                                                value={certification.credentialId || ''}
                                                                onChange={(e) => updateCertification(certification.id, 'credentialId', e.target.value)}
                                                                placeholder="e.g., ABC123456"
                                                            />
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={certification.showCredentialId}
                                                                        onChange={(e) => updateCertification(certification.id, 'showCredentialId', e.target.checked)}
                                                                    />
                                                                }
                                                                label="Show credential ID"
                                                            />
                                                        </Box>

                                                        {/* Credential URL */}
                                                        <Box>
                                                            <TextField
                                                                fullWidth
                                                                label="Credential URL"
                                                                value={certification.credentialUrl || ''}
                                                                onChange={(e) => updateCertification(certification.id, 'credentialUrl', e.target.value)}
                                                                placeholder="https://credential-verification-url.com"
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
                                                                        checked={certification.showCredentialUrl}
                                                                        onChange={(e) => updateCertification(certification.id, 'showCredentialUrl', e.target.checked)}
                                                                    />
                                                                }
                                                                label="Show credential URL"
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

                    {/* Add New Certification Button */}
                    <Paper
                        sx={{
                            mt: 3,
                            p: { xs: 2, sm: 3 },
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
                        onClick={addCertification}
                    >
                        <Add sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                            Add License or Certification
                        </Typography>
                    </Paper>
                </CardContent>
            </Card>
        </Box>
    );
};
