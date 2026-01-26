import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const AuthLayout = () => {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
