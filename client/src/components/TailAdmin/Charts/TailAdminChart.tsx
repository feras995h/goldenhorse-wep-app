import React, { useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
      rtl?: boolean;
    };
    tooltip?: {
      rtl?: boolean;
      backgroundColor?: string;
      titleColor?: string;
      bodyColor?: string;
    };
  };
  scales?: {
    x?: {
      display?: boolean;
      rtl?: boolean;
    };
    y?: {
      display?: boolean;
      beginAtZero?: boolean;
    };
  };
}

interface TailAdminChartProps {
  type: 'line' | 'bar' | 'doughnut' | 'pie' | 'area';
  data: ChartData;
  options?: ChartOptions;
  height?: number;
  width?: number;
  className?: string;
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string;
  rtl?: boolean;
  theme?: 'light' | 'dark' | 'golden';
}

// Golden theme color palette for charts
const goldenPalette = {
  primary: ['#FFD700', '#B8860B', '#FFECB3', '#F4C430', '#DAA520'],
  gradients: [
    'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
    'linear-gradient(135deg, #FFECB3 0%, #FFD700 100%)',
    'linear-gradient(135deg, #F4C430 0%, #DAA520 100%)',
    'linear-gradient(135deg, #B8860B 0%, #8B7D3A 100%)',
    'linear-gradient(135deg, #FFECB3 0%, #F0E68C 100%)'
  ],
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6'
};

// Simple chart implementation using Canvas API (for demonstration)
const TailAdminChart: React.FC<TailAdminChartProps> = ({
  type,
  data,
  options = {},
  height = 300,
  width,
  className = '',
  title,
  description,
  loading = false,
  error,
  rtl = true,
  theme = 'golden'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || loading || error) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = height;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw chart based on type
    drawChart(ctx, type, data, canvas.width, canvas.height, rtl, theme);
  }, [data, type, height, loading, error, rtl, theme]);

  const drawChart = (
    ctx: CanvasRenderingContext2D,
    chartType: string,
    chartData: ChartData,
    canvasWidth: number,
    canvasHeight: number,
    isRtl: boolean,
    chartTheme: string
  ) => {
    const padding = 40;
    const chartWidth = canvasWidth - 2 * padding;
    const chartHeight = canvasHeight - 2 * padding;

    // Set font for RTL support
    ctx.font = '12px Tajawal, Arial, sans-serif';
    ctx.direction = isRtl ? 'rtl' : 'ltr';

    switch (chartType) {
      case 'bar':
        drawBarChart(ctx, chartData, padding, chartWidth, chartHeight, isRtl);
        break;
      case 'line':
      case 'area':
        drawLineChart(ctx, chartData, padding, chartWidth, chartHeight, isRtl, chartType === 'area');
        break;
      case 'doughnut':
      case 'pie':
        drawPieChart(ctx, chartData, canvasWidth / 2, canvasHeight / 2, Math.min(chartWidth, chartHeight) / 3, chartType === 'doughnut');
        break;
      default:
        drawBarChart(ctx, chartData, padding, chartWidth, chartHeight, isRtl);
    }
  };

  const drawBarChart = (
    ctx: CanvasRenderingContext2D,
    chartData: ChartData,
    padding: number,
    chartWidth: number,
    chartHeight: number,
    isRtl: boolean
  ) => {
    const { labels, datasets } = chartData;
    if (!datasets[0] || !datasets[0].data) return;

    const data = datasets[0].data;
    const maxValue = Math.max(...data);
    const barWidth = chartWidth / labels.length * 0.6;
    const barSpacing = chartWidth / labels.length * 0.4;

    // Draw bars
    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
      const y = padding + chartHeight - barHeight;

      // Bar gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, goldenPalette.primary[0]);
      gradient.addColorStop(1, goldenPalette.primary[1]);

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Label
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], x + barWidth / 2, padding + chartHeight + 20);

      // Value
      ctx.fillStyle = '#6b7280';
      ctx.fillText(value.toLocaleString('ar-LY'), x + barWidth / 2, y - 10);
    });

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    // X-axis
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
  };

  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    chartData: ChartData,
    padding: number,
    chartWidth: number,
    chartHeight: number,
    isRtl: boolean,
    filled: boolean
  ) => {
    const { labels, datasets } = chartData;
    if (!datasets[0] || !datasets[0].data) return;

    const data = datasets[0].data;
    const maxValue = Math.max(...data);
    const stepX = chartWidth / (labels.length - 1);

    // Create path
    ctx.beginPath();
    data.forEach((value, index) => {
      const x = padding + index * stepX;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Fill area if area chart
    if (filled) {
      ctx.lineTo(padding + chartWidth, padding + chartHeight);
      ctx.lineTo(padding, padding + chartHeight);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
      gradient.addColorStop(0, goldenPalette.primary[0] + '40');
      gradient.addColorStop(1, goldenPalette.primary[0] + '10');
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw line
    ctx.strokeStyle = goldenPalette.primary[0];
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw points
    data.forEach((value, index) => {
      const x = padding + index * stepX;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = goldenPalette.primary[1];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    labels.forEach((label, index) => {
      const x = padding + index * stepX;
      ctx.fillText(label, x, padding + chartHeight + 20);
    });

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
  };

  const drawPieChart = (
    ctx: CanvasRenderingContext2D,
    chartData: ChartData,
    centerX: number,
    centerY: number,
    radius: number,
    isDoughnut: boolean
  ) => {
    const { labels, datasets } = chartData;
    if (!datasets[0] || !datasets[0].data) return;

    const data = datasets[0].data;
    const total = data.reduce((sum, value) => sum + value, 0);
    let currentAngle = -Math.PI / 2; // Start from top

    data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      const color = goldenPalette.primary[index % goldenPalette.primary.length];

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Tajawal, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${((value / total) * 100).toFixed(1)}%`,
        labelX,
        labelY
      );

      currentAngle += sliceAngle;
    });

    // Draw doughnut hole
    if (isDoughnut) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  };

  if (loading) {
    return (
      <div className={`bg-white border border-golden-200 rounded-xl p-6 ${className}`}>
        {title && (
          <div className=\"mb-4\">
            <h3 className=\"text-lg font-semibold text-dark-800\">{title}</h3>
            {description && (
              <p className=\"text-sm text-dark-600\">{description}</p>
            )}
          </div>
        )}
        <div className=\"flex items-center justify-center\" style={{ height }}>
          <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-golden-500\"></div>
          <span className=\"mr-3 text-dark-600\">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white border border-danger-200 rounded-xl p-6 ${className}`}>
        {title && (
          <div className=\"mb-4\">
            <h3 className=\"text-lg font-semibold text-dark-800\">{title}</h3>
            {description && (
              <p className=\"text-sm text-dark-600\">{description}</p>
            )}
          </div>
        )}
        <div className=\"flex items-center justify-center text-danger-600\" style={{ height }}>
          <BarChart3 className=\"h-8 w-8 ml-3\" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-golden-200 rounded-xl shadow-sm ${className}`}>
      {/* Chart Header */}
      {(title || description) && (
        <div className=\"px-6 py-4 border-b border-golden-200\">
          <div className=\"flex items-center justify-between\">
            <div>
              {title && (
                <h3 className=\"text-lg font-semibold text-dark-800 flex items-center\">
                  <BarChart3 className=\"h-5 w-5 ml-3 text-golden-600\" />
                  {title}
                </h3>
              )}
              {description && (
                <p className=\"text-sm text-dark-600 mt-1\">{description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className=\"p-6\" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className=\"w-full\"
          style={{ height, maxWidth: '100%' }}
        />
      </div>

      {/* Chart Legend */}
      {data.datasets[0] && data.labels && (
        <div className=\"px-6 pb-6\">
          <div className=\"flex flex-wrap gap-4 justify-center\">
            {data.labels.map((label, index) => (
              <div key={index} className=\"flex items-center\">
                <div
                  className=\"w-3 h-3 rounded-full ml-2\"
                  style={{
                    backgroundColor: goldenPalette.primary[index % goldenPalette.primary.length]
                  }}
                />
                <span className=\"text-sm text-dark-600\">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TailAdminChart;