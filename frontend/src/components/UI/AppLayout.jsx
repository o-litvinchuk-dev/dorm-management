import React from 'react';
import { Outlet } from 'react-router-dom';
import CommandPalette from './CommandPalette/CommandPalette';

const AppLayout = () => {
  return (
    <>
      <Outlet />
      <CommandPalette />
    </>
  );
};

export default AppLayout;