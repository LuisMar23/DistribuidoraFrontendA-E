import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';

import { ChartData } from 'chart.js';
import { DashboardService } from '../core/services/dashboard.service';
import {
  faCartShopping,
  faDollarSign,
  faTruck,
  faUserPlus,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FontAwesomeModule,],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  // Signals
  general = signal<any>(null);
  ventas = signal<any>(null);
  compras = signal<any>(null);
  caja = signal<any>(null);
  faenas = signal<any>(null);
  personas = signal<any>(null);
  clientesDeuda = signal<any>(null);
  loading = signal<boolean>(true);

  // Icons
  faDollarSign = faDollarSign;
  faCartShopping = faCartShopping;
  faUserPlus = faUserPlus;
  faTruck = faTruck;
  faUsers = faUsers;

  // Charts
  ventasChartData!: ChartData<'bar'>;
  comprasChartData!: ChartData<'bar'>;
  cajaChartData!: ChartData<'line'>;
  clientesDeudaChartData!: ChartData<'doughnut'>;

  constructor(private dashboardSvc: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  private toNum(value: any): number {
    if (!value) return 0;
    if (typeof value === 'object' && '_isDecimal' in value) return Number(value.toString());
    return Number(value);
  }

  private setupCharts() {

    this.ventasChartData = {
      labels: this.ventas()?.ventasPorCliente.map((v: any) => `Cliente ${v.id_cliente}`) || [],
      datasets: [
        {
          data: this.ventas()?.ventasPorCliente.map((v: any) => this.toNum(v._sum.total)) || [],
          label: 'Ventas por cliente',
          backgroundColor: '#3b82f6',
          type: 'bar',
        },
      ],
    };


    this.comprasChartData = {
      labels:
        this.compras()?.proveedoresMasActivos.map((p: any) => `Proveedor ${p.proveedorId}`) || [],
      datasets: [
        {
          data: this.compras()?.proveedoresMasActivos.map((p: any) => p._count.proveedorId) || [],
          label: 'Compras',
          backgroundColor: '#10b981',
          type: 'bar',
        },
      ],
    };


    const movimientos = this.caja()?.ultimosMovimientos || [];
    const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 });
    const finSemana = endOfWeek(new Date(), { weekStartsOn: 1 });
    const diasSemana = eachDayOfInterval({ start: inicioSemana, end: finSemana });

    const ingresos = diasSemana.map(() => 0);
    const egresos = diasSemana.map(() => 0);

    movimientos.forEach((mov: any) => {
      const fecha = new Date(mov.fecha);
      const index = diasSemana.findIndex((d) => d.getDate() === fecha.getDate());
      if (index >= 0) {
        if (mov.tipo === 'INGRESO') ingresos[index] += this.toNum(mov.monto);
        if (mov.tipo === 'EGRESO') egresos[index] += this.toNum(mov.monto);
      }
    });

    this.cajaChartData = {
      labels: diasSemana.map((d) => format(d, 'EEEE', { locale: es })),
      datasets: [
        { data: ingresos, label: 'Ingresos', borderColor: '#3b82f6', fill: false, type: 'line' },
        { data: egresos, label: 'Egresos', borderColor: '#ef4444', fill: false, type: 'line' },
      ],
    };

    const deuda = this.clientesDeuda()?.deuda || 0;
    const sinDeuda = this.clientesDeuda()?.sinDeuda || 0;
    this.clientesDeudaChartData = {
      labels: ['Con Deuda', 'Sin Deuda'],
      datasets: [
        {
          data: [deuda, sinDeuda],
          backgroundColor: ['#ef4444', '#10b981'],
          hoverBackgroundColor: ['#dc2626', '#059669'],
        },
      ],
    };
  }

  async loadDashboard() {
    this.loading.set(true);
    try {
      const [general, ventas, compras, caja, faenas, personas, clientesDeuda] = await Promise.all([
        this.dashboardSvc.getGeneral().toPromise(),
        this.dashboardSvc.getVentas().toPromise(),
        this.dashboardSvc.getCompras().toPromise(),
        this.dashboardSvc.getCaja().toPromise(),
        this.dashboardSvc.getFaenas().toPromise(),
        this.dashboardSvc.getPersonas().toPromise(),
        this.dashboardSvc.getClientesDeuda().toPromise(), // 👈 nuevo
      ]);

      this.general.set(general);
      this.ventas.set(ventas);
      this.compras.set(compras);
      this.caja.set(caja);
      this.faenas.set(faenas);
      this.personas.set(personas);
      this.clientesDeuda.set(clientesDeuda);

      this.setupCharts();
    } finally {
      this.loading.set(false);
    }
  }
}
