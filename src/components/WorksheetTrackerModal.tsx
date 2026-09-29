import React, { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Clock,
  Repeat,
  Calendar,
  Layers,
  Award,
  Filter,
} from 'lucide-react';
import { WORKSHEET_GOALS, WORKSHEET_TASKS } from '../data/worksheetData';

interface WorksheetTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction: (actionKey: string) => void;
}

export const WorksheetTrackerModal: React.FC<WorksheetTrackerModalProps> = ({
  isOpen,
  onClose,
  onExecuteAction,
}) => {
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('all');
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({
    'g1-t1': true,
    'g1-t2': true,
    'g1-t3': true,
    'g1-t4': true,
    'g1-t5': true,
    'g2-t1': true,
    'g2-t2': true,
    'g2-t3': true,
    'g2-t4': true,
    'g2-t5': true,
    'g3-t1': true,
    'g3-t2': true,
    'g3-t3': true,
    'g3-t4': true,
    'g3-t5': true,
  });

  if (!isOpen) return null;

  const filteredTasks =
    selectedGoalFilter === 'all'
      ? WORKSHEET_TASKS
      : WORKSHEET_TASKS.filter((t) => t.goalId === selectedGoalFilter);

  const totalTasks = WORKSHEET_TASKS.length;
  const completedCount = Object.values(completedTaskIds).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-slate-900">
                  Worksheet: Map Your Workflow & App Goals
                </h2>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  15/15 Active in App
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Live interactive companion to your workflow mapping exercise. Test every goal and task directly inside OmniMail AI.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-2 rounded-lg hover:bg-white/80 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 3 Goals Banner Cards */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
          {WORKSHEET_GOALS.map((goal) => {
            const isSelected = selectedGoalFilter === goal.id;
            return (
              <div
                key={goal.id}
                onClick={() =>
                  setSelectedGoalFilter(selectedGoalFilter === goal.id ? 'all' : goal.id)
                }
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                    Goal {goal.number}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Fully Built
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                  {goal.title.replace(`Goal ${goal.number}: `, '')}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                  {goal.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Legend / Step 4 Reference */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-700">Rating Scale Reference:</span>
            <span>
              <strong>Time Spent:</strong> Low = Minutes | Medium = ~1 hr | High = Several hrs
            </span>
            <span>
              <strong>Frequency:</strong> Low = Few/mo | Medium = Weekly | High = Daily
            </span>
            <span>
              <strong>Repetitiveness:</strong> Low = Different | Medium = Some repeated | High = Identical
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              ★ Prime Candidate for App
            </span>
          </div>
        </div>

        {/* Interactive Worksheet Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3 w-8 text-center">Status</th>
                  <th className="p-3 w-48">Step 1: Goal</th>
                  <th className="p-3 w-44">Step 2: Task</th>
                  <th className="p-3 w-48">Step 3: How AI Helps</th>
                  <th className="p-3 w-20 text-center">Time</th>
                  <th className="p-3 w-20 text-center">Freq</th>
                  <th className="p-3 w-20 text-center">Repetitive</th>
                  <th className="p-3">Implemented Feature & Test Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((t) => {
                  const isDone = completedTaskIds[t.id];
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() =>
                            setCompletedTaskIds((prev) => ({ ...prev, [t.id]: !prev[t.id] }))
                          }
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <CheckCircle2
                            className={`w-4 h-4 ${isDone ? 'text-emerald-600' : 'text-slate-300'}`}
                          />
                        </button>
                      </td>

                      <td className="p-3 font-semibold text-slate-800">
                        <span className="text-[10px] text-blue-600 font-bold block mb-0.5">
                          {t.goalTitle.split(':')[0]}
                        </span>
                        <span className="line-clamp-2">
                          {t.goalTitle.split(':')[1]?.trim() || t.goalTitle}
                        </span>
                      </td>

                      <td className="p-3 font-medium text-slate-900">
                        {t.task}
                      </td>

                      <td className="p-3 text-slate-600 leading-snug">
                        {t.howAiHelps}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            t.timeSpent === 'High'
                              ? 'bg-rose-100 text-rose-700'
                              : t.timeSpent === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.timeSpent}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            t.frequency === 'High'
                              ? 'bg-rose-100 text-rose-700'
                              : t.frequency === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.frequency}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            t.repetitiveness === 'High'
                              ? 'bg-purple-100 text-purple-700'
                              : t.repetitiveness === 'Medium'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.repetitiveness}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-700 font-medium">
                            {t.implementedFeature}
                          </span>
                          <button
                            onClick={() => {
                              onClose();
                              onExecuteAction(t.actionKey);
                            }}
                            className="shrink-0 px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-semibold rounded-lg text-[10px] border border-blue-200 transition-all flex items-center gap-1 group-hover:shadow-xs"
                          >
                            <span>Test Feature</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>100% of worksheet items active:</strong> All 3 goals & 15 tasks mapped into OmniMail AI.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Back to Inbox
          </button>
        </div>
      </div>
    </div>
  );
};
