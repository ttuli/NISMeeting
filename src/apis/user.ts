import request from "@/utils/request";

export const userServer = "http://175.178.112.138:8020"
export const fileServer = "http://175.178.112.138:8052"

let pingTimerId : NodeJS.Timeout | null = null;

export async function Login(data: any) {
    let res = await request({
        url: userServer+"/login",
        method: "post",
        data,
    });
    return res;
}

export async function Register(data: any) {
    let res = await request({
        url: userServer+"/register",
        method: "post",
        data,
    });
    return res;
}

export async function UpdateProfile(data:any) {
    let res = await request({
        url: userServer+"/updateInfo",
        method: "post",
        data,
    })
    return res;
}

export async function Ping() {
    pingTimerId = setInterval(() => {
        request({
            url: userServer+"/ping",
            method:"get",
        })
        Ping()
    },30000)
}

export function offline() {
    if (pingTimerId)
        clearTimeout(pingTimerId)
    request({
        url: userServer+"/offline",
        method:"get",
    })
}