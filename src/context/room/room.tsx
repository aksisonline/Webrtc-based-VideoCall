'use client'

import { IceCandidate, PCDescription, Room, RoomMember } from '@/interface/room';
import axios from 'axios';
import React, { useContext, useEffect, useState } from "react";

import { SupabaseClient, createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database

const initialValues: {
    creator: boolean,
    room?: Room,
    roomMembers?: RoomMember[],
    currentRoomMember?: RoomMember,
    stream: {
        localStream?: MediaStream,
        remoteStream?: MediaStream
    },
    clientData?: SupabaseClient<any, "public", any>,
    fetchRoom: Function,
    createRoom: Function,
    setStream: Function,
    generateOffer: Function,
    setupAnswer: Function,
    setupNewIceCandidate: Function,
    generateAnswer: Function,
} = {
    creator: false,
    room: undefined,
    roomMembers: undefined,
    currentRoomMember: undefined,
    stream: {
        localStream: undefined,
        remoteStream: undefined
    },
    clientData: undefined,
    fetchRoom: () => { },
    createRoom: () => { },
    setStream: () => { },
    generateOffer: () => { },
    setupAnswer: () => { },
    setupNewIceCandidate: () => { },
    generateAnswer: () => { },
};

type Props = {
    children?: React.ReactNode;
};

const RoomContext = React.createContext(initialValues);

const useRoom = () => useContext(RoomContext);

const RoomProvider: React.FC<Props> = ({ children }) => {



    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""



    const servers = {
        iceServers: [
            {
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
            },
        ],
        iceCandidatePoolSize: 10,
    };

    const [pc, setPc] = useState<RTCPeerConnection>();
    const [clientData, setClientData] = useState<SupabaseClient<any, "public", any>>();

    const [creator, setCreator] = useState<boolean>(true);



    const [room, serRoom] = useState<Room>();
    const [roomMembers, setRoomMembers] = useState<RoomMember[]>();
    const [currentRoomMember, setCurrentRoomMember] = useState<RoomMember>();

    const [localStream, setLocalStream] = useState<MediaStream>();
    const [remoteStream, setRemoteStream] = useState<MediaStream>();
    const [offerCandidates, setOfferCandidates] = useState<IceCandidate[]>();
    const [answerCandidates, setAnswerCandidates] = useState<IceCandidate[]>();

    const [offerDescription, setOfferDescription] = useState<PCDescription>();
    const [answersDescription, setAnswersDescription] = useState<PCDescription>();

    const [ip, setIP] = useState("");
    const getData = async () => {
        const res = await axios.get("https://api.ipify.org/?format=json");
        console.log(res.data);
        setIP(res.data.ip);
        return res.data.ip
    }


    // called before going to the room screen
    const createRoom = async () => {

        // get ip

        const IP = await getData();
        const userResponse = await fetch('/api/user', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": "owa",
                "ip": IP,
            })
        });

        const user = await userResponse.json();
        console.log("user", user)
        if (user.data) {
            // fetch user

            const response = await fetch('/api/room', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "ownerId": user.data.id,
                    "name": "room-1"
                })
            });


            const data = await response.json();

            console.log("data", data)

            // create a room in the database


            // setup peer connection
            setPc(new RTCPeerConnection(servers));

            // setup stream

            setClientData(createClient(SUPABASE_URL, SUPABASE_KEY))
        }
    }

    // called before going to the room screen
    const fetchRoom = async () => {

        // get ip


        // fetch user

        // create a room in the database


        // setup peer connection
        setPc(new RTCPeerConnection(servers));

        // setup stream
    }


    // called on the useEffect to setup the streams
    const setStream = async () => {
        if (pc) {
            const localStreamData = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            const remoteStreamData = new MediaStream()

            setLocalStream(localStreamData);
            setRemoteStream(remoteStreamData);
            // Push tracks from local stream to peer connection
            localStreamData.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamData);
            });

            // Pull tracks from remote stream, add to video stream
            pc.ontrack = (event) => {
                event.streams[0].getTracks().forEach((track) => {
                    remoteStreamData.addTrack(track);
                });
            };
        }

    }

    const generateOffer = async () => {
        if (pc) {
            // Create offer
            const offerDescription = await pc.createOffer();
            await pc.setLocalDescription(offerDescription);

            const offer: PCDescription = {
                sdp: offerDescription.sdp,
                type: offerDescription.type,
            };

            setOfferDescription(offer);
            //save offer to the database

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    const data = offerCandidates ?? [];
                    setOfferCandidates([...data, {
                        candidate: event.candidate.candidate,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid,
                        usernameFragment: event.candidate.usernameFragment,
                    }])
                    //save offerCandidate to the database
                }
            };
        }
    }

    const setupAnswer = async (answer: PCDescription) => {
        if (pc) {
            // Create offer
            await pc.setRemoteDescription(answer);
            setAnswersDescription(answer);
        }
    }

    const setupNewIceCandidate = async (answerCandidate: IceCandidate) => {
        if (pc) {
            await pc.addIceCandidate(answerCandidate);
            const data = offerCandidates ?? [];
            setAnswerCandidates([...data, answerCandidate])
        }
    }

    const generateAnswer = async () => {
        if (pc) {
            // fetch the offer and offer candidate

            const offerDescription = await pc.createOffer();
            await pc.setRemoteDescription(new RTCSessionDescription({
                sdp: offerDescription.sdp,
                type: offerDescription.type
            }));

            setOfferDescription({
                sdp: offerDescription.sdp,
                type: offerDescription.type,
            });

            const fetchedOfferCandidates: IceCandidate[] = [];

            for (let offerCandidate of fetchedOfferCandidates) {
                let iceCandidate = new RTCIceCandidate({
                    candidate: offerCandidate.candidate,
                    sdpMLineIndex: offerCandidate.sdpMLineIndex,
                    sdpMid: offerCandidate.sdpMid,
                });
                await pc.addIceCandidate(iceCandidate);
            }

            const answerDescription = await pc.createAnswer();
            await pc.setLocalDescription(answerDescription);

            const answer: PCDescription = {
                sdp: answerDescription.sdp,
                type: answerDescription.type,
            };

            //save answer to the database
            setAnswersDescription(answer);
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    const data = offerCandidates ?? [];
                    setAnswerCandidates([...data, {
                        candidate: event.candidate.candidate,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid,
                        usernameFragment: event.candidate.usernameFragment,
                    }])
                    //save AnswerCandidate to the database
                    // and send to the socket
                }
            };
        }
    }





    return (
        <RoomContext.Provider
            value={{
                creator,
                room,
                roomMembers,
                currentRoomMember,
                stream: {
                    localStream,
                    remoteStream
                },
                clientData,
                fetchRoom,
                createRoom,
                setStream,
                generateOffer,
                setupAnswer,
                setupNewIceCandidate,
                generateAnswer
            }}
        >
            {children}
        </RoomContext.Provider>
    );
};

export { RoomProvider, useRoom };