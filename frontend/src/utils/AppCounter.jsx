import api from "../services/api.jsx";

export async function getAppCounter(taskid) {
    if (!taskid) return 0;
    try {
        const response = await api.get(`/tasks/applications?task_id=${taskid}`);
        const filtered = response.data.filter(item => item.status === "На рассмотрении");
        return filtered.length;
    } catch (error) {
        console.error('Ошибка при получении количества заявок:', error);
        return 0;
    }
}

