export interface AvatarItem {
    name: string;
    avatarFile: string;
}

export class AvatarManager {
    getCharacters(): AvatarItem[] {
        const characters = SillyTavern.getContext().characters ?? [];
        return characters.map(char => ({
            name: char.name,
            avatarFile: char.avatar,
        }));
    }

    getPersonas(): AvatarItem[] {
        // @ts-ignore
        const personas = SillyTavern.getContext().powerUserSettings.personas ?? {};
        return Object.entries(personas).map(([avatarFile, name]) => ({
            name: name as string,
            avatarFile,
        }));
    }

    async getBackgrounds(): Promise<string[]> {
        try {
            const response = await fetch('/api/backgrounds/all', {
                method: 'POST',
                headers: SillyTavern.getContext().getRequestHeaders(),
                body: JSON.stringify({}),
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch backgrounds: ${response.statusText}`);
            }
            const data = await response.json();
            return data.images ?? [];
        } catch (error) {
            console.error(`[BananaGen] Failed to get backgrounds:`, error);
            return [];
        }
    }

    async getAvatarBase64(type: 'avatar' | 'persona' | 'bg', fileName: string): Promise<string> {
        if (!fileName) return '';
        try {
            const thumbnailUrl = SillyTavern.getContext().getThumbnailUrl(type, fileName);
            const response = await fetch(thumbnailUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch avatar: ${response.statusText}`);
            }
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error(`[BananaGen] Failed to get base64 for avatar ${fileName}:`, error);
            return '';
        }
    }

    getDefaultCharacterName(): string {
        // @ts-ignore
        return SillyTavern.getContext().name2;
    }

    getDefaultPersonaName(): string {
        // @ts-ignore
        return SillyTavern.getContext().name1;
    }
}
