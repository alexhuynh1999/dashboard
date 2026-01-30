import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    doc,
    updateDoc,
    deleteDoc,
    orderBy
} from 'firebase/firestore';

interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

const TodoList: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const q = query(collection(db, "todos"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const todosArr: Todo[] = [];
            querySnapshot.forEach((doc) => {
                todosArr.push({ id: doc.id, ...doc.data() } as Todo);
            });
            setTodos(todosArr);
        });
        return () => unsubscribe();
    }, []);

    const addTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        await addDoc(collection(db, "todos"), {
            text: inputValue,
            completed: false,
            createdAt: new Date()
        });
        setInputValue('');
    };

    const toggleTodo = async (id: string, completed: boolean) => {
        const todoRef = doc(db, "todos", id);
        await updateDoc(todoRef, {
            completed: !completed
        });
    };

    const removeTodo = async (id: string) => {
        await deleteDoc(doc(db, "todos", id));
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-card)',
            maxHeight: 'calc(100vh - 150px)',
            overflowY: 'auto'
        }}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.4rem' }}>Tasks</h2>

            <form onSubmit={addTodo} style={{ marginBottom: '1.5rem', display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Add a task..."
                    aria-label="New Task"
                />
                <button type="submit" style={{ flexShrink: 0 }}>+</button>
            </form>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {todos.length === 0 && (
                    <li style={{ color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                        No tasks yet.
                    </li>
                )}
                {todos.map((todo: Todo) => (
                    <li key={todo.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 0',
                        borderBottom: '1px solid var(--border-color)'
                    }}>
                        <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => toggleTodo(todo.id, todo.completed)}
                            style={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer',
                                accentColor: 'var(--color-primary)'
                            }}
                        />
                        <span style={{
                            flex: 1,
                            textDecoration: todo.completed ? 'line-through' : 'none',
                            color: todo.completed ? 'var(--text-muted)' : 'var(--text-main)',
                            transition: 'all 0.2s'
                        }}>
                            {todo.text}
                        </span>
                        <button
                            onClick={() => removeTodo(todo.id)}
                            style={{
                                padding: '4px 8px',
                                background: 'transparent',
                                boxShadow: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '1.2rem'
                            }}
                            title="Remove task"
                        >
                            ×
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TodoList;
