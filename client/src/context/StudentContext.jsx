import { useState, useCallback, useEffect, useMemo } from 'react';
import { initialStudents } from '../data/students';
import {
  calculateLevel,
  buildSessions,
  defaultActiveSession,
  parseSessionStartYear,
} from '../utils/students';
import { StudentContext } from './StudentContext';

const STUDENTS_KEY = 'absu_students';
const SESSIONS_KEY = 'absu_academic_sessions';
const ACTIVE_SESSION_KEY = 'absu_active_session';

const loadJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const storageWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable — keep state in memory only.
  }
};

const normalizeMatric = (matric) => String(matric || '').trim().toUpperCase();

const buildRecord = (data) => ({
  id: `stu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: String(data.name || '').trim(),
  matric: normalizeMatric(data.matric),
  faculty: data.faculty || '',
  department: data.department || '',
  createdAt: new Date().toISOString().slice(0, 10),
});

export const StudentProvider = ({ children }) => {
  const [students, setStudents] = useState(() => {
    const saved = loadJSON(STUDENTS_KEY, null);
    return Array.isArray(saved) ? saved : initialStudents;
  });

  const [sessions, setSessions] = useState(() => {
    const saved = loadJSON(SESSIONS_KEY, null);
    const base = Array.isArray(saved) && saved.length ? saved : buildSessions(new Date().getFullYear());
    const auto = buildSessions(new Date().getFullYear());
    const merged = [];
    const seen = new Set(base.map((s) => s.label));
    auto.forEach((s) => {
      if (!seen.has(s.label)) merged.push({ ...s, id: `sess-${s.startYear}-auto` });
    });
    if (!merged.length) return base;
    return [...base, ...merged].sort((a, b) => a.startYear - b.startYear);
  });

  const [activeSession, setActiveSession] = useState(() => {
    const saved = loadJSON(ACTIVE_SESSION_KEY, null);
    if (saved) return saved;
    const computed = defaultActiveSession();
    const exists = sessions.some((s) => s.label === computed);
    return exists ? computed : sessions[sessions.length - 1]?.label || computed;
  });

  useEffect(() => {
    storageWrite(STUDENTS_KEY, students);
  }, [students]);

  useEffect(() => {
    storageWrite(SESSIONS_KEY, sessions);
  }, [sessions]);

  useEffect(() => {
    storageWrite(ACTIVE_SESSION_KEY, activeSession);
  }, [activeSession]);

  const activeSessionRecord = useMemo(
    () => sessions.find((s) => s.label === activeSession) || null,
    [sessions, activeSession]
  );

  const getLevelForMatric = useCallback(
    (matric, session = activeSession) => calculateLevel(matric, session),
    [activeSession]
  );

  const getStudentLevel = useCallback(
    (student) => calculateLevel(student.matric, activeSession),
    [activeSession]
  );

  const addStudent = useCallback(
    (data) => {
      const record = buildRecord(data);
      setStudents((prev) => [...prev, record]);
      return record;
    },
    []
  );

  const addStudents = useCallback(
    (records) => {
      const added = [];
      setStudents((prev) => {
        const existing = new Set(prev.map((student) => normalizeMatric(student.matric)));
        records.forEach((data) => {
          const matric = normalizeMatric(data.matric);
          if (!matric || existing.has(matric)) return;
          const record = buildRecord(data);
          existing.add(matric);
          added.push(record);
        });
        return [...prev, ...added];
      });
      return added;
    },
    []
  );

  const updateStudent = useCallback((id, data) => {
    let updated = null;
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== id) return student;
        updated = {
          ...student,
          name: String(data.name || '').trim(),
          matric: normalizeMatric(data.matric),
          faculty: data.faculty || '',
          department: data.department || '',
        };
        return updated;
      })
    );
    return updated;
  }, []);

  const deleteStudent = useCallback((id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const isMatricTaken = useCallback(
    (matric, excludeId) => {
      const cleaned = normalizeMatric(matric);
      return students.some((s) => s.matric === cleaned && s.id !== excludeId);
    },
    [students]
  );

  const setActiveSessionByLabel = useCallback((label) => {
    setActiveSession(label);
  }, []);

  const addSession = useCallback(
    (label) => {
      const clean = String(label || '').trim();
      const startYear = parseSessionStartYear(clean);
      if (!startYear || sessions.some((s) => s.label === clean)) return null;
      const record = {
        id: `sess-${startYear}-${Date.now()}`,
        label: clean,
        startYear,
        status: 'upcoming',
      };
      setSessions((prev) => [...prev, record].sort((a, b) => a.startYear - b.startYear));
      return record;
    },
    [sessions]
  );

  const removeSession = useCallback(
    (id) => {
      const target = sessions.find((s) => s.id === id);
      if (!target) return;
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSession === target.label) {
        const remaining = sessions.filter((s) => s.id !== id);
        setActiveSession(remaining[remaining.length - 1]?.label || defaultActiveSession());
      }
    },
    [sessions, activeSession]
  );

  const value = useMemo(
    () => ({
      students,
      sessions,
      activeSession,
      activeSessionRecord,
      addStudent,
      addStudents,
      updateStudent,
      deleteStudent,
      isMatricTaken,
      setActiveSessionByLabel,
      addSession,
      removeSession,
      getLevelForMatric,
      getStudentLevel,
    }),
    [
      students,
      sessions,
      activeSession,
      activeSessionRecord,
      addStudent,
      addStudents,
      updateStudent,
      deleteStudent,
      isMatricTaken,
      setActiveSessionByLabel,
      addSession,
      removeSession,
      getLevelForMatric,
      getStudentLevel,
    ]
  );

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
};