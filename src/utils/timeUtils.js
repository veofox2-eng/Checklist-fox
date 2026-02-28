export const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;

    // Parse HH:MM:SS relative to a fixed date
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);

    // Fallback if formatting is wrong
    if (startParts.length !== 3 || endParts.length !== 3) return 0;

    const startSecs = (startParts[0] * 3600) + (startParts[1] * 60) + startParts[2];
    const endSecs = (endParts[0] * 3600) + (endParts[1] * 60) + endParts[2];

    let durationSecs = endSecs - startSecs;

    // Handle overnight (cross-midnight) durations
    if (durationSecs < 0) {
        durationSecs += 86400; // 24 hours in seconds
    }

    // Minimum 10 seconds requirement
    if (durationSecs > 0 && durationSecs < 10) {
        return 10;
    }

    return Math.max(0, durationSecs);
};

export const calculateUnionDuration = (tasks) => {
    let intervals = [];

    tasks.forEach(task => {
        if (!task.start_time || !task.end_time) return;

        const startParts = task.start_time.split(':').map(Number);
        const endParts = task.end_time.split(':').map(Number);

        if (startParts.length !== 3 || endParts.length !== 3) return;

        const startSecs = (startParts[0] * 3600) + (startParts[1] * 60) + startParts[2];
        let endSecs = (endParts[0] * 3600) + (endParts[1] * 60) + endParts[2];

        if (endSecs === startSecs) {
            endSecs = startSecs + 10;
        }

        if (endSecs < startSecs) {
            intervals.push([startSecs, 86400]);
            intervals.push([0, endSecs]);
        } else {
            intervals.push([startSecs, endSecs]);
        }
    });

    if (intervals.length === 0) return 0;

    // Merge overlapping intervals
    intervals.sort((a, b) => a[0] - b[0]);

    const merged = [intervals[0]];

    for (let i = 1; i < intervals.length; i++) {
        const current = intervals[i];
        const lastMerged = merged[merged.length - 1];

        if (current[0] <= lastMerged[1]) {
            lastMerged[1] = Math.max(lastMerged[1], current[1]);
        } else {
            merged.push(current);
        }
    }

    // Sum merged intervals
    const totalSeconds = merged.reduce((sum, interval) => sum + (interval[1] - interval[0]), 0);
    return Math.max(0, totalSeconds);
};

export const formatDuration = (totalSeconds) => {
    if (totalSeconds === 0) return '00:00:00';

    const days = Math.floor(totalSeconds / 86400);
    const remainingAfterDays = totalSeconds % 86400;

    const hours = Math.floor(remainingAfterDays / 3600);
    const remainingAfterHours = remainingAfterDays % 3600;

    const minutes = Math.floor(remainingAfterHours / 60);
    const seconds = remainingAfterHours % 60;

    const formatTime = (time) => time.toString().padStart(2, '0');

    if (days > 0) {
        return `${days} Day${days > 1 ? 's' : ''}, ${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
    }

    return `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
};

export const getCurrentTimeFormatted = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
};
