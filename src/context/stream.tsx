'use client'

import { getPeerConnection, setupStream } from '@/utils/peerConnection';
import React, { useContext, useState } from "react";

const initialValues: {
    localStream?: MediaStream,
    remoteStream?: MediaStream,
    setStream: Function
} = {
    localStream: undefined,
    remoteStream: undefined,
    setStream: () => { }
};

type Props = {
    children?: React.ReactNode;
};

const StreamContext = React.createContext(initialValues);

const useStream = () => useContext(StreamContext);

const StreamProvider: React.FC<Props> = ({ children }) => {
    const [localStream, setLocalStream] = useState<MediaStream>();
    const remoteStream = new MediaStream()


    // called on the useEffect to setup the streams
    const setStream = async () => {
        const localStreamData = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        const remoteVideo = document.getElementById('remoteStream') as HTMLVideoElement;

        setLocalStream(localStreamData);

        await setupStream({
            localStreamData,
            remoteVideo
        });
    }

    return (
        <StreamContext.Provider
            value={{
                localStream,
                remoteStream,
                setStream
            }}
        >
            {children}
        </StreamContext.Provider>
    );
};

export { StreamProvider, useStream };