'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { initializeDatabase, ResumeService } from '@/lib/database';
import { useResumeStore } from '@/stores/resume-store';
import { ResumeData } from '@/types/resume';
import {
  Add,
  ContentCopy,
  Delete,
  Description,
  Download,
  Edit,
  FileUpload,
  Menu as MenuIcon,
  Search,
  Security,
  Speed,
  Star
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { templates, resumes, createResume, deleteResume, duplicateResume, isLoading } = useResumeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResumes, setFilteredResumes] = useState<ResumeData[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [exportingResumeId, setExportingResumeId] = useState<string | null>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // Fix hydration by ensuring client-side only rendering
  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  console.log('HomePage - templates:', templates, 'resumes:', resumes);

  useEffect(() => {
    // Load existing resumes and templates
    const loadResumes = async () => {
      try {
        const allResumes = await ResumeService.getAllResumes();
        useResumeStore.setState({ resumes: allResumes });
      } catch (error) {
        console.error('Failed to load resumes:', error);
      }
    };

    const loadTemplates = async () => {
      try {
        if (templates.length === 0) {
          console.log('HomePage: Initializing database and loading templates...');
          await initializeDatabase(); // Ensure database is initialized
          const loadedTemplates = await ResumeService.getTemplates();
          console.log('HomePage: Loaded templates:', loadedTemplates);
          useResumeStore.setState({ templates: loadedTemplates });
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };

    loadResumes();
    loadTemplates();
  }, [templates.length]);

  useEffect(() => {
    // Debounced search - filter resumes based on search query using the database search method
    const searchResumes = async () => {
      if (!searchQuery.trim()) {
        setFilteredResumes(resumes);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = await ResumeService.searchResumes(searchQuery);
        setFilteredResumes(searchResults);
      } catch (error) {
        console.error('Failed to search resumes:', error);
        // Fallback to simple filtering
        const filtered = resumes.filter(resume =>
          resume.personalInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resume.personalInfo.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredResumes(filtered);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(searchResumes, 300);
    return () => clearTimeout(timeoutId);
  }, [resumes, searchQuery]);

  const handleCreateResume = async (templateId: string) => {
    try {
      const resumeId = await createResume(templateId);
      router.push(`/editor/${resumeId}`);
    } catch (error) {
      console.error('Failed to create resume:', error);
    }
  };

  const handleEditResume = (resumeId: string) => {
    router.push(`/editor/${resumeId}`);
  };

  const handleDuplicateResume = async (resumeId: string) => {
    try {
      const newResumeId = await duplicateResume(resumeId);
      router.push(`/editor/${newResumeId}`);
    } catch (error) {
      console.error('Failed to duplicate resume:', error);
    }
  };

  const handleDeleteClick = (resumeId: string) => {
    setResumeToDelete(resumeId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (resumeToDelete) {
      try {
        await deleteResume(resumeToDelete);
        setDeleteDialogOpen(false);
        setResumeToDelete(null);
      } catch (error) {
        console.error('Failed to delete resume:', error);
      }
    }
  };

  const handleExportData = async (resumeId: string) => {
    try {
      setExportingResumeId(resumeId);

      const resume = resumes.find(r => r.id === resumeId);
      if (!resume) {
        console.error('Resume not found');
        return;
      }

      // Create a temporary element to render the resume template
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);

      try {
        // Import the template component dynamically
        const { AzizulClassicTemplate } = await import('@/templates/AzizulClassicTemplate');
        const React = await import('react');
        const { createRoot } = await import('react-dom/client');

        // Create a root and render the resume
        const root = createRoot(tempContainer);
        const templateElement = React.createElement(AzizulClassicTemplate, { data: resume });

        root.render(templateElement);

        // Wait for rendering to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get the rendered HTML
        const renderedHTML = tempContainer.innerHTML;

        if (!renderedHTML) {
          throw new Error('Failed to render resume template');
        }

        // Call the PDF export API route with HTML content
        const response = await fetch('/api/export-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: renderedHTML,
            filename: `${resume.personalInfo.name || 'resume'}.pdf`
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Export failed: ${errorData.error || response.statusText}`);
        }

        // Get the PDF blob
        const pdfBlob = await response.blob();

        // Create download link
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${resume.personalInfo.name || 'resume'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Cleanup
        root.unmount();
      } finally {
        // Always cleanup the temp container
        document.body.removeChild(tempContainer);
      }

    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExportingResumeId(null);
    }
  };

  const handleImportData = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            const resumeId = await ResumeService.importResumeData(content);

            // Refresh resumes list
            const allResumes = await ResumeService.getAllResumes();
            useResumeStore.setState({ resumes: allResumes });

            router.push(`/editor/${resumeId}`);
          } catch (error) {
            console.error('Failed to import resume:', error);
            alert('Failed to import resume. Please check the file format.');
          }
        };
        reader.readAsText(file);
      };

      input.click();
    } catch (error) {
      console.error('Failed to import data:', error);
    }
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template?.name || 'Unknown Template';
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    handleMobileMenuClose();
  };

  const formatDate = (date: Date) => {
    // Prevent hydration mismatch by using a consistent date format
    if (!isClientLoaded) return '';
    return date.toLocaleDateString();
  };

  if (isLoading || !isClientLoaded) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress size={60} sx={{ color: '#61C0BE' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Image
              src="/logo.svg"
              alt="Vitaena Logo"
              width={40}
              height={40}
              style={{ marginRight: '12px' }}
            />
            <Typography variant="h6" component="div" sx={{
              fontWeight: 700,
              color: '#61C0BE',
              fontSize: { xs: '1.25rem', md: '1.5rem' }
            }}>
              Vitaena
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {isClientLoaded && !isMobile && (
            <Box sx={{ display: 'flex', gap: 2, mr: 3 }}>
              <Button
                sx={{
                  color: 'text.primary',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(97, 192, 190, 0.1)',
                    color: '#61C0BE'
                  }
                }}
                onClick={() => scrollToSection('templates-section')}
              >
                Templates
              </Button>
              <Button
                sx={{
                  color: 'text.primary',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(97, 192, 190, 0.1)',
                    color: '#61C0BE'
                  }
                }}
                onClick={() => scrollToSection('documents-section')}
              >
                My Documents
              </Button>
            </Box>
          )}

          {/* Mobile Navigation */}
          {isClientLoaded && isMobile && (
            <IconButton
              size="large"
              onClick={handleMobileMenuOpen}
              sx={{
                mr: 1,
                color: '#61C0BE',
                '&:hover': {
                  backgroundColor: 'rgba(97, 192, 190, 0.1)'
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Desktop Import Button */}
          {isClientLoaded && !isMobile && (
            <Button
              variant="outlined"
              startIcon={<FileUpload />}
              onClick={handleImportData}
              sx={{
                mr: 2,
                borderColor: '#61C0BE',
                color: '#61C0BE',
                '&:hover': {
                  borderColor: '#4A9A98',
                  backgroundColor: 'rgba(97, 192, 190, 0.1)'
                }
              }}
            >
              Import Data
            </Button>
          )}

          <ThemeToggle />
        </Toolbar>
      </AppBar>

      {/* Mobile Menu */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: 'background.paper',
            minWidth: 200,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <MenuItem
          onClick={() => scrollToSection('templates-section')}
          sx={{
            py: 1.5,
            '&:hover': { backgroundColor: 'rgba(97, 192, 190, 0.1)' }
          }}
        >
          <Description sx={{ mr: 2, color: '#61C0BE' }} />
          Templates
        </MenuItem>
        <MenuItem
          onClick={() => scrollToSection('documents-section')}
          sx={{
            py: 1.5,
            '&:hover': { backgroundColor: 'rgba(97, 192, 190, 0.1)' }
          }}
        >
          <Edit sx={{ mr: 2, color: '#61C0BE' }} />
          My Documents
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleImportData();
            handleMobileMenuClose();
          }}
          sx={{
            py: 1.5,
            '&:hover': { backgroundColor: 'rgba(97, 192, 190, 0.1)' }
          }}
        >
          <FileUpload sx={{ mr: 2, color: '#61C0BE' }} />
          Import Data
        </MenuItem>
      </Menu>

      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(97, 192, 190, 0.1) 0%, rgba(97, 192, 190, 0.05) 100%)',
        pt: 8,
        pb: 12
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4.5rem' },
                background: 'linear-gradient(135deg, #61C0BE 0%, #4A9A98 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
                lineHeight: 1.2,
              }}
            >
              Build Your Perfect Resume
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                mb: 4,
                maxWidth: 700,
                mx: 'auto',
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                lineHeight: 1.6
              }}
            >
              Create professional resumes, CVs, and biodata with beautiful templates.
              100% private, works offline, no registration required.
            </Typography>

            {/* Feature Pills */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 6 }}>
              <Chip
                icon={<Security />}
                label="100% Private"
                sx={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  fontWeight: 600,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              />
              <Chip
                icon={<Speed />}
                label="Works Offline"
                sx={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  color: 'white',
                  fontWeight: 600,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(139, 92, 246, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              />
              <Chip
                icon={<Star />}
                label="Multiple Templates"
                sx={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: 'white',
                  fontWeight: 600,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(245, 158, 11, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Document Types Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{
            mb: 4,
            fontWeight: 700,
            textAlign: 'center',
            color: 'text.primary'
          }}>
            Choose Your Document Type
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 4,
            mb: 6
          }}>
            <Card sx={{
              height: '100%',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 24px rgba(97, 192, 190, 0.15)'
              },
              border: '1px solid',
              borderColor: 'rgba(97, 192, 190, 0.2)'
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Avatar sx={{
                  backgroundColor: '#61C0BE',
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2
                }}>
                  <Description sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Resume
                </Typography>
                <Typography color="text.secondary">
                  Professional resumes for job applications with modern layouts
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{
              height: '100%',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 24px rgba(97, 192, 190, 0.15)'
              },
              border: '1px solid',
              borderColor: 'rgba(97, 192, 190, 0.2)'
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Avatar sx={{
                  backgroundColor: '#61C0BE',
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2
                }}>
                  <Description sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  CV
                </Typography>
                <Typography color="text.secondary">
                  Comprehensive curriculum vitae for academic and research positions
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{
              height: '100%',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 24px rgba(97, 192, 190, 0.15)'
              },
              border: '1px solid',
              borderColor: 'rgba(97, 192, 190, 0.2)'
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Avatar sx={{
                  backgroundColor: '#61C0BE',
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2
                }}>
                  <Description sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Biodata
                </Typography>
                <Typography color="text.secondary">
                  Marriage biodata and personal profiles with elegant designs
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Templates Section */}
        <Box sx={{ mb: 8 }} id="templates-section">
          <Typography variant="h3" component="h2" gutterBottom sx={{
            mb: 4,
            fontWeight: 700,
            textAlign: 'center',
            color: 'text.primary'
          }}>
            Available Templates
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3
          }}>
            {templates.map((template) => (
              <Card
                key={template.id}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(97, 192, 190, 0.2)',
                  },
                  border: '1px solid',
                  borderColor: 'rgba(97, 192, 190, 0.1)'
                }}
                onClick={() => handleCreateResume(template.id)}
              >
                <Box
                  sx={{
                    height: 180,
                    background: 'linear-gradient(135deg, #61C0BE 0%, #4A9A98 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Description sx={{ fontSize: 48, opacity: 0.9 }} />
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)'
                  }} />
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={template.category}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(97, 192, 190, 0.1)',
                        color: '#61C0BE',
                        fontWeight: 500
                      }}
                    />
                    <Button
                      size="small"
                      startIcon={<Add />}
                      sx={{
                        color: '#61C0BE',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: 'rgba(97, 192, 190, 0.1)' }
                      }}
                    >
                      Create
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Existing Documents Section */}
        {resumes.length > 0 && (
          <Box sx={{ mb: 8 }} id="documents-section">
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 2, sm: 0 },
              mb: 4
            }}>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 700 }}>
                Your Documents ({resumes.length})
              </Typography>
              <TextField
                size="small"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  width: { xs: '100%', sm: 300 },
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#61C0BE',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#61C0BE',
                    },
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {isSearching ? <CircularProgress size={20} /> : <Search />}
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {filteredResumes.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {searchQuery ? 'No documents found' : 'No documents yet'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Get started by creating your first document'
                  }
                </Typography>
              </Box>
            ) : (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 3
              }}>
                {filteredResumes.map((resume) => (
                  <Card
                    key={resume.id}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(97, 192, 190, 0.15)'
                      },
                      border: '1px solid',
                      borderColor: 'rgba(97, 192, 190, 0.1)'
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Box sx={{
                        height: 120,
                        background: 'linear-gradient(135deg, rgba(97, 192, 190, 0.1) 0%, rgba(97, 192, 190, 0.05) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Description sx={{ fontSize: 36, color: '#61C0BE' }} />
                      </Box>
                      <Chip
                        label={getTemplateName(resume.templateId)}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: '#61C0BE',
                          color: 'white',
                          fontWeight: 500,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                        {resume.personalInfo.name || 'Untitled Document'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {resume.personalInfo.title || 'No title'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Updated {formatDate(resume.updatedAt)}
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => handleEditResume(resume.id)}
                        sx={{
                          flexGrow: 1,
                          backgroundColor: '#61C0BE',
                          '&:hover': { backgroundColor: '#4A9A98' }
                        }}
                      >
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDuplicateResume(resume.id)}
                        title="Duplicate"
                        sx={{
                          color: '#61C0BE',
                          '&:hover': { backgroundColor: 'rgba(97, 192, 190, 0.1)' }
                        }}
                      >
                        <ContentCopy />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleExportData(resume.id)}
                        title="Download PDF"
                        disabled={exportingResumeId === resume.id}
                        sx={{
                          color: '#61C0BE',
                          '&:hover': { backgroundColor: 'rgba(97, 192, 190, 0.1)' }
                        }}
                      >
                        {exportingResumeId === resume.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Download />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(resume.id)}
                        title="Delete"
                        sx={{ '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}
                      >
                        <Delete />
                      </IconButton>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this document? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            sx={{ '&:hover': { backgroundColor: '#d32f2f' } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
