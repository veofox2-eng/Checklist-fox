import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { profileService } from '../api';
import Logo from '../components/Logo';
import { compressImage } from '../utils/imageUtils';

const CreateProfile = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            // Create user
            const response = await profileService.createProfile({
                name: formData.name,
                password: formData.password,
                avatar_url: avatarPreview // Simulated avatar upload for now
            });

            // Auto login
            const profile = response.data;
            localStorage.setItem('activeProfileId', profile.id);
            localStorage.setItem('activeProfileName', profile.name);

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create profile');
        } finally {
            setLoading(false);
        }
    };

    const fileInputRef = React.useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64Image = await compressImage(file);
                setAvatarPreview(base64Image);
            } catch (err) {
                console.error("Error processing image", err);
                setError("Failed to process image");
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="create-profile-container"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
        >
            <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-icon"
                        style={{ border: 'none', background: 'transparent' }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <Logo />
                </div>

                <h1 style={{ marginBottom: '0.5rem' }} className="text-gradient">Create Profile</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Set up your secure checklist space.</p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--danger)',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '100px', height: '100px',
                                borderRadius: '50%',
                                border: '2px dashed var(--border-color)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                background: avatarPreview ? 'transparent' : 'rgba(255,255,255,0.02)',
                                transition: 'all 0.3s ease'
                            }}
                            title="Click to upload profile photo"
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Camera size={32} color="var(--text-muted)" />
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

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Profile Name</label>
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="e.g. Alex"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Password</label>
                        <input
                            type="password"
                            className="glass-input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Confirm Password</label>
                        <input
                            type="password"
                            className="glass-input"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ marginTop: '1rem', width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="spinner" size={20} /> : (
                            <>
                                <UserPlus size={20} />
                                Create Account
                            </>
                        )}
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

export default CreateProfile;
