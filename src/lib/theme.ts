import { createTheme, ThemeOptions } from "@mui/material/styles";

// Define the color palette
const lightPalette = {
  primary: {
    main: "#2563eb", // Blue
    light: "#60a5fa",
    dark: "#1d4ed8",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#64748b", // Slate
    light: "#94a3b8",
    dark: "#475569",
    contrastText: "#ffffff",
  },
  background: {
    default: "#ffffff",
    paper: "#ffffff",
  },
  text: {
    primary: "#0f172a",
    secondary: "#64748b",
  },
  divider: "#e2e8f0",
  action: {
    hover: "#f8fafc",
    selected: "#f1f5f9",
    disabled: "#cbd5e1",
    disabledBackground: "#f1f5f9",
  },
};

const darkPalette = {
  primary: {
    main: "#3b82f6", // Blue
    light: "#60a5fa",
    dark: "#1d4ed8",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#94a3b8", // Slate
    light: "#cbd5e1",
    dark: "#64748b",
    contrastText: "#000000",
  },
  background: {
    default: "#0f172a",
    paper: "#1e293b",
  },
  text: {
    primary: "#f8fafc",
    secondary: "#cbd5e1",
  },
  divider: "#334155",
  action: {
    hover: "#1e293b",
    selected: "#334155",
    disabled: "#475569",
    disabledBackground: "#1e293b",
  },
};

// Common theme options
const commonThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.25rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "1.875rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: "6px",
          padding: "8px 16px",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.12)",
          },
          transition: "all 0.2s ease-in-out",
        },
        contained: {
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow:
            "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
          "&:hover": {
            boxShadow:
              "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
          },
          transition: "box-shadow 0.2s ease-in-out",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "6px",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        },
      },
    },
  },
};

// Create light theme
export const lightTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: "light",
    ...lightPalette,
  },
});

// Create dark theme
export const darkTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: "dark",
    ...darkPalette,
  },
});
