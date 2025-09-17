import { XMLParser } from 'fast-xml-parser';
import { IEntry } from './types.js';

const parser = new XMLParser();

function createRandomNumber(length: number): number {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface XmlParseOptions {
  previousContent?: string;
}

export function parseXMLOwn(xml: string, options: XmlParseOptions = {}): IEntry[] {
  let processedXml = xml;
  const { previousContent } = options;

  // Remove code blocks
  processedXml = processedXml.replace(/```xml/g, '').replace(/```/g, '');

  // Merge with previous content if exists
  if (previousContent) {
    processedXml = previousContent + processedXml.trimEnd();
  }

  // Ensure XML is complete by checking for imbalanced tags
  if (processedXml.includes('<image>') && !processedXml.includes('</image>')) {
    throw new Error('Incomplete XML: Missing </image> tag');
  }
  if (processedXml.includes('<description>') && !processedXml.includes('</description>')) {
    throw new Error('Incomplete XML: Missing </description> tag');
  }

  const images: IEntry[] = [];
  try {
    const rawResponse = parser.parse(processedXml);

    if (!rawResponse.images) {
      return images;
    }

    const parsedImages = rawResponse.images.image?.description
      ? [rawResponse.images.image]
      : rawResponse.images.image;

    if (!parsedImages) {
      return images;
    }

    for (const image of parsedImages) {
      if (image.description) {
        const content = Array.isArray(image.description)
          ? image.description.join('\n\n')
          : image.description;

        images.push({
          uid: createRandomNumber(6),
          type: 'text',
          key: [], // No triggers in the new format
          content: content,
          comment: image.title ?? '', // Use title as comment
          disable: false,
          keysecondary: [],
        });
      }
    }

    return images;
  } catch (error: any) {
    console.error(error);
    throw new Error('Model response is not valid XML');
  }
}

export function getPrefilledXML(entry: IEntry): string {
  return `
<images>
  <image>
    <title>${entry.comment}</title>
    <description>${entry.content}`;
}

export function getFullXML(entry: IEntry): string {
  return `
<images>
  <image>
    <title>${entry.comment}</title>
    <description>${entry.content}</description>
  </image>
</images>`;
}
