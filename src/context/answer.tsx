'use client'

import { addDescriptionAction, getDescriptionAction } from '@/actions/description';
import { getIceCandidateAction } from '@/actions/iceCandidate';
import { PCDescription, } from '@/interface/room';
import { addIce, setupTheAnswer } from '@/utils/peerConnection';
import { getRoom } from '@/utils/supabase';
import { Room, RoomMember } from '@prisma/client';
import React, { useContext, useState } from "react";

const initialValues: {
    answersDescription?: PCDescription,
    generateAnswer?: ({ roomMember, room }: { roomMember: RoomMember, room: Room }) => {}
} = {
    answersDescription: undefined,
    generateAnswer: undefined
};

type Props = {
    children?: React.ReactNode;
};

const AnswerContext = React.createContext(initialValues);

const useAnswer = () => useContext(AnswerContext);

const AnswerProvider: React.FC<Props> = ({ children }) => {
    const [answersDescription, setAnswersDescription] = useState<PCDescription>();


    const generateAnswer = async ({ roomMember, room }: { roomMember: RoomMember, room: Room }) => {
        const offerData = await getDescriptionAction({
            roomId: room.id,
            dataType: "Offer"
        })
        const offerCandidates = await getIceCandidateAction({
            roomId: room.id,
            dataType: "Offer"
        })

        const offerDescription = offerData[0];
        const answerDescription = await setupTheAnswer({
            sdp: offerDescription.sdp,
            type: offerDescription.type as RTCSdpType,
        });

        const answer: PCDescription = {
            sdp: answerDescription.sdp,
            type: answerDescription.type,
        };

        for (let offerCandidate of offerCandidates) {
            await addIce({
                candidate: offerCandidate.candidate,
                sdpMid: offerCandidate.sdpMid,
                sdpMLineIndex: offerCandidate.sdpMLineIndex,
                usernameFragment: offerCandidate.usernameFragment,
            })
        }

        const roomChannel = await getRoom({ roomId: room.id });

        roomChannel.send({
            type: 'broadcast',
            event: 'description',
            payload: {
                roomMemberId: roomMember.id,
                ...answer
            },
        })
    }

    return (
        <AnswerContext.Provider
            value={{
                answersDescription,
                generateAnswer,
            }}
        >
            {children}
        </AnswerContext.Provider>
    );
};

export { AnswerProvider, useAnswer };