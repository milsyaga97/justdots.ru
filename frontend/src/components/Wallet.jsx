import React, {useContext, useState} from 'react';
import {AuthContext} from "../context/AuthContext.jsx";
import Icon from "./other/Icon.jsx";
import Inputor from "./Inputor.jsx";
import SimpleButton from "./SimpleButton.jsx";
import {useNotification} from "../context/Notifications.jsx";
import api from "../services/api.jsx";

const Wallet = () => {
    const [fakeAmount, setFakeAmount] = useState(100);
    const {myuser} = useContext(AuthContext);
    const notify = useNotification();
    const paid = async () => {
        if(fakeAmount < 100){
            notify({message: "Сумма пополнения должна быть больше 100 рублей", type: 'info', duration: 4200});
            return(null);
        }
        try{
            api.post(`/auth/balance/add/`, {fakeAmount});
            notify({message: `Вы пополнили баланс на ${fakeAmount} рублей`, type: 'success', duration: 4200});
        }
        catch(error){
            console.error(error);
        }
        finally {
            setFakeAmount(0);
        }
    }
    return (
        <>
            <div className="hatsaver"></div>
            <div className="blocktitle">кошелёк</div>
            <div className="bodyblock gap20">
                <div className='bfxcol gap5'>
                    <div className="titleblock">
                        На балансе: {myuser.balance} рублей
                    </div>
                    <div className="simplepropblock">
                        {myuser.user_type == "freelancer" ? (
                            `Всего заработано на justdots.ru: ${myuser.profile.total_earned} рублей`
                            ) : `Всего выплачено фрилансерам: ${myuser.profile.total_spent} рублей`}
                    </div>
                </div>
                <div className="bfxcol gap5">
                    <div className="titleblock">Вывод средств:</div>
                    <span style={{color: 'orange', fontWeight: 800}}>На данный момент к сайту не подключена платежная система</span>
                </div>
                {myuser.user_type == "customer" && (
                    <div className='bfxcol gap5'>
                        <div className="titleblock">Фейк-пополнение баланса:</div>
                        <div className="textblock">
                            <div className="bfxrow gap10">
                                <Inputor type='number' value={fakeAmount} placeholder='Сумма' onChange={(e) => setFakeAmount(Number(e.target.value))}></Inputor>
                                <SimpleButton icon='wallet' onClick={paid}>Пополнить</SimpleButton>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Wallet;