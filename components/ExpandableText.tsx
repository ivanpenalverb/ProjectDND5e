"use client";
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ExpandableText = ({ text }: { text: string | string[] }) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  const formattedText = Array.isArray(text) ? text.join('\n\n') : text;

  if (!formattedText) return null;

  return (
    <div className="mt-2 border-t border-zinc-800/50 pt-2">
      <div className={`text-sm text-zinc-500 transition-all ${expanded ? '' : 'line-clamp-2'} whitespace-pre-wrap`}>
        {formattedText}
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="flex items-center gap-1 text-xs text-accent-gold mt-2 hover:text-yellow-400 transition-colors"
      >
        {expanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} 
        {expanded ? t('actions.showLess', 'Show Less') : t('actions.showMore', 'Show More')}
      </button>
    </div>
  );
};
