import React from 'react';
import { Language } from '../../types';
import HeroSection from './HeroSection';
import HowItWorksSection from './HowItWorksSection';
import Feature1Section from './Feature1Section';
import Feature2Section from './Feature2Section';

interface LandingPageProps {
  lang: Language;
}

const LandingPage: React.FC<LandingPageProps> = ({ lang }) => {
  return (
    <div className="w-full overflow-y-auto h-screen bg-[#0D0D0D]">
      <HeroSection lang={lang} />
      <HowItWorksSection lang={lang} />
      <Feature1Section lang={lang} />
      <Feature2Section lang={lang} />
    </div>
  );
};

export default LandingPage;
