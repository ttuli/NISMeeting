import request from "@/utils/request";

export const meetingServer = "http://175.178.112.138:8021"

export async function CreateMeeting(data:any) {
    return await request({
        url: meetingServer + "/createMeeting",
        method: "post",
        data,
    })
}

export async function JoinMeeting(data:any) {
    return await request({
        url: meetingServer + "/joinMeeting",
        method: "post",
        data,
    })
}

export async function LeftMeeting(data:any) {
    return await request({
        url: meetingServer + "/leftMeeting",
        method: "post",
        data,
    })
}

export async function HistoryMeeting(data:any) {
    return await request({
        url: meetingServer + "/historyMeeting",
        method: "post",
        data,
    })
}