import { useState } from 'react';
import InputorWLabel from '../InputorWLabel';
import SimpleButton from '../SimpleButton.jsx';
import api from '../../services/api.jsx';
import { useNotification } from '../../context/Notifications.jsx';
import Loader from '../Loader.jsx';
import { useNavigate } from 'react-router-dom';

export const TaskCreator = () => {
    const [title, setTitle] = useState(null);
    const [description, setDescription] = useState(null);
    const [deadline, setDeadline] = useState(null);
    const [category, setCategory] = useState("Разработка");
    const [skill_level, setSkill] = useState("Менее года");
    const [budget_min, setMinBudget] = useState(null);
    const [budget_max, setMaxBudget] = useState(null);
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const [pricetype, setPriceType] = useState("fixed");
    const priceTypeChange = (event) => {
        setPriceType(event.target.value);
    }

    const categoryTypeChange = (event) => {
        setCategory(event.target.value);
        console.log(category);
    }

    const skillTypeChange = (event) => {
        setSkill(event.target.value);
        console.log(skill_level);
    }


    const addDays = (date, days) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        return newDate;
    }

    const deadlineFormatter = (event) => {
        const deadDays = parseInt(event.target.value, 10);
        const nowDate = new Date();
        const fin = addDays(nowDate, deadDays);
        setDeadline(fin);
    }

    const handleKeyDown = (event) => {
        if (!/^[0-9]$/.test(event.key) && event.key !== 'Backspace') {
            event.preventDefault();
        }
    };

    const notify = useNotification();
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await api.post("/tasks/create", { title, description, budget_min, budget_max, deadline, category, skill_level });
            notify({ message: "Задача успешно создана", type: "success", duration: 4200 });
        }
        catch (error) {
            setLoading(false);
            console.log(error);
            notify({ message: error.message, type: "error", duration: 4200 });
        }
        finally {
            setLoading(false);
            navigate("/mytasks");
        }
    }

    if (loading) {
        return <Loader></Loader>
    }
    return (
        <>
            <div className="hatsaver"></div>
            <div className="blocktitle">
                создание заказа
            </div>

            <div className="bodyblock">
                <div className='formbody-empty'>
                    <div className='propblock black taskprop'>
                        Обратите внимание: <br />
                        В описании заказа следует грамотно указать подробное объяснение задания
                        для исполнителя, иначе заказ может быть отклонен модерацией.
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label className='iblabel'>Категория:</label>
                            <select onChange={categoryTypeChange} className='propblock'>
                                <option value="Разработка">Разработка</option>
                                <option value="Дизайн">Дизайн</option>
                                <option value="Программирование">Программирование</option>
                                <option value="Копирайтинг">Копирайтинг</option>
                                <option value="Другое">Другое</option>
                            </select>
                        </div>
                        <InputorWLabel label="Название заказа" onChange={(e) => setTitle(e.target.value)} required></InputorWLabel>
                        <InputorWLabel label="Описание заказа" onChange={(e) => setDescription(e.target.value)} typea="textarea" required></InputorWLabel>
                        <InputorWLabel label="Срок выполнения (дни)" type='number' min="1" max="365" onKeyDown={handleKeyDown} onChange={deadlineFormatter} required></InputorWLabel>
                        <div>
                            <label className='iblabel'>Опыт работы:</label>
                            <select onChange={skillTypeChange} className='propblock'>
                                <option value="Менее года">Менее года</option>
                                <option value="От 1 до 3 лет">От 1 до 3 лет</option>
                                <option value="Более 3 лет">Более 3-х лет</option>
                            </select>
                        </div>
                        <div>
                            <div className="textblock">
                                <label className='iblabel'>Тип вознаграждения:</label>
                                <div className='role-selector'>
                                    <input
                                        className='roleradio'
                                        value="fixed"
                                        type="radio"
                                        id='rolebut1'
                                        name='roletoggle'
                                        onChange={priceTypeChange}
                                        defaultChecked
                                    />
                                    <label htmlFor='rolebut1' className='role-option'>Фиксированное</label>
                                    <div style={{ width: 2 + 'px', height: 38 + 'px', background: 'var(--variable-collection-border)' }}></div>
                                    <input
                                        className='roleradio'
                                        value="range"
                                        type="radio"
                                        id='rolebut2'
                                        name='roletoggle'
                                        onChange={priceTypeChange}
                                    />
                                    <label htmlFor='rolebut2' className='role-option'>Диапазон</label>
                                </div>
                            </div>
                        </div>
                        {pricetype == "fixed" ? (
                            <InputorWLabel label="Размер вознаграждения" type='number' min="10" max="999999" onKeyDown={handleKeyDown} onChange={(e) => { setMinBudget(parseInt(e.target.value, 10)); setMaxBudget(parseInt(e.target.value, 10)) }} required></InputorWLabel>
                        ) : (
                            <>
                                <InputorWLabel label="Размер вознаграждения от" type='number' min="10" max="999998" onKeyDown={handleKeyDown} onChange={(e) => setMinBudget(parseInt(e.target.value, 10))} required></InputorWLabel>
                                <InputorWLabel label="до" type='number' min={budget_min + 1} onKeyDown={handleKeyDown} onChange={(e) => setMaxBudget(parseInt(e.target.value, 10))} required></InputorWLabel>
                            </>
                        )}
                        <SimpleButton type="submit" icon="plus" style="black">Создать заказ</SimpleButton>
                    </form>
                </div >
            </div >
        </>
    )
}

export default TaskCreator