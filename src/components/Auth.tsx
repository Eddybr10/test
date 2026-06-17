"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Key, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { generateSalt, hashMasterPasswordForAuth } from '@/lib/crypto';
import styles from './Auth.module.css';

export default function Auth({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bufferToBase64 = (buffer: ArrayBufferLike): string => {
    const bytes = new Uint8Array(buffer as ArrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login Flow
        // 1. Get Salt
        const resSalt = await fetch('/api/auth/get-salt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        
        const dataSalt = await resSalt.json();
        
        if (!resSalt.ok) {
          throw new Error(dataSalt.error || 'Error al iniciar sesión');
        }

        // 2. Hash Password
        const masterHash = await hashMasterPasswordForAuth(password, dataSalt.salt);

        // 3. Login
        const resLogin = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, masterPasswordHash: masterHash }),
        });

        if (!resLogin.ok) throw new Error('Credenciales inválidas');

        // Store salt in memory for crypto operations
        sessionStorage.setItem('sessionSalt', dataSalt.salt);
        sessionStorage.setItem('masterKey', password); // In memory, wiped on reload or logout
        onAuthenticated();

      } else {
        // Register Flow
        const salt = generateSalt();
        const saltBase64 = bufferToBase64(salt.buffer);
        const masterHash = await hashMasterPasswordForAuth(password, saltBase64);

        const resRegister = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, salt: saltBase64, masterPasswordHash: masterHash }),
        });

        const dataRegister = await resRegister.json();

        if (!resRegister.ok) {
          throw new Error(dataRegister.error || 'Error al registrar');
        }

        sessionStorage.setItem('sessionSalt', saltBase64);
        sessionStorage.setItem('masterKey', password);
        onAuthenticated();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.header}>
          <ShieldCheck className={styles.icon} size={48} />
          <h2>{isLogin ? 'Bienvenido a tu Bóveda' : 'Crear tu Bóveda'}</h2>
          <p>Criptografía Zero-Knowledge. Máxima privacidad.</p>
        </div>

        {error && <motion.div className={styles.error} initial={{opacity:0}} animate={{opacity:1}}>{error}</motion.div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <Mail size={20} className={styles.inputIcon} />
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <Key size={20} className={styles.inputIcon} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Contraseña Maestra" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              minLength={8}
            />
            <button 
              type="button" 
              className={styles.eyeBtn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {!isLogin && (
            <p className={styles.warning}>
              ⚠️ <strong>Importante:</strong> Si olvidas tu Contraseña Maestra, perderás acceso a todas tus contraseñas. No podemos recuperarla por ti.
            </p>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
          </button>
        </form>

        <div className={styles.toggleText}>
          {isLogin ? '¿No tienes una bóveda? ' : '¿Ya tienes una bóveda? '}
          <button type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
