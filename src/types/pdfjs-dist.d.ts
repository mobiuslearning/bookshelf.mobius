declare module "pdfjs-dist/build/pdf.mjs" {
  export interface PdfDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<{
      getViewport(options: { scale: number }): {
        width: number;
        height: number;
      };
      render(options: {
        canvasContext: CanvasRenderingContext2D;
        viewport: { width: number; height: number };
      }): { promise: Promise<void>; cancel(): void };
    }>;
  }

  export const GlobalWorkerOptions: { workerSrc: string };
  export function getDocument(source: string | { url: string }): {
    promise: Promise<PdfDocumentProxy>;
  };
}

declare module "pdfjs-dist/build/pdf.worker.min.mjs?url" {
  const url: string;
  export default url;
}
