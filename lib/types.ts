// Dashboard Types for Colindante

export interface MasterCliente {
  PROYECTO: string
  INMUEBLE: string
  SITUACION: 'VENDIDO' | 'SEPARADO' | 'BLOQUEADO' | 'POR VENDER'
  'Nombre del Cliente': string
  DPTO: string
  EST: string
  DEP: string
  TORRE: string
  VENDEDOR: string
  'VALOR S/': number
  'Ingresos  S/.': number
  'Por Pagar  S/.': number
  'MES DE VENTA': number
  'AÑO DE VENTA': number
  'Tipo de  Credito': string
}

export interface Abono {
  PROYECTO: string
  Mes: number
  Año: number
  'INGRESO S/': number
  'INGRESO US$': number
  TC: number
  'FECHA FIRMA CV': string | number
  'FECHA ABONO': string | number
}

export interface CronogramaItem {
  PROYECTO: string
  'Nombre del Cliente': string
  DPTO: string
  TORRE: string
  'Tipo de Credito': string
  'Monto Cuota': number
  'Fecha Cuota': string | number
  ESTADO: 'Por Pagar' | 'Pagado'
  SITUACION: 'Vencida' | 'Por Vencer' | 'Pendiente'
  'ESTADO VENTA': string
}

export interface ProyeccionItem {
  Proyecto: string
  PROYECTO: string
  Estatus: string
  'Inicio de Venta Proy.': string
  'Precio Real': number
  [key: string]: string | number | undefined
}

export interface FilterState {
  proyecto: string
  situacion: string
  inmueble: string
}

export interface KPIData {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export interface ChartDataPoint {
  name: string
  value: number
  value2?: number
  [key: string]: string | number | undefined
}
