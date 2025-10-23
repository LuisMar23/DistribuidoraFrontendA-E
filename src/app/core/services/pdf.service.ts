import { Injectable } from '@angular/core';
import * as pdfMakeLib from 'pdfmake/build/pdfmake';
import * as pdfFontsLib from 'pdfmake/build/vfs_fonts';

const pdfMake: any = pdfMakeLib;
pdfMake.vfs = pdfFontsLib as any;

pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
};

export interface PdfColumn {
  header: string;
  dataKey: string;
  width?: string | number;
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
  logo?: string;
}

export interface DetalleVentaDto {
  id?: number;
  uuid?: string;
  ventaId: number;
  productoId?: number;
  producto_codigo: string;
  nombre_producto: string;
  precio_por_kilo: number;
  precio_unitario: number;
  peso_original: number;
  descuento_peso: number;
  peso_final: number;
  subtotal: number;
  producto?: any;
}

export interface PlanPagoDto {
  id_plan_pago?: number;
  uuid?: string;
  ventaId: number;
  total: number;
  monto_inicial: number;
  plazo: number;
  periodicidad: 'DIAS' | 'SEMANAS' | 'MESES';
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado?: 'ACTIVO' | 'PAGADO' | 'CANCELADO';
  pagos?: PagoPlanDto[];
}

export interface PagoPlanDto {
  id_pago_plan?: number;
  uuid?: string;
  plan_pago_id: number;
  monto: number;
  fecha_pago: string;
  observacion?: string;
}

export interface VentaDto {
  id_venta?: number;
  uuid?: string;
  id_cliente: number;
  id_usuario: number;
  fecha_venta: string;
  subtotal: number;
  descuento: number;
  total: number;
  metodo_pago: 'efectivo' | 'transferencia' | 'credito';
  estado: 'pendiente' | 'pagado';
  observaciones?: string;
  cliente?: any;
  usuario?: any;
  detalles?: DetalleVentaDto[];
  planPago?: PlanPagoDto;
}

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private defaultHeaderColor = '#d3d3d3';
  private defaultAlternateColor = '#f9f9f9';

  constructor() {}

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
      alternateRowColor = '#ffffff',
      showFooter = true,
      footerText,
      logo,
    } = options;

    const docDefinition: any = {
      pageSize: pageSize,
      pageOrientation: pageOrientation,
      pageMargins: [40, 60, 40, 60],

      header: (currentPage: number, pageCount: number) => {
        const fechaHora = new Date().toLocaleString('es-BO');
        return {
          columns: [
            logo ? { image: logo, width: 50, margin: [40, 20, 0, 0] } : {},
            {
              text: `Fecha y Hora: ${fechaHora}`,
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
        {
          text: title,
          style: 'header',
          margin: [0, 0, 0, 10],
        },

        subtitle
          ? {
              text: subtitle,
              style: 'subheader',
              margin: [0, 0, 0, 20],
            }
          : {},

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
        font: 'Roboto',
        fontSize: 9,
        color: '#333',
      },
    };

    pdfMake.createPdf(docDefinition).download(this.sanitizeFileName(fileName));
  }

  downloadDeudasPdf(clientesConDeudas: any[]): void {
    try {
      if (
        !clientesConDeudas ||
        !Array.isArray(clientesConDeudas) ||
        clientesConDeudas.length === 0
      ) {
        console.error('No hay datos válidos para generar el PDF de deudas');
        return;
      }

      const fechaHora = new Date().toLocaleString('es-BO');
      const fechaGeneracion = new Date().toLocaleDateString('es-BO');

      // Funciones de formato
      const formatCurrency = (value: any): string => {
        if (value === null || value === undefined) return 'Bs. 0.00';
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return `Bs. ${isNaN(num) ? '0.00' : num.toFixed(2)}`;
      };

      const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('es-BO');
        } catch {
          return 'Fecha inválida';
        }
      };

      // CONSTRUIR TABLA SIN COLSPAN - ESTRUCTURA SIMPLE
      const tableBody: any[] = [];

      // ENCABEZADO - 7 CELDAS
      tableBody.push([
        { text: 'N°', style: 'tableHeader', alignment: 'center' },
        { text: 'CLIENTE', style: 'tableHeader', alignment: 'left' },
        { text: 'N° VENTA', style: 'tableHeader', alignment: 'center' },
        { text: 'FECHA VENTA', style: 'tableHeader', alignment: 'center' },
        { text: 'MONTO TOTAL', style: 'tableHeader', alignment: 'right' },
        { text: 'TOTAL PAGADO', style: 'tableHeader', alignment: 'right' },
        { text: 'SALDO PENDIENTE', style: 'tableHeader', alignment: 'right' },
      ]);

      let contadorCliente = 1;
      let numeroFila = 1;

      // PROCESAR CADA CLIENTE
      clientesConDeudas.forEach((cliente, clienteIndex) => {
        if (!cliente) return;

        const nombreCliente = cliente.nombre_cliente || 'Cliente N/A';
        const ventas = cliente.ventas || [];

        // PROCESAR VENTAS DEL CLIENTE
        if (ventas.length > 0) {
          ventas.forEach((venta: any, ventaIndex: number) => {
            if (!venta) return;

            // Si es la primera venta del cliente, mostrar nombre del cliente
            const mostrarNombreCliente = ventaIndex === 0;

            // FILA DE VENTA - 7 CELDAS
            tableBody.push([
              {
                text: mostrarNombreCliente ? contadorCliente.toString() : '',
                style: 'tableCell',
                alignment: 'center',
              },
              {
                text: mostrarNombreCliente ? nombreCliente : '',
                style: 'tableCell',
                alignment: 'left',
              },
              {
                text: venta.id_venta?.toString() || 'N/A',
                style: 'tableCell',
                alignment: 'center',
              },
              { text: formatDate(venta.fecha_venta), style: 'tableCell', alignment: 'center' },
              { text: formatCurrency(venta.total_venta), style: 'tableCell', alignment: 'right' },
              { text: formatCurrency(venta.total_pagado), style: 'tableCell', alignment: 'right' },
              {
                text: formatCurrency(venta.saldo_pendiente),
                style: 'tableCell',
                alignment: 'right',
              },
            ]);

            numeroFila++;
          });
        } else {
          // CLIENTE SIN VENTAS - 7 CELDAS
          tableBody.push([
            { text: contadorCliente.toString(), style: 'tableCell', alignment: 'center' },
            { text: nombreCliente, style: 'tableCell', alignment: 'left' },
            { text: 'N/A', style: 'tableCell', alignment: 'center' },
            { text: 'N/A', style: 'tableCell', alignment: 'center' },
            { text: 'Bs. 0.00', style: 'tableCell', alignment: 'right' },
            { text: 'Bs. 0.00', style: 'tableCell', alignment: 'right' },
            { text: 'Bs. 0.00', style: 'tableCell', alignment: 'right' },
          ]);
          numeroFila++;
        }

        // CALCULAR TOTALES DEL CLIENTE
        const totalVentas = ventas.reduce(
          (sum: number, v: any) => sum + (Number(v?.total_venta) || 0),
          0
        );
        const totalPagado = ventas.reduce(
          (sum: number, v: any) => sum + (Number(v?.total_pagado) || 0),
          0
        );
        const deudaTotal = Number(cliente.deuda_total) || 0;

        // FILA DE TOTAL CLIENTE - 7 CELDAS
        tableBody.push([
          { text: '', style: 'totalCliente', alignment: 'center' },
          {
            text: `TOTAL ${nombreCliente.toUpperCase()}:`,
            style: 'totalCliente',
            alignment: 'left',
          },
          { text: '', style: 'totalCliente', alignment: 'center' },
          { text: '', style: 'totalCliente', alignment: 'center' },
          { text: formatCurrency(totalVentas), style: 'totalCliente', alignment: 'right' },
          { text: formatCurrency(totalPagado), style: 'totalCliente', alignment: 'right' },
          { text: formatCurrency(deudaTotal), style: 'deudaStyle', alignment: 'right' },
        ]);

        numeroFila++;
        contadorCliente++;

        // SEPARADOR ENTRE CLIENTES
        if (clienteIndex < clientesConDeudas.length - 1) {
          tableBody.push([
            { text: '', style: 'separator' },
            { text: '', style: 'separator' },
            { text: '', style: 'separator' },
            { text: '', style: 'separator' },
            { text: '', style: 'separator' },
            { text: '', style: 'separator' },
            { text: '', style: 'separator' },
          ]);
          numeroFila++;
        }
      });

      // CALCULAR TOTAL GENERAL
      const deudaTotalGeneral = clientesConDeudas.reduce(
        (sum, cliente) => sum + (Number(cliente?.deuda_total) || 0),
        0
      );

      // FILA DE TOTAL GENERAL - 7 CELDAS
      tableBody.push([
        { text: '', style: 'totalGeneral', alignment: 'center' },
        { text: 'TOTAL GENERAL DE DEUDAS:', style: 'totalGeneral', alignment: 'left' },
        { text: '', style: 'totalGeneral', alignment: 'center' },
        { text: '', style: 'totalGeneral', alignment: 'center' },
        { text: '', style: 'totalGeneral', alignment: 'right' },
        { text: '', style: 'totalGeneral', alignment: 'right' },
        { text: formatCurrency(deudaTotalGeneral), style: 'totalGeneralStyle', alignment: 'right' },
      ]);

      // VERIFICAR QUE TODAS LAS FILAS TIENEN 7 CELDAS
      console.log('Verificando estructura de tabla:');
      tableBody.forEach((row, index) => {
        if (!row || row.length !== 7) {
          console.error(`Fila ${index} tiene ${row?.length} celdas en lugar de 7:`, row);
        }
      });

      // CREAR DOCUMENTO PDF
      const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [20, 80, 20, 60],

        header: {
          columns: [
            {
              stack: [
                { text: 'REPORTE DE CLIENTES CON DEUDAS PENDIENTES', style: 'header' },
                { text: 'Sistema Ventas Carnes A&E', style: 'subheader' },
                { text: `Generado el: ${fechaHora}`, style: 'fechaHeader' },
              ],
              alignment: 'center',
            },
          ],
          margin: [0, 20, 0, 0],
        },

        footer: (currentPage: number, pageCount: number) => {
          return {
            columns: [
              {
                text: 'Distribuidora A-E - Reporte de Deudas Pendientes',
                alignment: 'left',
                margin: [20, 0, 0, 0],
                fontSize: 8,
                color: '#666666',
              },
              {
                text: `Página ${currentPage} de ${pageCount}`,
                alignment: 'right',
                margin: [0, 0, 20, 0],
                fontSize: 8,
                color: '#666666',
              },
            ],
            margin: [0, 10, 0, 10],
          };
        },

        content: [
          {
            table: {
              headerRows: 1,
              widths: ['5%', '25%', '10%', '12%', '15%', '15%', '15%'],
              body: tableBody,
            },
            layout: {
              hLineWidth: (i: number, node: any) => {
                return i === 0 || i === node.table.body.length - 1 ? 1 : 0.5;
              },
              vLineWidth: () => 0.5,
              hLineColor: () => '#000000',
              vLineColor: () => '#000000',
              paddingLeft: () => 4,
              paddingRight: () => 4,
              paddingTop: () => 3,
              paddingBottom: () => 3,
            },
          },
          {
            text: `Total de clientes con deudas: ${clientesConDeudas.length}`,
            style: 'summary',
            margin: [0, 20, 0, 0],
          },
        ],

        styles: {
          header: {
            fontSize: 16,
            bold: true,
            color: '#000000',
            alignment: 'center',
            margin: [0, 0, 0, 5],
          },
          subheader: {
            fontSize: 12,
            color: '#000000',
            alignment: 'center',
            margin: [0, 0, 0, 5],
          },
          fechaHeader: {
            fontSize: 10,
            color: '#000000',
            alignment: 'center',
            margin: [0, 0, 0, 10],
          },
          tableHeader: {
            bold: true,
            fontSize: 9,
            color: '#000000',
            fillColor: '#E0E0E0',
            alignment: 'center',
          },
          tableCell: {
            fontSize: 8,
            color: '#000000',
          },
          totalCliente: {
            bold: true,
            fontSize: 8,
            color: '#000000',
            fillColor: '#E8E8E8',
          },
          deudaStyle: {
            bold: true,
            fontSize: 8,
            color: '#000000',
            fillColor: '#F0F0F0',
          },
          totalGeneral: {
            bold: true,
            fontSize: 9,
            color: '#000000',
            fillColor: '#D0D0D0',
          },
          totalGeneralStyle: {
            bold: true,
            fontSize: 9,
            color: '#000000',
            fillColor: '#D0D0D0',
          },
          separator: {
            fontSize: 4,
            fillColor: '#FFFFFF',
          },
          summary: {
            fontSize: 10,
            bold: true,
            alignment: 'right',
            color: '#000000',
          },
        },

        defaultStyle: {
          font: 'Roboto',
          fontSize: 8,
          color: '#000000',
        },
      };

      const fileName = `Clientes_Con_Deudas_Pendientes_${fechaGeneracion.replace(/\//g, '-')}.pdf`;
      pdfMake.createPdf(docDefinition).download(fileName);
    } catch (error) {
      console.error('Error generando PDF de deudas:', error);
    }
  }

  generateReciboPdf(venta: VentaDto): void {
    const formatNumber = (value: any): string => {
      if (value === null || value === undefined) return '0.00';
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    const formatDate = (dateString: string | undefined): string => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-BO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return 'Fecha inválida';
      }
    };

    const getClienteNombre = (venta: VentaDto): string => {
      const cliente = venta.cliente;
      if (!cliente) return 'Cliente N/A';

      if (cliente.persona?.nombre) {
        return `${cliente.persona.nombre} ${cliente.persona.apellido || ''}`.trim();
      }

      if (cliente.nombre) {
        return cliente.nombre;
      }

      return 'Cliente ' + (venta.id_cliente || 'N/A');
    };

    const buildProductosTable = (detalles: DetalleVentaDto[]): any => {
      if (!detalles || detalles.length === 0) {
        return {
          text: 'No hay productos en esta venta',
          italics: true,
          color: '#666',
          margin: [0, 0, 0, 10],
        };
      }

      const body = [
        [
          { text: 'Código', style: 'tableHeader' },
          { text: 'Producto', style: 'tableHeader' },
          { text: 'Peso (Kg)', style: 'tableHeader' },
          { text: 'Precio/Kg', style: 'tableHeader' },
          { text: 'Subtotal', style: 'tableHeader' },
        ],
        ...detalles.map((detalle) => [
          { text: detalle.producto_codigo || 'N/A', style: 'tableCell', alignment: 'center' },
          { text: detalle.nombre_producto || 'N/A', style: 'tableCell', alignment: 'left' },
          { text: formatNumber(detalle.peso_final), style: 'tableCell', alignment: 'right' },
          { text: formatNumber(detalle.precio_por_kilo), style: 'tableCell', alignment: 'right' },
          { text: formatNumber(detalle.subtotal), style: 'tableCell', alignment: 'right' },
        ]),
      ];

      return {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto'],
          body: body,
        },
        layout: {
          fillColor: (rowIndex: number) => {
            return rowIndex === 0 ? '#404040' : rowIndex % 2 === 0 ? '#f5f5f5' : null;
          },
          hLineWidth: (i: number) => 0.5,
          vLineWidth: (i: number) => 0.5,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
        },
        margin: [0, 0, 0, 10],
      };
    };

    const buildPagosTable = (pagos: PagoPlanDto[]): any => {
      if (!pagos || pagos.length === 0) {
        return {
          text: 'No se han realizado pagos',
          italics: true,
          color: '#666',
          margin: [0, 0, 0, 10],
        };
      }

      const body = [
        [
          { text: 'Fecha', style: 'tableHeader' },
          { text: 'Monto', style: 'tableHeader' },
          { text: 'Observación', style: 'tableHeader' },
        ],
        ...pagos.map((pago) => [
          { text: formatDate(pago.fecha_pago), style: 'tableCell', alignment: 'center' },
          { text: `${formatNumber(pago.monto)} Bs.`, style: 'tableCell', alignment: 'right' },
          { text: pago.observacion || '-', style: 'tableCell', alignment: 'left' },
        ]),
      ];

      return {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', '*'],
          body: body,
        },
        layout: {
          fillColor: (rowIndex: number) => {
            return rowIndex === 0 ? '#404040' : rowIndex % 2 === 0 ? '#f5f5f5' : null;
          },
          hLineWidth: (i: number) => 0.5,
          vLineWidth: (i: number) => 0.5,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
        },
        margin: [0, 0, 0, 10],
      };
    };

    const buildPlanPagosSection = (planPago: PlanPagoDto | undefined): any[] => {
      if (!planPago || !planPago.pagos || planPago.pagos.length === 0) {
        return [];
      }

      const totalPagado =
        planPago.pagos?.reduce((sum, pago) => {
          const monto = typeof pago.monto === 'string' ? parseFloat(pago.monto) : pago.monto;
          return sum + (monto || 0);
        }, 0) || 0;

      const totalPlan =
        typeof planPago.total === 'string' ? parseFloat(planPago.total) : planPago.total;
      const saldoPendiente = (totalPlan || 0) - totalPagado;

      return [
        {
          text: 'PLAN DE PAGOS',
          style: 'sectionHeader',
          margin: [0, 10, 0, 5],
        },

        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Monto Total:', bold: true },
                { text: `${formatNumber(planPago.total)} Bs.`, alignment: 'right' },
              ],
              [
                { text: 'Monto Inicial:', bold: true },
                { text: `${formatNumber(planPago.monto_inicial)} Bs.`, alignment: 'right' },
              ],
              [
                { text: 'Fecha de Pago:', bold: true },
                { text: formatDate(planPago.fecha_inicio), alignment: 'right' },
              ],
            ],
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 10],
        },

        {
          text: 'PAGOS REALIZADOS',
          style: 'sectionHeader',
          margin: [0, 0, 0, 5],
        },

        buildPagosTable(planPago.pagos || []),

        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Total Pagado:', bold: true, fontSize: 10 },
                {
                  text: `${formatNumber(totalPagado)} Bs.`,
                  alignment: 'right',
                  fontSize: 10,
                },
              ],
              [
                { text: 'Saldo Pendiente:', bold: true, fontSize: 10 },
                {
                  text: `${formatNumber(saldoPendiente)} Bs.`,
                  alignment: 'right',
                  fontSize: 10,
                  bold: true,
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
          margin: [0, 5, 0, 0],
        },
      ];
    };

    const fechaHora = new Date().toLocaleString('es-BO');

    const docDefinition: any = {
      pageSize: 'A5',
      pageOrientation: 'portrait',
      pageMargins: [15, 15, 15, 15],

      header: {
        columns: [
          {
            text: 'RECIBO DE VENTA',
            alignment: 'center',
            bold: true,
            fontSize: 14,
            margin: [0, 5, 0, 5],
          },
        ],
      },

      footer: (currentPage: number, pageCount: number) => {
        return {
          columns: [
            {
              text: `Generado el ${fechaHora}`,
              alignment: 'left',
              fontSize: 7,
              color: '#666',
            },
            {
              text: `Página ${currentPage} de ${pageCount}`,
              alignment: 'right',
              fontSize: 7,
              color: '#666',
            },
          ],
          margin: [15, 5, 15, 5],
        };
      },

      content: [
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'N° Venta:', bold: true, border: [false, false, false, false] },
                { text: `#${venta.id_venta || 'N/A'}`, border: [false, false, false, false] },
              ],
              [
                { text: 'Fecha Venta:', bold: true, border: [false, false, false, false] },
                { text: formatDate(venta.fecha_venta), border: [false, false, false, false] },
              ],
              [
                { text: 'Cliente:', bold: true, border: [false, false, false, false] },
                { text: getClienteNombre(venta), border: [false, false, false, false] },
              ],
              [
                { text: 'Método Pago:', bold: true, border: [false, false, false, false] },
                {
                  text: (venta.metodo_pago || '').toUpperCase(),
                  border: [false, false, false, false],
                },
              ],
              [
                { text: 'Estado:', bold: true, border: [false, false, false, false] },
                { text: (venta.estado || '').toUpperCase(), border: [false, false, false, false] },
              ],
            ],
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 10],
        },

        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
              lineColor: '#cccccc',
            },
          ],
          margin: [0, 5, 0, 10],
        },

        {
          text: 'PRODUCTOS VENDIDOS',
          style: 'sectionHeader',
          margin: [0, 0, 0, 5],
        },

        buildProductosTable(venta.detalles || []),

        {
          text: 'RESUMEN DE VENTA',
          style: 'sectionHeader',
          margin: [0, 10, 0, 5],
        },

        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Total:', bold: true, alignment: 'left', fontSize: 11 },
                {
                  text: `${formatNumber(venta.total)} Bs.`,
                  bold: true,
                  alignment: 'right',
                  fontSize: 11,
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
          margin: [0, 0, 0, 10],
        },

        ...buildPlanPagosSection(venta.planPago),
      ],

      styles: {
        sectionHeader: {
          fontSize: 11,
          bold: true,
          color: '#000000',
          background: '#f5f5f5',
          padding: [3, 5],
          border: [false, false, false, true],
          borderColor: '#000000',
          borderLineWidth: 1,
        },
        tableHeader: {
          bold: true,
          fontSize: 8,
          color: '#ffffff',
          fillColor: '#404040',
          alignment: 'center',
        },
        tableCell: {
          fontSize: 7,
          padding: [1, 2],
        },
        totalRow: {
          bold: true,
          fontSize: 8,
          fillColor: '#f5f5f5',
        },
      },

      defaultStyle: {
        font: 'Roboto',
        fontSize: 8,
        color: '#000000',
      },
    };

    const fileName = `Recibo_Venta_${venta.id_venta}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  private buildTableBody(columns: PdfColumn[], data: any[]): any[][] {
    const headers = columns.map((col) => ({
      text: col.header,
      style: 'tableHeader',
      alignment: col.alignment || 'center',
    }));

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
      defaultStyle: {
        font: 'Roboto',
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
