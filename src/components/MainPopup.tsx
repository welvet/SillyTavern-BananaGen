import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import {
    STButton,
    STConnectionProfileSelect,
    STPresetSelect,
    STTextarea,
    PresetItem,
} from 'sillytavern-utils-lib/components';
import { BuildPromptOptions, Message } from 'sillytavern-utils-lib';
import {
    selected_group,
    st_echo,
    st_getCharaFilename,
    this_chid,
} from 'sillytavern-utils-lib/config';
import { IEntry } from '../types.js';
import { runTextPromptGeneration, runImageGeneration } from '../generate.js';
import { ExtensionSettings, settingsManager } from '../settings.js';
// @ts-ignore
import { Handlebars } from '../../../../../lib.js';
import { useForceUpdate } from '../hooks/useForceUpdate.js';
import { SuggestedPrompt } from './SuggestedPrompt.js';
import { AvatarManager, AvatarItem } from '../utils/avatarManager.js';

if (!Handlebars.helpers['join']) {
    Handlebars.registerHelper('join', function (array: any, separator: any) {
        return array.join(separator);
    });
}

const globalContext = SillyTavern.getContext();
export const comment_avatar = 'img/quill.png';

// Helper to get current character/group avatar filename
const getAvatar = () => (this_chid ? st_getCharaFilename(this_chid) : selected_group);

interface MainPopupProps {
    onClose: () => void;
}

export const MainPopup: FC<MainPopupProps> = ({ onClose }) => {
    const forceUpdate = useForceUpdate();
    const settings = settingsManager.getSettings();
    const [entries, setEntries] = useState<IEntry[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [characters, setCharacters] = useState<AvatarItem[]>([]);
    const [personas, setPersonas] = useState<AvatarItem[]>([]);
    const [backgrounds, setBackgrounds] = useState<string[]>([]);
    const [selectedCharacter, setSelectedCharacter] = useState<string>('');
    const [selectedPersona, setSelectedPersona] = useState<string>('');
    const [selectedBackground, setSelectedBackground] = useState<string>('');

    const avatarManager = useMemo(() => new AvatarManager(), []);

    useEffect(() => {
        const chars = avatarManager.getCharacters();
        const pers = avatarManager.getPersonas();
        avatarManager.getBackgrounds().then(bgs => setBackgrounds(bgs));
        setCharacters(chars);
        setPersonas(pers);
        // @ts-ignore
        setSelectedCharacter(chars.find(c => c.name === avatarManager.getDefaultCharacterName())?.avatarFile ?? '');
        // @ts-ignore
        setSelectedPersona(pers.find(p => p.name === avatarManager.getDefaultPersonaName())?.avatarFile ?? '');
        console.log('Default character:', avatarManager.getDefaultCharacterName());
    }, [avatarManager]);

    const avatarKey = useMemo(() => getAvatar() ?? '_global', [this_chid, selected_group]);

    const updateSetting = <K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) => {
        settingsManager.getSettings()[key] = value;
        settingsManager.saveSettings();
        forceUpdate();
    };

    const updateContextToSend = <K extends keyof ExtensionSettings['contextToSend']>(
        key: K,
        value: ExtensionSettings['contextToSend'][K],
    ) => {
        settingsManager.getSettings().contextToSend[key] = value;
        settingsManager.saveSettings();
        forceUpdate();
    };

    const promptPresetItems = useMemo(
        (): PresetItem[] => Object.keys(settings.promptPresets).map((key) => ({ value: key, label: key })),
        [settings.promptPresets],
    );

    const handleTextPromptGeneration = useCallback(
        async (continueFrom?: { entry: IEntry; prompt: string; mode: 'continue' | 'revise' }) => {
            if (!settings.profileId) return st_echo('warning', 'Please select a text generation profile.');

            const userPrompt = continueFrom?.prompt ?? settings.promptPresets[settings.promptPreset].content;

            if (!continueFrom && !userPrompt) {
                return st_echo('warning', 'Please enter a prompt.');
            }

            setIsGenerating(true);
            try {
                const profile = globalContext.extensionSettings.connectionManager?.profiles?.find(
                    (p) => p.id === settings.profileId,
                );
                if (!profile) throw new Error('Text generation profile not found.');

                const buildPromptOptions: BuildPromptOptions = {
                    presetName: profile.preset,
                    contextName: profile.context,
                    instructName: profile.instruct,
                    syspromptName: profile.sysprompt,
                    ignoreCharacterFields: !settings.contextToSend.charCard,
                    ignoreWorldInfo: true,
                    ignoreAuthorNote: !settings.contextToSend.authorNote,
                    maxContext:
                        settings.maxContextType === 'custom'
                            ? settings.maxContextValue
                            : settings.maxContextType === 'profile'
                                ? 'preset'
                                : 'active',
                    includeNames: !!selected_group,
                };

                const avatar = getAvatar();
                if (!avatar) {
                    buildPromptOptions.messageIndexesBetween = { start: -1, end: -1 };
                } else {
                    switch (settings.contextToSend.messages.type) {
                        case 'none':
                            buildPromptOptions.messageIndexesBetween = { start: -1, end: -1 };
                            break;
                        case 'first':
                            buildPromptOptions.messageIndexesBetween = { start: 0, end: settings.contextToSend.messages.first ?? 10 };
                            break;
                        case 'last': {
                            const lastCount = settings.contextToSend.messages.last ?? 10;
                            const chatLength = globalContext.chat?.length ?? 0;
                            buildPromptOptions.messageIndexesBetween = {
                                end: Math.max(0, chatLength - 1),
                                start: Math.max(0, chatLength - lastCount),
                            };
                            break;
                        }
                        case 'range':
                            if (settings.contextToSend.messages.range)
                                buildPromptOptions.messageIndexesBetween = settings.contextToSend.messages.range;
                            break;
                    }
                }

                const promptSettings = structuredClone(settings.prompts);
                if (!settings.contextToSend.stDescription) delete (promptSettings as any).stDescription;

                const continueFromPayload = continueFrom
                    ? { entry: continueFrom.entry, mode: continueFrom.mode }
                    : undefined;

                const resultingEntries = await runTextPromptGeneration({
                    profileId: settings.profileId,
                    userPrompt: userPrompt,
                    buildPromptOptions,
                    entries,
                    promptSettings,
                    mainContextList: settings.mainContextTemplatePresets[settings.mainContextTemplatePreset].prompts
                        .filter((p) => p.enabled)
                        .map((p) => ({ promptName: p.promptName, role: p.role })),
                    maxResponseToken: settings.maxResponseToken,
                    continueFrom: continueFromPayload,
                });

                if (resultingEntries.length > 0) {
                    if (continueFrom) {
                        setEntries((prevEntries) =>
                            prevEntries.map((entry) => (entry.uid === continueFrom.entry.uid ? { ...resultingEntries[0], type: 'text' } : entry)),
                        );
                        st_echo('success', 'Revised prompt.');
                    } else {
                        const newEntries = resultingEntries.map(entry => ({ ...entry, type: 'text' as const }));
                        setEntries((prevEntries) => [...newEntries, ...prevEntries]);
                        st_echo('success', `Added ${newEntries.length} new prompts.`);
                    }
                } else {
                    st_echo('warning', 'No results from AI');
                }
            } catch (error: any) {
                console.error(error);
                st_echo('error', error instanceof Error ? error.message : String(error));
            } finally {
                setIsGenerating(false);
            }
        },
        [settings, entries],
    );

    const handleImageGeneration = useCallback(async (entry: IEntry, includeAvatars: boolean) => {
        if (!settings.imageProfileId) return st_echo('warning', 'Please select an image generation profile.');

        setIsGenerating(true);
        try {
            const messages: any[] = [{ role: 'user', content: entry.content }];

            if (includeAvatars) {
                const charAvatar = await avatarManager.getAvatarBase64('avatar', selectedCharacter);
                const personaAvatar = await avatarManager.getAvatarBase64('persona', selectedPersona);
                const background = await avatarManager.getAvatarBase64('bg', selectedBackground);

                if (charAvatar) {
                    messages[0].content = [{ type: 'text', text: messages[0].content }, { type: 'image_url', image_url: { url: charAvatar } }];
                }
                if (personaAvatar) {
                    if (Array.isArray(messages[0].content)) {
                        messages[0].content.push({ type: 'image_url', image_url: { url: personaAvatar } });
                    } else {
                        messages[0].content = [{ type: 'text', text: messages[0].content }, { type: 'image_url', image_url: { url: personaAvatar } }];
                    }
                }
                if (background) {
                    if (Array.isArray(messages[0].content)) {
                        messages[0].content.push({ type: 'image_url', image_url: { url: background } });
                    } else {
                        messages[0].content = [{ type: 'text', text: messages[0].content }, { type: 'image_url', image_url: { url: background } }];
                    }
                }
            }

            const { imageUrl, textResponse } = await runImageGeneration({
                profileId: settings.imageProfileId,
                imagePromptTemplate: settings.prompts.imagePromptTemplate.content,
                maxResponseToken: settings.maxResponseToken,
                messages,
            });

            if (textResponse) {
                st_echo(imageUrl ? 'success' : 'info', textResponse);
            }

            if (!imageUrl) {
                st_echo('error', 'Image generation failed. No image was returned.');
                return;
            }

            const newImageEntry: IEntry = {
                ...entry,
                uid: Date.now(), // new UID for the image entry
                parentUid: entry.uid,
                type: 'image',
                imageUrl,
            };

            setEntries(prev => [newImageEntry, ...prev]);
            st_echo('success', 'Image generated successfully!');

        } catch (error: any) {
            console.error(error);
            st_echo('error', error instanceof Error ? error.message : String(error));
        } finally {
            setIsGenerating(false);
        }
    }, [settings, selectedCharacter, selectedPersona, selectedBackground, avatarManager]);

    const handleRefineImage = useCallback(async (entry: IEntry, refineInstruction: string, includeAvatars: boolean) => {
        if (!settings.imageProfileId) return st_echo('warning', 'Please select an image generation profile.');
        if (!refineInstruction) return st_echo('warning', 'Please enter refinement instructions.');

        setIsGenerating(true);
        try {
            // Build message history with images
            const content: any[] = [{ type: 'text', text: refineInstruction }];
            let current: IEntry | undefined = entry;
            const allEntries = [...entries];

            while (current) {
                if (current.type === 'image' && current.imageUrl) {
                    content.push({
                        type: 'image_url',
                        image_url: {
                            url: current.imageUrl,
                        },
                    });
                }
                current = allEntries.find(e => e.uid === current!.parentUid);
            }

            if (includeAvatars) {
                const charAvatar = await avatarManager.getAvatarBase64('avatar', selectedCharacter);
                const personaAvatar = await avatarManager.getAvatarBase64('persona', selectedPersona);
                const background = await avatarManager.getAvatarBase64('bg', selectedBackground);

                if (charAvatar) {
                    content.push({ type: 'image_url', image_url: { url: charAvatar } });
                }
                if (personaAvatar) {
                    content.push({ type: 'image_url', image_url: { url: personaAvatar } });
                }
                if (background) {
                    content.push({ type: 'image_url', image_url: { url: background } });
                }
            }

            const messages = [{
                role: 'user',
                content: content.reverse(), // Reverse to put text first, then images
            }];

            const { imageUrl, textResponse } = await runImageGeneration({
                profileId: settings.imageProfileId,
                imagePromptTemplate: settings.prompts.imagePromptTemplate.content,
                maxResponseToken: settings.maxResponseToken,
                messages,
            });

            if (textResponse) {
                st_echo(imageUrl ? 'success' : 'info', textResponse);
            }

            if (!imageUrl) {
                st_echo('error', 'Image refinement failed. No image was returned.');
                return;
            }

            const newImageEntry: IEntry = {
                ...entry,
                uid: Date.now(),
                parentUid: entry.uid,
                type: 'image',
                imageUrl,
                comment: `Refined: ${refineInstruction}`,
            };

            setEntries(prev => [newImageEntry, ...prev]);
            st_echo('success', 'Image refined successfully!');

        } catch (error: any) {
            console.error(error);
            st_echo('error', error instanceof Error ? error.message : String(error));
        } finally {
            setIsGenerating(false);
        }
    }, [settings, entries, selectedCharacter, selectedPersona, selectedBackground, avatarManager]);


    const handleReviseText = useCallback(
        (entry: IEntry, prompt: string) => {
            handleTextPromptGeneration({ entry, prompt, mode: 'revise' });
        },
        [handleTextPromptGeneration],
    );

    const handleDismiss = useCallback((uid: number) => {
        setEntries((prev) => prev.filter((entry) => entry.uid !== uid));
    }, []);

    const handlePostToChat = useCallback(async (entry: IEntry) => {
        if (entry.type !== 'image' || !entry.imageUrl) {
            return st_echo('error', 'Only generated images can be posted to chat.');
        }

        const {
            chat,
            addOneMessage,
            saveChat,
            eventSource,
            // @ts-ignore
            event_types,
        } = SillyTavern.getContext();

        if (!chat || !addOneMessage || !saveChat || !eventSource || !event_types) {
            return console.error('[BananaGen] Missing required context functions for publishing.');
        }

        const message = {
            name: 'Narrator',
            is_user: false,
            is_system: true,
            send_date: Date.now(),
            mes: entry.content.trim(),
            force_avatar: comment_avatar,
            extra: {
                image: entry.imageUrl,
                inline_image: true,
                gen_id: Date.now(),
                api: 'manual',
                model: 'SillyTavern-BananaGen',
            },
        };

        chat.push(message);
        await eventSource.emit(event_types.MESSAGE_SENT, chat.length - 1);
        addOneMessage(message);
        await eventSource.emit(event_types.USER_MESSAGE_RENDERED, chat.length - 1);
        await saveChat();

        st_echo('success', 'Posted to chat!');
        onClose();
    }, [onClose]);


    const handleReset = () => {
        setEntries([]);
    };

    return (
        <>
            <div id="bananagenPopup">
                <h2>Image Prompt Generator</h2>
                <div className="container">
                    {/* Left Column */}
                    <div className="column">
                        <div className="card">
                            <h3>Connection Profiles</h3>
                            <label>Text Generation</label>
                            <STConnectionProfileSelect
                                initialSelectedProfileId={settings.profileId}
                                // @ts-ignore
                                onChange={(profile) => updateSetting('profileId', profile?.id)}
                            />
                             <label style={{ marginTop: '10px' }}>Image Generation</label>
                             <STConnectionProfileSelect
                                initialSelectedProfileId={settings.imageProfileId}
                                // @ts-ignore
                                onChange={(profile) => updateSetting('imageProfileId', profile?.id)}
                            />
                        </div>

                        <div className="card">
                            <h3>Avatars to Include</h3>
                            <label>Character</label>
                            <select className="text_pole" value={selectedCharacter} onChange={(e) => setSelectedCharacter(e.target.value)}>
                                <option value="">None</option>
                                {characters.map(c => <option key={c.avatarFile} value={c.avatarFile}>{c.name}</option>)}
                            </select>
                            <label style={{ marginTop: '10px' }}>Persona</label>
                            <select className="text_pole" value={selectedPersona} onChange={(e) => setSelectedPersona(e.target.value)}>
                                <option value="">None</option>
                                {personas.map(p => <option key={p.avatarFile} value={p.avatarFile}>{p.name}</option>)}
                            </select>
                            <label style={{ marginTop: '10px' }}>Background</label>
                            <select className="text_pole" value={selectedBackground} onChange={(e) => setSelectedBackground(e.target.value)}>
                                <option value="">None</option>
                                {backgrounds.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                        </div>

                        <div className="card">
                            <h3>Context to Send (for Text Gen)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label className="checkbox_label">
                                    <input
                                        type="checkbox"
                                        checked={settings.contextToSend.stDescription}
                                        onChange={(e) => updateContextToSend('stDescription', e.target.checked)}
                                    />
                                    Description of SillyTavern
                                </label>
                                {avatarKey !== '_global' && (
                                    <div className="message-options">
                                        <h4>Messages to Include</h4>
                                        <select
                                            className="text_pole"
                                            value={settings.contextToSend.messages.type}
                                            onChange={(e) =>
                                                updateContextToSend('messages', {
                                                    ...settings.contextToSend.messages,
                                                    type: e.target.value as any,
                                                })
                                            }
                                        >
                                            <option value="none">None</option>
                                            <option value="all">All Messages</option>
                                            <option value="first">First X Messages</option>
                                            <option value="last">Last X Messages</option>
                                            <option value="range">Range</option>
                                        </select>

                                        {settings.contextToSend.messages.type === 'first' && (
                                            <div style={{ marginTop: '10px' }}>
                                                <label>
                                                    First{' '}
                                                    <input
                                                        type="number"
                                                        className="text_pole small message-input"
                                                        min="1"
                                                        value={settings.contextToSend.messages.first ?? 10}
                                                        onChange={(e) =>
                                                            updateContextToSend('messages', {
                                                                ...settings.contextToSend.messages,
                                                                first: parseInt(e.target.value) || 10,
                                                            })
                                                        }
                                                    />{' '}
                                                    Messages
                                                </label>
                                            </div>
                                        )}
                                        {settings.contextToSend.messages.type === 'last' && (
                                             <div style={{ marginTop: '10px' }}>
                                             <label>
                                                 Last{' '}
                                                 <input
                                                     type="number"
                                                     className="text_pole small message-input"
                                                     min="1"
                                                     value={settings.contextToSend.messages.last ?? 10}
                                                     onChange={(e) =>
                                                         updateContextToSend('messages', {
                                                             ...settings.contextToSend.messages,
                                                             last: parseInt(e.target.value) || 10,
                                                         })
                                                     }
                                                 />{' '}
                                                 Messages
                                             </label>
                                         </div>
                                        )}
                                        {settings.contextToSend.messages.type === 'range' && (
                                            <div style={{ marginTop: '10px' }}>
                                            <label>
                                                Range:{' '}
                                                <input
                                                    type="number"
                                                    className="text_pole small message-input"
                                                    min="0"
                                                    placeholder="Start"
                                                    value={settings.contextToSend.messages.range?.start ?? 0}
                                                    onChange={(e) =>
                                                        updateContextToSend('messages', {
                                                            ...settings.contextToSend.messages,
                                                            range: {
                                                                ...settings.contextToSend.messages.range!,
                                                                start: parseInt(e.target.value) || 0,
                                                            },
                                                        })
                                                    }
                                                />{' '}
                                                to{' '}
                                                <input
                                                    type="number"
                                                    className="text_pole small message-input"
                                                    min="1"
                                                    placeholder="End"
                                                    value={settings.contextToSend.messages.range?.end ?? 10}
                                                    onChange={(e) =>
                                                        updateContextToSend('messages', {
                                                            ...settings.contextToSend.messages,
                                                            range: {
                                                                ...settings.contextToSend.messages.range!,
                                                                end: parseInt(e.target.value) || 10,
                                                            },
                                                        })
                                                    }
                                                />
                                            </label>
                                        </div>
                                        )}
                                    </div>
                                )}

                                <label className="checkbox_label">
                                    <input
                                        type="checkbox"
                                        checked={settings.contextToSend.charCard}
                                        onChange={(e) => updateContextToSend('charCard', e.target.checked)}
                                    />
                                    Char Card
                                </label>

                                <label className="checkbox_label">
                                    <input
                                        type="checkbox"
                                        checked={settings.contextToSend.authorNote}
                                        onChange={(e) => updateContextToSend('authorNote', e.target.checked)}
                                    />{' '}
                                    Author Note
                                </label>
                            </div>
                        </div>

                        <div className="card">
                            <label>
                                Max Context
                                <select
                                    className="text_pole"
                                    title="Select Max Context Type"
                                    value={settings.maxContextType}
                                    onChange={(e) => updateSetting('maxContextType', e.target.value as any)}
                                >
                                    <option value="profile">Use profile preset</option>
                                    <option value="sampler">Use active preset in sampler settings</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </label>

                            {settings.maxContextType === 'custom' && (
                                <label style={{ marginTop: '10px' }}>
                                    <input
                                        type="number"
                                        className="text_pole"
                                        min="1"
                                        step="1"
                                        placeholder="Enter max tokens"
                                        value={settings.maxContextValue}
                                        onChange={(e) => updateSetting('maxContextValue', parseInt(e.target.value) || 2048)}
                                    />
                                </label>
                            )}

                            <label style={{ display: 'block', marginTop: '10px' }}>
                                Max Response Tokens
                                <input
                                    type="number"
                                    className="text_pole"
                                    min="1"
                                    step="1"
                                    placeholder="Enter max response tokens"
                                    value={settings.maxResponseToken}
                                    onChange={(e) => updateSetting('maxResponseToken', parseInt(e.target.value) || 256)}
                                />
                            </label>
                        </div>

                        <div className="card">
                            <h3>Your Prompt (for Text Gen)</h3>
                            <STPresetSelect
                                label="Prompt Preset"
                                items={promptPresetItems}
                                value={settings.promptPreset}
                                readOnlyValues={['default']}
                                onChange={(newValue) => updateSetting('promptPreset', newValue ?? 'default')}
                                onItemsChange={(newItems) => {
                                    const newPresets = newItems.reduce(
                                        (acc, item) => {
                                            acc[item.value] = settings.promptPresets[item.value] ?? { content: '' };
                                            return acc;
                                        },
                                        {} as Record<string, { content: string }>,
                                    );
                                    updateSetting('promptPresets', newPresets);
                                }}
                                enableCreate
                                enableRename
                                enableDelete
                            />
                            <STTextarea
                                value={settings.promptPresets[settings.promptPreset]?.content ?? ''}
                                onChange={(e) => {
                                    const newPresets = { ...settings.promptPresets };
                                    if (newPresets[settings.promptPreset]) {
                                        newPresets[settings.promptPreset].content = e.target.value;
                                        updateSetting('promptPresets', newPresets);
                                    }
                                }}
                                placeholder="e.g., 'A cinematic shot of {{char}} in a futuristic city.'"
                                rows={4}
                                style={{ marginTop: '5px', width: '100%' }}
                            />
                            <STButton
                                onClick={() => handleTextPromptGeneration()}
                                disabled={isGenerating}
                                className="menu_button interactable"
                                style={{ marginTop: '5px' }}
                            >
                                {isGenerating ? 'Generating...' : 'Generate Prompts'}
                            </STButton>
                            <STButton onClick={onClose} className="menu_button interactable" style={{ marginTop: '5px' }}>
                                Close
                            </STButton>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="wide-column">
                        <div className="card">
                            <h3>Generated Prompts & Images</h3>
                            <div className="actions">
                                <STButton onClick={handleReset} disabled={isGenerating} className="menu_button interactable">
                                    Clear All
                                </STButton>
                            </div>
                            <div>
                                {entries.length === 0 && <p>No prompts yet. Send a prompt to get started!</p>}
                                {entries.map((entry) => (
                                    <SuggestedPrompt
                                        key={entry.uid}
                                        entry={entry}
                                        onReviseText={handleReviseText}
                                        onDismiss={handleDismiss}
                                        onGenerateImage={handleImageGeneration}
                                        onRefineImage={handleRefineImage}
                                        onPostToChat={handlePostToChat}
                                        isGenerating={isGenerating}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};