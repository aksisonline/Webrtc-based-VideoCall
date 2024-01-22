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

        const pc = getPeerConnection();
        setLocalStream(localStreamData);

        // // Push tracks from local stream to peer connection
        // localStreamData.getTracks().forEach((track) => {
        //     console.log("track", track);
        //     console.log("localStreamData", localStreamData);
        //     pc.addTrack(track, localStreamData);
        // });

        // // Pull tracks from remote stream, add to video stream
        // // pc.ontrack = (event) => {
        // //   console.log("ontrack", event);
        // //   const [remoteStream] = event.streams;
        // //   remoteVideo.srcObject = remoteStream;
        // //   console.log("remoteStream", remoteStream);
        // // };

        // remoteStream.addEventListener("addtrack", () => {
        //     console.log("added");
        // });

        // remoteVideo.srcObject = remoteStream;
        // console.log("remoteVideo", remoteVideo.srcObject);

        // pc.ontrack = (event) => {
        //     event.streams[0].getTracks().forEach((track) => {
        //         remoteStream.addTrack(track);
        //     });
        // };

        // // pc.ontrack = (ev: any) => {
        // //     if (ev.streams && ev.streams[0]) {
        // //         remoteVideo.srcObject = ev.streams[0];
        // //     } else {
        // //         let inboundStream = new MediaStream(ev.track);
        // //         remoteVideo.srcObject = inboundStream;
        // //     }
        // // };



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