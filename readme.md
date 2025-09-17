# SillyTavern BananaGen

## Overview

A [SillyTavern](https://docs.sillytavern.app/) extension for generating images based on your stories. It uses a two-stage process:

1.  A **Text LLM** generates detailed, creative prompts suitable for an image model.
<img width="1717" height="1067" alt="image" src="https://github.com/user-attachments/assets/65159f96-abe5-4932-bca5-c2f08d43cc5b" />

2.  An **Image LLM** takes those prompts and generates the final image (only tested on google/gemini-2.5-flash-image-preview with openrouter).
<img width="1258" height="1046" alt="image" src="https://github.com/user-attachments/assets/b249bfbb-7b93-45a8-b0a2-e1915bdc9f7a" />

This workflow allows for a high degree of control and creativity, enabling you to bring your characters and scenes to life visually.

## Features

-   **Two-Stage Generation**: Uses a text model to craft perfect image prompts, then sends them to an image model.
-   **Dual Profile Configuration**: Set separate connection profiles for your text and image generation models.
-   **Interactive UI**: Each generated prompt and image appears as a card with a set of controls:
    -   **Generate Image**: Sends a text prompt to the image model.
    -   **Revise Text**: Send instructions to the text model to modify a prompt.
    -   **Refine Image**: Send instructions and the previous image(s) to the image model for refinement.
    -   **Post to Chat**: Sends the generated image directly to the chat as a system message.
    -   **Copy**: Copies the prompt text to your clipboard.
    -   **Dismiss**: Removes the card from the list.
-   **Avatar-Aware Prompts**: Include character and persona avatars directly in the image generation request for more contextually accurate results.
-   **Easy Access**: Open the BananaGen UI from the main extensions menu (click the Wand icon 🪄, then "BananaGen").
-   **Highly Configurable**: Customize the system prompts, context settings, and model parameters to tailor the results to your needs.

## How to Use

1.  **Open the BananaGen UI**:
    -   Click the **Wand icon (🪄)** in the left of the message box, then click **BananaGen** from the extensions list.
2.  **Configure Settings**:
    -   In the left-hand panel, select the **Text Generation** and **Image Generation** connection profiles you want to use.
    -   Optionally, select a **Character** and **Persona** avatar to include in your image prompts.
3.  **Write a Prompt**: In the "Your Prompt" section, tell the text model what you want ideas for (e.g., *"A cinematic shot of {{char}} in a futuristic city."*).
4.  **Generate Text Prompts**: Click the **Generate Prompts** button. The right-hand panel will populate with two text prompt suggestions.
5.  **Interact with Prompts**:
    -   Click **Generate Image** on a prompt card to send it to the image model. A new card will appear with the generated image.
    -   Click **Revise Text** to ask the text model to change a prompt.
6.  **Interact with Images**:
    -   Click **Post to Chat** to send the image to the main chat window.
    -   Click **Refine Image** to provide new instructions and generate a new version of the image.

## Configuration

This extension is designed to be highly flexible. You can customize the core prompts that guide the AI by going to the main SillyTavern settings, navigating to the **Extensions** tab, and finding the **BananaGen** section. Here, you can edit the templates for the prompt generator's role, the XML format rules, the image prompt template, and more.

<img width="1708" height="1091" alt="image" src="https://github.com/user-attachments/assets/51679365-1e76-4401-a8c6-563d93890ae1" />

## Acknowledgements

This extension is heavily inspired by and is a significant rework of the [SillyTavern-WorldInfo-Recommender](https://github.com/bmen25124/SillyTavern-WorldInfo-Recommender) by bmen25124. Many of the core ideas and initial code structure were adapted from that project.

