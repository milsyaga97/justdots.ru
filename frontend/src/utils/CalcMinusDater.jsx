export const CalcMinusDater = (date) => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        return { daysDiff: 0, dayText: 'дней' };
    }
    let status = null;
    const currentDate = new Date();
    const timeDiff = (parsedDate - currentDate);
    let daysDiff = (Math.floor(timeDiff / (1000 * 60 * 60 * 24)))+1;
    let dayText = null;
    let diffresult = null;

    if (daysDiff < 0) {
        status = false;
        diffresult = `Просрочено на ${Math.abs(daysDiff)}`;
        daysDiff = Math.abs(daysDiff);
        dayText = `${daysDiff % 10 === 1 && daysDiff % 100 !== 11 ? 'день' :
            daysDiff % 10 >= 2 && daysDiff % 10 <= 4 && (daysDiff % 100 < 10 || daysDiff % 100 > 20) ? 'дня' : 'дней'}`
    }
    else {
        status = true;
        diffresult = Math.abs(daysDiff);
        dayText = daysDiff % 10 === 1 && daysDiff % 100 !== 11 ? 'день' :
            daysDiff % 10 >= 2 && daysDiff % 10 <= 4 && (daysDiff % 100 < 10 || daysDiff % 100 > 20) ? 'дня' : 'дней';
    }


    return { diffresult, dayText, status };
}