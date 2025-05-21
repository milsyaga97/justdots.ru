import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../context/Notifications.jsx';
import { Navigate } from 'react-router-dom';
import SimpleButton from '../components/SimpleButton.jsx';
import InputorWLabel from './InputorWLabel';
import Loader from './Loader.jsx';

const Login = () => {
    const [username, setFfield] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login, isAuthenticated, myuser } = useContext(AuthContext);

    const notify = useNotification();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await login(username, password);
            setError(null);
            notify({ message: "Вы успешно авторизировались", type: "success", duration: 4200 })
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.detail[0]?.msg || err.response?.data?.detail[0].ctx?.reason || err.response?.data?.detail || err.message);
            notify({ message: error, type: "error", duration: 4200 });
        }
        finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader></Loader>
    }

    if (isAuthenticated && myuser.user_type === "moderator") {
        return <Navigate to={"/moderate"}/>
    }else if(isAuthenticated){
        return <Navigate to={"/profile/" + myuser.id} />
    }

    return (
        <>
        <div className="formbody">
            <div className='formblock' >
                <div className='formblock-title'>
                    Вход в аккаунт
                </div>
                <form onSubmit={handleSubmit}>
                    <InputorWLabel label="Логин или почта" onChange={(e) => setFfield(e.target.value)} type="login" required />
                    <InputorWLabel label="Пароль" onChange={(e) => setPassword(e.target.value)} type="password" required />
                    <SimpleButton style="accent" type="submit">Войти</SimpleButton>
                </form>
            </div >
        </div>
        </>
    );
};

export default Login;