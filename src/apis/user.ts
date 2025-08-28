import request from "@/utils/request";

export const userServer = "http://175.178.112.138:8020"
export const fileServer = "http://175.178.112.138:8052"

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