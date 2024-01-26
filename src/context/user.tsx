'use client'

import { createUserAction, fetchUserAction } from '@/actions/user';
import { User } from '@prisma/client';
import React, { useContext, useEffect, useState } from "react";
import { v4 } from 'uuid';

const initialValues: {
    user: User | null,
    createUser?: ({ name }: { name: string }) => Promise<{ user: User }>
} = {
    user: null,
    createUser: undefined
};

type Props = {
    children?: React.ReactNode;
};

const UserContext = React.createContext(initialValues);

const useUser = () => useContext(UserContext);

const UserProvider: React.FC<Props> = ({ children }) => {
    const FetchDeviceId = (): string => {
        let deviceId = localStorage.getItem("deviceId");
        if (deviceId) return deviceId
        deviceId = v4();
        localStorage.setItem("deviceId", deviceId);
        return deviceId
    }

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // called before going to the room screen
    const createUser = async ({ name }: { name: string }): Promise<{ user: User }> => {

        const deviceId = FetchDeviceId();
        const user = await createUserAction({
            deviceId: deviceId,
            name
        });

        setUser(user)

        return {
            user
        }
    }


    // called before going to the room screen
    const fetchUser = async (): Promise<User | null> => {

        const deviceId = FetchDeviceId();
        const user = await fetchUserAction({
            deviceId,
        });

        if (user)
            setUser(user)

        return user

    }


    useEffect(() => {
        onStart()
    }, [])

    // called before going to the room screen
    const onStart = async () => {
        setLoading(true)
        const user = await fetchUser();

        if (user) {

        } else {
            //redirect to login page
            try {
                await createUser({ name: "User Name - " + `${(Math.random() * 100).toFixed(3)}` });
            }
            catch (e) {
                alert(e);
            }
        }
        setLoading(false)
    }


    if (loading) {
        return <div className=' h-screen w-screen gap-x-5 flex justify-center items-center'>
            <p className='animate-bounce text-4xl duration-500 delay-500'>
                ::
            </p>
            <p className='animate-bounce text-4xl duration-500 delay-100'>
                ::
            </p>
            <p className='animate-bounce text-4xl duration-500 delay-500'>
                ::
            </p>
            <p className='animate-bounce text-4xl duration-500 delay-100'>
                ::
            </p>
            <p className='animate-bounce text-4xl duration-500 delay-500'>
                ::
            </p>
            <p className='animate-bounce text-4xl duration-500 delay-100'>
                ::
            </p>
            <p className='animate-bounce text-4xl duration-500 delay-500'>
                ::
            </p>
        </div>
    } else
        return (
            <UserContext.Provider
                value={{
                    user,
                    createUser
                }}
            >
                {children}
            </UserContext.Provider>
        );
};

export { UserProvider, useUser };