import * as pdfjsLib from 'pdfjs-dist';

// Configure worker URL
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

class PdfService {
  private currentPdfDoc: any = null;
  private currentPdfData: ArrayBuffer | null = null;

  async loadPdfFromBlob(blob: Blob): Promise<{ numPages: number }> {
    const arrayBuffer = await blob.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      useSystemFonts: true,
    });

    this.currentPdfDoc = await loadingTask.promise;
    return {
      numPages: this.currentPdfDoc.numPages,
    };
  }

  async loadPdfFromArrayBuffer(data: ArrayBuffer): Promise<{ numPages: number }> {
    // Clone arrayBuffer so the original is not detached by pdfjs worker
    const bufferCopy = data.slice(0);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(bufferCopy),
      useWorkerFetch: false,
      useSystemFonts: true,
    });

    this.currentPdfDoc = await loadingTask.promise;
    return {
      numPages: this.currentPdfDoc.numPages,
    };
  }

  isLoaded(): boolean {
    return this.currentPdfDoc !== null;
  }

  getTotalPages(): number {
    return this.currentPdfDoc ? this.currentPdfDoc.numPages : 0;
  }

  // Render a specific page onto an HTMLCanvasElement
  async renderPageToCanvas(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale = 1.4
  ): Promise<{ width: number; height: number }> {
    if (!this.currentPdfDoc) {
      throw new Error('Nessun documento PDF caricato');
    }

    if (pageNumber < 1 || pageNumber > this.currentPdfDoc.numPages) {
      throw new Error(`Numero pagina non valido: ${pageNumber} (totale: ${this.currentPdfDoc.numPages})`);
    }

    const page = await this.currentPdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contesto Canvas non disponibile');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    return {
      width: viewport.width,
      height: viewport.height,
    };
  }

  // Render page to JPEG base64 string for Gemini API analysis
  async renderPageToBase64(pageNumber: number, scale = 1.5): Promise<{ base64Image: string; textContent: string }> {
    if (!this.currentPdfDoc) {
      throw new Error('Nessun documento PDF caricato');
    }

    const page = await this.currentPdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = viewport.width;
    offscreenCanvas.height = viewport.height;

    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) throw new Error('Contesto Canvas non disponibile');

    // Fill white background before rendering
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const base64Image = offscreenCanvas.toDataURL('image/jpeg', 0.9);

    // Extract text content from the page as well
    let textContent = '';
    try {
      const text = await page.getTextContent();
      textContent = text.items.map((item: any) => item.str).join(' ');
    } catch (e) {
      console.warn('Text extraction fallback:', e);
    }

    return { base64Image, textContent };
  }
}

export const pdfService = new PdfService();
