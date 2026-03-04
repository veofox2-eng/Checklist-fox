import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Loader2, Play, Square, History, History as HistoryIcon, Lock as LockIcon, X, Trash2 } from 'lucide-react';
import { checklistService } from '../api';
import TaskItem from '../components/TaskItem';
import Logo from '../components/Logo';
import { useMaster } from '../contexts/MasterContext';
import { calculateDuration, formatDuration, getCurrentTimeFormatted, calculateUnionDuration } from '../utils/timeUtils';

const ChecklistView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isMaster } = useMaster();

    const [checklist, setChecklist] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState('');
    const [addingTask, setAddingTask] = useState(false);

    // Global Countdown State
    const [timerActive, setTimerActive] = useState(false);
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);

    // Timer Logs State
    const [showTimerLogsModal, setShowTimerLogsModal] = useState(false);
    const [timerLogs, setTimerLogs] = useState([]);
    const currentTimerSessionStartRef = React.useRef(null);

    // Checklist Date Tracking State
    const [expectedDate, setExpectedDate] = useState('');
    const [extendedDate, setExtendedDate] = useState('');
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Derived date values
    const createdDate = checklist?.created_at ? new Date(checklist.created_at).toLocaleDateString('en-GB').replace(/\//g, '.') : '';

    const extensionHistory = React.useMemo(() => {
        if (!checklist || !checklist.extension_history) return [];
        try {
            return JSON.parse(checklist.extension_history);
        } catch (e) {
            return [];
        }
    }, [checklist?.extension_history]);

    useEffect(() => {
        fetchChecklistAndTasks();
    }, [id]);

    const fetchChecklistAndTasks = async () => {
        try {
            const [listRes, tasksRes] = await Promise.all([
                checklistService.getChecklist(id),
                checklistService.getTasks(id)
            ]);
            setChecklist(listRes.data);
            if (listRes.data && listRes.data.expected_date) {
                setExpectedDate(listRes.data.expected_date);
            }
            setTasks(tasksRes.data);
        } catch (error) {
            console.error('Error fetching data', error);
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const buildTaskTree = (flatTasks, parentId = null, parentNumber = "") => {
        return flatTasks
            .filter(t => t.parent_id === parentId)
            .sort((a, b) => a.order_num - b.order_num)
            .map((t, index) => {
                const currentNumber = parentNumber ? `${parentNumber}.${index + 1}` : `${index + 1}`;

                // Recursively compute children first so we can sum their duration
                const children = buildTaskTree(flatTasks, t.id, currentNumber);

                const getAllNodes = (nodes) => {
                    let res = [];
                    nodes.forEach(n => {
                        res.push(n);
                        res = res.concat(getAllNodes(n.children));
                    });
                    return res;
                };

                // For this task's badge, union its own time and all descendants' times (excluding completed!)
                const allSubtreeTasks = [t, ...getAllNodes(children)].filter(tsk => !tsk.is_completed);
                const total_duration = calculateUnionDuration(allSubtreeTasks);

                return {
                    ...t,
                    displayNumber: currentNumber,
                    children,
                    total_duration
                };
            });
    };

    const getNextOrderNum = (parentId = null) => {
        const siblings = tasks.filter(t => t.parent_id === parentId);
        if (siblings.length === 0) return 0;
        return Math.max(...siblings.map(t => t.order_num)) + 1;
    };

    const handleAddMainTask = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        setAddingTask(true);
        try {
            const response = await checklistService.createTask({
                checklist_id: id,
                parent_id: null,
                title: newTitle,
                order_num: getNextOrderNum(null)
            }, getCurrentTimeFormatted(), '');
            setTasks([...tasks, response.data]);
            setNewTitle('');
        } catch (error) {
            console.error('Error adding main task', error);
        } finally {
            setAddingTask(false);
        }
    };

    const handleAddSubTask = async (parentId, title) => {
        try {
            const response = await checklistService.createTask({
                checklist_id: id,
                parent_id: parentId,
                title,
                order_num: getNextOrderNum(parentId)
            }, getCurrentTimeFormatted(), '');
            setTasks([...tasks, response.data]);
        } catch (error) {
            console.error('Error adding sub task', error);
        }
    };

    const handleStartTimer = () => {
        setTimerActive(true);
        currentTimerSessionStartRef.current = Date.now();
    };

    const handleStopTimer = async () => {
        setTimerActive(false);
        if (currentTimerSessionStartRef.current) {
            const elapsed = Math.floor((Date.now() - currentTimerSessionStartRef.current) / 1000);
            if (elapsed > 0) {
                try {
                    await checklistService.addTimerLog(id, elapsed);
                } catch (e) { console.error('Error logging timer session', e); }
            }
            currentTimerSessionStartRef.current = null;
        }
    };

    const handleAddExtensionDate = async () => {
        if (!checklist || !extendedDate) return;

        const parts = extendedDate.split('-');
        if (parts.length === 3) {
            const formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
            const newHistory = [...extensionHistory, formattedDate];
            try {
                const historyStr = JSON.stringify(newHistory);
                await checklistService.updateChecklist(id, { extension_history: historyStr });
                setChecklist(prev => ({ ...prev, extension_history: historyStr }));
                setExtensionHistory(newHistory);
                setExtendedDate('');
            } catch (err) {
                console.error("Error saving extension date", err);
                alert("Failed to save Extend Timeline. Is the 'extension_history' column missing from your Supabase 'checklists' table? Please run the SQL migration manually. Error: " + (err.response?.data?.error || err.message));
            }
        }
    };

    const handleDeleteExtensionDate = async (indexToRemove) => {
        try {
            const newHistory = [...extensionHistory];
            newHistory.splice(indexToRemove, 1);

            const historyStr = JSON.stringify(newHistory);
            await checklistService.updateChecklist(id, { extension_history: historyStr });

            setChecklist(prev => ({ ...prev, extension_history: historyStr }));
            // Force React to recognize the new array reference
            setExtensionHistory(newHistory);

            if (newHistory.length === 0) {
                setShowHistoryModal(false);
            }
        } catch (err) {
            console.error("Error deleting extension date", err);
            alert("Database Error deleting extension date: " + err.message);
        }
    };

    const handleOpenTimerLogs = async () => {
        setShowTimerLogsModal(true);
        try {
            const res = await checklistService.getTimerLogs(id);
            setTimerLogs(res.data || []);
        } catch (e) { console.error('Error fetching logs', e); }
    };

    const handleDeleteTimerLog = async (logId) => {
        try {
            await checklistService.deleteTimerLog(logId);
            setTimerLogs(prev => prev.filter(log => log.id !== logId));
            if (timerLogs.length <= 1) setShowTimerLogsModal(false);
        } catch (err) {
            console.error("Error deleting timer log", err);
            alert("Database Error deleting log: " + err.message);
        }
    };

    const handleToggleComplete = async (task, is_completed) => {
        // Find all descendant IDs
        const idsToUpdate = new Set([task.id]);

        if (is_completed) {
            // If marking complete, recursively find all children
            let added;
            do {
                added = false;
                for (const t of tasks) {
                    if (t.parent_id && idsToUpdate.has(t.parent_id) && !idsToUpdate.has(t.id)) {
                        idsToUpdate.add(t.id);
                        added = true;
                    }
                }
            } while (added);
        }

        const now = new Date();
        const completionTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        // Optimistic update
        setTasks(tasks.map(t => {
            if (idsToUpdate.has(t.id)) {
                return {
                    ...t,
                    is_completed,
                    ...(is_completed && { end_time: completionTime }),
                    ...(is_completed && !t.allocated_time && { allocated_time: t.end_time })
                };
            }
            return t;
        }));

        try {
            // Update all affected tasks in parallel
            await Promise.all(
                Array.from(idsToUpdate).map(id => {
                    const taskToUpdate = tasks.find(t => t.id === id);
                    const payload = { is_completed };
                    if (is_completed) {
                        payload.end_time = completionTime;
                        if (!taskToUpdate.allocated_time) {
                            payload.allocated_time = taskToUpdate.end_time;
                        }
                    }
                    return checklistService.updateTask(id, payload);
                })
            );
        } catch (error) {
            console.error('Error updating task(s)', error);
            // Revert on failure
            fetchChecklistAndTasks();
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
        try {
            await checklistService.updateTask(taskId, updates);
        } catch (error) {
            console.error('Error updating task properties', error);
            fetchChecklistAndTasks();
        }
    };

    // Helper to remove task and all its recursive children from state optimism
    const removeTaskAndChildren = (flatTasks, taskIdToRemove) => {
        const toRemove = new Set([taskIdToRemove]);
        let added;
        do {
            added = false;
            for (const t of flatTasks) {
                if (t.parent_id && toRemove.has(t.parent_id) && !toRemove.has(t.id)) {
                    toRemove.add(t.id);
                    added = true;
                }
            }
        } while (added);
        return flatTasks.filter(t => !toRemove.has(t.id));
    };

    const handleDeleteTask = async (taskId) => {
        setTasks(removeTaskAndChildren(tasks, taskId));
        try {
            await checklistService.deleteTask(taskId);
            // Let the backend cascade delete handle the database, we deleted locally.
        } catch (error) {
            console.error('Error deleting task', error);
            fetchChecklistAndTasks();
        }
    };

    const tree = buildTaskTree(tasks);

    // Calculate Global Time Length (exclude completed tasks)
    const activeTasks = tasks.filter(t => !t.is_completed);
    const totalDurationSeconds = calculateUnionDuration(activeTasks);
    const hasAnyTime = totalDurationSeconds > 0;

    // Timer Side-Effect logic
    useEffect(() => {
        let interval;
        if (timerActive && timeLeftSeconds > 0) {
            interval = setInterval(() => {
                setTimeLeftSeconds(prev => prev - 1);
            }, 1000);
        } else if (timerActive && timeLeftSeconds <= 0) {
            setTimerActive(false);
            alert("Time's up! 🎉");
        }
        return () => clearInterval(interval);
    }, [timerActive, timeLeftSeconds]);

    // Track the total duration mathematically to find the diff
    const prevTotalDuration = React.useRef(totalDurationSeconds);

    // Update internal timer state when tasks change
    useEffect(() => {
        if (!timerActive) {
            // Timer is stopped, safe to completely sync with total duration
            setTimeLeftSeconds(totalDurationSeconds);
        } else {
            // Timer is running! A task was just completed or added.
            // Find the mathematical difference
            const durationDiff = totalDurationSeconds - prevTotalDuration.current;

            // Apply the difference directly to the running countdown
            setTimeLeftSeconds(prev => {
                const newTime = prev + durationDiff;
                return Math.max(0, newTime); // Prevent going below 0
            });
        }

        // Always store current total for the next render diff
        prevTotalDuration.current = totalDurationSeconds;

    }, [totalDurationSeconds, timerActive]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Loader2 size={40} className="spinner text-gradient" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-icon"
                        style={{ flexShrink: 0 }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-gradient" style={{ fontSize: '2rem' }}>{checklist.title}</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Build your workflow</p>
                    </div>
                </div>
                <Logo />
            </motion.div>

            {/* Checklist Dates Input Row */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
                    padding: '1rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)',
                    marginBottom: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)'
                }}
            >
                <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Checklist Created</span>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-muted)', padding: '6px 12px', fontSize: '0.85rem', fontFamily: 'monospace', minWidth: '100px', textAlign: 'center' }}>
                        {createdDate || '---'}
                    </div>
                </div>

                <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Expected Date {checklist?.expected_date && !isMaster && <LockIcon size={12} color="var(--text-muted)" />}
                    </span>
                    {checklist?.expected_date && !isMaster ? (
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-muted)', padding: '6px 12px', fontSize: '0.85rem', fontFamily: 'monospace', minWidth: '100px', textAlign: 'center', opacity: 0.7 }}>
                            {checklist.expected_date.includes('-') ? checklist.expected_date.split('-').reverse().join('.') : checklist.expected_date}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="date"
                                value={expectedDate}
                                onChange={(e) => setExpectedDate(e.target.value)}
                                style={{
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', cursor: 'pointer',
                                    borderRadius: '4px', color: 'var(--text-primary)', padding: '5px 8px', fontSize: '0.85rem',
                                    fontFamily: 'monospace', height: '32px'
                                }}
                            />
                            {expectedDate && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const parts = expectedDate.split('-');
                                            const formattedDate = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : expectedDate;
                                            await checklistService.updateChecklist(id, { expected_date: formattedDate });
                                            setChecklist((prev) => ({ ...prev, expected_date: formattedDate }));
                                        } catch (err) {
                                            console.error("Error saving expected date", err);
                                            alert("Failed to save Expected Date! Are you sure you ran the SQL Schema to add 'expected_date' to the 'checklists' table? Error: " + (err.response?.data?.error || err.message));
                                        }
                                    }}
                                    className="btn-primary"
                                    style={{ padding: '0 12px', height: '32px', fontSize: '0.8rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                                >
                                    Save
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Extend Timeline</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                                type="date"
                                value={extendedDate}
                                onChange={(e) => setExtendedDate(e.target.value)}
                                style={{
                                    background: 'rgba(255,255,255,0.03)', border: '1px dotted var(--border-highlight)', cursor: 'pointer',
                                    borderRadius: '4px', color: 'var(--accent-primary)', padding: '5px 8px', fontSize: '0.85rem',
                                    fontFamily: 'monospace', height: '32px'
                                }}
                            />
                            {extendedDate && (
                                <button
                                    onClick={handleAddExtensionDate}
                                    className="btn-secondary"
                                    style={{ padding: '0 12px', height: '32px', fontSize: '0.8rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                                >
                                    Save
                                </button>
                            )}
                        </div>
                        <button className="btn-icon-subtle" onClick={() => setShowHistoryModal(true)} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }} title="View Extension History">
                            <HistoryIcon size={16} color="var(--accent-primary)" />
                            {extensionHistory.length > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{extensionHistory.length}</span>}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Global Time Tracker */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {timerActive ? 'Time Remaining' : 'Total Allocated Time'}
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'monospace', color: timerActive ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {formatDuration(timeLeftSeconds)}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={timerActive ? handleStopTimer : handleStartTimer}
                        className={timerActive ? 'btn-secondary' : 'btn-primary'}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                    >
                        {timerActive ? (
                            <>
                                <Square size={18} /> Stop Timer
                            </>
                        ) : (
                            <>
                                <Play size={18} /> Start Timer
                            </>
                        )}
                    </button>
                    <button
                        className="btn-icon-subtle"
                        onClick={handleOpenTimerLogs}
                        style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                    >
                        <History size={14} /> Logs
                    </button>
                </div>
            </motion.div>

            {/* Main Task Input */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ marginBottom: '3rem' }}
            >
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Main Task</h2>
                <form
                    onSubmit={handleAddMainTask}
                    style={{
                        display: 'flex',
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '8px',
                        boxShadow: 'var(--shadow-md)',
                        alignItems: 'center'
                    }}
                >
                    <div style={{ padding: '0 12px', color: 'var(--accent-primary)' }}>
                        <Plus size={24} />
                    </div>
                    <input
                        type="text"
                        placeholder="Type a task and press Enter..."
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            padding: '12px 0',
                            outline: 'none'
                        }}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        disabled={addingTask}
                    />
                    {addingTask && <Loader2 size={20} className="spinner" style={{ marginRight: '16px', color: 'var(--text-muted)' }} />}
                </form>
            </motion.div>

            {/* Task Tree */}
            <div style={{ marginLeft: '1rem' }}>
                <AnimatePresence>
                    {tree.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onToggleComplete={handleToggleComplete}
                            onDelete={handleDeleteTask}
                            onAddSubTask={handleAddSubTask}
                            onUpdateTask={handleUpdateTask}
                        />
                    ))}
                </AnimatePresence>

                {tasks.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}
                    >
                        <p>No tasks yet. Start by adding a main task above.</p>
                    </motion.div>
                )}
            </div>

            {/* Timer Logs Modal */}
            <AnimatePresence>
                {showTimerLogsModal && (
                    <div onClick={() => setShowTimerLogsModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <motion.div
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-highlight)', boxShadow: 'var(--shadow-lg)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <History size={18} /> Timer Logs
                                </h3>
                                <button className="btn-icon-subtle" onClick={() => setShowTimerLogsModal(false)}><X size={20} /></button>
                            </div>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                                {timerLogs.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>No manual timer stops recorded yet.</p>
                                ) : (
                                    timerLogs.map(log => (
                                        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                </div>
                                                <div style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                    {formatDuration(log.elapsed_seconds)}
                                                </div>
                                            </div>
                                            {isMaster && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTimerLog(log.id);
                                                    }}
                                                    className="btn-icon-subtle"
                                                    style={{ color: '#ef4444', marginLeft: '12px', zIndex: 10 }}
                                                    title="Delete this log"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Extension History Modal */}
            <AnimatePresence>
                {showHistoryModal && (
                    <div onClick={() => setShowHistoryModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <motion.div
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-highlight)', boxShadow: 'var(--shadow-lg)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><HistoryIcon size={20} color="var(--accent-primary)" /> Extension History</h3>
                                <button className="btn-icon-subtle" onClick={() => setShowHistoryModal(false)}><X size={20} /></button>
                            </div>

                            {extensionHistory.length > 0 ? (
                                <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                    {extensionHistory.map((dateStr, idx) => (
                                        <div key={idx} style={{ padding: '12px 16px', borderBottom: idx < extensionHistory.length - 1 ? '1px solid var(--border-color)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>{idx + 1}.</span>
                                                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>{dateStr}</span>
                                            </div>
                                            {isMaster && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteExtensionDate(idx);
                                                    }}
                                                    className="btn-icon-subtle"
                                                    style={{ color: '#ef4444', zIndex: 10 }}
                                                    title="Delete extension"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No extensions recorded.</p>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChecklistView;
