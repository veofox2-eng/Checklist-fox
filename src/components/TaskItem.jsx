import React, { useState, useEffect } from 'react';
import { formatDuration, calculateDuration } from '../utils/timeUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MoreVertical, CornerDownRight, Clock, FileText, X } from 'lucide-react';

const TaskItem = ({
    task,
    onToggleComplete,
    onDelete,
    onAddSubTask,
    onUpdateTask,
    depth = 0
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [isAddingSub, setIsAddingSub] = useState(false);
    const [newSubTitle, setNewSubTitle] = useState('');

    // Modal state
    const [showDescModal, setShowDescModal] = useState(false);
    const [descText, setDescText] = useState(task.description || '');
    const [showStatsModal, setShowStatsModal] = useState(false);
    // Time tracking local state
    const [startTime, setStartTime] = useState(task.start_time || '');
    const [endTime, setEndTime] = useState(task.end_time || '');

    // Synchronize local state if parent prop dynamically overrides the timer
    useEffect(() => {
        setStartTime(task.start_time || '');
        setEndTime(task.end_time || '');
    }, [task.start_time, task.end_time]);

    // Auto-close dropdown when clicking outside (or simulated by mouse leave wrapper)
    const handleToggle = () => {
        onToggleComplete(task, !task.is_completed);
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        if (!newSubTitle.trim()) return;
        onAddSubTask(task.id, newSubTitle);
        setNewSubTitle('');
        setIsAddingSub(false);
    };

    const handleTimeBlur = async () => {
        // Only update if changed
        if (startTime !== task.start_time || endTime !== task.end_time) {
            try {
                // we invoke a parent callback to handle the database update so the state lifts properly
                // Since ChecklistView maps this, we can optionally pass an onUpdate(id, updates) function
                // or just trigger the API directly here if we accept optimistic delay
                await onUpdateTask(task.id, { start_time: startTime, end_time: endTime });
            } catch (err) {
                console.error("Error saving time", err);
                alert("Database Error updating Task Time! Make sure your schema has all required columns. Error: " + (err?.response?.data?.error || err.message));
            }
        }
    };



    // Calculate nesting visuals
    const marginLeft = depth > 0 ? '2rem' : '0';

    return (
        <div className="task-item-wrapper" style={{ marginLeft }}>
            {/* n8n style Branching Line from parent to this item */}
            {depth > 0 && (
                <div style={{
                    position: 'absolute',
                    left: '-1.5rem',
                    top: '-1rem',
                    bottom: '50%',
                    width: '1.5rem',
                    borderLeft: '2px solid var(--border-color)',
                    borderBottom: '2px solid var(--border-color)',
                    borderBottomLeftRadius: '12px',
                    zIndex: 0
                }} />
            )}

            {/* Connecting line to children if they exist */}
            {task.children && task.children.length > 0 && (
                <div style={{
                    position: 'absolute',
                    left: '0.5rem',
                    top: '3rem', // Start below the current task
                    bottom: '-1rem', // Extend to the last child
                    width: '2px',
                    background: 'var(--border-color)',
                    zIndex: 0
                }} />
            )}

            {/* Main Task Row */}
            <motion.div
                layout
                className={`task-row-content ${showDropdown ? 'dropdown-active' : ''}`}
                initial={{ opacity: 0, x: -25, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.01, x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 18px',
                    marginBottom: '0.6rem',
                    backdropFilter: 'blur(16px)'
                }}
                onMouseLeave={() => setShowDropdown(false)}
            >
                <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={task.is_completed}
                    onChange={handleToggle}
                />

                <div style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: '600',
                    color: 'var(--accent-primary)',
                    fontSize: '0.9rem',
                    minWidth: '24px'
                }}>
                    {task.displayNumber}
                </div>

                <div style={{
                    flex: 1,
                    fontSize: '1rem',
                    textDecoration: task.is_completed ? 'line-through' : 'none',
                    color: task.is_completed ? 'var(--text-muted)' : 'var(--text-primary)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    {task.title}
                    {task.is_completed && (
                        <span
                            onClick={(e) => { e.stopPropagation(); setShowStatsModal(true); }}
                            style={{ fontSize: '0.8rem', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px', cursor: 'pointer' }}
                        >
                            Completed
                        </span>
                    )}
                </div>

                {/* Individual/Group Total Duration */}
                {!task.is_completed && task.total_duration > 0 && (
                    <div style={{ marginRight: '4px', fontSize: '0.8rem', color: 'var(--accent-primary)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }}>
                        <Clock size={14} color="var(--accent-primary)" /> {formatDuration(task.total_duration)}
                    </div>
                )}



                {/* Time Tracking Inputs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 5, marginRight: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Start</span>
                        <input
                            type="time"
                            step="1"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            onBlur={handleTimeBlur}
                            style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                                borderRadius: '4px', color: 'var(--text-primary)', padding: '2px 4px', fontSize: '0.8rem',
                                colorScheme: 'dark', fontFamily: 'monospace'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>End</span>
                        <input
                            type="time"
                            step="1"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            onBlur={handleTimeBlur}
                            style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                                borderRadius: '4px', color: 'var(--text-primary)', padding: '2px 4px', fontSize: '0.8rem',
                                colorScheme: 'dark', fontFamily: 'monospace'
                            }}
                        />
                    </div>
                </div>

                {/* Task Description Icon */}
                <button
                    className="btn-icon-subtle"
                    onClick={(e) => { e.stopPropagation(); setShowDescModal(true); }}
                    title="Task Description"
                    style={{ marginRight: '8px' }}
                >
                    <FileText size={16} />
                </button>

                {/* Hover Dropdown Wrapper */}
                <div
                    style={{ position: 'relative' }}
                    onMouseEnter={() => setShowDropdown(true)}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(!showDropdown);
                    }}
                >
                    <button
                        className={`btn-icon-subtle ${showDropdown ? 'active' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreVertical size={16} />
                    </button>

                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-highlight)',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: 'var(--shadow-md)',
                                    padding: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    minWidth: '160px',
                                    zIndex: 20
                                }}
                            >
                                <button
                                    onClick={() => setIsAddingSub(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', width: '100%', textAlign: 'left', borderRadius: '6px', color: 'var(--text-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Plus size={14} /> Add sub-task
                                </button>
                                <button
                                    onClick={() => onDelete(task.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', width: '100%', textAlign: 'left', borderRadius: '6px', color: 'var(--danger)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Trash2 size={14} /> Delete task
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Inline Add Sub-task form */}
            <AnimatePresence>
                {isAddingSub && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddSubmit}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            marginLeft: '2rem', marginBottom: '0.5rem',
                            position: 'relative'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            left: '-1.5rem',
                            top: '-0.5rem',
                            height: '1.5rem',
                            width: '1.5rem',
                            borderLeft: '2px solid var(--accent-glow)',
                            borderBottom: '2px solid var(--accent-glow)',
                            borderBottomLeftRadius: '12px'
                        }} />
                        <input
                            type="text"
                            className="glass-input"
                            placeholder={`Sub-task for ${task.displayNumber}...`}
                            value={newSubTitle}
                            onChange={(e) => setNewSubTitle(e.target.value)}
                            autoFocus
                            onBlur={() => !newSubTitle && setIsAddingSub(false)}
                        />
                    </motion.form>
                )}
            </AnimatePresence >

            {/* Description Modal */}
            <AnimatePresence>
                {showDescModal && (
                    <div onClick={() => setShowDescModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <motion.div
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px', border: '1px solid var(--border-highlight)', boxShadow: 'var(--shadow-lg)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>Task Description</h3>
                                <button className="btn-icon-subtle" onClick={() => setShowDescModal(false)}><X size={20} /></button>
                            </div>
                            <textarea
                                value={descText}
                                onChange={(e) => setDescText(e.target.value)}
                                onBlur={(e) => onUpdateTask(task.id, { description: e.target.value })}
                                placeholder="Add notes, links, or details about this task..."
                                style={{
                                    width: '100%',
                                    minHeight: '150px',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Stats Modal */}
            <AnimatePresence>
                {showStatsModal && (
                    <div onClick={() => setShowStatsModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <motion.div
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-highlight)', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>Task Completion Stats</h3>
                                <button className="btn-icon-subtle" onClick={() => setShowStatsModal(false)}><X size={20} /></button>
                            </div>

                            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
                                <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Time Completed (Actual)</p>
                                <div style={{ fontSize: '1.4rem', color: 'var(--success)', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                    {formatDuration(calculateDuration(task.start_time, task.end_time))}
                                </div>
                            </div>

                            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Time Allocated</p>
                                <div style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                    {task.allocated_time ? formatDuration(calculateDuration(task.start_time, task.allocated_time)) : formatDuration(calculateDuration(task.start_time, task.end_time))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>



            {/* Render Children Recursively */}
            {
                task.children && task.children.length > 0 && (
                    <div style={{ position: 'relative' }}>
                        <AnimatePresence>
                            {task.children.map((child) => (
                                <TaskItem
                                    key={child.id}
                                    task={child}
                                    depth={depth + 1}
                                    onToggleComplete={onToggleComplete}
                                    onDelete={onDelete}
                                    onAddSubTask={onAddSubTask}
                                    onUpdateTask={onUpdateTask}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )
            }
        </div >
    );
};

export default TaskItem;
