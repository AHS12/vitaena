import { ResumeData } from '@/types/resume';
import {
    Close,
    DataObject,
    Download,
    PictureAsPdf,
} from '@mui/icons-material';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface ExportModalProps {
    resume: ResumeData;
    onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ resume, onClose }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            // TODO: Implement PDF export with jsPDF + html2canvas
            console.log('Exporting PDF for:', resume.personalInfo.name);

            // Placeholder: Create a simple download
            const element = document.querySelector('[data-resume-template]') as HTMLElement;
            if (element) {
                // This will be implemented with html2canvas and jsPDF
                alert('PDF export will be implemented with html2canvas and jsPDF');
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportJSON = () => {
        const dataStr = JSON.stringify(resume, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${resume.personalInfo.name || 'resume'}_data.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Export Resume</Typography>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Choose how you&apos;d like to export your resume:
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* PDF Export */}
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            cursor: isExporting ? 'not-allowed' : 'pointer',
                            opacity: isExporting ? 0.5 : 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': !isExporting ? {
                                backgroundColor: 'action.hover',
                                borderColor: 'primary.main',
                            } : {},
                            transition: 'all 0.2s ease-in-out',
                        }}
                        onClick={!isExporting ? handleExportPDF : undefined}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PictureAsPdf sx={{ fontSize: 32, color: 'error.main' }} />
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={500}>
                                        PDF Document
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Perfect for printing and sharing
                                    </Typography>
                                </Box>
                            </Box>
                            {isExporting ? (
                                <CircularProgress size={20} />
                            ) : (
                                <Download sx={{ color: 'text.secondary' }} />
                            )}
                        </Box>
                    </Paper>

                    {/* JSON Export */}
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                                borderColor: 'primary.main',
                            },
                            transition: 'all 0.2s ease-in-out',
                        }}
                        onClick={handleExportJSON}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <DataObject sx={{ fontSize: 32, color: 'primary.main' }} />
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={500}>
                                        Data Backup
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Save your resume data for import later
                                    </Typography>
                                </Box>
                            </Box>
                            <Download sx={{ color: 'text.secondary' }} />
                        </Box>
                    </Paper>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="outlined" fullWidth>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};
