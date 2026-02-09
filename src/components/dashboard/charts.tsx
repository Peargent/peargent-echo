"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

interface ChartProps {
    data: { value: number; label: string }[];
    color: string;
    height?: number | string;
    showXAxis?: boolean;
    showYAxis?: boolean;
    showGrid?: boolean;
    syncId?: string;
    id?: string;
}

export function VercelAreaChart({ data, color, height = 300, showXAxis = true, showYAxis = true, showGrid = true, syncId, id }: ChartProps) {
    if (!data || data.length === 0) return null;

    return (
        <div style={{ width: '100%', height }} className="[&_.recharts-wrapper]:!outline-none [&_.recharts-wrapper]:focus:!outline-none [&_.recharts-surface]:!outline-none">
            <ResponsiveContainer>
                <AreaChart data={data} syncId={syncId}>
                    <defs>
                        <linearGradient id={`gradient-${id || color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    {showGrid && (
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(255,255,255,0.05)"
                        />
                    )}
                    {showXAxis && (
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 10 }}
                            dy={10}
                            minTickGap={30}
                        />
                    )}
                    {showYAxis && (
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 10 }}
                            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                            width={30}
                        />
                    )}
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#gradient-${id || color})`}
                        animationDuration={500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function VercelBarChart({ data, color, height = 200 }: ChartProps) {
    if (!data || data.length === 0) return null;

    return (
        <div style={{ width: '100%', height }} className="[&_.recharts-wrapper]:!outline-none [&_.recharts-wrapper]:focus:!outline-none [&_.recharts-surface]:!outline-none">
            <ResponsiveContainer>
                <BarChart data={data}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: 10 }}
                        dy={10}
                        minTickGap={30}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar
                        dataKey="value"
                        fill={color}
                        radius={[4, 4, 0, 0]}
                        animationDuration={500}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/90 border border-white/10 p-3 rounded shadow-xl backdrop-blur-sm">
                <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium text-white">
                    {payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
}
