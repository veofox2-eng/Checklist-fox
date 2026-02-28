import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Loader2, Play, Square } from 'lucide-react';
import { checklistService } from '../api';
import TaskItem from '../components/TaskItem';
import Logo from '../components/Logo';
import { calculateDuration, formatDuration, getCurrentTimeFormatted, calculateUnionDuration } from '../utils/timeUtils';

const ChecklistView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [checklist, setChecklist] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState('');
    const [addingTask, setAddingTask] = useState(false);

    // Global Countdown State
    const [timerActive, setTimerActive] = useState(false);
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);

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

        // Optimistic update
        setTasks(tasks.map(t => idsToUpdate.has(t.id) ? { ...t, is_completed } : t));

        try {
            // Update all affected tasks in parallel
            await Promise.all(
                Array.from(idsToUpdate).map(id =>
                    checklistService.updateTask(id, { is_completed })
                )
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

    // Update internal timer state when tasks change (only if not running)
    useEffect(() => {
        if (!timerActive) {
            setTimeLeftSeconds(totalDurationSeconds);
        }
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

                <button
                    onClick={() => setTimerActive(!timerActive)}
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

        </div>
    );
};

export default ChecklistView;
