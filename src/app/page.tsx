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
  Search,
} from '@mui/icons-material';
import {
  AppBar,
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
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { templates, resumes, createResume, deleteResume, duplicateResume, isLoading } = useResumeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResumes, setFilteredResumes] = useState<ResumeData[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

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
      const jsonData = await ResumeService.exportResumeData(resumeId);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const resume = resumes.find(r => r.id === resumeId);
      const filename = `${resume?.personalInfo.name || 'resume'}_data.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export resume data:', error);
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

  if (isLoading) {
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
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Offline Resume Maker
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FileUpload />}
            onClick={handleImportData}
            sx={{ mr: 2 }}
          >
            Import Data
          </Button>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            Create Professional Resumes
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
          >
            Build stunning resumes with multiple templates, all stored locally on your device
          </Typography>
        </Box>

        {/* Templates Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
            Choose a Template
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {templates.map((template) => (
              <Card
                key={template.id}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleCreateResume(template.id)}
              >
                <Box
                  sx={{
                    height: 200,
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Description sx={{ fontSize: 64 }} />
                </Box>
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={template.category} size="small" />
                    <Button size="small" startIcon={<Add />}>
                      Create
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Existing Resumes Section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h2">
              Your Resumes ({resumes.length})
            </Typography>
            <TextField
              size="small"
              placeholder="Search resumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 300 }}
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
                {searchQuery ? 'No resumes found' : 'No resumes yet'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Get started by creating your first resume'
                }
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                },
                gap: 3,
              }}
            >
              {filteredResumes.map((resume) => (
                <Card key={resume.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  {/* Template Badge - positioned at top right */}
                  <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
                    <Chip
                      label={getTemplateName(resume.templateId)}
                      size="small"
                      variant="filled"
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '& .MuiChip-label': { fontSize: '0.75rem', fontWeight: 500 },
                        boxShadow: 1
                      }}
                    />
                  </Box>

                  <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {resume.personalInfo.name || 'Untitled Resume'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {resume.personalInfo.title || 'No title'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Updated {resume.updatedAt.toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                    <Button
                      variant="contained"
                      startIcon={<Edit />}
                      onClick={() => handleEditResume(resume.id)}
                      sx={{ flexGrow: 1, mr: 1 }}
                    >
                      Edit
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleDuplicateResume(resume.id)}
                      title="Duplicate"
                    >
                      <ContentCopy />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleExportData(resume.id)}
                      title="Export"
                    >
                      <Download />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(resume.id)}
                      title="Delete"
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Resume</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this resume? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
