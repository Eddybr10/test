"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Shield, LogOut, AlertTriangle, Key, ExternalLink } from 'lucide-react';
import styles from './Dashboard.module.css';
import { deriveKey, encryptData, decryptData, base64ToBuffer } from '@/lib/crypto';
import PasswordModal from './PasswordModal';

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [decryptedItems, setDecryptedItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // We keep CryptoKey in memory
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    initKeyAndFetch();
  }, []);

  const initKeyAndFetch = async () => {
    try {
      const password = sessionStorage.getItem('masterKey');
      const saltBase64 = sessionStorage.getItem('sessionSalt');

      if (!password || !saltBase64) {
        onLogout();
        return;
      }

      const saltBuffer = new Uint8Array(base64ToBuffer(saltBase64));
      const key = await deriveKey(password, saltBuffer);
      setCryptoKey(key);

      await fetchItems(key);
    } catch (error) {
      console.error(error);
      onLogout();
    }
  };

  const fetchItems = async (key: CryptoKey) => {
    setLoading(true);
    const res = await fetch('/api/vault');
    if (res.ok) {
      const data = await res.json();
      setItems(data);
      // Decrypt items
      const decList = await Promise.all(data.map(async (item: any) => {
        try {
          const decryptedPayloadStr = await decryptData(item.encryptedPassword, item.iv, key);
          const payload = JSON.parse(decryptedPayloadStr);
          return {
            ...item,
            dec_title: payload.title,
            dec_username: payload.username,
            dec_url: payload.url,
            dec_password: payload.password,
            dec_notes: payload.notes,
          };
        } catch(e) {
          console.error(e);
          return { ...item, dec_title: 'Error descifrando', dec_username: '' };
        }
      }));
      setDecryptedItems(decList);
    }
    setLoading(false);
  };

  const handleSave = async (data: any) => {
    if (!cryptoKey) return;
    setIsModalOpen(false);
    
    // Encrypt data
    const encTitle = await encryptData(data.title || 'Sin Título', cryptoKey);
    // Use the same IV for the object to simplify, or generate unique IVs per field. 
    // We will generate unique IV per field if we want, but schema has one IV. 
    // To use one IV, we must ensure we don't reuse it for different encryptions. 
    // Wait, encryptData generates a new IV each time. 
    // Let's use the IV from title for all or just store JSON and encrypt it entirely?
    // Actually, encrypting a JSON string of all sensitive data is much better and uses 1 IV.
    // Since our schema has separate fields, let's just encrypt a JSON payload and store it in encryptedPassword, 
    // OR we just encrypt them separately and store them. But wait, encryptData returns {ciphertext, iv}.
    // If we use separate IVs, we need to change schema. 
    // Let's pack all data into a JSON string and encrypt it, storing in `encryptedPassword` and empty the others,
    // OR we use the same IV for all fields. USING SAME IV FOR MULTIPLE ENCRYPTIONS WITH AES-GCM IS A SECURITY RISK.
    // So let's pack into a JSON.
    const payload = JSON.stringify({
      title: data.title,
      username: data.username,
      url: data.url,
      password: data.password,
      notes: data.notes
    });

    const encrypted = await encryptData(payload, cryptoKey);

    const payloadObj = {
      title: 'Encrypted', // Dummy for schema
      username: 'Encrypted', // Dummy for schema
      url: 'Encrypted', // Dummy for schema
      notes: null,
      encryptedPassword: encrypted.ciphertext,
      iv: encrypted.iv
    };

    if (editingItem) {
      await fetch(`/api/vault/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadObj)
      });
    } else {
      await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadObj)
      });
    }

    // Since we changed how we encrypt (JSON payload), let's adjust fetchItems logic:
    // Wait, let's just call initKeyAndFetch.
    await initKeyAndFetch();
  };

  const handleDelete = async (id: string) => {
    if(confirm('¿Eliminar esta credencial?')) {
      await fetch(`/api/vault/${id}`, { method: 'DELETE' });
      await initKeyAndFetch();
    }
  }

  // Adjust fetchItems decrypt logic to handle JSON payload
  // Because in previous step I wrote fetchItems expecting separate fields.
  // I will fix it inside fetchItems in the same file.

  const isExpired = (lastModified: string) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(lastModified).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 90; // 3 meses
  };

  const filtered = decryptedItems.filter(item => 
    item.dec_title?.toLowerCase().includes(search.toLowerCase()) || 
    item.dec_username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Shield className={styles.icon} size={32} />
          <h1>Mi Bóveda</h1>
        </div>
        <button className={styles.logoutBtn} onClick={onLogout}><LogOut size={18}/> Salir</button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            placeholder="Buscar contraseñas..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <button 
          className={styles.addBtn}
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
        >
          <Plus size={18} /> Nueva
        </button>
      </div>

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.loading}>Descifrando bóveda...</div>
        ) : (
          <AnimatePresence>
            {filtered.map(item => (
              <motion.div 
                key={item.id} 
                className={styles.card}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className={styles.cardHeader}>
                  <h3>{item.dec_title}</h3>
                  <div className={styles.actions}>
                    <button onClick={() => {
                      setEditingItem({
                        id: item.id,
                        title: item.dec_title,
                        username: item.dec_username,
                        password: item.dec_password,
                        url: item.dec_url,
                        notes: item.dec_notes
                      });
                      setIsModalOpen(true);
                    }}>Editar</button>
                    <button className={styles.deleteText} onClick={() => handleDelete(item.id)}>X</button>
                  </div>
                </div>
                
                <p className={styles.username}>{item.dec_username}</p>
                
                {isExpired(item.lastModified) && (
                  <div className={styles.expiredAlert}>
                    <AlertTriangle size={14} /> Contraseña antigua (más de 3 meses). Se recomienda cambiarla.
                  </div>
                )}
              </motion.div>
            ))}
            {filtered.length === 0 && !loading && (
              <div className={styles.empty}>No hay credenciales.</div>
            )}
          </AnimatePresence>
        )}
      </div>

      {isModalOpen && (
        <PasswordModal 
          item={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
