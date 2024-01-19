'use client'

import { addDescriptionAction } from '@/actions/description';
import { addIceCandidateAction } from '@/actions/iceCandidate';
import { IceCandidate, PCDescription } from '@/interface/room';
import { getPeerConnection } from '@/utils/peerConnection';
import { getRoom } from '@/utils/supabase';
import { RoomMember } from '@prisma/client';
import React, { useContext, useState } from "react";

let running = false;
const initialValues: {
    offerDescription?: PCDescription,
    offerCandidates: IceCandidate[],
    generateOffer?: ({ roomMember }: { roomMember: RoomMember }) => {},
    setupOfferIceCandidate?: (offerCandidate: IceCandidate) => {},
} = {
    offerDescription: undefined,
    offerCandidates: [],
    generateOffer: undefined,
    setupOfferIceCandidate: undefined

};

type Props = {
    children?: React.ReactNode;
};

const OfferContext = React.createContext(initialValues);

const useOffer = () => useContext(OfferContext);

const OfferProvider: React.FC<Props> = ({ children }) => {
    const [offerDescription, setOfferDescription] = useState<PCDescription>();
    const [offerCandidates, setOfferCandidates] = useState<IceCandidate[]>([]);


    const generateOffer = async ({ roomMember }: { roomMember: RoomMember }) => {
        const pc = getPeerConnection()

        if (!running) {
            console.log(running)
            running = true
            const roomChannel = getRoom({ roomId: roomMember.roomId });

            pc.onicecandidateerror = async (event) => {
                console.log("event", event)
            }
            pc.onicecandidate = async (event) => {
                console.log("event", event);
                if (event.candidate) {
                    const data = offerCandidates ?? [];
                    const candidate = {
                        candidate: event.candidate.candidate,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid,
                        usernameFragment: event.candidate.usernameFragment,
                    };
                    setOfferCandidates([...data, {
                        ...candidate,
                    }])
                    // roomChannel.subscribe((status) => {
                    //     // Wait for successful connection
                    //     if (status !== 'SUBSCRIBED') {
                    //         return null
                    //     }
                    // })

                    // Send a message once the client is subscribed
                    roomChannel.send({
                        type: 'broadcast',
                        event: 'iceCandidate',
                        payload: {
                            roomMemberId: roomMember.id,
                            candidate,
                            dataType: "Offer",
                        },
                    })
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
            // Create offer
            const offerDescription = await pc.createOffer();
            await pc.setLocalDescription(offerDescription);

            const offer: PCDescription = {
                sdp: offerDescription.sdp,
                type: offerDescription.type,
            };

            setOfferDescription(offer);
            //save offer to the database

            try {
                await addDescriptionAction({
                    description: offer,
                    dataType: "Offer",
                    roomMemberId: roomMember.id,
                })
            } catch (e) {
                console.log(e)
            }

            running = false

        }


    }


    const setupOfferIceCandidate = async (offerCandidate: IceCandidate) => {
        const pc = getPeerConnection()
        const candidate = new RTCIceCandidate({ ...offerCandidate });
        await pc.addIceCandidate(candidate);
        const data = offerCandidates ?? [];
        setOfferCandidates([...data, offerCandidate])
    }
    return (
        <OfferContext.Provider
            value={{
                offerDescription,
                offerCandidates,
                generateOffer,
                setupOfferIceCandidate
            }}
        >
            {children}
        </OfferContext.Provider>
    );
};

export { OfferProvider, useOffer };