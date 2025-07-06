import { Box, CircularProgress, Typography } from '@mui/material';
import Image from 'next/image';

export default function Loading() {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'background.default',
                gap: 3,
            }}
        >
            <Image
                src="/logo.svg"
                alt="Vitaena Logo"
                width={80}
                height={80}
                style={{ opacity: 0.8 }}
            />

            <CircularProgress
                size={60}
                sx={{
                    color: '#61C0BE',
                    '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                    },
                }}
            />

            <Typography
                variant="body1"
                sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                    fontSize: '1.1rem',
                }}
            >
                Loading Vitaena...
            </Typography>
        </Box>
    );
}
