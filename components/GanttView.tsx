import React, { useState, useMemo } from 'react';
import { GanttTask } from '../types';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

interface GanttViewProps {
  tasks: GanttTask[];
  onTasksUpdate: (tasks: GanttTask[]) => void;
  isMobile?: boolean;
}

const GanttView: React.FC<GanttViewProps> = ({
  tasks,
  onTasksUpdate,
  isMobile = false
}) => {
  // State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Week');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form state
  const [taskForm, setTaskForm] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    progress: 0
  });

  // 날짜 범위 계산
  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        start: today,
        end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      };
    }

    const allDates = tasks.flatMap(t => [
      new Date(t.startDate),
      new Date(t.endDate)
    ]);

    const start = new Date(Math.min(...allDates.map(d => d.getTime())));
    const end = new Date(Math.max(...allDates.map(d => d.getTime())));

    // 시작 전 7일, 종료 후 7일 여유
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);

    return { start, end };
  }, [tasks]);

  // 날짜 배열 생성
  const getDates = () => {
    const dates = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const allDates = getDates();

  // 한글 날짜 포맷
  const formatDateKorean = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  };

  // 작업의 시작/종료 인덱스
  const getTaskPosition = (task: GanttTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    const startIdx = allDates.findIndex(d => d.toDateString() === taskStart.toDateString());
    const endIdx = allDates.findIndex(d => d.toDateString() === taskEnd.toDateString());

    return {
      startIdx: Math.max(0, startIdx),
      endIdx: Math.min(allDates.length - 1, endIdx)
    };
  };

  // 색상 배열
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const getTaskColor = (index: number) => colors[index % colors.length];

  // Validation
  const validateDateRange = (start: string, end: string): boolean => {
    return new Date(start) <= new Date(end);
  };

  // CRUD Operations
  const addTask = () => {
    if (!taskForm.name.trim()) {
      setValidationError('작업명을 입력하세요');
      return;
    }

    if (!validateDateRange(taskForm.startDate, taskForm.endDate)) {
      setValidationError('종료일은 시작일 이후여야 합니다');
      return;
    }

    const newTask: GanttTask = {
      id: Date.now().toString(),
      name: taskForm.name.trim(),
      startDate: taskForm.startDate,
      endDate: taskForm.endDate,
      progress: taskForm.progress,
      color: '#3B82F6'
    };

    onTasksUpdate([...tasks, newTask]);
    resetForm();
    setIsAddingTask(false);
  };

  const updateTask = (id: string, updates: Partial<GanttTask>) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    );
    onTasksUpdate(updatedTasks);
  };

  const deleteTask = (id: string) => {
    if (confirm('이 작업을 삭제하시겠습니까?')) {
      onTasksUpdate(tasks.filter(task => task.id !== id));
    }
  };

  const saveEditingTask = () => {
    if (!editingTask) return;

    if (!taskForm.name.trim()) {
      setValidationError('작업명을 입력하세요');
      return;
    }

    if (!validateDateRange(taskForm.startDate, taskForm.endDate)) {
      setValidationError('종료일은 시작일 이후여야 합니다');
      return;
    }

    updateTask(editingTask.id, {
      name: taskForm.name,
      startDate: taskForm.startDate,
      endDate: taskForm.endDate,
      progress: taskForm.progress
    });

    setEditingTask(null);
    resetForm();
  };

  const resetForm = () => {
    setTaskForm({
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      progress: 0
    });
    setValidationError(null);
  };

  const closeModal = () => {
    setIsAddingTask(false);
    setEditingTask(null);
    resetForm();
  };

  // Render
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className={`flex items-center justify-between mb-4 flex-shrink-0 ${isMobile ? 'pb-2' : 'pb-4'}`}>
        <div className="flex items-center gap-2">
          <div className={`text-gray-800 ${isMobile ? 'text-sm' : 'text-lg'} font-bold`}>
            📊 Project Timeline
          </div>
          <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Total Tasks: {tasks.length}
          </div>
        </div>
        <div className={`flex gap-2 ${isMobile ? 'gap-1' : ''}`}>
          <button
            onClick={() => setViewMode('Day')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'Day'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('Week')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'Week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('Month')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'Month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end mb-3 flex-shrink-0">
        <button
          onClick={() => {
            setIsAddingTask(true);
            resetForm();
          }}
          className={`flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${isMobile ? 'text-xs' : 'text-sm'}`}
        >
          <Plus className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
          새 작업
        </button>
      </div>

      {/* Gantt Chart */}
      <div className={`border border-gray-300 rounded bg-white flex-1 overflow-hidden flex flex-col ${isMobile ? '' : ''}`}>
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            작업을 추가하여 간트 차트를 시작하세요
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Timeline Header */}
            <div className="flex flex-shrink-0 border-b border-gray-200 bg-gray-50">
              <div className="w-32 flex-shrink-0 px-3 py-2 border-r border-gray-200">
                <div className={`font-semibold text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>작업명</div>
              </div>
              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-0.5 px-2 py-2">
                  {allDates.map((date, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-16 text-center"
                      style={{
                        backgroundColor: date.getDay() === 0 || date.getDay() === 6 ? '#f3f4f6' : 'white'
                      }}
                    >
                      <div className={`font-medium text-gray-600 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        {date.getMonth() + 1}월
                      </div>
                      <div className={`text-gray-800 ${isMobile ? 'text-xs' : 'text-sm'} font-semibold`}>
                        {date.getDate()}일
                      </div>
                      <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto">
              {tasks.map((task, taskIdx) => {
                const { startIdx, endIdx } = getTaskPosition(task);
                const width = ((endIdx - startIdx + 1) / allDates.length) * 100;
                const offset = (startIdx / allDates.length) * 100;

                return (
                  <div key={task.id} className="flex flex-shrink-0 border-b border-gray-200 hover:bg-blue-50 transition-colors">
                    <div className="w-32 flex-shrink-0 px-3 py-3 border-r border-gray-200 bg-gray-50">
                      <div className={`font-medium text-gray-800 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {task.name}
                      </div>
                    </div>
                    <div className="flex-1 relative min-h-12 overflow-x-auto px-2 py-2">
                      <div className="relative" style={{ minWidth: `${allDates.length * 64}px` }}>
                        {/* 배경 */}
                        <div className="absolute top-0 left-0 right-0 bottom-0 flex">
                          {allDates.map((date, idx) => (
                            <div
                              key={idx}
                              className="flex-shrink-0 w-16 border-r border-gray-100"
                              style={{
                                backgroundColor: date.getDay() === 0 || date.getDay() === 6 ? '#f9fafb' : 'transparent'
                              }}
                            />
                          ))}
                        </div>

                        {/* 작업 바 */}
                        <div
                          className="absolute top-1/2 transform -translate-y-1/2 rounded-md shadow-sm transition-all hover:shadow-md cursor-pointer group"
                          style={{
                            left: `${offset}%`,
                            width: `${width}%`,
                            minWidth: '40px',
                            backgroundColor: getTaskColor(taskIdx),
                            height: '28px'
                          }}
                          onClick={() => {
                            setEditingTask(task);
                            setTaskForm({
                              name: task.name,
                              startDate: task.startDate,
                              endDate: task.endDate,
                              progress: task.progress || 0
                            });
                            setValidationError(null);
                          }}
                        >
                          {/* 진행률 */}
                          {task.progress !== undefined && task.progress > 0 && (
                            <div
                              className="absolute top-0 left-0 h-full rounded-md bg-black/20"
                              style={{
                                width: `${Math.min(task.progress, 100)}%`,
                                transition: 'width 0.3s ease'
                              }}
                            />
                          )}

                          {/* 텍스트 */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`text-white font-semibold ${isMobile ? 'text-xs' : 'text-xs'}`}>
                              {task.progress}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex-shrink-0 px-3 py-2 flex gap-1 items-center bg-gray-50 border-l border-gray-200">
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setTaskForm({
                            name: task.name,
                            startDate: task.startDate,
                            endDate: task.endDate,
                            progress: task.progress || 0
                          });
                          setValidationError(null);
                        }}
                        className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-colors"
                        title="편집"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      {(isAddingTask || editingTask) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <div className={`bg-white rounded-lg shadow-xl w-full max-w-md p-6 ${isMobile ? 'max-h-[80vh] overflow-y-auto' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold text-gray-800 ${isMobile ? 'text-base' : 'text-lg'}`}>
                {editingTask ? '작업 수정' : '새 작업'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {validationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {validationError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  작업명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={taskForm.name}
                  onChange={(e) => {
                    setTaskForm({ ...taskForm, name: e.target.value });
                    setValidationError(null);
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="작업명을 입력하세요"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    시작일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={taskForm.startDate}
                    onChange={(e) => {
                      setTaskForm({ ...taskForm, startDate: e.target.value });
                      setValidationError(null);
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    종료일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={taskForm.endDate}
                    onChange={(e) => {
                      setTaskForm({ ...taskForm, endDate: e.target.value });
                      setValidationError(null);
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className={`block font-medium text-gray-700 mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  진행률: {taskForm.progress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={taskForm.progress}
                  onChange={(e) => setTaskForm({ ...taskForm, progress: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className={`flex gap-2 mt-6 ${isMobile ? 'flex-col-reverse' : ''}`}>
              <button
                onClick={closeModal}
                className={`flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors font-medium ${isMobile ? 'text-sm' : ''}`}
              >
                취소
              </button>
              <button
                onClick={editingTask ? saveEditingTask : addTask}
                className={`flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium ${isMobile ? 'text-sm' : ''}`}
              >
                {editingTask ? '저장' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttView;
