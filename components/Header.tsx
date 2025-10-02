import React from 'react';

const Logo = () => (
    <img 
        src="https://www.agriculture.gov.ma/sites/default/files/2025-02/logo%20prix%20presse.png" 
        alt="Grand prix de la presse Agricole et Rurale Logo" 
        className="w-72 mx-auto"
    />
);

interface HeaderProps {
    title: string;
    subtitle: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
    return (
        <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
               <Logo />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-800">{title}</h1>
            <p className="text-stone-500 mt-2">{subtitle}</p>
        </div>
    );
};

export default Header;