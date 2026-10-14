import { Injectable, signal, computed } from '@angular/core';
import {
  KPIItem,
  DepartmentMetric,
  CostCategory,
  MonthlyTrend,
  PeriodComparison,
  ExecutiveReport,
  Recommendation
} from '../models/analytics.models';

const STORAGE_KEY = 'aura_analytics_data_v2';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  // Global filter signals
  readonly selectedPeriod = signal<string>('Q3-2026');
  readonly selectedComparison = signal<string>('Q2-2026');
  readonly selectedDepartment = signal<string>('Todos');

  // Search filter query
  readonly searchQuery = signal<string>('');

  // Initial Default Data (in Soles S/.)
  private readonly defaultKPIs: KPIItem[] = [
    {
      id: 'kpi-headcount',
      title: 'Plantilla Activa (Headcount)',
      value: '248',
      numericValue: 248,
      change: 6.4,
      isPositive: true,
      periodText: 'vs período anterior (+15 colaboradores)',
      subtitle: 'Tasa de retención 95.6%',
      category: 'personal'
    },
    {
      id: 'kpi-payroll',
      title: 'Costo de Nómina Mensual',
      value: 'S/. 1,833,500',
      numericValue: 1833500,
      change: -2.1,
      isPositive: true,
      periodText: 'optimización de S/. 39,140',
      subtitle: 'Costo prom. x colaborador: S/. 7,393',
      category: 'costos'
    },
    {
      id: 'kpi-turnover',
      title: 'Tasa de Rotación (Turnover)',
      value: '2.8%',
      numericValue: 2.8,
      change: -1.4,
      isPositive: true,
      periodText: 'reducción favorable vs 4.2%',
      subtitle: 'Meta directiva: < 3.5%',
      category: 'personal'
    },
    {
      id: 'kpi-productivity',
      title: 'Índice de Productividad Global',
      value: '94.6%',
      numericValue: 94.6,
      change: 5.2,
      isPositive: true,
      periodText: 'supera objetivo anual (90%)',
      subtitle: 'SLA promedio: 98.4%',
      category: 'estadisticas'
    },
    {
      id: 'kpi-overtime',
      title: 'Horas Extras Acumuladas',
      value: '312 hrs',
      numericValue: 312,
      change: -18.5,
      isPositive: true,
      periodText: 'descenso notable de costos extra',
      subtitle: 'Ahorro estimado: S/. 33,060',
      category: 'costos'
    },
    {
      id: 'kpi-satisfaction',
      title: 'Clima Laboral & eNPS',
      value: '+68',
      numericValue: 68,
      change: 8.0,
      isPositive: true,
      periodText: 'Categoría Excelente (Zona Top)',
      subtitle: '89% participación en encuesta',
      category: 'estadisticas'
    }
  ];

  private readonly defaultDepartments: DepartmentMetric[] = [
    {
      id: 'dept-1',
      department: 'Tecnología & Producto',
      headcount: 84,
      openPositions: 6,
      turnoverRate: 1.8,
      retentionRate: 98.2,
      avgCostPerEmployee: 9310,
      totalPayroll: 782040,
      productivityScore: 96.5,
      satisfactionRate: 74,
      overtimeHours: 64,
      absenteeismRate: 0.9
    },
    {
      id: 'dept-2',
      department: 'Operaciones & Logística',
      headcount: 72,
      openPositions: 4,
      turnoverRate: 3.6,
      retentionRate: 92.4,
      avgCostPerEmployee: 6270,
      totalPayroll: 451440,
      productivityScore: 93.8,
      satisfactionRate: 65,
      overtimeHours: 142,
      absenteeismRate: 2.4
    },
    {
      id: 'dept-3',
      department: 'Comercial & Ventas',
      headcount: 45,
      openPositions: 3,
      turnoverRate: 4.1,
      retentionRate: 91.0,
      avgCostPerEmployee: 7980,
      totalPayroll: 359100,
      productivityScore: 95.2,
      satisfactionRate: 70,
      overtimeHours: 48,
      absenteeismRate: 1.2
    },
    {
      id: 'dept-4',
      department: 'Finanzas & Administración',
      headcount: 26,
      openPositions: 1,
      turnoverRate: 1.2,
      retentionRate: 98.8,
      avgCostPerEmployee: 7030,
      totalPayroll: 182780,
      productivityScore: 94.0,
      satisfactionRate: 66,
      overtimeHours: 32,
      absenteeismRate: 0.8
    },
    {
      id: 'dept-5',
      department: 'Gestión de Talento & RRHH',
      headcount: 21,
      openPositions: 1,
      turnoverRate: 2.0,
      retentionRate: 97.5,
      avgCostPerEmployee: 6536,
      totalPayroll: 137256,
      productivityScore: 93.1,
      satisfactionRate: 78,
      overtimeHours: 26,
      absenteeismRate: 1.0
    }
  ];

  private readonly defaultCostCategories: CostCategory[] = [
    {
      id: 'cost-1',
      category: 'Sueldos Base & Cargas Sociales',
      budgeted: 1558000,
      actual: 1514300,
      variance: -43700,
      variancePercentage: -2.8,
      department: 'Todos',
      status: 'on_track'
    },
    {
      id: 'cost-2',
      category: 'Compensaciones Variables & Bonos',
      budgeted: 171000,
      actual: 160740,
      variance: -10260,
      variancePercentage: -6.0,
      department: 'Comercial & Ventas',
      status: 'on_track'
    },
    {
      id: 'cost-3',
      category: 'Beneficios & EPS Privada',
      budgeted: 121600,
      actual: 118560,
      variance: -3040,
      variancePercentage: -2.5,
      department: 'Gestión de Talento',
      status: 'on_track'
    },
    {
      id: 'cost-4',
      category: 'Capacitación, Licencias y Desarrollo',
      budgeted: 83600,
      actual: 94240,
      variance: 10640,
      variancePercentage: 12.7,
      department: 'Tecnología & Talento',
      status: 'warning'
    },
    {
      id: 'cost-5',
      category: 'Horas Extras & Guardias Operativas',
      budgeted: 57000,
      actual: 39900,
      variance: -17100,
      variancePercentage: -30.0,
      department: 'Operaciones',
      status: 'on_track'
    },
    {
      id: 'cost-6',
      category: 'Reclutamiento & Headhunting',
      budgeted: 68400,
      actual: 53960,
      variance: -14440,
      variancePercentage: -21.1,
      department: 'Gestión de Talento',
      status: 'on_track'
    }
  ];

  private readonly defaultMonthlyTrends: MonthlyTrend[] = [
    { id: 't-1', month: 'Ene', payrollCost: 1755600, operationalCost: 273600, totalCost: 2029200, budget: 2090000, headcount: 233, productivityIndex: 91.2, turnover: 3.4 },
    { id: 't-2', month: 'Feb', payrollCost: 1767000, operationalCost: 269800, totalCost: 2036800, budget: 2090000, headcount: 235, productivityIndex: 92.0, turnover: 3.1 },
    { id: 't-3', month: 'Mar', payrollCost: 1789800, operationalCost: 285000, totalCost: 2074800, budget: 2109000, headcount: 238, productivityIndex: 92.5, turnover: 2.9 },
    { id: 't-4', month: 'Abr', payrollCost: 1801200, operationalCost: 281200, totalCost: 2082400, budget: 2128000, headcount: 240, productivityIndex: 93.1, turnover: 3.0 },
    { id: 't-5', month: 'May', payrollCost: 1816400, operationalCost: 296400, totalCost: 2112800, budget: 2147000, headcount: 242, productivityIndex: 93.8, turnover: 2.7 },
    { id: 't-6', month: 'Jun', payrollCost: 1843000, operationalCost: 288800, totalCost: 2131800, budget: 2166000, headcount: 244, productivityIndex: 94.2, turnover: 2.6 },
    { id: 't-7', month: 'Jul', payrollCost: 1824000, operationalCost: 277400, totalCost: 2101400, budget: 2166000, headcount: 246, productivityIndex: 94.5, turnover: 2.5 },
    { id: 't-8', month: 'Ago', payrollCost: 1833500, operationalCost: 271700, totalCost: 2105200, budget: 2185000, headcount: 248, productivityIndex: 94.6, turnover: 2.8 }
  ];

  private readonly defaultPeriodComparisons: PeriodComparison[] = [
    {
      id: 'comp-1',
      metric: 'Colaboradores Activos (Headcount)',
      unit: 'Colaboradores',
      periodAValue: 248,
      periodBValue: 233,
      absoluteDiff: 15,
      percentageDiff: 6.44,
      trend: 'up',
      isFavorable: true,
      category: 'Personal'
    },
    {
      id: 'comp-2',
      metric: 'Costo Total de Nómina y Cargas',
      unit: 'S/.',
      periodAValue: 1833500,
      periodBValue: 1872640,
      absoluteDiff: -39140,
      percentageDiff: -2.09,
      trend: 'down',
      isFavorable: true,
      category: 'Costos'
    },
    {
      id: 'comp-3',
      metric: 'Costo Promedio por Empleado',
      unit: 'S/./Mes',
      periodAValue: 7393,
      periodBValue: 8037,
      absoluteDiff: -644,
      percentageDiff: -8.01,
      trend: 'down',
      isFavorable: true,
      category: 'Costos'
    },
    {
      id: 'comp-4',
      metric: 'Tasa de Rotación Voluntaria',
      unit: '%',
      periodAValue: 2.8,
      periodBValue: 4.2,
      absoluteDiff: -1.4,
      percentageDiff: -33.33,
      trend: 'down',
      isFavorable: true,
      category: 'Personal'
    },
    {
      id: 'comp-5',
      metric: 'Horas Extras Totales',
      unit: 'Horas',
      periodAValue: 312,
      periodBValue: 383,
      absoluteDiff: -71,
      percentageDiff: -18.54,
      trend: 'down',
      isFavorable: true,
      category: 'Costos'
    },
    {
      id: 'comp-6',
      metric: 'Índice de Eficiencia Operativa',
      unit: '%',
      periodAValue: 94.6,
      periodBValue: 90.4,
      absoluteDiff: 4.2,
      percentageDiff: 4.65,
      trend: 'up',
      isFavorable: true,
      category: 'Operaciones'
    },
    {
      id: 'comp-7',
      metric: 'Nivel de Satisfacción (eNPS)',
      unit: 'Puntos',
      periodAValue: 68,
      periodBValue: 60,
      absoluteDiff: 8,
      percentageDiff: 13.33,
      trend: 'up',
      isFavorable: true,
      category: 'Operaciones'
    },
    {
      id: 'comp-8',
      metric: 'Tasa de Ausentismo No Programado',
      unit: '%',
      periodAValue: 1.4,
      periodBValue: 2.1,
      absoluteDiff: -0.7,
      percentageDiff: -33.33,
      trend: 'down',
      isFavorable: true,
      category: 'Personal'
    }
  ];

  private readonly defaultRecommendations: Recommendation[] = [
    {
      id: 'rec-1',
      priority: 'Alta',
      action: 'Aprobar plan de incentivos por objetivos para mandos medios en Operaciones para consolidar la baja en horas extras.',
      department: 'Operaciones & Finanzas',
      estimatedImpact: 'Ahorro recurrente anual de S/. 399,000.',
      status: 'Aprobado'
    },
    {
      id: 'rec-2',
      priority: 'Media',
      action: 'Centralizar la adquisición corporativa de licencias Cloud e IA para capturar descuentos por volumen.',
      department: 'Tecnología & Compras',
      estimatedImpact: 'Reducción de varianza a < 3% en Q4.',
      status: 'En Progreso'
    },
    {
      id: 'rec-3',
      priority: 'Media',
      action: 'Implementar programa piloto de onboarding acelerado para reducir tiempo a la productividad de 45 a 25 días.',
      department: 'Gestión de Talento',
      estimatedImpact: 'Mayor velocidad de entrega de proyectos comerciales.',
      status: 'Pendiente'
    }
  ];

  // Core Reactive Signals
  readonly kpisData = signal<KPIItem[]>(this.loadStorage('kpis', this.defaultKPIs));
  readonly departmentsData = signal<DepartmentMetric[]>(this.loadStorage('departments', this.defaultDepartments));
  readonly costCategoriesData = signal<CostCategory[]>(this.loadStorage('costs', this.defaultCostCategories));
  readonly monthlyTrendsData = signal<MonthlyTrend[]>(this.loadStorage('trends', this.defaultMonthlyTrends));
  readonly periodComparisonsData = signal<PeriodComparison[]>(this.loadStorage('comparisons', this.defaultPeriodComparisons));
  readonly recommendationsData = signal<Recommendation[]>(this.loadStorage('recommendations', this.defaultRecommendations));

  // Executive Report signal
  readonly executiveReport = computed<ExecutiveReport>(() => ({
    generatedAt: '14 de Octubre de 2026',
    currentPeriod: this.selectedPeriod(),
    comparisonPeriod: this.selectedComparison(),
    author: 'Dirección de Analítica & Finanzas — Aura',
    executiveSummary:
      'La gestión del capital humano y los costos operativos en Soles (S/.) durante el periodo actual reflejan un desempeño altamente positivo y disciplinado. Se registró un incremento neto de 15 posiciones clave en áreas estratégicas (Tecnología y Operaciones) manteniendo un ahorro de S/. 39,140 en la nómina global gracias a la reestructuración de niveles salariales y optimización drástica del 18.5% en horas extras.',
    keyFindings: [
      'Disminución histórica en la rotación de personal (de 4.2% a 2.8%), consolidando la retención en perfiles técnicos en 98.2%.',
      'Cumplimiento presupuestario de nómina al 97.2%, generando un superávit operacional de S/. 79,800 frente al presupuesto aprobado.',
      'Aumento sostenido en el índice de productividad (+5.2%) y un salto cuantitativo en el eNPS directivo a +68 puntos.',
      'Control efectivo de horas extraordinarias en Operaciones, reduciendo la erogación mensual en S/. 33,060.'
    ],
    operationalRisks: [
      'Presión por contrataciones pendientes en el área de Producto & TI (6 vacantes críticas en proceso de oferta).',
      'Desviación presupuestaria menor (+12.7%) en licencias de software y capacitación tecnológica de IA, la cual queda amortizada por el ahorro en reclutamiento.'
    ],
    recommendations: this.recommendationsData()
  }));

  // Computed signals with filters
  readonly filteredKPIs = computed(() => this.kpisData());

  readonly filteredDepartments = computed(() => {
    const dept = this.selectedDepartment();
    const query = this.searchQuery().toLowerCase().trim();
    let list = this.departmentsData();

    if (dept !== 'Todos') {
      list = list.filter(d => d.department.toLowerCase().includes(dept.toLowerCase()));
    }
    if (query) {
      list = list.filter(d =>
        d.department.toLowerCase().includes(query) ||
        d.headcount.toString().includes(query)
      );
    }
    return list;
  });

  readonly filteredCostCategories = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    let list = this.costCategoriesData();
    if (query) {
      list = list.filter(c =>
        c.category.toLowerCase().includes(query) ||
        c.department.toLowerCase().includes(query)
      );
    }
    return list;
  });

  readonly monthlyTrends = computed(() => this.monthlyTrendsData());
  readonly periodComparisons = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    let list = this.periodComparisonsData();
    if (query) {
      list = list.filter(c =>
        c.metric.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
      );
    }
    return list;
  });

  readonly totalHeadcount = computed(() => {
    return this.departmentsData().reduce((acc, curr) => acc + curr.headcount, 0);
  });

  readonly totalPayroll = computed(() => {
    return this.departmentsData().reduce((acc, curr) => acc + curr.totalPayroll, 0);
  });

  readonly averageProductivity = computed(() => {
    const list = this.departmentsData();
    if (list.length === 0) return '0.0';
    const sum = list.reduce((acc, curr) => acc + curr.productivityScore, 0);
    return (sum / list.length).toFixed(1);
  });

  readonly totalBudgetedCost = computed(() => {
    return this.costCategoriesData().reduce((acc, curr) => acc + curr.budgeted, 0);
  });

  readonly totalActualCost = computed(() => {
    return this.costCategoriesData().reduce((acc, curr) => acc + curr.actual, 0);
  });

  // Storage helpers
  private loadStorage<T>(keySuffix: string, fallback: T): T {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    try {
      const stored = window.localStorage.getItem(`${STORAGE_KEY}_${keySuffix}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveStorage<T>(keySuffix: string, data: T): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(`${STORAGE_KEY}_${keySuffix}`, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving to storage', e);
    }
  }

  // --- CRUD: Department Metric ---
  addDepartment(dept: Omit<DepartmentMetric, 'id'>): void {
    const newDept: DepartmentMetric = {
      ...dept,
      id: 'dept-' + Date.now()
    };
    const updated = [newDept, ...this.departmentsData()];
    this.departmentsData.set(updated);
    this.saveStorage('departments', updated);
    this.recalculateKPIs();
  }

  updateDepartment(id: string, dept: Partial<DepartmentMetric>): void {
    const updated = this.departmentsData().map(d => (d.id === id ? { ...d, ...dept } : d));
    this.departmentsData.set(updated);
    this.saveStorage('departments', updated);
    this.recalculateKPIs();
  }

  deleteDepartment(id: string): void {
    const updated = this.departmentsData().filter(d => d.id !== id);
    this.departmentsData.set(updated);
    this.saveStorage('departments', updated);
    this.recalculateKPIs();
  }

  // --- CRUD: Cost Category ---
  addCostCategory(cat: Omit<CostCategory, 'id' | 'variance' | 'variancePercentage'>): void {
    const variance = cat.actual - cat.budgeted;
    const variancePercentage = cat.budgeted > 0 ? Number(((variance / cat.budgeted) * 100).toFixed(1)) : 0;
    const newCat: CostCategory = {
      ...cat,
      variance,
      variancePercentage,
      id: 'cost-' + Date.now()
    };
    const updated = [newCat, ...this.costCategoriesData()];
    this.costCategoriesData.set(updated);
    this.saveStorage('costs', updated);
  }

  updateCostCategory(id: string, cat: Partial<CostCategory>): void {
    const updated = this.costCategoriesData().map(c => {
      if (c.id === id) {
        const merged = { ...c, ...cat };
        merged.variance = merged.actual - merged.budgeted;
        merged.variancePercentage = merged.budgeted > 0 ? Number(((merged.variance / merged.budgeted) * 100).toFixed(1)) : 0;
        return merged;
      }
      return c;
    });
    this.costCategoriesData.set(updated);
    this.saveStorage('costs', updated);
  }

  deleteCostCategory(id: string): void {
    const updated = this.costCategoriesData().filter(c => c.id !== id);
    this.costCategoriesData.set(updated);
    this.saveStorage('costs', updated);
  }

  // --- CRUD: Period Comparison ---
  addPeriodComparison(item: Omit<PeriodComparison, 'id' | 'absoluteDiff' | 'percentageDiff'>): void {
    const absoluteDiff = item.periodAValue - item.periodBValue;
    const percentageDiff = item.periodBValue > 0 ? Number(((absoluteDiff / item.periodBValue) * 100).toFixed(2)) : 0;
    const newItem: PeriodComparison = {
      ...item,
      absoluteDiff,
      percentageDiff,
      id: 'comp-' + Date.now()
    };
    const updated = [newItem, ...this.periodComparisonsData()];
    this.periodComparisonsData.set(updated);
    this.saveStorage('comparisons', updated);
  }

  updatePeriodComparison(id: string, item: Partial<PeriodComparison>): void {
    const updated = this.periodComparisonsData().map(c => {
      if (c.id === id) {
        const merged = { ...c, ...item };
        merged.absoluteDiff = merged.periodAValue - merged.periodBValue;
        merged.percentageDiff = merged.periodBValue > 0 ? Number(((merged.absoluteDiff / merged.periodBValue) * 100).toFixed(2)) : 0;
        return merged;
      }
      return c;
    });
    this.periodComparisonsData.set(updated);
    this.saveStorage('comparisons', updated);
  }

  deletePeriodComparison(id: string): void {
    const updated = this.periodComparisonsData().filter(c => c.id !== id);
    this.periodComparisonsData.set(updated);
    this.saveStorage('comparisons', updated);
  }

  // --- CRUD: Recommendations ---
  addRecommendation(rec: Omit<Recommendation, 'id'>): void {
    const newRec: Recommendation = {
      ...rec,
      id: 'rec-' + Date.now()
    };
    const updated = [newRec, ...this.recommendationsData()];
    this.recommendationsData.set(updated);
    this.saveStorage('recommendations', updated);
  }

  updateRecommendation(id: string, rec: Partial<Recommendation>): void {
    const updated = this.recommendationsData().map(r => (r.id === id ? { ...r, ...rec } : r));
    this.recommendationsData.set(updated);
    this.saveStorage('recommendations', updated);
  }

  deleteRecommendation(id: string): void {
    const updated = this.recommendationsData().filter(r => r.id !== id);
    this.recommendationsData.set(updated);
    this.saveStorage('recommendations', updated);
  }

  // Reset to demo defaults
  resetAllData(): void {
    this.departmentsData.set(this.defaultDepartments);
    this.costCategoriesData.set(this.defaultCostCategories);
    this.periodComparisonsData.set(this.defaultPeriodComparisons);
    this.recommendationsData.set(this.defaultRecommendations);
    this.kpisData.set(this.defaultKPIs);

    this.saveStorage('departments', this.defaultDepartments);
    this.saveStorage('costs', this.defaultCostCategories);
    this.saveStorage('comparisons', this.defaultPeriodComparisons);
    this.saveStorage('recommendations', this.defaultRecommendations);
    this.saveStorage('kpis', this.defaultKPIs);
  }

  private recalculateKPIs(): void {
    const totalHc = this.totalHeadcount();
    const totalPay = this.totalPayroll();
    const currentKPIs = this.kpisData().map(k => {
      if (k.id === 'kpi-headcount') {
        return { ...k, value: `${totalHc}`, numericValue: totalHc };
      }
      if (k.id === 'kpi-payroll') {
        return {
          ...k,
          value: `S/. ${totalPay.toLocaleString()}`,
          numericValue: totalPay,
          subtitle: `Costo prom. x colaborador: S/. ${(totalHc > 0 ? Math.round(totalPay / totalHc) : 0).toLocaleString()}`
        };
      }
      return k;
    });
    this.kpisData.set(currentKPIs);
    this.saveStorage('kpis', currentKPIs);
  }

  setPeriod(period: string): void {
    this.selectedPeriod.set(period);
  }

  setComparison(period: string): void {
    this.selectedComparison.set(period);
  }

  setDepartment(dept: string): void {
    this.selectedDepartment.set(dept);
  }

  setSearchQuery(q: string): void {
    this.searchQuery.set(q);
  }

  // Export to CSV in Soles
  exportToCSV(): void {
    const comparisons = this.periodComparisonsData();
    const headers = ['Métrica', 'Unidad (Moneda: PEN Soles)', 'Periodo Actual', 'Periodo Comparativo', 'Diferencia Absoluta', 'Variación %', 'Tendencia', 'Estado'];
    
    const rows = comparisons.map(c => [
      `"${c.metric}"`,
      `"${c.unit}"`,
      c.periodAValue,
      c.periodBValue,
      c.absoluteDiff,
      `${c.percentageDiff.toFixed(2)}%`,
      c.trend,
      c.isFavorable ? 'Favorable' : 'Desfavorable'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Aura_Analytics_Reporte_PEN_Soles_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printReport(): void {
    window.print();
  }
}
