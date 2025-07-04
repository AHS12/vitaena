declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      allowTaint?: boolean;
      backgroundColor?: string;
      width?: number;
      height?: number;
      scrollX?: number;
      scrollY?: number;
      windowWidth?: number;
      windowHeight?: number;
      letterRendering?: boolean;
      logging?: boolean;
      proxy?: undefined;
      removeContainer?: boolean;
      onclone?: (clonedDoc: Document) => void;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: string;
      compress?: boolean;
      precision?: number;
      putOnlyUsedFonts?: boolean;
      floatPrecision?: number;
    };
    pagebreak?: {
      mode?: string;
      before?: string;
      after?: string;
      avoid?: string[];
    };
  }

  interface Html2Pdf {
    set(options: Html2PdfOptions): Html2Pdf;
    from(element: HTMLElement): Html2Pdf;
    save(): Promise<void>;
    output(type?: string): Promise<unknown>;
    then(callback: (pdf: unknown) => void): Html2Pdf;
  }

  function html2pdf(): Html2Pdf;
  export = html2pdf;
}
