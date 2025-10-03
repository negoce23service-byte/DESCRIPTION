import React from 'react';

const Logo = () => (
    <img 
        src="https://lh7-rt.googleusercontent.com/formsz/AN7BsVBgGY96VoqDofEF9zWn8EQzHy6avjlLuAzwRmyd_APVSz8ZsVcpXUmfeFzqLKE12JJHrE5t19hAPJO6-Ad4aToiwoosw0I4p72RYuv2yiP1RTwekPMmxWZtAK68YoHJkShZ-bik-knCmtp8iLZbaGR_Nql8rZGZUIL8KKYDGzHkQkS0HX_X6pF8K_uCuhyJPDJtc9xkS8rKiyKF=w668?key=ioklNWInx-a3uP8_izc67g" 
        alt="Grand prix de la presse Agricole et Rurale Logo" 
        
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