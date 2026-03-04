import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, Lock, ArrowRight, Loader2, X, Trash2 } from 'lucide-react';
import { profileService } from '../api';
import Logo from '../components/Logo';

const ProfileSelection = () => {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Login Modal State
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [password, setPassword] = useState('');
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    // Delete Profile Modal State
    const [showDeleteProfile, setShowDeleteProfile] = useState(null);
    const [deleteProfilePassword, setDeleteProfilePassword] = useState('');

    useEffect(() => {
        fetchProfiles();

        // Auto clear auth state on this page
        localStorage.removeItem('activeProfileId');
        localStorage.removeItem('activeProfileName');
    }, []);

    const fetchProfiles = async () => {
        try {
            const response = await profileService.getProfiles();
            setProfiles(response.data);
        } catch (error) {
            console.error('Error fetching profiles', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoggingIn(true);

        try {
            if (isResettingPassword) {
                // Reset password flow
                const response = await profileService.updateProfile(selectedProfile.id, { password });

                // Keep them logged in via the new token/hash data
                localStorage.setItem('activeProfileId', response.data.id);
                localStorage.setItem('activeProfileName', response.data.name);
                localStorage.setItem('activeProfileAvatar', response.data.avatar_url || '');
                navigate('/dashboard');
            } else {
                // Normal login flow
                const response = await profileService.login(selectedProfile.id, password);
                localStorage.setItem('activeProfileId', response.data.id);
                localStorage.setItem('activeProfileName', response.data.name);
                localStorage.setItem('activeProfileAvatar', response.data.avatar_url || '');
                navigate('/dashboard');
            }
        } catch (err) {
            setLoginError(err.response?.data?.error || (isResettingPassword ? 'Failed to reset password' : 'Invalid credentials'));
        } finally {
            setLoggingIn(false);
        }
    };

    const handleDeleteProfileClick = (e, profile) => {
        e.stopPropagation();
        setShowDeleteProfile(profile);
    };

    const confirmDeleteProfile = async (e) => {
        e.preventDefault();
        if (!showDeleteProfile || !deleteProfilePassword) return;
        setLoggingIn(true);
        setLoginError('');
        try {
            await profileService.deleteProfile(showDeleteProfile.id, deleteProfilePassword);
            setProfiles(profiles.filter(p => p.id !== showDeleteProfile.id));
            setShowDeleteProfile(null);
            setDeleteProfilePassword('');
        } catch (error) {
            console.error('Error deleting profile:', error);
            setLoginError(error.response?.data?.error || 'Incorrect password or failed to delete.');
        } finally {
            setLoggingIn(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '80vh', paddingTop: '4rem' }}>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
                <div style={{ marginBottom: '2rem' }}><Logo /></div>
                <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Welcome Back</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Who's stepping into the workspace?</p>
            </motion.div>

            {loading ? (
                <Loader2 size={40} className="spinner text-gradient" />
            ) : (
                <motion.div
                    className="profile-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '2rem',
                        width: '100%',
                        maxWidth: '1000px'
                    }}
                >
                    {/* Create New Profile Card */}
                    <motion.div variants={itemVariants}>
                        <div
                            className="glass-panel"
                            style={{
                                height: '240px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                                border: '2px dashed var(--border-color)',
                                backgroundColor: 'transparent'
                            }}
                            onClick={() => navigate('/create-profile')}
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.02)' }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div
                                style={{
                                    width: '64px', height: '64px',
                                    borderRadius: '50%',
                                    background: 'var(--bg-glass)',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    marginBottom: '1rem'
                                }}
                            >
                                <Plus size={32} color="var(--accent-primary)" />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>New Profile</h3>
                        </div>
                    </motion.div>

                    {/* Existing Profiles */}
                    {profiles.map(profile => (
                        <motion.div variants={itemVariants} key={profile.id}>
                            <div
                                className="glass-panel"
                                style={{
                                    height: '240px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onClick={() => setSelectedProfile(profile)}
                            >
                                <button
                                    onClick={(e) => handleDeleteProfileClick(e, profile)}
                                    className="btn-icon-subtle danger"
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        padding: '6px',
                                        color: 'var(--text-muted)'
                                    }}
                                    title="Delete Profile"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div
                                    style={{
                                        width: '80px', height: '80px',
                                        borderRadius: '50%',
                                        background: 'var(--bg-secondary)',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        marginBottom: '1.5rem',
                                        overflow: 'hidden',
                                        border: '2px solid var(--border-color)'
                                    }}
                                >
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={36} color="var(--text-muted)" />
                                    )}
                                </div>
                                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{profile.name}</h3>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Login Modal */}
            <AnimatePresence>
                {selectedProfile && (
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
                        onClick={() => { setSelectedProfile(null); setPassword(''); setLoginError(''); setIsResettingPassword(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-panel"
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                padding: '2.5rem',
                                position: 'relative'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => { setSelectedProfile(null); setPassword(''); setLoginError(''); setIsResettingPassword(false); }}
                                style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}
                            >
                                <X size={24} />
                            </button>

                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div
                                    style={{
                                        width: '64px', height: '64px',
                                        borderRadius: '50%',
                                        background: 'var(--bg-secondary)',
                                        margin: '0 auto 1rem auto',
                                        overflow: 'hidden',
                                        border: '2px solid var(--accent-primary)'
                                    }}
                                >
                                    {selectedProfile.avatar_url ? (
                                        <img src={selectedProfile.avatar_url} alt={selectedProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={32} color="var(--text-muted)" style={{ margin: '16px' }} />
                                    )}
                                </div>
                                <h2>{isResettingPassword ? `Reset Password` : `Hi, ${selectedProfile.name}`}</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    {isResettingPassword ? `Enter a new password for ${selectedProfile.name}` : `Enter your password to continue`}
                                </p>
                            </div>

                            {loginError && (
                                <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
                                    {loginError}
                                </div>
                            )}

                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    <input
                                        type="password"
                                        placeholder={isResettingPassword ? "Enter new password" : "Password"}
                                        className="glass-input"
                                        style={{ paddingLeft: '40px' }}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loggingIn || !password}
                                    style={{ width: '100%' }}
                                >
                                    {loggingIn ? <Loader2 size={20} className="spinner" /> : (
                                        <>
                                            {isResettingPassword ? "Reset & Login" : "Login"}
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>

                                {!isResettingPassword ? (
                                    <button
                                        type="button"
                                        onClick={() => { setIsResettingPassword(true); setPassword(''); setLoginError(''); }}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px', textDecoration: 'underline' }}
                                    >
                                        Forgot Password?
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { setIsResettingPassword(false); setPassword(''); setLoginError(''); }}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}
                                    >
                                        Cancel Reset
                                    </button>
                                )}
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Profile Modal */}
            <AnimatePresence>
                {showDeleteProfile && (
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
                        onClick={() => { setShowDeleteProfile(null); setDeleteProfilePassword(''); setLoginError(''); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-panel"
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                padding: '2.5rem',
                                position: 'relative',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => { setShowDeleteProfile(null); setDeleteProfilePassword(''); setLoginError(''); }}
                                style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}
                            >
                                <X size={24} />
                            </button>

                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <Trash2 size={48} color="var(--danger)" style={{ margin: '0 auto 1rem auto' }} />
                                <h2 style={{ color: 'var(--danger)' }}>Delete Profile?</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
                                    Are you sure you want to permanently delete <strong>{showDeleteProfile.name}</strong>? This will destroy all associated checklists. Enter your password to confirm.
                                </p>
                            </div>

                            {loginError && (
                                <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
                                    {loginError}
                                </div>
                            )}

                            <form onSubmit={confirmDeleteProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        className="glass-input"
                                        style={{ paddingLeft: '40px' }}
                                        value={deleteProfilePassword}
                                        onChange={(e) => setDeleteProfilePassword(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loggingIn || !deleteProfilePassword}
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
                                >
                                    {loggingIn ? <Loader2 size={20} className="spinner" /> : 'Delete Profile'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ProfileSelection;
