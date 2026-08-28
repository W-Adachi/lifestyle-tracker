"use client";

import { FC } from "react";
import styles from "./TimePicker.module.css";

interface TimePickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    id?: string;
    }

    export const TimePicker: FC<TimePickerProps> = ({ label, value, onChange, id }) => {
    const handleSetCurrentTime = () => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        onChange(`${hours}:${minutes}`);
    };

    return (
        <div className={styles.container}>
        <div className={styles.header}>
            <label htmlFor={id} className={styles.label}>
            {label}
            </label>
            <button type="button" onClick={handleSetCurrentTime} className={styles.button}>
            現在時刻
            </button>
        </div>
        <input
            type="time"
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={styles.input}
        />
        </div>
    );
};