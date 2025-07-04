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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
            console.log('Exporting PDF for:', resume.personalInfo.name);

            // Find the resume template element
            const element = document.querySelector('[data-resume-template]') as HTMLElement;
            if (!element) {
                throw new Error('Resume template not found. Please make sure the preview is visible.');
            }

            // Create canvas from HTML element with optimized settings
            const canvas = await html2canvas(element, {
                scale: 3, // Higher resolution for better font quality
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                height: element.offsetHeight,
                width: element.offsetWidth,
                scrollX: 0,
                scrollY: 0,
                logging: false,
                onclone: (clonedDoc) => {
                    // Ensure fonts are properly loaded
                    const body = clonedDoc.body;
                    body.style.fontFamily = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
                    body.style.setProperty('-webkit-font-smoothing', 'antialiased');
                    body.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
                    body.style.setProperty('text-rendering', 'optimizeLegibility');
                }
            });

            // A4 dimensions in mm
            const pdfWidth = 210;
            const pdfHeight = 297;

            // Calculate scaling to fit A4 page
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            // Calculate scale to fit width
            const scaleX = (pdfWidth / canvasWidth) * 72 / 25.4 * 2; // Convert mm to points and apply scale
            const scaleY = (pdfHeight / canvasHeight) * 72 / 25.4 * 2;

            // Use the smaller scale to ensure everything fits
            const scale = Math.min(scaleX, scaleY);

            // Calculate final dimensions
            const finalWidth = (canvasWidth * scale * 25.4) / 72 / 2;
            const finalHeight = (canvasHeight * scale * 25.4) / 72 / 2;

            // Create PDF with A4 dimensions
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            // Get image data
            const imgData = canvas.toDataURL('image/png', 1.0);

            // Center the content on the page
            const xOffset = (pdfWidth - finalWidth) / 2;
            const yOffset = (pdfHeight - finalHeight) / 2;

            // Add the image to PDF - ensure it fits on one page
            pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight, '', 'FAST');

            // Generate filename
            const fileName = `${resume.personalInfo.name?.replace(/\s+/g, '_') || 'resume'}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Save the PDF
            pdf.save(fileName);

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
