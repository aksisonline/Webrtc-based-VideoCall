'use client'

import { getPeerConnection, setupStream } from '@/utils/peerConnection';
import React, { useContext, useState } from "react";

const initialValues: {
    localStream?: MediaStream,
    remoteStream?: MediaStream,
    setStream: Function,
    pauseVideo: Function,
    resumeVideo: Function,
    pauseAudio: Function,
    resumeAudio: Function,
    stopMediaStream: Function,
} = {
    localStream: undefined,
    remoteStream: undefined,
    setStream: () => { },
    pauseVideo: () => { },
    resumeVideo: () => { },
    pauseAudio: () => { },
    resumeAudio: () => { },
    stopMediaStream: () => { },
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

        const pc = getPeerConnection();
        setLocalStream(localStreamData);

        await setupStream({
            localStreamData,
            remoteVideo
        });
    }

    function pauseVideo() {
        if (localStream && localStream.getVideoTracks().length > 0) {
            localStream.getVideoTracks()[0].enabled = false;
        }
    }

    // Function to resume video
    function resumeVideo() {
        if (localStream && localStream.getVideoTracks().length > 0) {
            localStream.getVideoTracks()[0].enabled = true;
        }
    }

    // Function to pause audio
    function pauseAudio() {
        if (localStream && localStream.getAudioTracks().length > 0) {
            localStream.getAudioTracks()[0].enabled = false;
        }
    }

    // Function to resume audio
    function resumeAudio() {
        if (localStream && localStream.getAudioTracks().length > 0) {
            localStream.getAudioTracks()[0].enabled = true;
        }
    }


    const stopMediaStream = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
    };


    return (
        <StreamContext.Provider
            value={{
                localStream,
                remoteStream,
                setStream,
                pauseVideo,
                resumeVideo,
                pauseAudio,
                resumeAudio,
                stopMediaStream
            }}
        >
            {children}
        </StreamContext.Provider>
    );
};

export { StreamProvider, useStream };