import React, {useContext} from 'react';
import {AuthContext} from "../../context/AuthContext.jsx";
import SimpleButton from "../SimpleButton.jsx";

const Message = ({message, owner, freelancer}) => {
    const {myuser} = useContext(AuthContext);

    const messagedate = new Date(message.created_at);
    const timeOnly = messagedate.toLocaleTimeString();


    if(!message)return;
    if(myuser.id === message.owner_id)
        return(
            <div className="chatmymessage">
                <div className="message-author-name">
                    <span className="message-date">
                        {timeOnly}
                    </span>
                </div>
                <div className="mymessage-text">
                    {message.message}
                </div>
            </div>

        );
    else
    return (
        <div className="chatmessage">
            <div className="message-author-name">
                {message.username}
                <span className="message-date">
                    {timeOnly}
                </span>
            </div>
            <div className="message-text">
                {message.message}
            </div>
        </div>
    );
};

export default Message;