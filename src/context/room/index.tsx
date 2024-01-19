'use client'

import { IceCandidate, PCDescription, Room, RoomMember, User } from '@/interface/room';
import axios from 'axios';
import React, { useContext, useEffect, useState } from "react";

import { RealtimeChannel, SupabaseClient, createClient } from '@supabase/supabase-js'
import { PrismaClient } from "@prisma/client";
import { useRouter } from 'next/navigation';
import { createRoomAction } from '@/actions/createRoom';
import { fetchRoomAction, fetchRoomMemberAction, fetchUserAction } from '@/actions/fetchRoom';
import { addDescriptionAction, getDescriptionAction } from '@/actions/description';
import { addIceCandidateAction, getIceCandidateAction } from '@/actions/iceCandidate';
import { v4 } from "uuid";

const prisma = new PrismaClient();
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




    const servers = {
        iceServers: [
            {
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
            },
        ],
        iceCandidatePoolSize: 10,
    };

    const [pc, setPc] = useState<RTCPeerConnection>();

    const [creator, setCreator] = useState<boolean>(true);



    const [room, serRoom] = useState<Room>();
    const [user, serUser] = useState<User>();
    const [roomMembers, setRoomMembers] = useState<RoomMember[]>();
    const [currentRoomMember, setCurrentRoomMember] = useState<RoomMember>();

    const [localStream, setLocalStream] = useState<MediaStream>();
    const [remoteStream, setRemoteStream] = useState<MediaStream>();
    const [offerCandidates, setOfferCandidates] = useState<IceCandidate[]>();
    const [answerCandidates, setAnswerCandidates] = useState<IceCandidate[]>();

    const [offerDescription, setOfferDescription] = useState<PCDescription>();
    const [answersDescription, setAnswersDescription] = useState<PCDescription>();

    let ip: string;

    useEffect(() => {

        // setup peer connection
        setPc(new RTCPeerConnection(servers));

        // setup stream
        // const [clientData, setClientData] = useState<SupabaseClient<any, "public", any>>();
        //     setClientData(createClient(SUPABASE_URL, SUPABASE_KEY))

        let ipId = localStorage.getItem("userID");
        if (ipId) ip = ipId
        else {
            const id = v4();
            localStorage.setItem("userID", id);
            console.log(id);
            ip = id
        }



    }, [])


    // called before going to the room screen
    const createRoom = async () => {


        if (!ip) {
            let ipId = localStorage.getItem("userID");
            if (ipId) ip = ipId
            else {
                const id = v4();
                localStorage.setItem("userID", id);
                console.log(id);
                ip = id
            }
        }
        const { newRoomMember, newRoom, newUser } = await createRoomAction(ip);
        console.log("newRoomMember", newRoomMember)
        console.log("newRoom", newRoom)
        console.log("newUser", newUser)


        // create a room in the database
        serRoom({ ...newRoom })
        setCurrentRoomMember({ ...newRoomMember, })
        serUser({ ...newUser })
        setCreator(true);



        return {
            newRoom, newUser, newRoomMember
        }
    }

    // called before going to the room screen
    const fetchRoom = async ({ id }: { id: string }) => {
        const room = await fetchRoomAction({ id });

        if (!room) {
            console.log("room error",)
            return
        }

        console.log("room", room)

        if (!ip) {
            let ipId = localStorage.getItem("userID");
            if (ipId) ip = ipId
            else {
                const id = v4();
                localStorage.setItem("userID", id);
                console.log(id);
                ip = id
            }
        }
        const user = await fetchUserAction(ip);

        if (!user) {
            console.log("user error",)
            return
        }

        const roomMember = await fetchRoomMemberAction({
            memberId: user.id,
            roomId: room.id
        });
        // const newRoomMember = data.roomMember;
        const creatorData = user.id === room.ownerId;

        if (!roomMember) {
            console.log("roomMember error",)
            return
        }


        serRoom({ ...room })
        setCurrentRoomMember({ ...roomMember })
        serUser({ ...user })
        setCreator(creatorData)

        return {
            room, user, roomMember, creatorData
        }
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

    const generateOffer = async ({ roomMember }: { roomMember: RoomMember }) => {
        if (pc && roomMember) {
            // Create offer
            const offerDescription = await pc.createOffer();
            await pc.setLocalDescription(offerDescription);

            const offer: PCDescription = {
                sdp: offerDescription.sdp,
                type: offerDescription.type,
            };

            setOfferDescription(offer);
            //save offer to the database

            pc.onicecandidate = async (event) => {
                if (event.candidate) {
                    const data = offerCandidates ?? [];
                    const candidate = {
                        candidate: event.candidate.candidate,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid,
                        usernameFragment: event.candidate.usernameFragment,
                    };
                    setOfferCandidates([...data, {
                        candidate: event.candidate.candidate,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid,
                        usernameFragment: event.candidate.usernameFragment,
                    }])

                    try {
                        await addIceCandidateAction({
                            candidate,
                            dataType: "Offer",
                            roomMemberId: roomMember.id,
                        })
                    } catch (e) {
                        console.log("ice candidate", e)
                    }
                }
            };


            try {
                await addDescriptionAction({
                    description: offer,
                    dataType: "Offer",
                    roomMemberId: roomMember.id,
                })
            } catch (e) {
                console.log(e)
            }


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

    const generateAnswer = async ({ roomMember, room, channel }: { roomMember: RoomMember, room: Room, channel: RealtimeChannel }) => {
        if (pc) {
            // fetch the offer and offer candidate

            const offerCandidate = await getIceCandidateAction({
                roomId: room.id,
                dataType: "Offer"
            })

            const offerData = await getDescriptionAction({

                roomId: room.id,
                dataType: "Offer"
            })


            const offerDescription = offerData[0];
            const offerCandidates = offerCandidate;

            await pc.setRemoteDescription(new RTCSessionDescription({
                sdp: offerDescription.sdp,
                type: offerDescription.type as RTCSdpType
            }));

            setOfferDescription({
                sdp: offerDescription.sdp,
                type: offerDescription.type as RTCSdpType
            });

            for (let offerCandidate of offerCandidates) {
                let iceCandidate = new RTCIceCandidate({
                    candidate: offerCandidate.candidate,
                    sdpMLineIndex: offerCandidate.sdpMLineIndex,
                    sdpMid: offerCandidate.sdpMid,
                });
                await pc.addIceCandidate(iceCandidate);
            }
            setOfferCandidates(offerCandidates);

            const answerDescription = await pc.createAnswer();
            await pc.setLocalDescription(answerDescription);

            const answer: PCDescription = {
                sdp: answerDescription.sdp,
                type: answerDescription.type,
            };


            channel.subscribe((status) => {
                // Wait for successful connection
                if (status !== 'SUBSCRIBED') {
                    return null
                }
                // Send a message once the client is subscribed
                channel.send({
                    type: 'broadcast',
                    event: 'description',
                    payload: {
                        roomMemberId: roomMember.id,
                        ...answer
                    },
                })
            })


            await addDescriptionAction({
                description: answer,
                dataType: "Answer",
                roomMemberId: roomMember.id,
            })

            //save answer to the database
            setAnswersDescription(answer);
            pc.onicecandidate = async (event) => {
                if (event.candidate) {
                    const data = offerCandidates ?? [];
                    setAnswerCandidates([...data, {
                        candidate: event.candidate.candidate,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid,
                        usernameFragment: event.candidate.usernameFragment,
                    }])
                    const offerCandidateData = {

                        candidate: event.candidate.candidate,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid,
                        usernameFragment: event.candidate.usernameFragment,
                    }

                    channel.subscribe((status) => {
                        // Wait for successful connection
                        if (status !== 'SUBSCRIBED') {
                            return null
                        }
                        // Send a message once the client is subscribed
                        channel.send({
                            type: 'broadcast',
                            event: 'iceCandidate',
                            payload: {
                                roomMemberId: roomMember.id,
                                ...offerCandidateData
                            },
                        })
                    })



                    await addIceCandidateAction({
                        candidate: offerCandidateData,
                        dataType: "Answer",
                        roomMemberId: roomMember.id,
                    })


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