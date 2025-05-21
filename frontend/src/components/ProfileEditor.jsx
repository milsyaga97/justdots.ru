import React, {useContext, useState} from 'react';
import {AuthContext} from "../context/AuthContext.jsx";
import {SERVER_URL} from "../pathconfig.js";
import api from "../services/api.jsx";
import {useNotification} from "../context/Notifications.jsx";
import InputorWLabel from "./InputorWLabel.jsx";
import SimpleButton from "./SimpleButton.jsx";
import Icon from "./other/Icon.jsx";
import Inputor from "./Inputor.jsx";
import PortfolioItem from "./other/PortfolioItem.jsx";

const ProfileEditor = ({profile, action, onsub}) => {
    const {myuser} = useContext(AuthContext);
    const notify = useNotification();

    const [editingPItem, setEditingPItem] = useState(null);
    const [portfolio, setPortfolio] = useState(profile.profile.portfolio);
    const [skills, setSkills] = useState(profile.skills)
    const [fName, setfName] = useState(profile.first_name);
    const [lName, setLname] = useState(profile.last_name);
    const [patro, setPatro] = useState(profile.patronymic);
    const [bio, setBio] = useState(profile.profile.bio);

    const newPortfolioItem = () => {
        const item = {
            id: Date.now(),
            title: "Пустое название",
            description: "Описание",
            url: "https://ссылка"
        }
        setPortfolio([...portfolio, item]);
    }

    const editPortfolioItem = (id, item) => {
        setPortfolio(prevItems =>
            prevItems.map(el =>
                el.id === id
                    ? {...el, ...item}
                    : el
            )
        )
    }

    const removePortfolioItem = (id) => {
        setPortfolio(prevItems =>
            prevItems.filter(item => item.title !== id)
        );
    }

    const [skillValue, setSkillValue] = useState('');

    const addSkill = () => {
        if(skillValue.length < 3) return notify({message: "Длина названия навыка должна быть не менее трёх символов", type: "info", duration: 4200});
        const newItem = {
            name: skillValue
        }
        setSkills([...skills, newItem]);
        setSkillValue('');
    }

    const handleAvatarUploader = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const MAX_SIZE = 5 * 1024 * 1024;
        if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > MAX_SIZE) {
            notify({
                message: 'Файл должен быть JPG/PNG (макс. 5MB)',
                type: "error",
                duration: 4200
            });
            return;
        }

        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await api.put("/users/profile/avatar", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            notify({
                message: "Аватар обновлен!",
                type: "success",
                duration: 3000
            });

        } catch (err) {
            notify({
                message: err.response?.data?.message || "Ошибка загрузки",
                type: "error",
                duration: 4200
            });
    }}

    const skillRemover = (id) => {
        setSkills(prevItems =>
            prevItems.filter(item => item.name !== id)
        );
    }

    const submitUpdate = async () => {
        if (fName.length < 2 || lName.length < 2){
            notify({message: "В ваших ФИ слишком мало символов", type: "info", duration: 4200})
            return;
        }
        try{
            api.put("/users/profile/update", {
                username: profile.username,
                first_name: fName,
                last_name: lName,
                patronymic: patro,
                email: profile.email,
                bio: bio,
                skills: skills,
                portfolio: portfolio
            })
            notify({message: "Профиль успешно обновлен", type: "success", duration: 4200});
        }
        catch(error){
            console.log(error);
            notify({message: "При обновлении профиля произошла ошибка", type: "error", duration: 4200});
        }
        finally {
            onsub();
        }
    }
    if(!myuser) return;

    return (
        <>
            <div className='hatsaver'></div>
            <div className='blocktitle'>
                мой профиль (редактирование)
            </div>
            <div className="bodyblock gap10">
                <div className="filler">
                    <div className="ellipse-profile">
                        <input style={{ display: "none" }} type="file" accept=".jpg,.jpeg,.png" id="profileimguploader" onChange={handleAvatarUploader}></input>
                        <label htmlFor='profileimguploader' title='Нажмите чтобы загрузить новое фото' className='ellipse-hoverer' />
                        <img
                            className='iph'
                            src={profile.profile?.avatar_url ? `${SERVER_URL + profile.profile?.avatar_url}` : null}
                        />
                    </div>
                    <div className="profile-info">
                        <div className="profile-info-name">
                            <span>{profile.username}</span>
                        </div>
                    </div>
                    <div className="profile-edit-container gap10">
                        <SimpleButton style="green" icon="check" onClick={submitUpdate}>Применить изменения</SimpleButton>
                        <SimpleButton icon="arrow-left" onClick={action}>Отменить и выйти</SimpleButton>
                    </div>
                </div>
                    <div className="profile-edit-flex">
                        <div className="edit-container">
                            <div className="fx gap10">
                                <InputorWLabel label="Фамилия" value={lName} onChange={(e) => setLname(e.target.value)} required></InputorWLabel>
                                <InputorWLabel label="Имя" value={fName} onChange={(e) => setfName(e.target.value)} required></InputorWLabel>
                                <InputorWLabel label="Отчество (при наличии)" value={patro}  onChange={(e) => setPatro(e.target.value)} required></InputorWLabel>
                                <InputorWLabel typea="textarea" label="Обо мне" value={bio}  onChange={(e) => setBio(e.target.value)}></InputorWLabel>
                            </div>
                        </div>
                        {profile.user_type == "freelancer" && (
                            <div className="edit-container gap20">
                                <div>
                                    <div className="titleblock">Навыки</div><br/>
                                    <div className="bfxrow">
                                        <div className="skillsflex">
                                            {skills.map((skill, index) => (
                                                <div className="bfxrow gap5" key={index}>
                                                    <div className="propblock black">{skill.name}
                                                        <button className="skillremover" onClick={() => skillRemover(skill.name)}>
                                                            <Icon icon="xmark"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <Inputor size={1} placeholder={"Навык"} maxLength="20"
                                                     value={skillValue}
                                                     onChange={(e) => setSkillValue(e.target.value)}
                                            />
                                            <button className="skillremover" onClick={addSkill}>
                                                <Icon icon="plus"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="titleblock">Портфолио</div>
                                <div className="bfxcol gap5">
                                    {portfolio.map((item, index) => (
                                        <PortfolioItem key={index} item={item} editor="false" action={removePortfolioItem} edit={editPortfolioItem}/>
                                    ))}
                                    <SimpleButton style="black" icon="plus" onClick={newPortfolioItem}></SimpleButton>
                                </div>
                            </div>
                        )}
                    </div>
            </div>
        </>
    )
}

export default ProfileEditor