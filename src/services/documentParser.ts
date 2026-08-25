import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up pdf.js worker URL or fallback
if (typeof window !== 'undefined' && 'Worker' in window) {
  // Using unpkg or worker bundled
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

export interface ExtractedDocument {
  fileName: string;
  fileType: string;
  fileSize: number;
  rawText: string;
  pageCount?: number;
  success: boolean;
  error?: string;
}

export async function extractTextFromFile(file: File): Promise<{
  text: string;
  fileType: string;
  fileHash: string;
}> {
  const parsed = await parseDocument(file);
  const fileHash = `${file.name}_${file.size}_${file.lastModified || Date.now()}`;
  return {
    text: parsed.rawText,
    fileType: parsed.fileType,
    fileHash,
  };
}

export async function parseDocument(file: File): Promise<ExtractedDocument> {
  const fileName = file.name;
  const fileType = file.type || '';
  const fileSize = file.size;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  try {
    if (extension === 'txt' || fileType.includes('text/plain') || extension === 'md') {
      const text = await parseTxtFile(file);
      return {
        fileName,
        fileType: 'TXT',
        fileSize,
        rawText: text,
        success: true,
      };
    }

    if (extension === 'docx' || fileType.includes('wordprocessingml')) {
      const text = await parseDocxFile(file);
      return {
        fileName,
        fileType: 'DOCX',
        fileSize,
        rawText: text,
        success: true,
      };
    }

    if (extension === 'pdf' || fileType.includes('pdf')) {
      const text = await parsePdfFile(file);
      return {
        fileName,
        fileType: 'PDF',
        fileSize,
        rawText: text,
        success: true,
      };
    }

    // Default / generic fallback
    const text = await parseGenericFile(file);
    return {
      fileName,
      fileType: extension.toUpperCase() || 'DESCONHECIDO',
      fileSize,
      rawText: text,
      success: true,
    };
  } catch (err: any) {
    console.error(`Erro ao processar arquivo ${fileName}:`, err);
    // Last resort fallback
    try {
      const fallbackText = await parseGenericFile(file);
      if (fallbackText && fallbackText.trim().length > 20) {
        return {
          fileName,
          fileType: extension.toUpperCase(),
          fileSize,
          rawText: fallbackText,
          success: true,
        };
      }
    } catch {
      // ignore
    }

    return {
      fileName,
      fileType: extension.toUpperCase(),
      fileSize,
      rawText: '',
      success: false,
      error: err.message || 'Falha ao extrair texto do documento',
    };
  }
}

async function parseTxtFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(new Error('Erro ao ler arquivo de texto'));
    reader.readAsText(file, 'UTF-8');
  });
}

async function parseDocxFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  } catch (e: any) {
    console.warn('Mammoth parsing failed, attempting fallback text extraction...', e);
    return extractTextFromArrayBuffer(arrayBuffer);
  }
}

async function parsePdfFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      useSystemFonts: true,
    });
    
    const pdfDoc = await loadingTask.promise;
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n';
    }
    
    if (fullText.trim().length > 0) {
      return fullText;
    }
    throw new Error('PDF vazio ou ilegível');
  } catch (e: any) {
    console.warn('PDF.js parsing failed, fallback text extraction...', e);
    const extracted = extractTextFromArrayBuffer(arrayBuffer);
    if (extracted.trim().length > 30) {
      return extracted;
    }
    throw e;
  }
}

/**
 * Fallback to extract strings and ASCII/UTF-8 words from binary formats
 */
function extractTextFromArrayBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let result = '';
  let word = '';
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Printable characters + whitespace + latin characters (accented portuguese)
    if (
      (byte >= 32 && byte <= 126) ||
      byte === 10 || // newline
      byte === 13 || // carriage return
      byte === 9 ||  // tab
      (byte >= 192 && byte <= 255) // Latin accented chars
    ) {
      word += String.fromCharCode(byte);
    } else {
      if (word.length >= 2) {
        result += word + ' ';
      }
      word = '';
    }
  }
  if (word.length >= 2) {
    result += word;
  }
  
  // Clean up XML tags or binary noise if present
  const cleaned = result
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
    
  return cleaned;
}

async function parseGenericFile(file: File): Promise<string> {
  const text = await parseTxtFile(file);
  if (text && text.trim().length > 10) {
    return text;
  }
  const arrayBuffer = await file.arrayBuffer();
  return extractTextFromArrayBuffer(arrayBuffer);
}
