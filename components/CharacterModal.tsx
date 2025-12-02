
import React, { useState, useEffect } from 'react';
import type { Character, VoiceActor } from '../types';
import { CloseIcon } from './icons/Icons';
import { fetchWithRetry } from '../api';

interface CharacterModalProps {
  character: Character;
  onClose: () => void;
  onVoiceActorSelect?: (id: number) => void;
}

const CharacterModal: React.FC<CharacterModalProps> = ({ character, onClose, onVoiceActorSelect }) => {
  const [fullCharacter, setFullCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFullCharacter = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchWithRetry(`https://api.jikan.moe/v4/characters/${character.id}/full`);
        if (!res.ok) {
          throw new Error(`Failed to fetch character details. Status: ${res.status}`);
        }
        const data = (await res.json()).data;
        parseData(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    const parseData = (data: any) => {
      if (!data) {
        setFullCharacter(character); // Fallback to basic info
        return;
      }

      const voiceActors: VoiceActor[] = (data.voices || []).map((va: any) => ({
        id: va.person.mal_id,
        name: va.person.name,
        image: va.person.images?.jpg?.image_url || '',
        language: va.language,
      })).filter((va: VoiceActor) => va.id && va.name && va.image);

      setFullCharacter({
        ...character,
        name_kanji: data.name_kanji,
        about: data.about,
        voiceActors: voiceActors,
      });
    };

    fetchFullCharacter();
  }, [character.id, character]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const displayCharacter = fullCharacter || character;
  const hasDetails = !!displayCharacter.about || !!displayCharacter.name_kanji || displayCharacter.voiceActors.length > 0;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="aspect-[2/3] w-full bg-[rgb(var(--surface-4))] rounded-lg"></div>
            </div>
            <div className="md:col-span-2 space-y-4">
              <div className="h-8 bg-[rgb(var(--surface-4))] rounded w-3/4"></div>
              <div className="h-6 bg-[rgb(var(--surface-4))] rounded w-1/2"></div>
              <div className="space-y-2 pt-4">
                <div className="h-4 bg-[rgb(var(--surface-4))] rounded"></div>
                <div className="h-4 bg-[rgb(var(--surface-4))] rounded w-5/6"></div>
                <div className="h-4 bg-[rgb(var(--surface-4))] rounded w-4/6"></div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="h-6 bg-[rgb(var(--surface-4))] rounded w-1/3 mb-4"></div>
            <div className="flex gap-4">
              <div className="w-24 h-40 bg-[rgb(var(--surface-4))] rounded-lg"></div>
              <div className="w-24 h-40 bg-[rgb(var(--surface-4))] rounded-lg"></div>
              <div className="w-24 h-40 bg-[rgb(var(--surface-4))] rounded-lg"></div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-[rgb(var(--color-danger))]">{error}</p>;
    }

    if (!hasDetails) {
      return <p className="text-center text-[rgb(var(--text-muted))]">No detailed information available for this character.</p>;
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <img loading="lazy" src={displayCharacter.image} alt={displayCharacter.name} className="w-full h-auto object-cover rounded-lg shadow-lg" />
          </div>
          <div className="md:col-span-2">
            <h2 className="text-3xl font-bold text-[rgb(var(--text-primary))]">{displayCharacter.name}</h2>
            {displayCharacter.name_kanji && <h3 className="text-xl text-[rgb(var(--text-muted))] mb-4">{displayCharacter.name_kanji}</h3>}
            {displayCharacter.about && (
              <>
                <h4 className="font-semibold text-[rgb(var(--color-primary-accent))] mt-4 mb-2">About</h4>
                <p className="text-[rgb(var(--text-secondary))] text-sm max-h-48 overflow-y-auto whitespace-pre-wrap pr-2" style={{ scrollbarWidth: 'thin' }}>
                  {displayCharacter.about}
                </p>
              </>
            )}
          </div>
        </div>

        {displayCharacter.voiceActors.length > 0 && (
          <div className="mt-8">
            <h4 className="text-xl font-semibold text-[rgb(var(--color-primary-accent))] mb-4">Voice Actors</h4>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6" style={{ scrollbarWidth: 'thin' }}>
              {displayCharacter.voiceActors.map(va => (
                <button 
                    key={va.id} 
                    onClick={() => {
                        onClose();
                        if (onVoiceActorSelect) onVoiceActorSelect(va.id);
                    }}
                    className="flex-shrink-0 w-28 text-center group focus:outline-none"
                >
                  <div className="aspect-[2/3] w-full rounded-lg overflow-hidden shadow-md transform transition-transform duration-300 group-hover:scale-105">
                    <img loading="lazy" src={va.image} alt={va.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--text-primary))] truncate group-hover:text-[rgb(var(--color-primary-accent))]">{va.name}</p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">{va.language}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center animate-cinematic-fade-in p-4" onClick={onClose}>
      <div className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-2xl border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] relative flex flex-col animate-modal-pop-in" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">Character Details</h3>
          <button onClick={onClose} className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CharacterModal;
