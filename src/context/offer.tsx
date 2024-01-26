'use client'

import { addDescriptionAction } from '@/actions/description';
import { PCDescription } from '@/interface/room';
import { getCallStarterStatus, getPeerConnection, setupTheOffer } from '@/utils/peerConnection';
import { getRoom } from '@/utils/supabase';
import { RoomMember } from '@prisma/client';
import React, { useContext, useState } from "react";

let running = false;
const initialValues: {
    offerDescription?: PCDescription,
    generateOffer?: ({ roomMember }: { roomMember: RoomMember }) => {},
} = {
    offerDescription: undefined,
    generateOffer: undefined,

};

type Props = {
    children?: React.ReactNode;
};

const OfferContext = React.createContext(initialValues);

const useOffer = () => useContext(OfferContext);

const OfferProvider: React.FC<Props> = ({ children }) => {
    const [offerDescription, setOfferDescription] = useState<PCDescription>();


    const generateOffer = async ({ roomMember }: { roomMember: RoomMember }) => {

        const roomChannel = await getRoom({ roomId: roomMember.roomId });

        // Create offer
        try {
            const offerDescription = await setupTheOffer()
            const offer: PCDescription = {
                sdp: offerDescription.sdp,
                type: offerDescription.type,
            };
            roomChannel.send({
                type: 'broadcast',
                event: 'description',
                payload: {
                    roomMemberId: roomMember.id,
                    ...offer
                },
            })

            setOfferDescription(offer);
            //save offer to the database

            try {
                await addDescriptionAction({
                    description: offer,
                    dataType: "Offer",
                    roomMemberId: roomMember.id,
                })
            } catch (e) {
                console.error("e", e)
            }

        } catch (e) {
            console.error(e)
        }
    }


    return (
        <OfferContext.Provider
            value={{
                offerDescription,
                generateOffer,
            }}
        >
            {children}
        </OfferContext.Provider>
    );
};

export { OfferProvider, useOffer };