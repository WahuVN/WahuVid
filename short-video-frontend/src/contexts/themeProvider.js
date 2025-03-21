import React, { createContext, useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const ColorModeContext = createContext({ toggleColorMode: () => { } });

export const ToggleColorMode = ({ children }) => {
  const [mode, setMode] = useState(localStorage.getItem('colorMode') || 'light');
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
        localStorage.setItem('colorMode', localStorage.getItem('colorMode') === 'light' ? 'dark' : 'light');
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#fe2c55' : '#d6002a',
            light: mode === 'light' ? '#ff79b0' : '#ffb2dd',
            dark: mode === 'light' ? '#c60055' : '#c51162',
            contrastText: '#ffffff',
          },
          secondary: {
            main: mode === 'light' ? '#3f51b5' : '#8c9eff',
            light: mode === 'light' ? '#7986cb' : '#b39ddb',
            dark: mode === 'light' ? '#303f9f' : '#5c6bc0',
            contrastText: '#ffffff',
          },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
          text: {
            primary: mode === 'light' ? '#444' : '#ffffff',
            secondary: mode === 'light' ? '#757575' : '#b0b0b0',
          },
          custom: {
            header: mode === 'light' ? '#ffffff' : '#1e1e1e',
            search: mode === 'light' ? '#f1f1f2' : '#2f2f2f',
            icon: mode === 'light' ? '#757575' : '#b0b0b0',
            hover: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
            playButton: "#FFF"
          },
        },
        shape: {
          borderRadius: 8,
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontSize: '2.5rem',
            fontWeight: 500,
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 500,
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.5,
          },
          body2: {
            fontSize: '0.8rem',
            lineHeight: 1.2,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: '20px',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
                  },
                },
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
