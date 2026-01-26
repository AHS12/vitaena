import { exportToPDF, generatePDFFilename } from '@/lib/pdf-export';
import { ResumeData } from '@/types/resume';
import {
    CheckCircle,
    Close,
    DataObject,
    Download,
    PictureAsPdf,
    WifiOff,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface ExportModalProps {
    resume: ResumeData;
    onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ resume, onClose }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Set initial online status
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleExportPDF = async () => {
        setIsExporting(true);

        try {
            console.log('Exporting PDF for:', resume.personalInfo.name);

            // Get the resume template element for export (hidden full-scale version)
            const resumeElement = document.querySelector('[data-export-template] [data-resume-template]') as HTMLElement;

            if (!resumeElement) {
                throw new Error('Resume template not found. Please make sure the resume is visible on screen.');
            }

            // Generate filename
            const filename = generatePDFFilename(resume.personalInfo.name);

            // Export PDF using utility function
            await exportToPDF({
                resumeElement,
                filename,
                type: resume.category, // Pass the category (resume/cv) to handle multi-page logic
                onProgress: () => {
                    // Progress status available but not displayed in UI
                }
            });

            console.log('PDF exported successfully');
            setExportSuccess(true);
            setTimeout(() => {
                setExportSuccess(false);
                onClose();
            }, 2000);
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
        <Dialog
            open={true}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    backgroundColor: 'background.paper',
                    backgroundImage: 'none',
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 2,
                px: { xs: 2, sm: 3 },
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                    <Download sx={{
                        fontSize: { xs: 24, sm: 28 },
                        background: 'linear-gradient(135deg, #61C0BE 0%, #4A90A4 100%)',
                        borderRadius: '50%',
                        p: { xs: 0.5, sm: 1 },
                        color: 'white'
                    }} />
                    <Box>
                        <Typography variant="h5" sx={{
                            fontWeight: 600,
                            fontSize: { xs: '1.25rem', sm: '1.5rem' }
                        }}>
                            Export Resume
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{
                            display: { xs: 'none', sm: 'block' }
                        }}>
                            {resume.personalInfo.name || 'Untitled Resume'}
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        '&:hover': { backgroundColor: 'error.main', color: 'white' },
                        transition: 'all 0.2s ease'
                    }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
                <Typography variant="body1" color="text.secondary" sx={{
                    mb: 4,
                    mt: { xs: 1, sm: 2 },
                    textAlign: 'center',
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                    Choose your preferred export format
                </Typography>

                {/* Offline Alert */}
                {!isOnline && (
                    <Alert
                        severity="warning"
                        icon={<WifiOff />}
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                            '& .MuiAlert-message': {
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                            }
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                            You&apos;re currently offline
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            PDF export requires an internet connection. JSON export is still available for backing up your data.
                        </Typography>
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
                    {/* PDF Export */}
                    <Paper
                        elevation={2}
                        sx={{
                            p: { xs: 2, sm: 3 },
                            cursor: isExporting || !isOnline ? 'not-allowed' : 'pointer',
                            opacity: isExporting || !isOnline ? 0.7 : 1,
                            border: '2px solid',
                            borderColor: isExporting ? 'primary.main' : !isOnline ? 'error.main' : 'divider',
                            borderRadius: 2,
                            backgroundColor: 'background.paper',
                            '&:hover': !isExporting && isOnline ? {
                                borderColor: 'primary.main',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 24px rgba(97, 192, 190, 0.15)',
                            } : {},
                            transition: 'all 0.3s ease-in-out',
                        }}
                        onClick={!isExporting && isOnline ? handleExportPDF : undefined}
                    >
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 2, sm: 0 }
                        }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: { xs: 2, sm: 3 },
                                flexDirection: { xs: 'column', sm: 'row' },
                                textAlign: { xs: 'center', sm: 'left' }
                            }}>
                                <Box sx={{
                                    width: { xs: 48, sm: 56 },
                                    height: { xs: 48, sm: 56 },
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                                }}>
                                    <PictureAsPdf sx={{ fontSize: { xs: 24, sm: 32 }, color: 'white' }} />
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{
                                        fontWeight: 600,
                                        mb: 0.5,
                                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                    }}>
                                        PDF Document
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                    }}>
                                        High-quality PDF ready for printing and sharing
                                    </Typography>
                                    <Chip
                                        label="Recommended"
                                        size="small"
                                        sx={{
                                            mt: 1,
                                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                            color: 'white',
                                            fontWeight: 500,
                                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                        }}
                                    />
                                </Box>
                            </Box>

                            {isExporting ? (
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1,
                                    minWidth: { xs: 'auto', sm: 120 }
                                }}>
                                    <CircularProgress
                                        size={32}
                                        thickness={4}
                                        sx={{
                                            color: 'primary.main',
                                            '& .MuiCircularProgress-circle': {
                                                strokeLinecap: 'round',
                                            }
                                        }}
                                    />
                                </Box>
                            ) : !isOnline ? (
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <WifiOff sx={{
                                        fontSize: 32,
                                        color: 'error.main'
                                    }} />
                                    <Typography variant="body2" color="error.main" sx={{
                                        fontWeight: 500,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                    }}>
                                        Offline
                                    </Typography>
                                </Box>
                            ) : exportSuccess ? (
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <CheckCircle sx={{
                                        fontSize: 32,
                                        color: 'success.main',
                                        animation: 'pulse 1s ease-in-out'
                                    }} />
                                    <Typography variant="body2" color="success.main" sx={{
                                        fontWeight: 500,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                    }}>
                                        Success!
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    color: 'primary.main'
                                }}>
                                    <Typography variant="body2" sx={{
                                        fontWeight: 500,
                                        display: { xs: 'none', sm: 'block' }
                                    }}>
                                        Export
                                    </Typography>
                                    <Download />
                                </Box>
                            )}
                        </Box>
                    </Paper>

                    {/* JSON Export */}
                    <Paper
                        elevation={1}
                        sx={{
                            p: { xs: 2, sm: 3 },
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            backgroundColor: 'background.paper',
                            '&:hover': {
                                borderColor: 'primary.main',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 24px rgba(97, 192, 190, 0.15)',
                            },
                            transition: 'all 0.3s ease-in-out',
                        }}
                        onClick={handleExportJSON}
                    >
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 2, sm: 0 }
                        }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: { xs: 2, sm: 3 },
                                flexDirection: { xs: 'column', sm: 'row' },
                                textAlign: { xs: 'center', sm: 'left' }
                            }}>
                                <Box sx={{
                                    width: { xs: 48, sm: 56 },
                                    height: { xs: 48, sm: 56 },
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #61C0BE 0%, #4A90A4 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(97, 192, 190, 0.3)'
                                }}>
                                    <DataObject sx={{ fontSize: { xs: 24, sm: 32 }, color: 'white' }} />
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{
                                        fontWeight: 600,
                                        mb: 0.5,
                                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                    }}>
                                        Data Backup
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                    }}>
                                        Save your resume data for future imports
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                color: 'primary.main'
                            }}>
                                <Typography variant="body2" sx={{
                                    fontWeight: 500,
                                    display: { xs: 'none', sm: 'block' }
                                }}>
                                    Download
                                </Typography>
                                <Download />
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    fullWidth
                    size="large"
                    sx={{
                        borderRadius: 2,
                        borderColor: 'divider',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        py: { xs: 1, sm: 1.5 },
                        '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'rgba(97, 192, 190, 0.05)'
                        }
                    }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};
