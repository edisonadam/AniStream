import React, { useState } from 'react';
import { CloseIcon, CaptionsIcon } from './icons/Icons';
import { useToast } from '../hooks/useToast';

interface SubmitSubtitlesModalProps {
  onClose: () => void;
}

const SubmitSubtitlesModal: React.FC<SubmitSubtitlesModalProps> = ({ onClose }) => {
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('English');
    const [type, setType] = useState('subtitle');
    const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
    const [fontFiles, setFontFiles] = useState<FileList | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subtitleFile) {
            addToast('Please select a subtitle file.', 'warning');
            return;
        }
        setIsSubmitting(true);
        // Simulate submission
        setTimeout(() => {
            addToast('Subtitles submitted for review!', 'success');
            setIsSubmitting(false);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-cinematic-fade-in p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-lg m-4 p-6 relative" onClick={e => e.stopPropagation()}>
                <button type="button" onClick={onClose} className="absolute top-3 right-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                <div className="text-center mb-6">
                    <CaptionsIcon className="mx-auto w-8 h-8 text-[rgb(var(--color-primary-accent))]" />
                    <h3 className="text-xl font-bold mt-2 text-[rgb(var(--text-primary))]">Submit Fan Subtitles</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="sub-title" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Subtitle Title</label>
                        <input type="text" id="sub-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Songs & Signs, Full" required className="w-full bg-[rgb(var(--surface-input))] border border-white/10 rounded-xl px-3 py-2 text-sm"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="sub-lang" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Language</label>
                            <input type="text" id="sub-lang" value={language} onChange={e => setLanguage(e.target.value)} placeholder="e.g., English" required className="w-full bg-[rgb(var(--surface-input))] border border-white/10 rounded-xl px-3 py-2 text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="sub-type" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Subtitle Type</label>
                            <select id="sub-type" value={type} onChange={e => setType(e.target.value)} className="w-full bg-[rgb(var(--surface-input))] border border-white/10 rounded-xl px-3 py-2 text-sm">
                                <option value="subtitle">Subtitle (for original audio)</option>
                                <option value="dubtitle">Dubtitle (for dubbed audio)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="sub-file" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Subtitle File (.ass)</label>
                        <input type="file" id="sub-file" accept=".ass" onChange={e => setSubtitleFile(e.target.files?.[0] || null)} required className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[rgb(var(--color-primary))] file:text-white hover:file:bg-[rgb(var(--color-primary-hover))]"/>
                    </div>
                     <div>
                        <label htmlFor="font-files" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Font Files (.ttf, .otf) - Optional</label>
                        <input type="file" id="font-files" accept=".ttf,.otf" multiple onChange={e => setFontFiles(e.target.files)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"/>
                    </div>
                </div>

                <div className="mt-6 p-3 bg-black/20 rounded-lg text-xs text-[rgb(var(--text-muted))] space-y-1">
                    <p className="font-bold">Submission Guidelines:</p>
                    <ul className="list-disc list-inside pl-2">
                        <li>Subtitle files must be in .ass format.</li>
                        <li>Font files must be .ttf or .otf format.</li>
                        <li>Maximum file size: 10MB per file.</li>
                        <li>Submissions will be reviewed before approval.</li>
                    </ul>
                </div>

                 <button type="submit" disabled={isSubmitting} className="mt-4 w-full py-3 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                            <span>Submitting...</span>
                        </>
                    ) : 'Submit'}
                 </button>
            </form>
        </div>
    );
};

export default SubmitSubtitlesModal;