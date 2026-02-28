import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List, LogOut, Loader2, X, Calendar, Edit2, Trash2, Settings, Camera } from 'lucide-react';
import { checklistService, profileService } from '../api';
import Logo from '../components/Logo';
import { compressImage } from '../utils/imageUtils';

const Dashboard = () => {
    const navigate = useNavigate();
    const profileId = localStorage.getItem('activeProfileId');
    const profileName = localStorage.getItem('activeProfileName');

    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newChecklistTitle, setNewChecklistTitle] = useState('');
    const [creating, setCreating] = useState(false);

    // Edit/Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [showRenameModal, setShowRenameModal] = useState(null);
    const [renameTitle, setRenameTitle] = useState('');
    const [processing, setProcessing] = useState(false);

    // Edit Profile Modal State
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editProfileData, setEditProfileData] = useState({ name: '', password: '', avatar_url: '' });
    const fileInputRef = React.useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64Image = await compressImage(file);
                setEditProfileData({ ...editProfileData, avatar_url: base64Image });
            } catch (err) {
                console.error("Error processing image", err);
                alert("Failed to process image");
            }
        }
    };

    useEffect(() => {
        fetchChecklists();
    }, []);

    const fetchChecklists = async () => {
        try {
            const response = await checklistService.getChecklists(profileId);
            setChecklists(response.data);
        } catch (error) {
            console.error('Error fetching checklists', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateChecklist = async (e) => {
        e.preventDefault();
        if (!newChecklistTitle.trim()) return;

        setCreating(true);
        try {
            const response = await checklistService.createChecklist({
                profile_id: profileId,
                title: newChecklistTitle
            });
            setShowCreateModal(false);
            navigate(`/checklist/${response.data.id}`);
        } catch (error) {
            console.error('Error creating checklist', error);
            setCreating(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('activeProfileId');
        localStorage.removeItem('activeProfileName');
        localStorage.removeItem('activeProfileAvatar');
        navigate('/');
    };

    const handleEditProfileSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const dataToUpdate = {};
            if (editProfileData.name && editProfileData.name !== profileName) {
                dataToUpdate.name = editProfileData.name;
            }
            if (editProfileData.password) {
                dataToUpdate.password = editProfileData.password;
            }
            if (editProfileData.avatar_url && editProfileData.avatar_url !== localStorage.getItem('activeProfileAvatar')) {
                dataToUpdate.avatar_url = editProfileData.avatar_url;
            }

            if (Object.keys(dataToUpdate).length === 0) {
                setShowEditProfile(false);
                setProcessing(false);
                return;
            }

            const res = await profileService.updateProfile(profileId, dataToUpdate);
            localStorage.setItem('activeProfileName', res.data.name);
            localStorage.setItem('activeProfileAvatar', res.data.avatar_url || '');
            setShowEditProfile(false);
            window.location.reload();
        } catch (error) {
            console.error('Error updating profile', error);
            alert(error.response?.data?.error || "Failed to update profile.");
        } finally {
            setProcessing(false);
        }
    };

    const [activeDropdown, setActiveDropdown] = useState(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const confirmDeleteChecklist = async () => {
        if (!showDeleteModal) return;
        setProcessing(true);
        try {
            await checklistService.deleteChecklist(showDeleteModal);
            setChecklists(checklists.filter(c => c.id !== showDeleteModal));
            setShowDeleteModal(null);
        } catch (error) {
            console.error('Error deleting checklist', error);
        } finally {
            setProcessing(false);
        }
    };

    const confirmRenameChecklist = async (e) => {
        e.preventDefault();
        if (!showRenameModal || !renameTitle.trim()) return;
        setProcessing(true);
        try {
            await checklistService.updateChecklist(showRenameModal, { title: renameTitle });
            setChecklists(checklists.map(c => c.id === showRenameModal ? { ...c, title: renameTitle } : c));
            setShowRenameModal(null);
        } catch (error) {
            console.error('Error renaming checklist', error);
        } finally {
            setProcessing(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.8, y: 30 },
        show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 20 } }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}
            >
                <div>
                    <Logo />
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Welcome back, {profileName}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => {
                            setEditProfileData({ name: profileName, password: '', avatar_url: localStorage.getItem('activeProfileAvatar') || '' });
                            setShowEditProfile(true);
                        }}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Settings size={18} />
                        Edit Profile
                    </button>
                    <button
                        onClick={handleLogout}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <LogOut size={18} />
                        Switch Profile
                    </button>
                </div>
            </motion.div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
                    <Loader2 size={40} className="spinner text-gradient" />
                </div>
            ) : (
                <motion.div
                    className="profile-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '2rem'
                    }}
                >

                    {/* Create New Checklist Card */}
                    <motion.div variants={itemVariants}>
                        <div
                            className="glass-panel"
                            style={{
                                height: '200px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                                border: '2px dashed var(--border-color)',
                                backgroundColor: 'rgba(255,255,255,0.01)'
                            }}
                            onClick={() => setShowCreateModal(true)}
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.03)' }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div
                                style={{
                                    width: '60px', height: '60px',
                                    borderRadius: '16px',
                                    background: 'var(--bg-secondary)',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    marginBottom: '1rem',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            >
                                <Plus size={32} color="var(--accent-primary)" />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>New Checklist</h3>
                        </div>
                    </motion.div>

                    {/* Existing Checklists */}
                    {checklists.map(checklist => (
                        <motion.div variants={itemVariants} key={checklist.id}>
                            <motion.div
                                className="glass-panel"
                                style={{
                                    height: '200px',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                                onClick={() => navigate(`/checklist/${checklist.id}`)}
                                whileHover={{ y: -8, scale: 1.03, borderColor: 'var(--accent-glow)' }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'auto' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div
                                            className={`btn-icon-subtle ${activeDropdown === checklist.id ? 'active' : ''}`}
                                            style={{ padding: '8px' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdown(activeDropdown === checklist.id ? null : checklist.id);
                                            }}
                                        >
                                            <List size={22} />
                                        </div>

                                        <AnimatePresence>
                                            {activeDropdown === checklist.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        right: 0, // Align right instead of left to avoid clipping
                                                        marginTop: '8px',
                                                        background: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border-highlight)',
                                                        borderRadius: '8px',
                                                        padding: '6px',
                                                        zIndex: 20,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '4px',
                                                        minWidth: '150px',
                                                        boxShadow: 'var(--shadow-md)'
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        className="dropdown-item"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowRenameModal(checklist.id);
                                                            setRenameTitle(checklist.title);
                                                            setActiveDropdown(null);
                                                        }}
                                                    >
                                                        <Edit2 size={14} /> Rename
                                                    </button>
                                                    <button
                                                        className="dropdown-item danger"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowDeleteModal(checklist.id);
                                                            setActiveDropdown(null);
                                                        }}
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {checklist.title}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <Calendar size={14} />
                                        {new Date(checklist.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* --- Edit Profile Modal --- */}
            <AnimatePresence>
                {showEditProfile && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                        }}
                    >
                        <motion.div
                            className="glass-panel"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{
                                width: '100%', maxWidth: '400px', padding: '2rem',
                                background: 'var(--bg-secondary)', position: 'relative'
                            }}
                        >
                            <button
                                onClick={() => setShowEditProfile(false)}
                                className="btn-icon-subtle"
                                style={{ position: 'absolute', top: '16px', right: '16px' }}
                            >
                                <X size={20} />
                            </button>

                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Edit Profile</h2>

                            <form onSubmit={handleEditProfileSubmit}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Profile Name</label>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        placeholder="Leave blank to keep current"
                                        value={editProfileData.name}
                                        onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                                    />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>New Password (leave blank to keep current)</label>
                                    <input
                                        type="password"
                                        className="glass-input"
                                        value={editProfileData.password}
                                        onChange={(e) => setEditProfileData({ ...editProfileData, password: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            width: '80px', height: '80px',
                                            borderRadius: '50%',
                                            border: '2px dashed var(--border-color)',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            background: editProfileData.avatar_url && editProfileData.avatar_url.startsWith('data:image') ? 'transparent' : 'rgba(255,255,255,0.02)',
                                            transition: 'all 0.3s ease'
                                        }}
                                        title="Click to upload profile photo"
                                    >
                                        {editProfileData.avatar_url && editProfileData.avatar_url.startsWith('data:image') ? (
                                            <img src={editProfileData.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : editProfileData.avatar_url ? (
                                            <div style={{ fontSize: '2rem' }}>{editProfileData.avatar_url}</div>
                                        ) : (
                                            <Camera size={24} color="var(--text-muted)" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditProfile(false)}
                                        className="btn-secondary"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={processing}
                                        style={{ minWidth: '120px' }}
                                    >
                                        {processing ? <Loader2 size={20} className="spinner" /> : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(10, 10, 15, 0.8)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 50
                        }}
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: -20 }}
                            className="glass-panel"
                            style={{
                                width: '100%',
                                maxWidth: '450px',
                                padding: '2.5rem',
                                position: 'relative'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowCreateModal(false)}
                                style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ marginBottom: '0.5rem' }}>Create Checklist</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Give your new checklist a clear title.</p>

                            <form onSubmit={handleCreateChecklist} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="e.g., Weekly Grocery List"
                                    className="glass-input"
                                    value={newChecklistTitle}
                                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                                    required
                                    autoFocus
                                />

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={creating || !newChecklistTitle.trim()}
                                    style={{ width: '100%', marginTop: '1rem' }}
                                >
                                    {creating ? <Loader2 size={20} className="spinner" /> : 'Create and Open'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rename Modal */}
            <AnimatePresence>
                {showRenameModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(10, 10, 15, 0.6)', backdropFilter: 'blur(10px)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50
                        }}
                        onClick={() => setShowRenameModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: -20 }}
                            className="glass-panel"
                            style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Edit2 size={20} color="var(--accent-primary)" /> Rename Checklist
                            </h2>
                            <form onSubmit={confirmRenameChecklist} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <input
                                    type="text"
                                    className="glass-input"
                                    value={renameTitle}
                                    onChange={(e) => setRenameTitle(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                                    <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowRenameModal(null)}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={processing || !renameTitle.trim()}>
                                        {processing ? <Loader2 size={18} className="spinner" /> : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(10, 10, 15, 0.6)', backdropFilter: 'blur(10px)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50
                        }}
                        onClick={() => setShowDeleteModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: -20 }}
                            className="glass-panel"
                            style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 style={{ marginBottom: '0.5rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Trash2 size={24} /> Delete Checklist?
                            </h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                Are you sure you want to delete this checklist? This action cannot be undone and will delete all associated tasks.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteModal(null)}>Cancel</button>
                                <button
                                    className="btn-primary"
                                    style={{ flex: 1, background: 'linear-gradient(135deg, var(--danger), #dc2626)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}
                                    onClick={confirmDeleteChecklist}
                                    disabled={processing}
                                >
                                    {processing ? <Loader2 size={18} className="spinner" /> : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Dashboard;
