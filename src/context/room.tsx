'use client'

import { createRoomAction } from '@/actions/createRoom';
import { fetchRoomAction, fetchRoomMemberAction, fetchRoomMembersAction } from '@/actions/fetchRoom';
import { RoomMembers } from '@/interface/members';
import { Room, RoomMember } from '@prisma/client';
import React, { useContext, useState } from "react";

const initialValues: {
    room?: Room,
    currentRoomMemberId: string,
    roomMembers: RoomMembers,
    creator: boolean,
    createRoom?: ({ userId }: { userId: string }) => Promise<{ room: Room, roomMember: RoomMember }>,
    fetchRoom?: ({ userId, roomId }: { userId: string, roomId: string }) => Promise<{ room: Room, roomMember: RoomMember, creator: boolean }>,
} = {
    room: undefined,
    currentRoomMemberId: "",
    roomMembers: {},
    creator: true,
    createRoom: undefined,
    fetchRoom: undefined
};

type Props = {
    children?: React.ReactNode;
};

const RoomContext = React.createContext(initialValues);

const useRoom = () => useContext(RoomContext);

const RoomProvider: React.FC<Props> = ({ children }) => {
    const [room, serRoom] = useState<Room>();
    const [roomMembers, setRoomMembers] = useState<RoomMembers>({});
    const [creator, setCreator] = useState<boolean>(true);
    const [currentRoomMemberId, setCurrentRoomMemberId] = useState<string>("");

    // called before going to the room screen
    const createRoom = async ({ userId }: { userId: string }): Promise<{ room: Room, roomMember: RoomMember }> => {
        const { room, roomMember } = await createRoomAction({
            userId: userId
        });

        // create a room in the database
        serRoom({ ...room })
        const members = { ...roomMembers };

        members[roomMember.id] = roomMember;
        setRoomMembers({ ...members })
        setCurrentRoomMemberId(roomMember.id)
        setCreator(true);

        return {
            room,
            roomMember,
        }
    }


    // called before going to the room screen
    const fetchRoom = async ({ userId, roomId }: { userId: string, roomId: string }): Promise<{ room: Room, roomMember: RoomMember, creator: boolean }> => {
        const room = await fetchRoomAction({
            roomId
        });

        if (!room) {
            console.log("error")
            throw new Error();
        }


        // create a room in the database
        serRoom({ ...room })

        const roomMember = await fetchRoomMemberAction({
            userId,
            roomId
        });

        if (!roomMember) {
            console.log("error")
            throw new Error();
        }
        setCurrentRoomMemberId(roomMember.id);

        const roomMembersData = await fetchRoomMembersAction({
            roomId
        });

        if (!roomMembersData) {
            console.log("error")
            throw new Error();
        }

        const members = { ...roomMembers };
        for (let roomMemberData of roomMembersData) {
            members[roomMemberData.id] = roomMemberData;
        }
        setRoomMembers({ ...members })


        const creator = roomMember.memberId === room.ownerId
        setCreator(creator);

        return {
            room,
            roomMember,
            creator
        }
    }

    return (
        <RoomContext.Provider
            value={{
                room,
                createRoom,
                fetchRoom,
                creator,
                roomMembers,
                currentRoomMemberId
            }}
        >
            {children}
        </RoomContext.Provider>
    );
};

export { RoomProvider, useRoom };