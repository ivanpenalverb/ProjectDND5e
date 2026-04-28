"use client";
import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/utils/i18n';

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const savedLng = localStorage.getItem('i18nextLng');
    if (savedLng && savedLng !== i18n.language) {
      i18n.changeLanguage(savedLng);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
