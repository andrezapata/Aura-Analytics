export interface KPIItem {
  id: string;
  title: string;
  value: string;
  numericValue: number;
  change: number; // percentage
  isPositive: boolean;
  periodText: string;
  subtitle?: string;
  category: 'personal' | 'costos' | 'estadisticas' | 'general';
}

export interface DepartmentMetric {
  id: string;
  department: string;
  headcount: number;
  openPositions: number;
  turnoverRate: number; // %
  retentionRate: number; // %
  avgCostPerEmployee: number; // PEN (S/.)
  totalPayroll: number; // PEN (S/.)
  productivityScore: number; // %
  satisfactionRate: number; // eNPS
  overtimeHours: number;
  absenteeismRate: number; // %
}

export interface CostCategory {
  id: string;
  category: string;
  budgeted: number; // PEN (S/.)
  actual: number; // PEN (S/.)
  variance: number;
  variancePercentage: number;
  department: string;
  status: 'on_track' | 'warning' | 'danger';
}

export interface MonthlyTrend {
  id: string;
  month: string;
  payrollCost: number;
  operationalCost: number;
  totalCost: number;
  budget: number;
  headcount: number;
  productivityIndex: number;
  turnover: number;
}

export interface PeriodComparison {
  id: string;
  metric: string;
  unit: string;
  periodAValue: number;
  periodBValue: number;
  absoluteDiff: number;
  percentageDiff: number;
  trend: 'up' | 'down' | 'neutral';
  isFavorable: boolean;
  category: 'Personal' | 'Costos' | 'Operaciones';
}

export interface Recommendation {
  id: string;
  priority: 'Alta' | 'Media' | 'Baja';
  action: string;
  department: string;
  estimatedImpact: string;
  status: 'Pendiente' | 'En Progreso' | 'Aprobado';
}

export interface ExecutiveReport {
  generatedAt: string;
  currentPeriod: string;
  comparisonPeriod: string;
  author: string;
  executiveSummary: string;
  keyFindings: string[];
  operationalRisks: string[];
  recommendations: Recommendation[];
}
