import React from 'react';

interface AlphabeticalBrowseProps {
  onLetterSelect: (letter: string) => void;
  selectedLetter?: string;
}

const AlphabeticalBrowse: React.FC<AlphabeticalBrowseProps> = ({ onLetterSelect, selectedLetter }) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const numbers = '#'; // Changed from 0-9 as Jikan API does not support number ranges

  const Button: React.FC<{ char: string }> = ({ char }) => {
    const isSelected = selectedLetter?.toLowerCase() === char.toLowerCase();
    return (
      <button
        onClick={() => onLetterSelect(char)}
        className={`flex-1 text-center py-2.5 rounded-lg font-bold transition-all duration-200 transform hover:scale-110 ${
          isSelected
            ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg shadow-[rgb(var(--shadow-color))/0.4]'
            : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--color-primary-accent))]'
        }`}
      >
        {char}
      </button>
    );
  };

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8 text-center" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
        Browse A-Z
      </h2>
      <div className="bg-[rgb(var(--surface-2))/0.5] backdrop-blur-md rounded-2xl p-4">
        <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-14 gap-2">
            <Button char={numbers} />
            {alphabet.map(letter => (
                <Button key={letter} char={letter} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default AlphabeticalBrowse;