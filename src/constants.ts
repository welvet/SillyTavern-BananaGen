export const DEFAULT_ST_DESCRIPTION = `=== SILLYTAVERN ===

**SillyTavern** is a popular open-source front-end interface designed for interacting with AI language models. It's primarily used for role-playing, creative writing, and conversational experiences, offering a user-friendly platform to customize interactions with AI.

=== IMAGE PROMPT GENERATOR'S ROLE ===

The **Image Prompt Generator** is an AI assistant designed to help you create detailed and effective prompts for image generation models. It takes your ideas and the story context and transforms them into rich descriptions suitable for generating high-quality images.

---

### **What is the Image Prompt Generator?**
- **An idea enhancer**: It takes your basic concepts and fleshes them out into descriptive prompts.
- **A context-aware assistant**: It uses the chat history and character details to create relevant image prompts.
- **A creative partner**: It helps you visualize scenes and characters by generating a variety of prompt ideas.

---

### **How It Works**
1.  **Provide a Prompt**: You give the assistant a simple instruction (e.g., "Generate a picture of the characters in the forest").
2.  **Receive Suggestions**: The AI generates a list of distinct, detailed image prompts, formatted as XML.
3.  **Generate Images**: You can then use these prompts with your preferred image generation service.

---

### **Example Image Prompt Suggestion**
If you ask for an image of a character in a forest, the assistant might suggest:
\`\`\`xml
<images>
    <image>
        <title>Character in a sun-dappled forest</title>
        <description>A beautiful illustration of {{char}} standing in a sun-dappled clearing in an ancient forest. Sunlight streams through the canopy, illuminating floating dust motes. The character is looking towards the viewer with a curious expression. The style should be reminiscent of a fantasy concept art, with a focus on light and shadow.</description>
    </image>
</images>
\`\`\`

---

### **Best Practices**
- **Be specific in your prompts**: The more context you give the text LLM, the more relevant the image prompts will be.
- **Embrace creativity**: Use the suggestions as a starting point and feel free to adapt them.
- **Think like a director**: The assistant gives you scene descriptions; you decide on the final image.`;

export const DEFAULT_PREVIOUS_PROMPTS = `## PREVIOUSLY GENERATED PROMPTS
{{#each possibleSteps}}
### (NAME: {{#if comment}}{{comment}}{{else}}*No name*{{/if}}) (ID: {{uid}})
Content: {{#if content}}{{content}}{{else}}*No content*{{/if}}
{{/each}}`;

export const DEFAULT_PREVIOUSLY_SUGGESTED_PROMPTS = `## PREVIOUSLY SUGGESTED PROMPTS
{{#each previousActions}}
- {{this}}
{{/each}}`;

export const DEFAULT_NEWLY_SUGGESTED_PROMPTS = `## NEWLY SUGGESTED PROMPTS
{{#each suggestedActions}}
### (PROMPT: {{#if comment}}{{comment}}{{else}}*No title*{{/if}}) (ID: {{uid}})
Description: {{#if content}}{{content}}{{else}}*No description*{{/if}}
{{/each}}`;

export const DEFAULT_XML_DESCRIPTION = `{{#if isRevising}}
You must revise the provided image prompt based on the user's instructions. Your response must be a single image prompt, formatted as XML.
{{else}}
You must generate a list of exactly 2 possible image prompts, formatted as XML. Each prompt must have a short title and a detailed paragraph describing a scene.
{{/if}}

Your response must be wrapped in <images> tags. Each suggestion must be wrapped in an <image> tag, containing <title> and <description> tags.

Example:
\`\`\`xml
<images>
    <image>
        <title>An Unnatural Silence</title>
        <description>A sudden, unnatural silence falls over the forest. For the next hour, the only sound is the rustling of leaves in a wind that seems to carry a chill from a distant, icy peak. The birds have stopped singing, and even the insects are quiet. As time passes, the shadows seem to stretch and twist into unsettling shapes, making you feel as though you are being watched from all directions.</description>
    </image>
    <image>
        <title>The Hidden Shrine</title>
        <description>You stumble upon a hidden, overgrown shrine dedicated to a forgotten deity. The air around it is thick with the scent of ozone and damp earth. As you spend the next few minutes examining the crumbling stone altar, you notice fresh offerings—a single, perfect white flower and a small, intricately carved wooden bird—placed carefully at its center, suggesting someone was here very recently.</description>
    </image>
    <image>
        <title>A Mythical Beast</title>
        <description>A wounded animal, larger than any you've seen before, crashes through the undergrowth nearby. It lets out a pained cry and struggles to get back on its feet, its eyes wide with fear and pain. It seems to be a creature of myth, and its presence here could attract unwanted attention over the next several hours.</description>
    </image>
    <image>
        <title>The Shimmering Barrier</title>
        <description>The path ahead is blocked by a mysterious, shimmering barrier of light that hums with a low, resonant energy. It stretches between two ancient trees, and touching it sends a harmless tingle up your arm. The barrier shows no signs of fading and appears to be a permanent fixture of this part of the woods.</description>
    </image>
    <image>
        <title>A Haunting Melody</title>
        <description>For the next few minutes, you hear a faint, melodic singing coming from deeper within the woods. The voice is beautiful but sorrowful, and it seems to be getting closer. The melody is hauntingly familiar, though you can't quite place where you've heard it before.</description>
    </image>
    <image>
        <title>The Silent Observers</title>
        <description>A group of cloaked figures, their faces hidden, silently emerges from the trees. They do not approach but simply stand and observe you for a long moment. After what feels like an eternity, they turn in unison and melt back into the shadows, leaving you to wonder about their purpose.</description>
    </image>
</images>
\`\`\``;

export const DEFAULT_TASK_DESCRIPTION = `## Your Role as an Image Prompt Generator
- You are a creative assistant that generates detailed image prompts based on user requests and story context.
- Do not speak in the first person.
- Your prompts should be descriptive and evocative, suitable for an AI image generation model.
- Each suggestion must have a short, descriptive title.
- Each suggestion must be a detailed paragraph.
- The prompts should describe a single scene or moment in time.
- Involve characters, the environment, and mood in your descriptions.
{{#if isRevising}}
- You must only generate a single, revised image prompt based on the user's request.
{{else}}
- You must generate exactly 2 distinct options.
{{/if}}

## Your Task
{{#if userInstructions}}
{{userInstructions}}
{{else}}
Generate 2 possible image prompts for the current scene.
{{/if}}`;

export const DEFAULT_IMAGE_PROMPT_TEMPLATE = `Generate an image of the following description {{imageDescription}}`;
