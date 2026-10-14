import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject,
  signal,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from './services/analytics.service';
import {
  DepartmentMetric,
  CostCategory,
  PeriodComparison,
  Recommendation
} from './models/analytics.models';
import {
  Chart,
  registerables
} from 'chart.js';

Chart.register(...registerables);

type ActiveTab = 'resumen' | 'personal' | 'estadisticas' | 'costos' | 'comparativas' | 'informes';
type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, AfterViewInit {
  readonly analytics = inject(AnalyticsService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentTab = signal<ActiveTab>('resumen');
  readonly showNotification = signal<string | null>(null);

  // Search
  searchQueryText = '';

  // Modals state
  readonly showDeptModal = signal<boolean>(false);
  readonly showCostModal = signal<boolean>(false);
  readonly showCompModal = signal<boolean>(false);
  readonly showRecModal = signal<boolean>(false);
  readonly showDeleteConfirmModal = signal<boolean>(false);

  deptModalMode: ModalMode = 'create';
  costModalMode: ModalMode = 'create';
  compModalMode: ModalMode = 'create';
  recModalMode: ModalMode = 'create';

  // Item to delete
  pendingDeleteAction: (() => void) | null = null;
  deleteTitle = '';

  // Form Models
  currentDeptForm: Partial<DepartmentMetric> = {};
  currentCostForm: Partial<CostCategory> = {};
  currentCompForm: Partial<PeriodComparison> = {};
  currentRecForm: Partial<Recommendation> = {};

  // Filter state bindings
  readonly selectedPeriod = this.analytics.selectedPeriod;
  readonly selectedComparison = this.analytics.selectedComparison;
  readonly selectedDepartment = this.analytics.selectedDepartment;

  // Chart References
  @ViewChild('trendChartCanvas') trendChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('deptDistributionCanvas') deptDistributionCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('comparisonChartCanvas') comparisonChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('productivityChartCanvas') productivityChartCanvas?: ElementRef<HTMLCanvasElement>;

  private trendChart?: Chart;
  private deptChart?: Chart;
  private comparisonChart?: Chart;
  private productivityChart?: Chart;

  // Data signals
  readonly kpis = this.analytics.filteredKPIs;
  readonly departments = this.analytics.filteredDepartments;
  readonly costCategories = this.analytics.filteredCostCategories;
  readonly monthlyTrends = this.analytics.monthlyTrends;
  readonly periodComparisons = this.analytics.periodComparisons;
  readonly report = this.analytics.executiveReport;

  ngOnInit(): void {
    // Initial setup
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.renderCharts();
      }, 100);
    }
  }

  setTab(tab: ActiveTab): void {
    this.currentTab.set(tab);
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.renderCharts();
      }, 150);
    }
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQueryText = val;
    this.analytics.setSearchQuery(val);
  }

  clearSearch(): void {
    this.searchQueryText = '';
    this.analytics.setSearchQuery('');
  }

  onPeriodChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.analytics.setPeriod(val);
    this.notify(`Período actualizado a ${val}`);
    this.renderCharts();
  }

  onDepartmentChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.analytics.setDepartment(val);
    this.notify(`Filtro por área: ${val}`);
    this.renderCharts();
  }

  notify(msg: string): void {
    this.showNotification.set(msg);
    setTimeout(() => {
      this.showNotification.set(null);
    }, 3200);
  }

  // --- CONFIRMATION MODAL ---
  confirmDelete(title: string, action: () => void): void {
    this.deleteTitle = title;
    this.pendingDeleteAction = action;
    this.showDeleteConfirmModal.set(true);
  }

  executeDelete(): void {
    if (this.pendingDeleteAction) {
      this.pendingDeleteAction();
      this.pendingDeleteAction = null;
    }
    this.showDeleteConfirmModal.set(false);
    this.renderCharts();
  }

  cancelDelete(): void {
    this.pendingDeleteAction = null;
    this.showDeleteConfirmModal.set(false);
  }

  // --- CRUD: DEPARTMENTS ---
  openCreateDeptModal(): void {
    this.deptModalMode = 'create';
    this.currentDeptForm = {
      department: '',
      headcount: 10,
      openPositions: 1,
      turnoverRate: 2.0,
      retentionRate: 95.0,
      avgCostPerEmployee: 6500,
      totalPayroll: 65000,
      productivityScore: 92.0,
      satisfactionRate: 70,
      overtimeHours: 20,
      absenteeismRate: 1.0
    };
    this.showDeptModal.set(true);
  }

  openEditDeptModal(dept: DepartmentMetric): void {
    this.deptModalMode = 'edit';
    this.currentDeptForm = { ...dept };
    this.showDeptModal.set(true);
  }

  saveDept(): void {
    const deptName = (this.currentDeptForm.department || '').trim();
    if (!deptName) {
      alert('Por favor ingrese el nombre del departamento');
      return;
    }

    const form = this.currentDeptForm;
    const headcount = Number(form.headcount) || 1;
    const avgCost = Number(form.avgCostPerEmployee) || 0;
    const totalPayroll = Number(form.totalPayroll) || (headcount * avgCost);

    const payload: Omit<DepartmentMetric, 'id'> = {
      department: deptName,
      headcount: headcount,
      openPositions: Number(form.openPositions) || 0,
      turnoverRate: Number(form.turnoverRate) || 0,
      retentionRate: Number(form.retentionRate) || 100,
      avgCostPerEmployee: avgCost,
      totalPayroll: totalPayroll,
      productivityScore: Number(form.productivityScore) || 90,
      satisfactionRate: Number(form.satisfactionRate) || 60,
      overtimeHours: Number(form.overtimeHours) || 0,
      absenteeismRate: Number(form.absenteeismRate) || 0
    };

    if (this.deptModalMode === 'create') {
      this.analytics.addDepartment(payload);
      this.notify(`Departamento '${payload.department}' creado con éxito`);
    } else if (form.id) {
      this.analytics.updateDepartment(form.id, payload);
      this.notify(`Departamento '${payload.department}' actualizado`);
    }

    this.showDeptModal.set(false);
    this.renderCharts();
  }

  deleteDept(dept: DepartmentMetric): void {
    this.confirmDelete(`¿Eliminar el departamento '${dept.department}' y todos sus indicadores?`, () => {
      this.analytics.deleteDepartment(dept.id);
      this.notify(`Departamento '${dept.department}' eliminado`);
    });
  }

  // --- CRUD: COST CATEGORIES ---
  openCreateCostModal(): void {
    this.costModalMode = 'create';
    this.currentCostForm = {
      category: '',
      budgeted: 50000,
      actual: 48000,
      department: 'General',
      status: 'on_track'
    };
    this.showCostModal.set(true);
  }

  openEditCostModal(cat: CostCategory): void {
    this.costModalMode = 'edit';
    this.currentCostForm = { ...cat };
    this.showCostModal.set(true);
  }

  saveCost(): void {
    const catName = (this.currentCostForm.category || '').trim();
    if (!catName) {
      alert('Por favor ingrese el concepto de la partida');
      return;
    }

    const form = this.currentCostForm;
    const payload = {
      category: catName,
      budgeted: Number(form.budgeted) || 0,
      actual: Number(form.actual) || 0,
      department: form.department || 'General',
      status: form.status || 'on_track'
    };

    if (this.costModalMode === 'create') {
      this.analytics.addCostCategory(payload);
      this.notify(`Partida '${payload.category}' añadida a costos`);
    } else if (form.id) {
      this.analytics.updateCostCategory(form.id, payload);
      this.notify(`Partida '${payload.category}' actualizada`);
    }

    this.showCostModal.set(false);
    this.renderCharts();
  }

  deleteCost(cat: CostCategory): void {
    this.confirmDelete(`¿Eliminar la partida presupuestaria '${cat.category}'?`, () => {
      this.analytics.deleteCostCategory(cat.id);
      this.notify(`Partida '${cat.category}' eliminada`);
    });
  }

  // --- CRUD: PERIOD COMPARISONS ---
  openCreateCompModal(): void {
    this.compModalMode = 'create';
    this.currentCompForm = {
      metric: '',
      unit: 'S/.',
      periodAValue: 100,
      periodBValue: 90,
      trend: 'up',
      isFavorable: true,
      category: 'Costos'
    };
    this.showCompModal.set(true);
  }

  openEditCompModal(comp: PeriodComparison): void {
    this.compModalMode = 'edit';
    this.currentCompForm = { ...comp };
    this.showCompModal.set(true);
  }

  saveComp(): void {
    const metricName = (this.currentCompForm.metric || '').trim();
    if (!metricName) {
      alert('Por favor ingrese el nombre de la métrica');
      return;
    }

    const form = this.currentCompForm;
    const valA = Number(form.periodAValue) || 0;
    const valB = Number(form.periodBValue) || 0;

    const payload = {
      metric: metricName,
      unit: form.unit || '',
      periodAValue: valA,
      periodBValue: valB,
      trend: (valA > valB ? 'up' : valA < valB ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
      isFavorable: form.isFavorable ?? true,
      category: (form.category || 'Personal') as 'Personal' | 'Costos' | 'Operaciones'
    };

    if (this.compModalMode === 'create') {
      this.analytics.addPeriodComparison(payload);
      this.notify(`Métrica comparativa agregada`);
    } else if (form.id) {
      this.analytics.updatePeriodComparison(form.id, payload);
      this.notify(`Métrica comparativa actualizada`);
    }

    this.showCompModal.set(false);
    this.renderCharts();
  }

  deleteComp(comp: PeriodComparison): void {
    this.confirmDelete(`¿Eliminar la métrica comparativa '${comp.metric}'?`, () => {
      this.analytics.deletePeriodComparison(comp.id);
      this.notify(`Métrica eliminada`);
    });
  }

  // --- CRUD: RECOMMENDATIONS ---
  openCreateRecModal(): void {
    this.recModalMode = 'create';
    this.currentRecForm = {
      action: '',
      department: 'Operaciones',
      priority: 'Alta',
      estimatedImpact: 'Impacto en Soles estimado',
      status: 'Pendiente'
    };
    this.showRecModal.set(true);
  }

  openEditRecModal(rec: Recommendation): void {
    this.recModalMode = 'edit';
    this.currentRecForm = { ...rec };
    this.showRecModal.set(true);
  }

  saveRec(): void {
    const actionDesc = (this.currentRecForm.action || '').trim();
    if (!actionDesc) {
      alert('Por favor describa la acción estratégica');
      return;
    }

    const form = this.currentRecForm;
    const payload = {
      action: actionDesc,
      department: form.department || 'Dirección',
      priority: (form.priority || 'Media') as 'Alta' | 'Media' | 'Baja',
      estimatedImpact: form.estimatedImpact || 'Por definir',
      status: (form.status || 'Pendiente') as 'Pendiente' | 'En Progreso' | 'Aprobado'
    };

    if (this.recModalMode === 'create') {
      this.analytics.addRecommendation(payload);
      this.notify(`Recomendación registrada`);
    } else if (form.id) {
      this.analytics.updateRecommendation(form.id, payload);
      this.notify(`Recomendación actualizada`);
    }

    this.showRecModal.set(false);
  }

  deleteRec(rec: Recommendation): void {
    this.confirmDelete(`¿Eliminar la recomendación '${rec.action.slice(0, 35)}...'?`, () => {
      this.analytics.deleteRecommendation(rec.id);
      this.notify(`Recomendación eliminada`);
    });
  }

  resetDemo(): void {
    this.confirmDelete('¿Restablecer todos los datos del sistema a valores de fábrica en Soles (S/.)?', () => {
      this.analytics.resetAllData();
      this.notify('Datos restaurados correctamente a Soles');
      this.renderCharts();
    });
  }

  exportCSV(): void {
    this.analytics.exportToCSV();
    this.notify('Exportando reporte en Soles (S/.) a CSV...');
  }

  printReport(): void {
    this.analytics.printReport();
  }

  private renderCharts(): void {
    this.initTrendChart();
    this.initDeptDistributionChart();
    this.initComparisonChart();
    this.initProductivityChart();
  }

  private initTrendChart(): void {
    if (!this.trendChartCanvas?.nativeElement) return;
    if (this.trendChart) this.trendChart.destroy();

    const trends = this.monthlyTrends();
    const ctx = this.trendChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trends.map(t => t.month),
        datasets: [
          {
            label: 'Costo Total Real (S/.)',
            data: trends.map(t => t.totalCost),
            borderColor: '#DC2626',
            backgroundColor: 'rgba(220, 38, 38, 0.15)',
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: '#DC2626',
            pointRadius: 5
          },
          {
            label: 'Presupuesto Aprobado (S/.)',
            data: trends.map(t => t.budget),
            borderColor: '#94a3b8',
            borderDash: [6, 6],
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#e2e8f0', font: { family: 'Plus Jakarta Sans', size: 12 } }
          },
          tooltip: {
            backgroundColor: '#0B192C',
            titleColor: '#FFFFFF',
            bodyColor: '#e2e8f0',
            borderColor: '#DC2626',
            borderWidth: 1,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: S/. ${Number(ctx.raw).toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              callback: val => `S/. ${Number(val).toLocaleString()}`
            }
          }
        }
      }
    });
  }

  private initDeptDistributionChart(): void {
    if (!this.deptDistributionCanvas?.nativeElement) return;
    if (this.deptChart) this.deptChart.destroy();

    const depts = this.departments();
    const ctx = this.deptDistributionCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.deptChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: depts.map(d => d.department),
        datasets: [
          {
            data: depts.map(d => d.headcount),
            backgroundColor: [
              '#DC2626',
              '#0ea5e9',
              '#f59e0b',
              '#10b981',
              '#8b5cf6',
              '#ec4899',
              '#14b8a6'
            ],
            borderColor: '#0B192C',
            borderWidth: 3,
            hoverOffset: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              font: { family: 'Plus Jakarta Sans', size: 11 },
              padding: 12
            }
          }
        }
      }
    });
  }

  private initComparisonChart(): void {
    if (!this.comparisonChartCanvas?.nativeElement) return;
    if (this.comparisonChart) this.comparisonChart.destroy();

    const comps = this.periodComparisons().slice(0, 5);
    const ctx = this.comparisonChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.comparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: comps.map(c => c.metric),
        datasets: [
          {
            label: 'Período Actual (Q3)',
            data: comps.map(c => c.periodAValue),
            backgroundColor: '#DC2626',
            borderRadius: 6
          },
          {
            label: 'Período Anterior (Q2)',
            data: comps.map(c => c.periodBValue),
            backgroundColor: '#3b82f6',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#e2e8f0', font: { family: 'Plus Jakarta Sans', size: 12 } }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              maxRotation: 20
            }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  }

  private initProductivityChart(): void {
    if (!this.productivityChartCanvas?.nativeElement) return;
    if (this.productivityChart) this.productivityChart.destroy();

    const depts = this.departments();
    const ctx = this.productivityChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.productivityChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: depts.map(d => d.department.split('&')[0]),
        datasets: [
          {
            label: 'Productividad (%)',
            data: depts.map(d => d.productivityScore),
            borderColor: '#DC2626',
            backgroundColor: 'rgba(220, 38, 38, 0.25)',
            borderWidth: 2,
            pointBackgroundColor: '#DC2626'
          },
          {
            label: 'Retención (%)',
            data: depts.map(d => d.retentionRate),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 2,
            pointBackgroundColor: '#10b981'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        },
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            pointLabels: { color: '#e2e8f0', font: { size: 11, weight: 'bold' } },
            ticks: { display: false },
            suggestedMin: 80,
            suggestedMax: 100
          }
        }
      }
    });
  }
}
