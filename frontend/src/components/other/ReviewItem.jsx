import React, {useEffect, useState} from 'react';
import Icon from "./Icon.jsx";
import api from "../../services/api.jsx";
import {SERVER_URL} from "../../pathconfig.js";
import {Link} from "react-router-dom";


const ReviewItem = ({item}) => {
    const [author, setAuthor] = useState({});

    useEffect(() => {
        const fetchAuthor = async () => {
            if(!item) return;
            try{
                const response = await api.get(`/users/profile/${item.user_id}`);
                setAuthor(response.data);
            }
            catch(error){
                console.log(error);
            }
        };

        fetchAuthor();
    }, [item]);

    if(!item) return;
    if(!author) return;
    return (
        <div className="bfxrow">
            <div className="message-container">
                <div className="message-author-avatar">
                    <div className="message-avatar-container">
                        {author?.profile?.avatar_url && (
                            <img style={{height: "100" + "%"}} src={SERVER_URL + author?.profile?.avatar_url}/>
                        )}
                    </div>
                </div>
                <div className="message-data">
                    <div className="message-author-name">
                        <Link style={{textDecoration: "none", color: "var(--variable-collection-black)"}} to={`/profile/${author.id}`}>
                            {author.username}
                        </Link>
                    </div>
                    <div className="message-text">
                        {item.comment}
                    </div>
                </div>
                <div className="filler rev">
                    <div style={{marginLeft: 15 + "px"}} className="propblock black">
                        <Icon icon="star" color="gold"></Icon>
                        {item.score}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewItem;