import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    doc,
    deleteDoc,
    Timestamp,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Sun, Moon, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
    id: string;
    title: string;
    time: string;
    start: Date;
    end: Date;
}

// Helper to convert Firestore Timestamp to Date
const toDate = (val: any): Date => {
    if (val instanceof Timestamp) return val.toDate();
    return new Date(val);
};

// Helper function to convert 24-hour time to 12-hour AM/PM format
const formatTime12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Helper function to sort events by time
const sortEventsByTime = (events: Event[]): Event[] => {
    return [...events].sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
    });
};

const KanbanBoard: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventTime, setNewEventTime] = useState('');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    const [modalWeekOffset, setModalWeekOffset] = useState(0);
    const [boardWindowStart, setBoardWindowStart] = useState(0);

    const today = new Date();

    // Board Active Range: +/- 7 days from today
    const boardActiveRange = Array.from({ length: 15 }, (_, i) => addDays(today, i - 7));
    const activeDays = boardActiveRange.filter(day =>
        events.some(e => isSameDay(e.start, day)) || isSameDay(day, today)
    );

    // Visible days on board (up to 7)
    const visibleBoardDays = activeDays.slice(boardWindowStart, boardWindowStart + 7);

    // Modal week generation based on offset
    const modalStartDate = addDays(startOfWeek(today, { weekStartsOn: 0 }), modalWeekOffset * 7);
    const modalWeekDays = Array.from({ length: 7 }, (_, i) => addDays(modalStartDate, i));

    useEffect(() => {
        const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const eventsArr: Event[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                eventsArr.push({
                    id: doc.id,
                    title: data.title,
                    time: data.time,
                    start: toDate(data.start),
                    end: toDate(data.end)
                });
            });
            setEvents(eventsArr);
        }, (error) => {
            console.error("Firestore error:", error);
            if (error.code === 'permission-denied') {
                console.warn("Please check your Firestore Rules in the Firebase Console (Settings > Rules). Set them to 'allow read, write: if true;' for personal projects.");
            }
        });
        return () => unsubscribe();
    }, []);

    // Listen for theme changes
    useEffect(() => {
        const checkTheme = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            setTheme(currentTheme);
        };

        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => observer.disconnect();
    }, []);

    const handleColumnClick = (date: Date) => {
        setSelectedDate(date);
        setNewEventTime('09:00');
        setIsModalOpen(true);
    };

    const handleAddEventClick = () => {
        setSelectedDate(today);
        setModalWeekOffset(0);
        setNewEventTime('09:00');
        setIsModalOpen(true);
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedDate && newEventTitle) {
            const eventStart = new Date(selectedDate);
            const eventEnd = new Date(selectedDate);

            await addDoc(collection(db, "events"), {
                title: newEventTitle,
                time: newEventTime,
                start: Timestamp.fromDate(eventStart),
                end: Timestamp.fromDate(eventEnd),
                createdAt: serverTimestamp()
            });
            closeModal();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
        setModalWeekOffset(0);
        setNewEventTitle('');
        setNewEventTime('');
    };

    const removeEvent = async (id: string) => {
        await deleteDoc(doc(db, "events", id));
    };

    // Color classes for variety
    const getEventColorClass = (index: number) => {
        return `event-card-${index % 5}`;
    };

    // Pastel colors for each day (light mode only)
    const getPastelBackground = (day: Date) => {
        if (theme === 'dark') return 'rgba(0,0,0,0.02)';

        const pastelColors = [
            '#d6ffd7', // Pastel Green
            '#d6e9ff', // Pastel Blue
            '#e6d6ff', // Pastel Purple
            '#fff9c4', // Pastel Yellow
            '#ffedcc', // Pastel Orange
            '#ffd6e7', // Pastel Pink
            '#e0f7fa'  // Pastel Cyan
        ];

        // Use getDay() to map color to day of week (0-6)
        return pastelColors[day.getDay()];
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '1200px',
            position: 'relative'
        }}>
            {/* Board Navigation Arrows */}
            {activeDays.length > 7 && (
                <>
                    {boardWindowStart > 0 && (
                        <button
                            onClick={() => setBoardWindowStart(prev => prev - 1)}
                            style={{
                                position: 'absolute',
                                left: '-20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'var(--bg-card)',
                                border: '2px solid var(--color-primary)',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--color-primary)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 10,
                                padding: 0,
                                WebkitBackdropFilter: 'blur(4px)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                                e.currentTarget.style.background = 'var(--color-primary)';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                e.currentTarget.style.background = 'var(--bg-card)';
                                e.currentTarget.style.color = 'var(--color-primary)';
                            }}
                        >
                            <ChevronLeft size={24} strokeWidth={3} />
                        </button>
                    )}
                    {boardWindowStart + 7 < activeDays.length && (
                        <button
                            onClick={() => setBoardWindowStart(prev => prev + 1)}
                            style={{
                                position: 'absolute',
                                right: '-20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'var(--bg-card)',
                                border: '2px solid var(--color-primary)',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--color-primary)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 10,
                                padding: 0,
                                WebkitBackdropFilter: 'blur(4px)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                                e.currentTarget.style.background = 'var(--color-primary)';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                e.currentTarget.style.background = 'var(--bg-card)';
                                e.currentTarget.style.color = 'var(--color-primary)';
                            }}
                        >
                            <ChevronRight size={24} strokeWidth={3} />
                        </button>
                    )}
                </>
            )}
            {/* Floating Add Button */}
            <button
                onClick={handleAddEventClick}
                style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '20px',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(100, 108, 255, 0.4)',
                    zIndex: 10,
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="Add new event"
            >
                <Plus size={24} />
            </button>

            <div style={{
                display: visibleBoardDays.length === 0 ? 'flex' : 'grid',
                gridTemplateColumns: visibleBoardDays.length > 0
                    ? `repeat(${Math.min(visibleBoardDays.length, 7)}, 1fr)`
                    : undefined,
                gap: '12px',
                padding: '24px',
                background: 'var(--bg-card)',
                borderRadius: '24px',
                boxShadow: 'var(--shadow-card)',
                minHeight: '500px',
                alignItems: visibleBoardDays.length === 0 ? 'center' : undefined,
                justifyContent: visibleBoardDays.length === 0 ? 'center' : undefined
            }}>
                {visibleBoardDays.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        padding: '2rem'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📅</div>
                        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No events this week</div>
                        <div style={{ fontSize: '0.9rem' }}>Click the + button to add your first event</div>
                    </div>
                ) : (
                    visibleBoardDays.map((day) => {
                        const dayEvents = events.filter(e => isSameDay(e.start, day));
                        const sortedEvents = sortEventsByTime(dayEvents);
                        const isToday = isSameDay(day, today);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => handleColumnClick(day)}
                                style={{
                                    borderRadius: '16px',
                                    border: '1px solid transparent',
                                    padding: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    position: 'relative',
                                    backgroundColor: getPastelBackground(day)
                                }}
                                className="kanban-column"
                            >
                                <div style={{
                                    textAlign: 'center',
                                    marginBottom: '1rem',
                                    paddingBottom: '8px',
                                    position: 'relative'
                                }}>
                                    {isToday && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-20px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            color: theme === 'light' ? '#fbbf24' : 'var(--color-primary)'
                                        }}>
                                            {theme === 'light' ? (
                                                <Sun size={20} fill="currentColor" />
                                            ) : (
                                                <Moon size={20} fill="currentColor" />
                                            )}
                                        </div>
                                    )}
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{format(day, 'EEEE')}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{format(day, 'MMM d')}</div>
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {sortedEvents.length > 0 ? (
                                        sortedEvents.map((event, index) => (
                                            <div
                                                key={event.id}
                                                className={getEventColorClass(index)}
                                                style={{
                                                    background: theme === 'dark' ? '#252540' : 'var(--bg-body)',
                                                    padding: '8px 10px',
                                                    borderRadius: '8px',
                                                    boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                                                    fontSize: '0.9rem',
                                                    position: 'relative',
                                                    borderLeft: '3px solid var(--color-primary)'
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div style={{ fontWeight: 500, paddingRight: '20px' }}>{event.title}</div>
                                                {event.time && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        {formatTime12Hour(event.time)}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeEvent(event.id);
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '4px',
                                                        right: '4px',
                                                        background: 'transparent',
                                                        padding: '4px',
                                                        width: '20px',
                                                        height: '20px',
                                                        minWidth: 'unset',
                                                        border: 'none',
                                                        color: 'var(--text-muted)',
                                                        boxShadow: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        borderRadius: '4px'
                                                    }}
                                                    aria-label="Delete event"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{
                                            textAlign: 'center',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.85rem',
                                            fontStyle: 'italic',
                                            padding: '1rem 0'
                                        }}>
                                            Nothing planned for today.
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(5px)'
                }} onClick={closeModal}>
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '2rem',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '400px',
                        boxShadow: 'var(--shadow-card)'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>Add Event</h3>
                        <form onSubmit={handleAddEvent}>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.9rem' }}>Select Day</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setModalWeekOffset(prev => prev - 1)}
                                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', boxShadow: 'none' }}
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setModalWeekOffset(prev => prev + 1)}
                                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', boxShadow: 'none' }}
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(7, 1fr)',
                                    gap: '6px'
                                }}>
                                    {modalWeekDays.map(day => {
                                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                                        const isToday = isSameDay(day, today);
                                        return (
                                            <button
                                                key={day.toString()}
                                                type="button"
                                                onClick={() => setSelectedDate(day)}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                                                    background: isSelected ? 'var(--color-primary)' : 'var(--bg-card)',
                                                    color: isSelected ? '#fff' : 'var(--text-main)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '2px',
                                                    boxShadow: isSelected ? '0 2px 8px rgba(100, 108, 255, 0.3)' : 'none',
                                                    transition: 'all 0.2s ease',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div style={{ fontWeight: 600 }}>{format(day, 'EEE')}</div>
                                                <div style={{ fontSize: '0.85rem' }}>{format(day, 'd')}</div>
                                                {isToday && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '2px',
                                                        right: '2px',
                                                        width: '4px',
                                                        height: '4px',
                                                        borderRadius: '50%',
                                                        background: isSelected ? '#fff' : 'var(--color-primary)'
                                                    }} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Event Name</label>
                                <input
                                    type="text"
                                    value={newEventTitle}
                                    onChange={e => setNewEventTitle(e.target.value)}
                                    placeholder="Meeting, Workout, etc."
                                    autoFocus
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Time</label>
                                <input
                                    type="time"
                                    value={newEventTime}
                                    onChange={e => setNewEventTime(e.target.value)}
                                    style={{
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-main)',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={closeModal} style={{ background: 'transparent', boxShadow: 'none' }}>Cancel</button>
                                <button type="submit" style={{ background: 'var(--color-primary)', color: '#fff' }}>Add Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KanbanBoard;
