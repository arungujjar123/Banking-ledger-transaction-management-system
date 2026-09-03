import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'emerald' }) => {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="glass-panel rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group"
    >
      {/* Background Accent Glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/50 group-hover:bg-emerald-950/60 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs">
          <span className={`font-semibold ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.value}
          </span>
          <span className="text-slate-400">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
};
