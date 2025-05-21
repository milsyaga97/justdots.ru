import React, { useState, useContext } from 'react';
import { useNotification } from '../context/Notifications.jsx';
import SimpleButton from '../components/SimpleButton.jsx';
import InputorWLabel from './InputorWLabel';
import { AuthContext } from '../context/AuthContext.jsx';
import { Navigate, useNavigate } from 'react-router-dom';
import Loader from './Loader.jsx';

const Register = () => {
    const [username, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [first_name, setFName] = useState('');
    const [last_name, setLName] = useState('');
    const [patronymic, setPatronymic] = useState('');
    const [password, setPassword] = useState('');
    const [password_confirm, setConPassword] = useState('');
    const [user_type, setUserType] = useState('');
    const [error, setError] = useState('');
    const { register, isAuthenticated, myuser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    const notify = useNotification();

    const handleChange = (event) => {
        setUserType(event.target.value);
    };

    let navigate = useNavigate()
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(username, first_name, last_name, patronymic, email, password, password_confirm, user_type);
            setLoading(true);
            navigate('/login');
            notify({ message: "Вы успешно зарегистрировались", type: "success", duration: 4200 });
        } catch (err) {
            console.log(err.response?.data?.detail[0]?.ctx?.reason || "");
            setError(err.response?.data?.detail[0]?.msg || err.response?.data?.detail[0].ctx?.reason || err.response?.data?.detail);
            notify({ message: error, type: "error", duration: 4200 });
        }
        finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader></Loader>
    }

    if (isAuthenticated) {
        return <Navigate to={"/profile/" + myuser.id} />
    }

    return (
        <>
            <div className='formbody'>
                <div className='formblock' >
                    <div className='formblock-title'>Регистрация</div>
                    <form onSubmit={handleSubmit}>
                        <InputorWLabel label="Логин" onChange={(e) => setUserName(e.target.value)} required />
                        <InputorWLabel label="E-Mail" onChange={(e) => setEmail(e.target.value)} type="email" required />
                        <InputorWLabel label="Имя" onChange={(e) => setFName(e.target.value)} required />
                        <InputorWLabel label="Фамилия" onChange={(e) => setLName(e.target.value)} required />
                        <InputorWLabel label="Отчество (при наличии)" onChange={(e) => setPatronymic(e.target.value)} />
                        <InputorWLabel label="Пароль" onChange={(e) => setPassword(e.target.value)} type="password" required />
                        <InputorWLabel label="Повторите пароль" onChange={(e) => setConPassword(e.target.value)} type="password" required />
                        <div>
                            <label className='iblabel'>Выберите тип аккаунта:</label>
                            <div className='role-selector'>
                                <input
                                    className='roleradio'
                                    value="freelancer"
                                    type="radio"
                                    id='rolebut1'
                                    name='roletoggle'
                                    onChange={handleChange}
                                />
                                <label htmlFor='rolebut1' className='role-option'>Исполнитель</label>
                                <div style={{ width: 2 + 'px', height: 38 + 'px', background: 'var(--variable-collection-border)' }}></div>
                                <input
                                    className='roleradio'
                                    value="customer"
                                    type="radio"
                                    id='rolebut2'
                                    name='roletoggle'
                                    onChange={handleChange}
                                />
                                <label htmlFor='rolebut2' className='role-option'>Заказчик</label>
                            </div>
                        </div>
                        <div>
                            <input type="checkbox" id='policy-checkbox' required />
                            <label htmlFor="policy-checkbox">
                                Чекбокс 1
                            </label>
                        </div>
                        <div>
                            <input type="checkbox" id='policy-checkbox' required />
                            <label htmlFor="policy-checkbox">
                                Чекбокс 2
                            </label>
                        </div>
                        <SimpleButton style="black" type="submit">Зарегистрироваться</SimpleButton>
                    </form >
                </div >
            </div>
        </>
    );
};

export default Register;