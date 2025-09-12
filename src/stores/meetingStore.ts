import { defineStore } from "pinia";
import { reactive } from "vue";

interface AudioSource {
  id: string
  url: string
  muted: boolean
}

interface Participant {
  id: string
  name: string
  avatar: string
  video?: {
    url: string
  }
  audios: AudioSource[]
}

interface MemberInfo {
    uid : string;
    name : string;
    micOn : boolean;
}

interface MeetingInfo {
  description: string;
  hostId: string;
  hostName: string;
  meetingId: string;
  meetingName: string;
  meetingPassword: string;
  startTime:number;
}

export const useMeetingStore = defineStore('meetingStore',{
    state: () => ({
        participants: reactive<Participant[]>([]),
        members: reactive<MemberInfo[]>([]),
        meeting: reactive<MeetingInfo>({
            meetingId: '',
            meetingName: '',
            description: '',
            hostId: '',
            meetingPassword: '',
            hostName:'',
            startTime: 0
        })
    })
})