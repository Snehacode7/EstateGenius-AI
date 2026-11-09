import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { MARKET_TRENDS_BY_LOCATION, LocationMarketProfile, TrendDataPoint } from '../data/marketTrendsData';
import { TrendingUp, MapPin, DollarSign, Calendar, BarChart3, Info } from 'lucide-react';

interface MarketTrendsChartProps {
  initialLocation?: string;
  isCompact?: boolean;
  onSelectProperty?: (propId: string) => void;
}

export const MarketTrendsChart: React.FC<MarketTrendsChartProps> = ({
  initialLocation = 'Downtown',
  isCompact = false,
  onSelectProperty,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(
    MARKET_TRENDS_BY_LOCATION[initialLocation] ? initialLocation : 'Downtown'
  );
  const [metric, setMetric] = useState<'rent' | 'price' | 'pricePerSqft'>('rent');
  const [timeRange, setTimeRange] = useState<'6M' | '1Y'>('1Y');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<TrendDataPoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  const profile: LocationMarketProfile = useMemo(() => {
    return MARKET_TRENDS_BY_LOCATION[selectedLocation] || MARKET_TRENDS_BY_LOCATION['Downtown'];
  }, [selectedLocation]);

  const filteredData: TrendDataPoint[] = useMemo(() => {
    const all = profile.history;
    return timeRange === '6M' ? all.slice(-6) : all;
  }, [profile, timeRange]);

  // Compute percentage gain from first to last point
  const performanceChange = useMemo(() => {
    if (filteredData.length < 2) return '+0.0%';
    const firstVal = filteredData[0][metric];
    const lastVal = filteredData[filteredData.length - 1][metric];
    const diff = ((lastVal - firstVal) / firstVal) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  }, [filteredData, metric]);

  // D3 Chart Render
  useEffect(() => {
    if (!svgRef.current || !filteredData || filteredData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = isCompact ? 480 : 680;
    const height = isCompact ? 220 : 300;
    const margin = {
      top: 25,
      right: 25,
      bottom: isCompact ? 30 : 35,
      left: isCompact ? 45 : 55,
    };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Definitions for gradient
    const defs = svg.append('defs');

    // Area Gradient
    const gradient = defs
      .append('linearGradient')
      .attr('id', `area-gradient-${selectedLocation}-${metric}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    const gradientColor = metric === 'rent' ? '#0284c7' : metric === 'price' ? '#059669' : '#d97706';

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', gradientColor)
      .attr('stop-opacity', 0.35);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', gradientColor)
      .attr('stop-opacity', 0.0);

    // Scales
    const xScale = d3
      .scalePoint<string>()
      .domain(filteredData.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.1);

    const yMin = d3.min(filteredData, (d) => d[metric]) || 0;
    const yMax = d3.max(filteredData, (d) => d[metric]) || 100;
    const yPadding = (yMax - yMin) * 0.15;

    const yScale = d3
      .scaleLinear()
      .domain([Math.max(0, yMin - yPadding), yMax + yPadding])
      .range([innerHeight, 0])
      .nice();

    // Gridlines (Horizontal)
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(4);

    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-width', 1);

    g.select('.grid').select('.domain').remove();

    // Area Generator
    const areaGenerator = d3
      .area<TrendDataPoint>()
      .x((d) => xScale(d.label) || 0)
      .y0(innerHeight)
      .y1((d) => yScale(d[metric]))
      .curve(d3.curveMonotoneX);

    // Line Generator
    const lineGenerator = d3
      .line<TrendDataPoint>()
      .x((d) => xScale(d.label) || 0)
      .y((d) => yScale(d[metric]))
      .curve(d3.curveMonotoneX);

    // Append Area
    g.append('path')
      .datum(filteredData)
      .attr('fill', `url(#area-gradient-${selectedLocation}-${metric})`)
      .attr('d', areaGenerator);

    // Append Line
    const path = g
      .append('path')
      .datum(filteredData)
      .attr('fill', 'none')
      .attr('stroke', gradientColor)
      .attr('stroke-width', 2.5)
      .attr('d', lineGenerator);

    // X Axis
    const xAxis = d3.axisBottom(xScale);
    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#cbd5e1');
    xAxisGroup
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', isCompact ? '9px' : '10px')
      .attr('font-family', 'Plus Jakarta Sans, sans-serif')
      .attr('dy', '0.71em');

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((d) => {
        const val = Number(d);
        if (metric === 'price') return `$${Math.round(val / 1000)}k`;
        return `$${val}`;
      });

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.select('.domain').remove();
    yAxisGroup
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', isCompact ? '9px' : '10px')
      .attr('font-family', 'JetBrains Mono, monospace');

    // Benchmark Pin for Current Active Property
    const lastPoint = filteredData[filteredData.length - 1];
    const lastX = xScale(lastPoint.label) || 0;
    const lastY = yScale(lastPoint[metric]);

    const benchmarkGroup = g.append('g').attr('transform', `translate(${lastX},${lastY})`);

    benchmarkGroup
      .append('circle')
      .attr('r', 5)
      .attr('fill', gradientColor)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Interactive Overlay for crosshair tracking
    const overlay = g
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    overlay.on('mousemove', function (event) {
      const [mouseX] = d3.pointer(event);
      const step = innerWidth / (filteredData.length - 1 || 1);
      const index = Math.min(
        filteredData.length - 1,
        Math.max(0, Math.round(mouseX / step))
      );
      const point = filteredData[index];
      const ptX = xScale(point.label) || 0;
      const ptY = yScale(point[metric]);

      setHoveredPoint(point);
      setHoverCoords({ x: ptX + margin.left, y: ptY + margin.top });
    });

    overlay.on('mouseleave', function () {
      setHoveredPoint(null);
      setHoverCoords(null);
    });
  }, [filteredData, metric, selectedLocation, isCompact]);

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${
        isCompact ? 'p-4' : 'p-6'
      }`}
    >
      {/* Header with Title and Control Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">
              Market Rent & Valuation Trends (D3.js)
            </h3>
            <span className="text-[10px] font-mono-tabular font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {performanceChange}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical absorption and micro-district telemetry for{' '}
            <span className="font-semibold text-slate-800">{profile.location}</span> ({profile.propertyId})
          </p>
        </div>

        {/* Location Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {Object.keys(MARKET_TRENDS_BY_LOCATION).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setSelectedLocation(loc)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedLocation === loc
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Switcher & Key Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Metric:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setMetric('rent')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                metric === 'rent' ? 'bg-white font-bold text-blue-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Median Rent ($/mo)
            </button>
            <button
              type="button"
              onClick={() => setMetric('price')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                metric === 'price' ? 'bg-white font-bold text-emerald-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Purchase Price ($)
            </button>
            <button
              type="button"
              onClick={() => setMetric('pricePerSqft')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                metric === 'pricePerSqft' ? 'bg-white font-bold text-amber-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Price / Sq Ft
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTimeRange(timeRange === '6M' ? '1Y' : '6M')}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Range: {timeRange === '6M' ? 'Last 6 Months' : 'Last 12 Months'}
          </button>
        </div>
      </div>

      {/* Chart Canvas Area with Relative Tooltip */}
      <div className="relative w-full overflow-x-auto no-scrollbar">
        <svg
          ref={svgRef}
          viewBox={isCompact ? '0 0 480 220' : '0 0 680 300'}
          className="w-full h-auto select-none"
        />

        {/* Hover Crosshair Tooltip */}
        {hoveredPoint && hoverCoords && (
          <div
            style={{
              left: `${hoverCoords.x}px`,
              top: `${Math.max(10, hoverCoords.y - 70)}px`,
            }}
            className="pointer-events-none absolute -translate-x-1/2 z-20 bg-slate-900/95 text-white backdrop-blur-xs px-3 py-2 rounded-xl shadow-xl text-xs space-y-0.5 border border-slate-700/80 animate-in fade-in duration-100 whitespace-nowrap"
          >
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {hoveredPoint.label} · {profile.location}
            </div>
            <div className="font-mono-tabular font-bold text-sm text-amber-300">
              {metric === 'rent'
                ? `$${hoveredPoint.rent.toLocaleString()}/mo`
                : metric === 'price'
                ? `$${hoveredPoint.price.toLocaleString()}`
                : `$${hoveredPoint.pricePerSqft}/sq ft`}
            </div>
            <div className="text-[10px] text-slate-300">
              District Occupancy: {hoveredPoint.occupancyRate}%
            </div>
          </div>
        )}
      </div>

      {/* Bottom KPI Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-xs">
        <div className="p-2 bg-slate-50 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Benchmark Rate</span>
          <span className="font-mono-tabular font-bold text-slate-900">
            {metric === 'rent'
              ? `$${profile.currentRent.toLocaleString()}/mo`
              : `$${profile.currentPrice.toLocaleString()}`}
          </span>
        </div>
        <div className="p-2 bg-slate-50 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">1-Yr Appreciation</span>
          <span className="font-mono-tabular font-bold text-emerald-700">{profile.yoyGrowth}</span>
        </div>
        <div className="p-2 bg-slate-50 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Absorption Rate</span>
          <span className="font-mono-tabular font-bold text-blue-900">{profile.absorptionRate}</span>
        </div>
        <div className="p-2 bg-slate-50 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Market Days</span>
          <span className="font-mono-tabular font-bold text-slate-800">{profile.avgDaysOnMarket} Days</span>
        </div>
      </div>
    </div>
  );
};
