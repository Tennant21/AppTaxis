import React from 'react';

interface StatusSegment {
  label: string;
  count: number;
  color: string;
}

export const DonutStatusChart: React.FC<{
  segments: StatusSegment[];
  total: number;
  centerLabel?: string;
}> = ({ segments, total, centerLabel = 'Taxis' }) => {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 144 144" className="h-full w-full -rotate-90" role="img" aria-label="Répartition des taxis par statut">
          <circle
            cx="72"
            cy="72"
            r={radius}
            fill="none"
            stroke="#DCE4EF"
            strokeWidth="16"
          />
          {total > 0 &&
            segments.map((seg) => {
              if (seg.count === 0) return null;
              const fraction = seg.count / total;
              const strokeLength = fraction * circumference;
              const dashArray = `${strokeLength} ${circumference - strokeLength}`;
              const dashOffset = -accumulated * circumference;
              accumulated += fraction;
              return (
                <circle
                  key={seg.label}
                  cx="72"
                  cy="72"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="16"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[24px] font-bold text-[#172B4D] tabular-nums leading-none">
            {total}
          </span>
          <span className="mt-1 text-[12px] font-medium text-[#52627A]">{centerLabel}</span>
        </div>
      </div>

      <div className="w-full flex-1 space-y-2.5">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
          return (
            <div key={seg.label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-3 w-3 rounded-[3px] shrink-0"
                  style={{ backgroundColor: seg.color }}
                  aria-hidden="true"
                />
                <span className="truncate text-[13px] font-medium text-[#263B59]">
                  {seg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 tabular-nums shrink-0">
                <span className="text-[13px] font-semibold text-[#172B4D]">{seg.count}</span>
                <span className="text-[12px] text-[#52627A] w-10 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MonthlyBarChart: React.FC<{
  data: Array<{ month: string; controls: number; infractions: number }>;
}> = ({ data }) => {
  const maxVal = Math.max(
    4,
    ...data.map((d) => Math.max(d.controls, d.infractions))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-5 text-[12px] font-medium text-[#52627A]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-[#174EA6]" aria-hidden="true" />
          Contrôles effectués
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-[#DC2626]" aria-hidden="true" />
          Infractions relevées
        </span>
      </div>

      <div className="grid grid-cols-5 gap-3 items-end h-[170px] pt-4 border-b border-[#DCE4EF]">
        {data.map((item) => {
          const controlsH = Math.max(6, Math.round((item.controls / maxVal) * 125));
          const infractionsH = item.infractions > 0 ? Math.max(6, Math.round((item.infractions / maxVal) * 125)) : 2;
          return (
            <div key={item.month} className="flex flex-col items-center gap-2 h-full justify-end">
              <div className="flex items-end justify-center gap-1.5 w-full">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-semibold text-[#174EA6] tabular-nums">
                    {item.controls}
                  </span>
                  <div
                    className="w-5 sm:w-6 rounded-t-[4px] bg-[#174EA6] transition-all duration-200"
                    style={{ height: `${controlsH}px` }}
                    title={`${item.month} : ${item.controls} contrôle(s)`}
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-semibold text-[#DC2626] tabular-nums">
                    {item.infractions}
                  </span>
                  <div
                    className="w-5 sm:w-6 rounded-t-[4px] bg-[#DC2626] transition-all duration-200"
                    style={{ height: `${infractionsH}px` }}
                    title={`${item.month} : ${item.infractions} infraction(s)`}
                  />
                </div>
              </div>
              <span className="pb-2 text-[12px] font-medium text-[#52627A]">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
