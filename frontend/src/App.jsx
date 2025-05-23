import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/Notifications';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import { Main } from './components/layouts/Main';
import { Customer } from './components/layouts/Customer';
import { TaskCreator } from './components/customer/TaskCreator';
import { MyTasks } from './components/MyTasks';
import { TaskViewer } from './components/tasks/TaskViewer.jsx';
import { Freelancer } from './components/layouts/Freelancer';
import { PublicTasks } from './components/freelancer/PublicTasks.jsx';
import {Moderator} from "./components/layouts/Moderator.jsx";
import ModerateOrders from "./components/moderator/ModerateOrders.jsx";
import Landing from "./components/Landing.jsx";
import MyApplications from "./components/freelancer/MyApplications.jsx";
import {useState} from "react";
import Wallet from "./components/Wallet.jsx";
import Arbitrage from "./components/moderator/Arbitrage.jsx";


const App = () => {
  const root = document.documentElement;
  const [isDark, setDark] = useState(false);
  const switchTheme = () => {
    setDark(prev => !prev);
  }
    if(isDark){
      root.style.setProperty('--variable-collection-accent', 'rgb(48, 120, 120)');
      root.style.setProperty('--variable-collection-black', 'rgb(255, 255, 255)');
      root.style.setProperty('--variable-collection-blackprop', 'rgb(0, 0, 0)');
      root.style.setProperty('--variable-collection-white', 'rgb(41, 41, 41)');
      root.style.setProperty('--variable-collection-border', 'rgba(149, 149, 149, 0.15)');
      root.style.setProperty('--variable-collection-shadow', 'rgba(0, 0, 0, 0.15)');
      root.style.setProperty('--mainbackground', '#191919');
      root.style.setProperty('--mainbackgroundh', '#19191900');
      root.style.setProperty('--hat', 'rgba(0, 0, 0, 0.14)');
      root.style.setProperty('--loadercontain1', 'rgb(62, 61, 61)');
      root.style.setProperty('--loadercontain0', 'rgba(34, 34, 34, 0)');
    } else {
      root.style.setProperty('--variable-collection-accent', 'rgba(119, 166, 172, 1)');
      root.style.setProperty('--variable-collection-black', 'rgb(0, 0, 0)');
      root.style.setProperty('--variable-collection-blackprop', 'rgb(0, 0, 0)');
      root.style.setProperty('--variable-collection-white', 'rgb(255, 255, 255)');
      root.style.setProperty('--variable-collection-border', 'rgba(0, 0, 0, 0.15)');
      root.style.setProperty('--variable-collection-shadow', 'rgba(0, 0, 0, 0.15)');
      root.style.setProperty('--mainbackground', '#ffffff');
      root.style.setProperty('--mainbackgroundh', '#ffffff00');
      root.style.setProperty('--hat', 'rgba(255, 255, 255, 0.15)');
      root.style.setProperty('--loadercontain1', 'rgb(62, 61, 61)');
      root.style.setProperty('--loadercontain0', 'rgba(34, 34, 34, 0)');
    }

  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <Navbar themeSwitcher={switchTheme} isDark={isDark}/>
          <Routes>
            <Route path="/" element={<Landing/>}/>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<Main />}>
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/wallet" element={<Wallet/>}/>
              <Route element={<Customer />}>
                <Route path="/create" element={<TaskCreator />} />
              </Route>
              <Route element={<Freelancer />}>
                <Route path="/orders" element={<PublicTasks />} />
                <Route path="/myapps" element={<MyApplications/>}/>
              </Route>
              <Route path="/mytasks" element={<MyTasks />} />
              <Route path="/task/:id" element={<TaskViewer />} />
            </Route>
            <Route element={<Moderator/>}>
              <Route path="/moderate" element={<ModerateOrders/>}></Route>
              <Route path="/arbitrage" element={<Arbitrage/>}></Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider >
    </NotificationProvider>
  );
};

export default App;