'use client';

import { ArrowBack, Home } from '@mui/icons-material';
import { Box, Button, Container, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
    return (
        <Container maxWidth="md">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    textAlign: 'center',
                    py: 8,
                }}
            >
                <Image
                    src="/logo.svg"
                    alt="Vitaena Logo"
                    width={120}
                    height={120}
                    style={{ marginBottom: '2rem', opacity: 0.8 }}
                />

                <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                        fontSize: { xs: '4rem', md: '6rem' },
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #61C0BE 0%, #4A9A98 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 2,
                    }}
                >
                    404
                </Typography>

                <Typography
                    variant="h4"
                    component="h2"
                    sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 2,
                    }}
                >
                    Page Not Found
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: 'text.secondary',
                        mb: 4,
                        maxWidth: 500,
                        lineHeight: 1.6,
                    }}
                >
                    The page you&apos;re looking for doesn&apos;t exist. It might have been moved, deleted, or you entered the wrong URL.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button
                        component={Link}
                        href="/"
                        variant="contained"
                        startIcon={<Home />}
                        sx={{
                            background: 'linear-gradient(135deg, #61C0BE 0%, #4A9A98 100%)',
                            color: 'white',
                            fontWeight: 600,
                            px: 3,
                            py: 1.5,
                            borderRadius: 2,
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(97, 192, 190, 0.4)',
                            },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        Go Home
                    </Button>

                    <Button
                        onClick={() => window.history.back()}
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        sx={{
                            borderColor: '#61C0BE',
                            color: '#61C0BE',
                            fontWeight: 600,
                            px: 3,
                            py: 1.5,
                            borderRadius: 2,
                            '&:hover': {
                                borderColor: '#4A9A98',
                                backgroundColor: 'rgba(97, 192, 190, 0.1)',
                            },
                        }}
                    >
                        Go Back
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}
