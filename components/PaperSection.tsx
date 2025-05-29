
import React from 'react';

interface PaperSectionProps {
  title: string;
  level?: number; // For h2, h3, etc. default is 2 (h2)
  children: React.ReactNode;
}

export const PaperSection: React.FC<PaperSectionProps> = ({ title, level = 2, children }) => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  // prose classes handle styling, specific Tailwind classes for heading are fine but may be overridden by prose.
  // Ensure this component is used within an element that has `prose` class.
  return (
    <section className="my-8 py-4">
      <HeadingTag className="font-semibold mb-6 pb-2 border-b border-slate-600 text-sky-400">
        {title}
      </HeadingTag>
      <div className="space-y-4 text-slate-300">
        {children}
      </div>
    </section>
  );
};