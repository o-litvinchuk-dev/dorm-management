import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { useCommandPalette } from '../../../contexts/CommandPaletteContext';
import styles from './CommandPalette.module.css';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  HomeIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useUser } from '../../../contexts/UserContext';

function CommandPalette() {
  const { isOpen, setIsOpen } = useCommandPalette();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();
  const { logout, user } = useUser();

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (search.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const debounce = setTimeout(() => {
      api.get(`/search?q=${search}`)
        .then(res => setResults(res.data))
        .catch(err => console.error("Search failed", err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(debounce);
  }, [search]);

  const runCommand = (command) => {
    command();
    setIsOpen(false);
  };

  const hasSearchResults = results && (results.users?.length > 0 || results.dormitories?.length > 0 || results.faculties?.length > 0);
  
  const canSearchUsers = user && ['admin', 'superadmin', 'faculty_dean_office', 'dorm_manager'].includes(user.role);

  return (
    <Command.Dialog open={isOpen} onOpenChange={setIsOpen} label="Глобальний пошук" className={styles.commandDialog}>
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder="Шукайте сторінки, користувачів, гуртожитки..."
        className={styles.commandInput}
      />
      <Command.List className={styles.commandList}>
        <Command.Empty className={styles.commandEmpty}>Нічого не знайдено.</Command.Empty>

        {loading && <div className={styles.commandLoading}>Пошук...</div>}

        {!search && (
          <Command.Group heading="Навігація" className={styles.commandGroup}>
            <Command.Item onSelect={() => runCommand(() => navigate('/dashboard'))} className={styles.commandItem}>
              <HomeIcon /> Головна
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate('/profile'))} className={styles.commandItem}>
              <UserCircleIcon /> Мій профіль
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate('/services'))} className={styles.commandItem}>
              <ClipboardDocumentCheckIcon /> Центр послуг
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate('/settings'))} className={styles.commandItem}>
              <Cog6ToothIcon /> Налаштування
            </Command.Item>
          </Command.Group>
        )}
        
        {hasSearchResults && canSearchUsers && results.users.length > 0 && (
          <Command.Group heading="Користувачі" className={styles.commandGroup}>
            {results.users.map((user) => (
              <Command.Item key={`user-${user.id}`} onSelect={() => runCommand(() => navigate(`/public-profile/${user.id}`))} className={styles.commandItem}>
                <UserCircleIcon />
                <div>
                  <p>{user.name}</p>
                  <span>{user.email}</span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {hasSearchResults && results.dormitories.length > 0 && (
           <Command.Group heading="Гуртожитки" className={styles.commandGroup}>
            {results.dormitories.map((dorm) => (
              <Command.Item key={`dorm-${dorm.id}`} onSelect={() => runCommand(() => navigate(`/dormitories`))} className={styles.commandItem}>
                <BuildingOffice2Icon />
                <div>
                    <p>{dorm.name}</p>
                    <span>{dorm.address}</span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>
        )}

         {hasSearchResults && results.faculties.length > 0 && (
           <Command.Group heading="Факультети" className={styles.commandGroup}>
            {results.faculties.map((faculty) => (
              <Command.Item key={`faculty-${faculty.id}`} onSelect={() => runCommand(() => navigate(`/dean/groups`))} className={styles.commandItem}>
                <AcademicCapIcon /> {faculty.name}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading="Дії" className={styles.commandGroup}>
          <Command.Item onSelect={() => runCommand(logout)} className={styles.commandItem}>
            <ArrowLeftOnRectangleIcon /> Вийти
          </Command.Item>
        </Command.Group>

      </Command.List>
    </Command.Dialog>
  );
}

export default CommandPalette;