import React, {useState} from 'react';
import AutoTextarea from "./AutoTextarea.jsx";
import InputorWLabel from "../InputorWLabel.jsx";
import SimpleButton from "../SimpleButton.jsx";
import {Link} from "react-router-dom";
import {useNotification} from "../../context/Notifications.jsx";

const PortfolioItem = ({item, editor, action, edit, viewFromProfile}) => {
    const [editing, setEdit] = useState(editor);
    const notify = useNotification();

    const [id, setId] = useState(item.id);
    const [title, setTitle] = useState(item.title);
    const [desc, setDesc] = useState(item.description);
    const [url, setUrl] = useState(item.url.slice(8));

    const sendEdit = () => {
        if(title.length < 3 || desc.length < 10 || url.length == 0){
            notify({message: "В элементе портфолио слишком мало информации", type: "info", duration: 4200});
            return;
        }
        const item = {
            id: id,
            title: title,
            description: desc,
            url: url
        }
        edit(item.id, item);
        closeEdit();
    }

    const openEdit = () => {
        setEdit("true");
    }
    const closeEdit = () => {
        setEdit("false");
    }

    return(
        <>
            {viewFromProfile ? (
                <div className="bodyblock gap10">
                    <div className="titleblock">{item.title}</div>
                    <AutoTextarea>{item.description}</AutoTextarea>
                    <div className="bfxrow">
                        <a target="_blank" rel="noopener noreferrer" style={{textDecoration: "none"}} href={item.url}>
                            <SimpleButton style="accent" icon="link" title={item.url}>
                                {item.url.length > 20 ? `${item.url.slice(8, 20)}...` : item.url.slice(8)}
                            </SimpleButton>
                        </a>
                    </div>
                </div>
            ) : (
                <>
                    {editing == "false" ? (
                        <div className="bodyblock gap10">
                            <div className="titleblock">{item.title}</div>
                            <AutoTextarea>{item.description}</AutoTextarea>
                            <div className="bfxrow">
                                <a target="_blank" rel="noopener noreferrer" style={{textDecoration: "none"}} href={item.url}>
                                    <SimpleButton style="accent" icon="link" title={item.url}>
                                        {item.url.length > 20 ? `${item.url.slice(8, 20)}...` : item.url.slice(8)}
                                    </SimpleButton>
                                </a>
                                <div className="profile-edit-container gap5">
                                    <SimpleButton style="black" icon="edit" onClick={openEdit}></SimpleButton>
                                    <SimpleButton style="red" icon="trash" onClick={() => action(item.title)}></SimpleButton>
                                </div>
                            </div>
                        </div>
                    ) : editing == "true" &&(
                        <div className="bodyblock gap10">
                            <InputorWLabel value={title} label="Название проекта" onChange={(e) => setTitle(e.target.value)}></InputorWLabel>
                            <InputorWLabel value={desc} typea="textarea" label="Описание проекта" onChange={(e) => setDesc(e.target.value)}/>
                            <InputorWLabel value={url} label="Ссылка на проект (...domain.ru)" onChange={(e) => setUrl(e.target.value)}/>
                            <div className="bfxrow gap10">
                                <SimpleButton style="accent" icon="check" onClick={sendEdit}>Сохранить</SimpleButton>
                                <SimpleButton style="black" icon="xmark" onClick={closeEdit}>Отменить</SimpleButton>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    )
};

export default PortfolioItem;