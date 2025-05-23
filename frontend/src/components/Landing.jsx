import React from 'react';
import SimpleButton from "./SimpleButton.jsx";
import {useNavigate} from "react-router-dom";

const Landing = () => {
    const navigate = useNavigate();
    return (
        <>
            <div className='landing'>
                <div className="hatsaver land"></div>
                <div className='landingbox'>
                    <div className='landingcontainer'>
                        <div className='landingsider-fwsvg'>
                            <div className='landsquare'>

                            </div>
                        </div>
                        <div className="landingsider">
                            <div className='landingtitle'>
                                <span style={{fontSize: 4 + "vw"}}>justdots</span>
                                <span>с нами фрилансить просто.</span>
                            </div>
                            <div className='landingsemititle'>
                                <span>
                                    Ищете исполнителя для проекта или хотите найти выгодные заказы?<br/>
                                    <b>justdots</b> создан для того, чтобы сделать сотрудничество<br/> <b>простым</b>, <b>быстрым</b> и <b>безопасным</b>.
                                </span>
                            </div>
                            <div className='landingtrimititle'>
                                justdots - это биржа фриланса, позволяющая пользователям создавать и выполнять заказы по схеме заказчик - исполнитель. Наша платформа обладает интуитивно понятным интерфейсом и удобной системой подбора исполнителя. Основана в 2030 году.
                            </div>
                            <div className='landingbuttoncontainer'>
                                <span>Вы ещё не с нами?</span>
                                <div className='landbut'>
                                    Присоединяйтесь.
                                    <SimpleButton style='black' onClick={() => navigate(`/register`)}>Зарегистрироваться</SimpleButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Landing;