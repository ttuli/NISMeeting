import { defineStore } from "pinia";
import { reactive,Ref } from "vue";

interface AudioSource {
  id: string
  ref: Ref<HTMLAudioElement | undefined>
  muted: boolean
}

interface Participant {
  id: string
  name: string
  videoRef: Ref<HTMLVideoElement | undefined>
  audioRefs:AudioSource[]
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