'use client'

import React, { useContext, useEffect, useState } from "react";

const initialValues: {
    pc?: RTCPeerConnection
} = {
    pc: undefined,
};

type Props = {
    children?: React.ReactNode;
};

const StreamContext = React.createContext(initialValues);

const useStream = () => useContext(StreamContext);

const StreamProvider: React.FC<Props> = ({ children }) => {

    const servers = {
        iceServers: [
            {
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
            },
        ],
        iceCandidatePoolSize: 10,
    };

    const [pc, setPc] = useState<RTCPeerConnection>();


    useEffect(() => {
        setPc(new RTCPeerConnection(servers));

    }, [])



    return (
        <StreamContext.Provider
            value={{
                pc,
            }}
        >
            {children}
        </StreamContext.Provider>
    );
};

export { StreamProvider, useStream };