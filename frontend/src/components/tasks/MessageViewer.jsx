import React, {useEffect, useState} from 'react';
import api from "../../services/api.jsx";
import {useNotification} from "../../context/Notifications.jsx";
import Message from "../chat/message.jsx";
import SimpleButton from "../SimpleButton.jsx";

const MessageViewer = ({task}) => {
    const [myMessage, setMyMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const notify = useNotification();

    const handleSubmitMessage = async (e) => {
        e.preventDefault();
        if(!myMessage) return;
        try{
            const msg = {
                "message": myMessage
            }
            const response = await api.post(`/chat/${task.id}/send`, msg);
            setMessages(prev =>[...prev, response.data]);
        }
        catch (error){
            console.error(error);
            notify({message: "Произошла ошибка при отправке сообщения", type: "error", duration: 4200});
        }
        finally {
            setMyMessage('');
        }
    }

    const getMessages = async () => {
        try {
            const response = await api.get(`/chat/${task.id}/history`);
            setMessages(response.data);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        const intervalId = setInterval(() => {
            getMessages();
        }, 1000);

        return () => clearInterval(intervalId);
    }, [task]);


    return (
        <div className="bodyblock gap5">
            <div className="titleblock">Чат</div>
            <div className="chatviewer">
                <div className="chatwindow">
                    {messages.map((item, index) => (
                        <Message key={index} message={item}></Message>
                    ))}
                </div>
            </div>
            <form onSubmit={handleSubmitMessage}>
                <div className="bfxrow filler">
                    <input className="filler bfxrow chatinput" value={myMessage} placeholder="Введите сообщение" onChange={(e) => setMyMessage(e.target.value)}></input>
                    <SimpleButton style="accent" icon="arrow-right">
                        Отправить сообщение
                    </SimpleButton>
                </div>
            </form>
        </div>
    );
};

export default MessageViewer;