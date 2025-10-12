import { Injectable } from '@angular/core';
import * as pdfMakeLib from 'pdfmake/build/pdfmake';
import * as pdfFontsLib from 'pdfmake/build/vfs_fonts';

const pdfMake: any = pdfMakeLib;
pdfMake.vfs = pdfFontsLib as any;

export interface PdfColumn {
  header: string;
  dataKey: string;
  width?: string | number; // 'auto', '*', 100, etc.
  alignment?: 'left' | 'center' | 'right';
}

export interface PdfOptions {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  data: any[];
  fileName: string;
  pageOrientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'LETTER' | 'LEGAL';
  headerColor?: string;
  alternateRowColor?: string;
  showFooter?: boolean;
  footerText?: string;
  logo?: string; // Base64 string
}

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private defaultHeaderColor = '#d3d3d3';
  private defaultAlternateColor = '#f9f';

  constructor() {}

  /**
   * Genera y descarga un PDF con tabla de datos
   */
  downloadTablePdf(options: PdfOptions): void {
    const {
      title,
      subtitle,
      columns,
      data,
      fileName,
      pageOrientation = 'portrait',
      pageSize = 'A4',
      headerColor = '#9b9b9b',
      alternateRowColor = '#ffffff', //
      showFooter = true,
      footerText,
      logo,
    } = options;

    const docDefinition: any = {
      pageSize: pageSize,
      pageOrientation: pageOrientation,
      pageMargins: [40, 60, 40, 60],

      header: (currentPage: number, pageCount: number) => {
        const fechaHora = new Date().toLocaleString('es-BO'); // Fecha y hora local
        return {
          columns: [
            // Logo a la izquierda si existe
            logo ? { image: logo, width: 50, margin: [40, 20, 0, 0] } : {},
            // Fecha y hora a la derecha
            {
              text: `Fecha y Hora:${fechaHora}`,
              alignment: 'right',
              margin: [0, 20, 40, 0],
              fontSize: 9,
              color: '#666',
            },
          ],
        };
      },
      footer: (currentPage: number, pageCount: number) => {
        if (!showFooter) return {};

        return {
          columns: [
            {
              text: footerText || `Generado el ${new Date().toLocaleDateString('es-BO')}`,
              alignment: 'left',
              margin: [40, 0, 0, 0],
              fontSize: 8,
              color: '#666',
            },
            {
              text: `Página ${currentPage} de ${pageCount}`,
              alignment: 'right',
              margin: [0, 0, 40, 0],
              fontSize: 8,
              color: '#666',
            },
          ],
        };
      },

      content: [
        // Título principal
        {
          text: title,
          style: 'header',
          margin: [0, 0, 0, 10],
        },

        // Subtítulo (si existe)
        subtitle
          ? {
              text: subtitle,
              style: 'subheader',
              margin: [0, 0, 0, 20],
            }
          : {},

        // Tabla
        {
          table: {
            headerRows: 1,
            widths: this.getColumnWidths(columns),
            body: this.buildTableBody(columns, data),
          },
          layout: {
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) return headerColor;
              return rowIndex % 2 === 0 ? alternateRowColor : null;
            },
            hLineWidth: (i: number, node: any) => {
              return i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5;
            },
            vLineWidth: () => 0.5,
            hLineColor: () => '#ddd',
            vLineColor: () => '#ddd',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
        },

        // Resumen (total de registros)
        {
          text: `Total de registros: ${data.length}`,
          style: 'summary',
          margin: [0, 20, 0, 0],
        },
      ],

      styles: {
        pageHeader: {
          fontSize: 14,
          bold: true,
          color: headerColor,
        },
        pageSubheader: {
          fontSize: 10,
          color: '#666',
          margin: [0, 2, 0, 0],
        },
        header: {
          fontSize: 18,
          bold: true,
          color: '#000000',
          alignment: 'center',
        },
        subheader: {
          fontSize: 14,
          color: '#666',
          alignment: 'center',
        },
        tableHeader: {
          bold: true,
          fontSize: 11,
          color: 'white',
          alignment: 'center',
        },
        tableCell: {
          fontSize: 9,
        },
        summary: {
          fontSize: 11,
          bold: true,
          alignment: 'right',
          color: '#333',
        },
      },

      defaultStyle: {
        fontSize: 9,
        color: '#333',
      },
    };

    pdfMake.createPdf(docDefinition).download(this.sanitizeFileName(fileName));
  }

  private buildTableBody(columns: PdfColumn[], data: any[]): any[][] {
    // Headers
    const headers = columns.map((col) => ({
      text: col.header,
      style: 'tableHeader',
      alignment: col.alignment || 'center',
    }));

    // Datos
    const rows = data.map((row) =>
      columns.map((col) => ({
        text: this.formatCellValue(row[col.dataKey]),
        style: 'tableCell',
        alignment: col.alignment || 'left',
      }))
    );

    return [headers, ...rows];
  }

  private getColumnWidths(columns: PdfColumn[]): (string | number)[] {
    return columns.map((col) => col.width || '*');
  }

  private formatCellValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'number') return value.toLocaleString('es-BO');
    if (value instanceof Date) return value.toLocaleDateString('es-BO');
    return String(value);
  }

  private sanitizeFileName(fileName: string): string {
    // Agregar .pdf si no lo tiene
    if (!fileName.endsWith('.pdf')) {
      fileName += '.pdf';
    }

    if (!fileName.includes(new Date().getFullYear().toString())) {
      const date = new Date().toISOString().split('T')[0];
      fileName = fileName.replace('.pdf', `_${date}.pdf`);
    }

    return fileName;
  }

  openTablePdf(options: PdfOptions): void {
    const docDefinition: any = this.createDocDefinition(options);
    pdfMake.createPdf(docDefinition).open();
  }

  printTablePdf(options: PdfOptions): void {
    const docDefinition: any = this.createDocDefinition(options);
    pdfMake.createPdf(docDefinition).print();
  }

  private createDocDefinition(options: PdfOptions): any {
    return {};
  }

  downloadSimplePdf(title: string, content: string, fileName: string): void {
    const docDefinition = {
      content: [
        { text: title, style: 'header' },
        { text: content, style: 'content' },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 20],
        },
        content: {
          fontSize: 12,
          alignment: 'justify',
        },
      },
    };

    pdfMake.createPdf(docDefinition).download(this.sanitizeFileName(fileName));
  }

  async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
