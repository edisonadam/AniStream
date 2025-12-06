
import React from 'react';
import { ChevronLeftIcon, ShieldCheckIcon } from './icons/Icons';

interface RulesPageProps {
  onGoBack: () => void;
}

const RuleItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-xl font-semibold text-[rgb(var(--color-primary-accent))] mb-2">{title}</h3>
        <p>{children}</p>
    </div>
);

const RulesPage: React.FC<RulesPageProps> = ({ onGoBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6" />
        <span>Back</span>
      </button>

      <div className="max-w-4xl mx-auto bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-8 rounded-3xl border border-white/10">
        <div className="text-center mb-8">
          <ShieldCheckIcon className="w-12 h-12 mx-auto text-[rgb(var(--color-primary-accent))]" />
          <h1 className="text-4xl font-bold mt-4 text-[rgb(var(--text-primary))]">Community Rules & Guidelines</h1>
          <p className="text-lg text-[rgb(var(--text-muted))] mt-2">Let's keep ANISTREAM a fun and welcoming place for everyone.</p>
        </div>
        
        <div className="space-y-6 text-md text-[rgb(var(--text-secondary))]">
          <RuleItem title="1. Be Respectful">
            Treat all members with respect. Harassment, hate speech, personal attacks, and any form of discrimination will not be tolerated. Disagreements are fine, but keep them civil.
          </RuleItem>
          
          <RuleItem title="2. No Spoilers (Without Warning)">
            Do not post spoilers for recent episodes or major plot points without using appropriate spoiler tags or clear warnings. Ruining the experience for others is not cool.
          </RuleItem>
          
          <RuleItem title="3. Keep it Relevant">
            While off-topic discussions can happen, please try to keep comments on an anime page relevant to that anime. Use the Community Hub for more general chats.
          </RuleItem>
          
          <RuleItem title="4. No NSFW or Illegal Content">
            Do not post sexually explicit, gory, or otherwise not-safe-for-work content. Linking to illegal streams, downloads, or any other infringing material is strictly prohibited.
          </RuleItem>
          
          <RuleItem title="5. No Spam or Self-Promotion">
            Avoid spamming comments, creating multiple accounts for malicious purposes, or excessively promoting your own content or social media without permission.
          </RuleItem>

          <RuleItem title="6. Use the Report Button">
            If you see a comment or user breaking these rules, please use the report function. Do not engage in arguments; let the moderation team handle it.
          </RuleItem>

          <div className="pt-6 border-t border-white/10 text-center">
             <p className="text-md text-[rgb(var(--text-muted))]">Failure to follow these rules may result in comment deletion, temporary suspension, or a permanent ban from the community. Thanks for your cooperation!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesPage;
