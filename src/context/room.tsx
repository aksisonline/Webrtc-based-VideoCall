'use client'

import { createRoomAction } from '@/actions/room';
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
    clearRoom: Function,
} = {
    room: undefined,
    currentRoomMemberId: "",
    roomMembers: {},
    creator: true,
    createRoom: undefined,
    fetchRoom: undefined,
    clearRoom: () => { }
};

type Props = {
    children?: React.ReactNode;
};

const RoomContext = React.createContext(initialValues);

const useRoom = () => useContext(RoomContext);

const RoomProvider: React.FC<Props> = ({ children }) => {
    const [room, setRoom] = useState<Room>();
    const [roomMembers, setRoomMembers] = useState<RoomMembers>({});
    const [creator, setCreator] = useState<boolean>(true);
    const [currentRoomMemberId, setCurrentRoomMemberId] = useState<string>("");


    // called before going to the room screen
    const clearRoom = async () => {
        setRoom(undefined)
        setRoomMembers({})
        setCreator(true)
        setCurrentRoomMemberId("")

    }


    // called before going to the room screen
    const createRoom = async ({ userId }: { userId: string }): Promise<{ room: Room, roomMember: RoomMember }> => {
        const data = await createRoomAction({
            userId: userId
        });

        // create a room in the database
        setRoom({ ...data.room })
        const members = { ...roomMembers };

        members[data.roomMember.id] = data.roomMember;
        setRoomMembers({ ...members })
        setCurrentRoomMemberId(data.roomMember.id)
        setCreator(true);

        return data
    }


    // called before going to the room screen
    const fetchRoom = async ({ userId, roomId }: { userId: string, roomId: string }): Promise<{ room: Room, roomMember: RoomMember, creator: boolean }> => {
        const room: Room | null = await fetchRoomAction({
            roomId
        });

        if (!room || (room != null && !room!.isActive)) {
            console.log("error")
            throw new Error();
        }


        // create a room in the database
        setRoom({ ...room })

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
                clearRoom,
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