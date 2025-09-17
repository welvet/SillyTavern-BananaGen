import { ExtensionSettingsManager } from 'sillytavern-utils-lib';
import {
  DEFAULT_ST_DESCRIPTION,
  DEFAULT_PREVIOUS_PROMPTS,
  DEFAULT_XML_DESCRIPTION,
  DEFAULT_TASK_DESCRIPTION,
  DEFAULT_IMAGE_PROMPT_TEMPLATE,
} from './constants.js';
import { globalContext } from './generate.js';
import { st_echo } from 'sillytavern-utils-lib/config';

export const extensionName = 'SillyTavern-BananaGen';
export const VERSION = '0.0.1';
export const FORMAT_VERSION = 'F_1.2';

export const KEYS = {
  EXTENSION: 'bananaGen',
} as const;

export interface ContextToSend {
  stDescription: boolean;
  messages: {
    type: 'none' | 'all' | 'first' | 'last' | 'range';
    first?: number;
    last?: number;
    range?: {
      start: number;
      end: number;
    };
  };
  charCard: boolean;
  authorNote: boolean;
  worldInfo: boolean;
  suggestedEntries: boolean;
}

export interface PromptSetting {
  label: string;
  content: string;
  isDefault: boolean;
}

export interface PromptPreset {
  content: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MainContextPromptBlock {
  promptName: string;
  enabled: boolean;
  role: MessageRole;
}

export interface MainContextTemplatePreset {
  prompts: MainContextPromptBlock[];
}

export interface ExtensionSettings {
  version: string;
  formatVersion: string;
  profileId: string;
  imageProfileId: string;
  maxContextType: 'profile' | 'sampler' | 'custom';
  maxContextValue: number;
  maxResponseToken: number;
  contextToSend: ContextToSend;
  prompts: {
    stDescription: PromptSetting;
    possibleSteps: PromptSetting;  
    responseRules: PromptSetting;
    taskDescription: PromptSetting;
    imagePromptTemplate: PromptSetting;
    [key: string]: PromptSetting;
  };
  promptPreset: string;
  promptPresets: Record<string, PromptPreset>;
  mainContextTemplatePreset: string;
  mainContextTemplatePresets: Record<string, MainContextTemplatePreset>;
}

export type SystemPromptKey =
  | 'stDescription'
  | 'possibleSteps'
  | 'responseRules'
  | 'taskDescription'
  | 'imagePromptTemplate';

export const SYSTEM_PROMPT_KEYS: Array<SystemPromptKey> = [
  'stDescription',
  'possibleSteps',
  'responseRules',
  'taskDescription',
  'imagePromptTemplate',
];

export const DEFAULT_PROMPT_CONTENTS: Record<SystemPromptKey, string> = {
  stDescription: DEFAULT_ST_DESCRIPTION,
  possibleSteps: DEFAULT_PREVIOUS_PROMPTS,
  responseRules: DEFAULT_XML_DESCRIPTION,
  taskDescription: DEFAULT_TASK_DESCRIPTION,
  imagePromptTemplate: DEFAULT_IMAGE_PROMPT_TEMPLATE,
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  version: VERSION,
  formatVersion: FORMAT_VERSION,
  profileId: '',
  imageProfileId: '',
  maxContextType: 'profile',
  maxContextValue: 16384,
  maxResponseToken: 8192,
  contextToSend: {
    stDescription: true,
    messages: {
      type: 'all',
      first: 10,
      last: 10,
      range: {
        start: 0,
        end: 10,
      },
    },
    charCard: true,
    authorNote: true,
    worldInfo: true,
    suggestedEntries: true,
  },
  prompts: {
    stDescription: {
      label: 'SillyTavern Description',
      content: DEFAULT_PROMPT_CONTENTS.stDescription,
      isDefault: true,
    },
    possibleSteps: {
      label: 'Previous Prompts',
      content: DEFAULT_PROMPT_CONTENTS.possibleSteps,
      isDefault: true,
    },
    responseRules: {
      label: 'Response Rules',
      content: DEFAULT_PROMPT_CONTENTS.responseRules,
      isDefault: true,
    },
    taskDescription: {
      label: 'Task Description',
      content: DEFAULT_PROMPT_CONTENTS.taskDescription,
      isDefault: true,
    },
    imagePromptTemplate: {
      label: 'Image Prompt Template',
      content: DEFAULT_PROMPT_CONTENTS.imagePromptTemplate,
      isDefault: true,
    },
  },
  promptPreset: 'default',
  promptPresets: {
    default: {
      content: '',
    },
  },
  mainContextTemplatePreset: 'default',
  mainContextTemplatePresets: {
    default: {
      prompts: [
        {
          promptName: 'chatHistory', // this is exception, since chat history is not exactly a prompt
          enabled: true,
          role: 'system',
        },
        {
          promptName: 'stDescription',
          enabled: true,
          role: 'system',
        },
        {
          promptName: 'responseRules',
          enabled: true,
          role: 'system',
        },
        {
          promptName: 'taskDescription',
          enabled: true,
          role: 'user',
        },
      ],
    },
  },
};

export function convertToVariableName(key: string) {
  // Remove non-ASCII and special characters
  const normalized = key.replace(/[^\w\s]/g, '');

  // Split by whitespace and filter out empty parts
  const parts = normalized.split(/\s+/).filter(Boolean);

  let firstWordPrinted = false;
  return parts
    .map((word, _) => {
      // Remove numbers from the start of words
      const cleanWord = word.replace(/^\d+/, '');
      // Convert to camelCase
      if (cleanWord) {
        const result = firstWordPrinted
          ? `${cleanWord[0].toUpperCase()}${cleanWord.slice(1).toLowerCase()}`
          : cleanWord.toLowerCase();
        if (!firstWordPrinted) {
          firstWordPrinted = true;
        }
        return result;
      }

      return '';
    })
    .join('');
}

export const settingsManager = new ExtensionSettingsManager<ExtensionSettings>(KEYS.EXTENSION, DEFAULT_SETTINGS);

export async function initializeSettings(): Promise<void> {
  return new Promise((resolve, _reject) => {
    settingsManager
      .initializeSettings({
        strategy: [
          {
            from: 'F_1.0',
            to: 'F_1.1',
            action(previous) {
              const migrated = {
                ...DEFAULT_SETTINGS,
                ...previous,
              };
              delete migrated.stWorldInfoPrompt;
              delete migrated.usingDefaultStWorldInfoPrompt;
              delete migrated.lorebookDefinitionPrompt;
              delete migrated.usingDefaultLorebookDefinitionPrompt;
              delete migrated.lorebookRulesPrompt;
              delete migrated.usingDefaultLorebookRulesPrompt;
              delete migrated.responseRulesPrompt;
              delete migrated.usingDefaultResponseRulesPrompt;

              return migrated;
            },
          },
          {
            from: 'F_1.1',
            to: 'F_1.2',
            action(previous) {
              const migrated = { ...previous };
              migrated.formatVersion = 'F_1.2';

              // The exact string of the old default content for taskDescription
              const OLD_TASK_DESCRIPTION = `## Rules
- Don't suggest already existing or suggested entries.

## Your Task
{{userInstructions}}`;

              // Check if the user's current setting is the old default.
              if (migrated.prompts.taskDescription.content === OLD_TASK_DESCRIPTION) {
                // If so, update it to the new default.
                migrated.prompts.taskDescription.content = DEFAULT_PROMPT_CONTENTS.taskDescription;
                migrated.prompts.taskDescription.isDefault = true;
              } else {
                // Otherwise, it's a custom prompt, so just mark it as not default.
                migrated.prompts.taskDescription.isDefault = false;
              }

              return migrated;
            },
          },
        ],
      })
      .then((_result) => {
        resolve();
      })
      .catch((error) => {
        console.error(`[${extensionName}] Error initializing settings:`, error);
        st_echo('error', `[${extensionName}] Failed to initialize settings: ${error.message}`);
        globalContext.Popup.show
          .confirm(
            `[${extensionName}] Failed to load settings. This might be due to an update. Reset settings to default?`,
            'Extension Error',
          )
          .then((result: boolean) => {
            if (result) {
              settingsManager.resetSettings();
              st_echo('success', `[${extensionName}] Settings reset. Reloading may be required.`);
              resolve();
            }
          });
      });
  });
}
