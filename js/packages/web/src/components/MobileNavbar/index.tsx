import React from 'react';
import { LogoLink, MetaplexMenu } from '../AppBar';

export const MobileNavbar = () => {
  return (
    <div id="mobile-navbar">
      <LogoLink />
      <div className="mobile-menu">
        <MetaplexMenu />
      </div>
    </div>
  );
};
