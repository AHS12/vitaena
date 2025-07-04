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
    const [isExporting, setIsExporting] = useState(false); const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            console.log('Exporting PDF for:', resume.personalInfo.name);

            // Import html2pdf dynamically
            const html2pdf = (await import('html2pdf.js')).default;

            // Get the resume template element
            const resumeElement = document.querySelector('[data-resume-template]') as HTMLElement;

            if (!resumeElement) {
                throw new Error('Resume template not found. Please make sure the resume is visible on screen.');
            }

            // Configure html2pdf options for single page output
            const options = {
                margin: [0, 0, 0, 0], // No margins
                filename: `${resume.personalInfo.name?.replace(/\s+/g, '_') || 'resume'}_${new Date().toISOString().split('T')[0]}.pdf`,
                image: {
                    type: 'jpeg',
                    quality: 0.98
                },
                html2canvas: {
                    scale: 1.5, // Reduced scale for better single-page fit
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: '#ffffff',
                    width: 794, // A4 width in pixels (210mm at 96 DPI)
                    height: 1123, // A4 height in pixels (297mm at 96 DPI)
                    scrollX: 0,
                    scrollY: 0,
                    letterRendering: true,
                    logging: false,
                    onclone: (clonedDoc: Document) => {
                        console.log('Cloning document for PDF export');
                        const resumeEl = clonedDoc.querySelector('[data-resume-template]') as HTMLElement;
                        if (resumeEl) {
                            // Force the template to fit on a single page
                            resumeEl.style.width = '210mm';
                            resumeEl.style.height = '297mm';
                            resumeEl.style.maxHeight = '297mm';
                            resumeEl.style.overflow = 'hidden';
                            resumeEl.style.pageBreakInside = 'avoid';
                            resumeEl.style.pageBreakAfter = 'auto';
                            resumeEl.style.pageBreakBefore = 'auto';
                            resumeEl.style.margin = '0';
                            resumeEl.style.padding = '0';
                            resumeEl.style.boxSizing = 'border-box';
                            resumeEl.style.backgroundColor = '#ffffff';
                            resumeEl.style.fontSize = '11px'; // Slightly smaller font for better fit
                            resumeEl.style.lineHeight = '1.3';

                            // Scale down content if needed for single page
                            const contentHeight = resumeEl.scrollHeight;
                            const maxHeight = 1123; // A4 height in pixels

                            if (contentHeight > maxHeight) {
                                const scale = maxHeight / contentHeight;
                                resumeEl.style.transform = `scale(${scale})`;
                                resumeEl.style.transformOrigin = 'top left';
                                resumeEl.style.width = `${210 / scale}mm`;
                                resumeEl.style.height = `${297 / scale}mm`;
                            }

                            // Ensure all images are properly sized
                            const images = resumeEl.querySelectorAll('img');
                            images.forEach((img) => {
                                img.style.maxWidth = '100%';
                                img.style.height = 'auto';
                                img.style.display = 'block';
                            });
                        }
                    }
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                    compress: true,
                    precision: 16
                },
                pagebreak: {
                    mode: 'avoid-all', // Avoid page breaks
                    before: '',
                    after: ''
                }
            };

            // Generate and save PDF directly from the visible element
            await html2pdf()
                .set(options)
                .from(resumeElement)
                .save();

            console.log('PDF exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
