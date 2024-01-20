'use client'

import { getPeerConnection } from '@/utils/peerConnection';
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
        const pc = getPeerConnection()
        const localStreamData = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })


        setLocalStream(localStreamData);
        // Push tracks from local stream to peer connection
        localStreamData.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamData);
        });

        // Pull tracks from remote stream, add to video stream
        pc.ontrack = (event) => {
            console.log("ontrack", event);
            event.streams[0].getTracks().forEach((track) => {
                remoteStream.addTrack(track);
            });
        };
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