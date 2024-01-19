'use client'

import { addDescriptionAction, getDescriptionAction } from '@/actions/description';
import { addIceCandidateAction, getIceCandidateAction } from '@/actions/iceCandidate';
import { IceCandidate, PCDescription, } from '@/interface/room';
import { getPeerConnection, setupAnswerAction } from '@/utils/peerConnection';
import { getRoom } from '@/utils/supabase';
import { Room, RoomMember } from '@prisma/client';
import React, { useContext, useState } from "react";

const initialValues: {
    answerCandidates: IceCandidate[],
    answersDescription?: PCDescription,
    setupAnswer?: (answer: PCDescription) => {},
    setupAnswerIceCandidate?: (answerCandidate: IceCandidate) => {},
    generateAnswer?: ({ roomMember, room }: { roomMember: RoomMember, room: Room }) => {}
} = {
    answerCandidates: [],
    answersDescription: undefined,
    setupAnswer: undefined,
    setupAnswerIceCandidate: undefined,
    generateAnswer: undefined
};

type Props = {
    children?: React.ReactNode;
};

const AnswerContext = React.createContext(initialValues);

const useAnswer = () => useContext(AnswerContext);

const AnswerProvider: React.FC<Props> = ({ children }) => {
    const [answerCandidates, setAnswerCandidates] = useState<IceCandidate[]>([]);
    const [answersDescription, setAnswersDescription] = useState<PCDescription>();

    const setupAnswer = async (answer: PCDescription) => {
        setupAnswerAction(answer)
        setAnswersDescription(answer);

    }

    const setupAnswerIceCandidate = async (answerCandidate: IceCandidate) => {
        const pc = getPeerConnection()

        const candidate = new RTCIceCandidate({ ...answerCandidate });
        await pc.addIceCandidate(candidate);
        const data = answerCandidates ?? [];
        setAnswerCandidates([...data, answerCandidate])
    }

    const generateAnswer = async ({ roomMember, room }: { roomMember: RoomMember, room: Room }) => {
        const pc = getPeerConnection()
        pc.onicecandidate = async (event) => {
            if (event.candidate) {
                const data = offerCandidates ?? [];
                const answerCandidateData = {
                    candidate: event.candidate.candidate,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid,
                    usernameFragment: event.candidate.usernameFragment,
                }
                setAnswerCandidates([...data, answerCandidateData])

                // roomChannel.subscribe((status) => {
                //     // Wait for successful connection
                //     if (status !== 'SUBSCRIBED') {
                //         return null
                //     }
                //     // Send a message once the client is subscribed
                //     roomChannel.send({
                //         type: 'broadcast',
                //         event: 'iceCandidate',
                //         payload: {
                //             roomMemberId: roomMember.id,
                //             ...answerCandidateData
                //         },
                //     })
                // })
                // await addIceCandidateAction({
                //     candidate: answerCandidateData,
                //     dataType: "Answer",
                //     roomMemberId: roomMember.id,
                // })
            }
        };
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

        for (let offerCandidate of offerCandidates) {
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


        const roomChannel = getRoom({ roomId: room.id });
        // roomChannel.subscribe((status) => {
        //     // Wait for successful connection
        //     if (status !== 'SUBSCRIBED') {
        //         return null
        //     }
        //     // Send a message once the client is subscribed

        // })

        roomChannel.send({
            type: 'broadcast',
            event: 'description',
            payload: {
                roomMemberId: roomMember.id,
                ...answer
            },
        })
        await addDescriptionAction({
            description: answer,
            dataType: "Answer",
            roomMemberId: roomMember.id,
        })

        //save answer to the database
        setAnswersDescription(answer);

    }

    return (
        <AnswerContext.Provider
            value={{
                answerCandidates,
                answersDescription,
                setupAnswer,
                generateAnswer,
                setupAnswerIceCandidate,
            }}
        >
            {children}
        </AnswerContext.Provider>
    );
};

export { AnswerProvider, useAnswer };