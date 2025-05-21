import {useContext, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SimpleButton from './SimpleButton';
import LogoContainer from './LogoContainer';
import SimpleHatButton from './SimpleHatButton';
import { SERVER_URL } from '../pathconfig.js';

const Navbar = ({themeSwitcher, isDark}) => {
    const navigate = useNavigate();
    const { myuser, isAuthenticated, logout } = useContext(AuthContext);
    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const[darken, setDarken] = useState(false);
    const handleSwitch = () => {
        setDarken(prev => !prev);
        themeSwitcher();
    }

    return (
        <>
            <div className="hat">
                <div className="hat-container">
                    <LogoContainer size="littl" />
                    <nav className='hat-interactive-menu'>
                        {!isAuthenticated ?(
                            <>  {/* ШАПКА ПРИ АНОНИМЕ */}
                                <Link style={{ textDecoration: 'none' }} to="/login">
                                    <SimpleButton style={"white"} icon="right-to-bracket">Вход</SimpleButton>
                                </Link>
                                <Link style={{ textDecoration: 'none' }} to="/register">
                                    <SimpleButton style={"black"}>Регистрация</SimpleButton>
                                </Link>
                            </>
                        ) : isAuthenticated && myuser.user_type !== "moderator" ?(
                            <>  {/* ШАПКА ПРИ АВТОРИЗАЦИИ */}
                                <div className='hat-interactive-menu-act'>
                                    {myuser.user_type == "freelancer" ? (
                                        <>
                                            <Link style={{textDecoration: "none"}} to="/orders">
                                                <SimpleButton icon="search">Лента заказов</SimpleButton>
                                            </Link>
                                            <Link style={{textDecoration: "none"}} to="/myapps">
                                                <SimpleButton style="black" icon="quote-right"></SimpleButton>
                                            </Link>
                                        </>
                                    ) : (
                                        <Link style={{textDecoration: "none"}} to="/create">
                                            <SimpleButton style="black" icon="plus">Создать заказ</SimpleButton>
                                        </Link>
                                    )}
                                </div>
                                <Link style={{textDecoration: "none"}} to={"/mytasks"}>
                                    <SimpleButton icon="bars" title="Мои заказы">Мои заказы</SimpleButton>
                                </Link>
                                <Link style={{ textDecoration: 'none' }} to={"/profile/" + myuser.id} title='Мой профиль'>
                                    <div tabIndex={0} className='ellipse-profile miniep'>
                                        <img src={myuser.profile?.avatar_url ? `${SERVER_URL + myuser.profile?.avatar_url}` : null} />
                                    </div>
                                </Link>
                                <SimpleButton icon={isDark ? "sun" : "moon"} onClick={themeSwitcher}></SimpleButton>
                                <SimpleHatButton style="black" icon="power-off" title="Выйти из аккаунта" onClick={handleLogout}></SimpleHatButton>
                            </>
                        ) : (
                            <>
                                <div className="hat-interactive-menu-act">
                                    <div className="moderator-hat-title">
                                        moderator
                                    </div>
                                    <Link style={{textDecoration: "none"}} to="/moderate">
                                        <SimpleButton icon="search" style="accent">Модерация заказов</SimpleButton>
                                    </Link>
                                </div>
                                <span style={{color: "var(--variable-collection-black)"}}>{myuser.username}</span>
                                <SimpleButton icon={isDark ? "sun" : "moon"} onClick={themeSwitcher}></SimpleButton>
                                <SimpleHatButton style="black" icon="power-off" title="Выйти из аккаунта" onClick={handleLogout}></SimpleHatButton>
                            </>
                    )}
                    </nav>
                </div>
            </div >
        </>
    );
};

export default Navbar;