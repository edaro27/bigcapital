import {
  defaultTheme,
  ThemeProvider as XStyledEmotionThemeProvider,
} from '@xstyled/emotion';
import React from 'react';
import {
  ThemeProvider as StyleComponentsThemeProvider,
  StyleSheetManager,
} from 'styled-components';
import rtlPlugin from 'stylis-plugin-rtl';
import { useAppIntlContext } from '../AppIntlProvider';

const theme = {
  ...defaultTheme,
  bpPrefix: 'bp4',
};

interface DashboardThemeProviderProps {
  children: React.ReactNode;
}

export function DashboardThemeProvider({
  children,
}: DashboardThemeProviderProps) {
  const { direction } = useAppIntlContext();

  return (
    <StyleSheetManager
      {...(direction === 'rtl' ? { stylisPlugins: [rtlPlugin as any] } : {})}
    >
      <StyleComponentsThemeProvider theme={{ dir: direction }}>
        <XStyledEmotionThemeProvider theme={theme}>
          {children}
        </XStyledEmotionThemeProvider>
      </StyleComponentsThemeProvider>
    </StyleSheetManager>
  );
}
