import { FC, useState } from 'react';
import { STButton, STTextarea } from 'sillytavern-utils-lib/components';
import { IEntry } from '../types.js';

export interface SuggestedPromptProps {
    entry: IEntry;
    onReviseText: (entry: IEntry, prompt: string) => void;
    onDismiss: (uid: number) => void;
    onGenerateImage: (entry: IEntry) => void;
    onRefineImage: (entry: IEntry, refineInstruction: string, includeAvatars: boolean) => void;
    onPostToChat: (entry: IEntry) => void;
    isGenerating: boolean;
}

export const SuggestedPrompt: FC<SuggestedPromptProps> = ({ entry, onReviseText, onDismiss, onGenerateImage, onRefineImage, onPostToChat, isGenerating }) => {
    const [revisePrompt, setRevisePrompt] = useState('');
    const [includeAvatars, setIncludeAvatars] = useState(true);

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(entry.content);
        // @ts-ignore
        SillyTavern.getContext().st_echo('success', 'Copied to clipboard!');
    };

    return (
        <div className="entry">
            <div className="menu">
                {entry.type === 'text' && (
                    <STButton onClick={() => onGenerateImage(entry)} className="menu_button interactable generate" title="Generate an image from this prompt." disabled={isGenerating}>
                        {isGenerating ? '...' : 'Generate Image'}
                    </STButton>
                )}
                {entry.type === 'image' && (
                    <STButton onClick={() => onPostToChat(entry)} className="menu_button interactable publish" title="Post this image to the chat." disabled={isGenerating}>
                        {isGenerating ? '...' : 'Post to Chat'}
                    </STButton>
                )}
                <STButton onClick={handleCopyToClipboard} className="menu_button interactable" title="Copy the prompt text to your clipboard.">
                    Copy
                </STButton>
                <STButton onClick={() => onDismiss(entry.uid)} className="menu_button interactable remove">
                    Dismiss
                </STButton>
            </div>
            <h4 className="comment">{entry.comment}</h4>
            {entry.type === 'image' && entry.imageUrl && (
                <div className="image-container" style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <img src={entry.imageUrl} alt={entry.comment} style={{ maxWidth: '100%', borderRadius: '8px' }} />
                </div>
            )}
            <div className="content">{entry.content}</div>
            <div className="continue-prompt-section" style={{ marginTop: '10px' }}>
                <STTextarea
                    value={revisePrompt}
                    onChange={(e) => setRevisePrompt(e.target.value)}
                    placeholder={entry.type === 'text' ? "Optional instructions to revise this text prompt..." : "Optional instructions to refine this image..."}
                    rows={2}
                    style={{ width: '100%' }}
                />
                {entry.type === 'text' ? (
                    <STButton
                        onClick={() => onReviseText(entry, revisePrompt)}
                        disabled={isGenerating}
                        className="menu_button interactable revise"
                        title="Revise the text prompt."
                        style={{ marginTop: '5px' }}
                    >
                        {isGenerating ? '...' : 'Revise Text'}
                    </STButton>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                        <STButton
                            onClick={() => onRefineImage(entry, revisePrompt, includeAvatars)}
                            disabled={isGenerating}
                            className="menu_button interactable revise"
                            title="Refine the generated image."
                        >
                            {isGenerating ? '...' : 'Refine Image'}
                        </STButton>
                        <label className="checkbox_label">
                            <input
                                type="checkbox"
                                checked={includeAvatars}
                                onChange={(e) => setIncludeAvatars(e.target.checked)}
                            />
                            Include Avatars
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};