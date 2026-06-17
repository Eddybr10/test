"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import styles from './PasswordModal.module.css';
import { generatePassword } from '@/lib/crypto';

interface PasswordModalProps {
  item?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function PasswordModal({ item, onClose, onSave }: PasswordModalProps) {
  const [title, setTitle] = useState(item?.title || '');
  const [username, setUsername] = useState(item?.username || '');
  const [url, setUrl] = useState(item?.url || '');
  const [password, setPassword] = useState(item?.password || ''); // Note: this must be plaintext here
  const [notes, setNotes] = useState(item?.notes || '');
  
  const [showPassword, setShowPassword] = useState(false);
  
  // Generator options
  const [genLen, setGenLen] = useState(16);
  const [genSym, setGenSym] = useState(true);
  const [genNum, setGenNum] = useState(true);
  const [genUpper, setGenUpper] = useState(true);

  const handleGenerate = () => {
    setPassword(generatePassword(genLen, genSym, genNum, genUpper));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Podría mostrar un toast aquí
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, username, url, password, notes });
  };

  return (
    <div className={styles.overlay}>
      <motion.div 
        className={styles.modal}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
      >
        <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
        
        <h2>{item ? 'Editar Credencial' : 'Nueva Credencial'}</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Título / Nombre del Servicio</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Netflix, Google" />
          </div>

          <div className={styles.inputGroup}>
            <label>Usuario / Email</label>
            <div className={styles.inputWithBtn}>
              <input value={username} onChange={e => setUsername(e.target.value)} />
              <button type="button" onClick={() => handleCopy(username)}><Copy size={16}/></button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Contraseña</label>
            <div className={styles.inputWithBtn}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
              <button type="button" onClick={() => handleCopy(password)}><Copy size={16}/></button>
            </div>
          </div>

          <div className={styles.generatorBox}>
            <div className={styles.genHeader}>
              <span>Generador</span>
              <button type="button" onClick={handleGenerate} className={styles.genBtn}><RefreshCw size={14}/> Generar</button>
            </div>
            <div className={styles.genControls}>
              <label>Longitud: {genLen}
                <input type="range" min="8" max="64" value={genLen} onChange={e => setGenLen(Number(e.target.value))} />
              </label>
              <div className={styles.genChecks}>
                <label><input type="checkbox" checked={genUpper} onChange={e => setGenUpper(e.target.checked)} /> A-Z</label>
                <label><input type="checkbox" checked={genNum} onChange={e => setGenNum(e.target.checked)} /> 0-9</label>
                <label><input type="checkbox" checked={genSym} onChange={e => setGenSym(e.target.checked)} /> !@#</label>
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>URL (Opcional)</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className={styles.inputGroup}>
            <label>Notas Seguras (Opcional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>

          <button type="submit" className={styles.submitBtn}>
            {item ? 'Guardar Cambios' : 'Añadir a la Bóveda'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
