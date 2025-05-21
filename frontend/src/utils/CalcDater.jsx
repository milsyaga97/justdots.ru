export const CalcDater = (date) => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        return { daysDiff: 0, dayText: 'дней' };
    }

    const currentDate = new Date();
    const timeDiff = currentDate - parsedDate;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const dayText = daysDiff % 10 === 1 && daysDiff % 100 !== 11 ? 'день' :
        daysDiff % 10 >= 2 && daysDiff % 10 <= 4 && (daysDiff % 100 < 10 || daysDiff % 100 > 20) ? 'дня' : 'дней';
    return { daysDiff, dayText };
}